-- =========================================================
-- Script de configuración de la base de datos
-- Tienda Inteligente con Autenticación Biométrica
-- =========================================================

-- 0) Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";        -- pgvector

-- 1) Tipos y helpers
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    CREATE TYPE order_status AS ENUM ('draft', 'confirmed', 'paid', 'cancelled', 'refunded');
  END IF;
END$$;

-- 2) Entidades de identidad y biometría
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id      TEXT UNIQUE,
  full_name       TEXT NOT NULL,
  email           TEXT UNIQUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  avatar_url      TEXT
);

-- 128D para face-api.js; si usas ArcFace/ONNX cambia a 512
CREATE TABLE IF NOT EXISTS face_templates (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  embedding       VECTOR(128) NOT NULL,                -- o VECTOR(512)
  quality_score   REAL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Registro de intentos de autenticación y resultados
CREATE TABLE IF NOT EXISTS auth_logs (
  id              BIGSERIAL PRIMARY KEY,
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  cosine_sim      REAL,            -- 0..1 (1 = idéntico)
  l2_distance     REAL,            -- menor = mejor
  success         BOOLEAN NOT NULL,
  reason          TEXT,            -- "threshold_not_met", "no_face", "liveness_fail"...
  source_ip       INET,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices de similitud (pgvector)
CREATE INDEX IF NOT EXISTS idx_face_templates_embedding_cosine
  ON face_templates USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Filtros
CREATE INDEX IF NOT EXISTS idx_face_templates_user_id ON face_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_logs_user_id ON auth_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_logs_created_at ON auth_logs(created_at);

-- 3) Comercio: billetera, productos, pedidos y pagos
CREATE TABLE IF NOT EXISTS wallets (
  user_id         UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  balance_pen     NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wallet_ledger (
  id              BIGSERIAL PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_pen      NUMERIC(12,2) NOT NULL,       -- + recarga / - consumo
  reason          TEXT NOT NULL,                -- "order", "topup", etc.
  ref_id          UUID,                         -- referencia a order_id/payment_id
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wallet_ledger_user_id ON wallet_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_created_at ON wallet_ledger(created_at);

CREATE TABLE IF NOT EXISTS products (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  price_pen       NUMERIC(12,2) NOT NULL CHECK (price_pen >= 0),
  image_url       TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status          order_status NOT NULL DEFAULT 'draft',
  total_pen       NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id              BIGSERIAL PRIMARY KEY,
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  qty             INTEGER NOT NULL CHECK (qty > 0),
  unit_price_pen  NUMERIC(12,2) NOT NULL CHECK (unit_price_pen >= 0),
  line_total_pen  NUMERIC(12,2) GENERATED ALWAYS AS (qty * unit_price_pen) STORED
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

CREATE TABLE IF NOT EXISTS payments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount_pen      NUMERIC(12,2) NOT NULL CHECK (amount_pen >= 0),
  status          payment_status NOT NULL DEFAULT 'pending',
  method          TEXT NOT NULL DEFAULT 'wallet', -- "wallet", "cash", "card"...
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- 4) Vistas útiles
CREATE OR REPLACE VIEW v_last_auth AS
SELECT DISTINCT ON (user_id)
  user_id, success, cosine_sim, l2_distance, reason, created_at
FROM auth_logs
ORDER BY user_id, created_at DESC;

CREATE OR REPLACE VIEW v_wallet_balance_calc AS
SELECT
  u.id AS user_id,
  COALESCE(SUM(l.amount_pen), 0)::NUMERIC(12,2) AS balance_pen
FROM users u
LEFT JOIN wallet_ledger l ON l.user_id = u.id
GROUP BY u.id;

-- 5) Triggers de mantenimiento
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_touch ON users;
CREATE TRIGGER trg_users_touch
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_products_touch ON products;
CREATE TRIGGER trg_products_touch
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_orders_touch ON orders;
CREATE TRIGGER trg_orders_touch
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- Sincroniza tabla wallets a partir del ledger
CREATE OR REPLACE FUNCTION sync_wallet_balance() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO wallets (user_id, balance_pen, updated_at)
  VALUES (NEW.user_id, NEW.amount_pen, now())
  ON CONFLICT (user_id) DO UPDATE
    SET balance_pen = wallets.balance_pen + EXCLUDED.amount_pen,
        updated_at  = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_wallet_ledger_sync ON wallet_ledger;
CREATE TRIGGER trg_wallet_ledger_sync
AFTER INSERT ON wallet_ledger
FOR EACH ROW EXECUTE FUNCTION sync_wallet_balance();

-- 6) Funciones helper para similitud
-- Dado un embedding (vector), devuelve el mejor match por coseno
CREATE OR REPLACE FUNCTION match_face_by_cosine(p_embedding VECTOR(128), p_limit INT DEFAULT 1)
RETURNS TABLE(user_id UUID, cosine_sim REAL) AS $$
  SELECT ft.user_id,
         1 - (ft.embedding <#> p_embedding) AS cosine_sim
  FROM face_templates ft
  ORDER BY ft.embedding <#> p_embedding
  LIMIT p_limit;
$$ LANGUAGE sql STABLE;

-- 7) Datos de ejemplo (seed)
INSERT INTO users (id, student_id, full_name, email, avatar_url)
VALUES
  (uuid_generate_v4(), '20241503', 'Sofía Martínez', 'sofia@example.com', NULL)
ON CONFLICT DO NOTHING;

-- Recarga inicial
INSERT INTO wallet_ledger (user_id, amount_pen, reason)
SELECT id, 50.00, 'topup'
FROM users WHERE student_id = '20241503';

-- Productos demo
INSERT INTO products (name, price_pen, image_url) VALUES
 ('Café Americano', 5.00,  'https://placehold.co/100x100/FDBA74/ffffff?text=Cafe'),
 ('Empanada de Carne', 7.50,'https://placehold.co/100x100/B8A5E4/ffffff?text=Empanada'),
 ('Jugo de Naranja', 6.00,  'https://placehold.co/100x100/96D29A/ffffff?text=Jugo'),
 ('Sándwich de Jamón', 10.00,'https://placehold.co/100x100/FCA5A5/ffffff?text=Sandwich'),
 ('Galletas de Avena', 3.50,'https://placehold.co/100x100/FECDD6/ffffff?text=Galletas')
ON CONFLICT DO NOTHING;

-- Comentarios importantes:
-- 1. Los face_templates se insertan al enrolar desde la aplicación
-- 2. La tabla wallets se sincroniza automáticamente con wallet_ledger
-- 3. El sistema usa pgvector para búsquedas de similitud eficientes
-- 4. Todas las transacciones se registran en wallet_ledger para auditoría 