import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'pg';

dotenv.config();
const { Pool } = pkg;

const app = express();
const PORT = Number(process.env.PORT || 3000);
const COS_THRESHOLD = Number(process.env.FACE_COSINE_THRESHOLD || 0.6);
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: '2mb' }));

function asVectorLiteral(arr) {
    if (!Array.isArray(arr)) throw new Error('embedding inválido');
    return `[${arr.join(',')}]`;
}
async function withTx(fn) {
    const client = await pool.connect();
    try { await client.query('BEGIN'); const r = await fn(client); await client.query('COMMIT'); return r; }
    catch (e) { await client.query('ROLLBACK'); throw e; }
    finally { client.release(); }
}

// ----- endpoints -----
app.get('/api/health', async (_req, res) => {
    try { await pool.query('SELECT 1'); res.json({ ok: true, threshold: COS_THRESHOLD }); }
    catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// Crear usuario: { student_id, full_name, email, balance_pen }
app.post('/api/users', async (req, res) => {
    try {
        const { student_id, full_name, email, balance_pen } = req.body || {};
        if (!student_id || !full_name || !email || !balance_pen) {
            return res.status(400).json({ error: 'Todos los campos son requeridos' });
        }

        const result = await withTx(async (client) => {
            // Verificar si el student_id ya existe
            const existingUser = await client.query('SELECT 1 FROM users WHERE student_id = $1', [student_id]);
            if (existingUser.rowCount > 0) {
                throw new Error('El código de estudiante ya existe');
            }

            // Verificar si el email ya existe
            const existingEmail = await client.query('SELECT 1 FROM users WHERE email = $1', [email]);
            if (existingEmail.rowCount > 0) {
                throw new Error('El email ya está registrado');
            }

            // Crear usuario
            const { rows: userRows } = await client.query(
                'INSERT INTO users (student_id, full_name, email) VALUES ($1, $2, $3) RETURNING id, student_id, full_name, email',
                [student_id, full_name, email]
            );
            const user = userRows[0];

            // Crear recarga inicial en wallet_ledger (el trigger automáticamente actualizará wallets)
            await client.query(
                'INSERT INTO wallet_ledger (user_id, amount_pen, reason) VALUES ($1, $2, $3)',
                [user.id, balance_pen, 'topup']
            );

            return user;
        });

        res.json({ ok: true, user: result });
    } catch (e) {
        console.error('[createUser]', e);
        res.status(400).json({ error: e.message || 'No se pudo crear el usuario' });
    }
});

app.get('/api/products', async (_req, res) => {
    try {
        const { rows } = await pool.query('SELECT id, name, price_pen, image_url FROM products WHERE is_active=TRUE ORDER BY name');
        res.json(rows);
    } catch (e) { res.status(500).json({ error: 'No se pudieron cargar productos' }); }
});

app.get('/api/user/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const q = `SELECT u.id, u.student_id, u.full_name, u.email,
               COALESCE(w.balance_pen,0)::numeric(12,2) AS balance_pen
               FROM users u LEFT JOIN v_wallet_balance_calc w ON w.user_id=u.id WHERE u.id=$1`;
        const { rows } = await pool.query(q, [id]);
        if (!rows.length) return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });
        res.json({ ok: true, user: rows[0] });
    } catch (e) { res.status(500).json({ error: 'No se pudo obtener el usuario' }); }
});

// Obtener estadísticas de autenticación del usuario
app.get('/api/user/:id/auth-stats', async (req, res) => {
    try {
        const { id } = req.params;
        const q = `SELECT 
            COUNT(*) as total_attempts,
            COUNT(*) FILTER (WHERE success = true) as successful_logins,
            COUNT(*) FILTER (WHERE success = false) as failed_logins,
            AVG(cosine_sim) FILTER (WHERE success = true) as avg_success_score,
            MAX(created_at) as last_attempt
            FROM auth_logs WHERE user_id = $1`;
        const { rows } = await pool.query(q, [id]);
        if (!rows.length) return res.json({ total_attempts: 0, successful_logins: 0, failed_logins: 0, avg_success_score: 0, last_attempt: null });
        res.json(rows[0]);
    } catch (e) { res.status(500).json({ error: 'No se pudieron obtener las estadísticas' }); }
});

// Obtener historial de transacciones del usuario
app.get('/api/user/:id/transactions', async (req, res) => {
    try {
        const { id } = req.params;
        const q = `SELECT 
            wl.amount_pen,
            wl.reason,
            wl.created_at,
            o.id as order_id,
            o.status as order_status,
            o.total_pen as order_total
            FROM wallet_ledger wl
            LEFT JOIN orders o ON wl.ref_id = o.id
            WHERE wl.user_id = $1
            ORDER BY wl.created_at DESC
            LIMIT 50`;
        const { rows } = await pool.query(q, [id]);
        res.json(rows);
    } catch (e) { res.status(500).json({ error: 'No se pudo obtener el historial' }); }
});

// Enrolar: { userId, embedding[128], quality? }
app.post('/api/enroll', async (req, res) => {
    try {
        const { userId, embedding, quality = null } = req.body || {};
        if (!userId) return res.status(400).json({ error: 'userId es requerido' });
        if (!Array.isArray(embedding) || embedding.length !== 128)
            return res.status(400).json({ error: 'embedding[128] es requerido' });

        const u = await pool.query('SELECT 1 FROM users WHERE id=$1', [userId]);
        if (!u.rowCount) return res.status(400).json({ error: 'userId no existe' });

        const vec = asVectorLiteral(embedding);
        // Eliminar cualquier template anterior del usuario
        await pool.query('DELETE FROM face_templates WHERE user_id = $1', [userId]);
        // Insertar el nuevo template
        const q = `INSERT INTO face_templates (user_id, embedding, quality_score)
               VALUES ($1, $2::vector(128), $3) RETURNING id`;
        const { rows } = await pool.query(q, [userId, vec, quality]);
        res.json({ ok: true, templateId: rows[0].id });
    } catch (e) { console.error('[enroll]', e); res.status(500).json({ error: 'No se pudo enrolar' }); }
});

// Verificar: { embedding[128] }
app.post('/api/verify', async (req, res) => {
    try {
        const { embedding } = req.body || {};
        if (!Array.isArray(embedding) || embedding.length !== 128)
            return res.status(400).json({ error: 'embedding[128] es requerido' });

        const vec = asVectorLiteral(embedding);
        
        // Usar la función helper de la base de datos para mejor rendimiento
        const q = `SELECT user_id, cosine_sim FROM match_face_by_cosine($1::vector(128), 1)`;
        const { rows } = await pool.query(q, [vec]);
        
        if (!rows.length) return res.json({ match: false, score: 0 });

        const best = rows[0];
        const score = Number(best.cosine_sim);
        const match = score >= COS_THRESHOLD;

        // Registrar el intento de autenticación
        await pool.query(
            'INSERT INTO auth_logs (user_id, cosine_sim, success, reason, source_ip, user_agent) VALUES ($1,$2,$3,$4,$5,$6)',
            [best.user_id, score, match, match ? null : 'threshold_not_met', req.ip, req.headers['user-agent'] || null]
        );

        res.json({ match, userId: best.user_id, score });
    } catch (e) { 
        console.error('[verify]', e); 
        res.status(500).json({ error: 'No se pudo verificar' }); 
    }
});

// Checkout: { userId, items:[{productId, qty}] }
app.post('/api/checkout', async (req, res) => {
    const { userId, items } = req.body || {};
    if (!userId || !Array.isArray(items) || !items.length)
        return res.status(400).json({ ok: false, error: 'userId e items son requeridos' });

    try {
        const result = await withTx(async (client) => {
            const u = await client.query('SELECT 1 FROM users WHERE id=$1', [userId]);
            if (!u.rowCount) throw new Error('Usuario no encontrado');

            // Obtener balance actual usando la vista calculada
            const { rows: balanceRows } = await client.query(
                'SELECT balance_pen FROM v_wallet_balance_calc WHERE user_id = $1',
                [userId]
            );
            const currentBalance = balanceRows.length ? Number(balanceRows[0].balance_pen) : 0;

            const { rows: rOrder } = await client.query('INSERT INTO orders (user_id) VALUES ($1) RETURNING id', [userId]);
            const orderId = rOrder[0].id;

            for (const it of items) {
                if (!it.productId || !Number.isFinite(it.qty) || it.qty <= 0) throw new Error('Item inválido');
                const { rows: rp } = await client.query('SELECT price_pen FROM products WHERE id=$1 AND is_active=TRUE', [it.productId]);
                if (!rp.length) throw new Error('Producto no encontrado o inactivo');
                const price = rp[0].price_pen;
                await client.query('INSERT INTO order_items (order_id, product_id, qty, unit_price_pen) VALUES ($1,$2,$3,$4)', [orderId, it.productId, it.qty, price]);
            }

            await client.query(
                `UPDATE orders o SET total_pen = COALESCE((SELECT SUM(line_total_pen) FROM order_items WHERE order_id=o.id),0),
          status='confirmed' WHERE o.id=$1`, [orderId]
            );
            const { rows: rTotal } = await client.query('SELECT total_pen FROM orders WHERE id=$1', [orderId]);
            const total = Number(rTotal[0].total_pen);

            if (total > currentBalance) throw new Error('Saldo insuficiente');

            const { rows: rPay } = await client.query(
                "INSERT INTO payments (order_id, amount_pen, status, method) VALUES ($1,$2,'paid','wallet') RETURNING id",
                [orderId, total]
            );
            
            // Registrar el débito en wallet_ledger (el trigger automáticamente actualizará wallets)
            await client.query(
                "INSERT INTO wallet_ledger (user_id, amount_pen, reason, ref_id) VALUES ($1,$2,'order',$3)",
                [userId, -total, orderId]
            );
            
            await client.query("UPDATE orders SET status='paid' WHERE id=$1", [orderId]);

            return { orderId, paymentId: rPay[0].id, total };
        });

        res.json({ ok: true, ...result });
    } catch (e) { console.error('[checkout]', e); res.status(400).json({ ok: false, error: e.message || 'No se pudo procesar el checkout' }); }
});

app.use((_, res) => res.status(404).json({ error: 'Not Found' }));

app.listen(PORT, () => console.log(`✅ API lista en http://localhost:${PORT}`));
