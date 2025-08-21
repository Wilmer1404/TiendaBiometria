# 🛒 Tienda Inteligente con Autenticación Biométrica
hola
Una aplicación web moderna que combina una tienda en línea con un sistema de autenticación biométrica basado en reconocimiento facial.

## ✨ Características Principales

### 🔐 Sistema de Autenticación Biométrica
- **Reconocimiento facial** usando modelos de IA pre-entrenados
- **Enrolamiento seguro** de usuarios con captura de rostro
- **Verificación en tiempo real** para acceso a la tienda
- **Almacenamiento seguro** de vectores biométricos (no fotos)

### 👤 Gestión de Usuarios
- **Registro completo** de nuevas personas
- **Datos personales**: código de estudiante, nombre, email
- **Billetera digital** con saldo inicial configurable
- **Flujo integrado** desde registro hasta acceso a la tienda

### 🛍️ Tienda Inteligente
- **Catálogo de productos** con diseño moderno
- **Carrito de compras** interactivo
- **Pago automático** desde la billetera del usuario
- **Validación de saldo** en tiempo real
- **Interfaz responsiva** para todos los dispositivos

## 🚀 Flujo de Usuario

1. **📝 Registro**: El usuario completa sus datos personales
2. **📸 Enrolamiento**: Captura su rostro para el sistema biométrico
3. **🔓 Autenticación**: Se autentica usando reconocimiento facial
4. **🛒 Compra**: Accede a la tienda y realiza compras
5. **💳 Pago**: Paga automáticamente desde su billetera

## 🛠️ Tecnologías Utilizadas

### Frontend
- **React 18** con hooks modernos
- **Bootstrap 5** para diseño responsivo
- **CSS personalizado** con gradientes y animaciones
- **Bootstrap Icons** para iconografía consistente

### Backend
- **Node.js** con Express
- **PostgreSQL** como base de datos
- **pgvector** para almacenamiento de vectores biométricos
- **CORS** configurado para desarrollo

### IA y Biometría
- **face-api.js** para detección y reconocimiento facial
- **Modelos pre-entrenados** para landmarks y embeddings
- **Umbral configurable** de similitud coseno

## 📁 Estructura del Proyecto

```
TiendaBiometria/
├── backend/                 # Servidor Node.js
│   ├── server.js           # API principal
│   └── package.json        # Dependencias del backend
├── frontend/               # Aplicación React
│   ├── src/
│   │   ├── pages/         # Páginas principales
│   │   │   ├── PersonRegistration.jsx
│   │   │   ├── BiometricEnroll.jsx
│   │   │   ├── BiometricLogin.jsx
│   │   │   └── Store.jsx
│   │   ├── components/    # Componentes reutilizables
│   │   ├── lib/           # Utilidades y API
│   │   └── App.jsx        # Componente principal
│   ├── public/            # Archivos estáticos
│   └── package.json       # Dependencias del frontend
└── README.md              # Este archivo
```

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18+ y npm
- PostgreSQL 13+ con extensión pgvector
- Navegador moderno con acceso a cámara

### 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd TiendaBiometria
```

### 2. Configurar la base de datos PostgreSQL

#### Instalar PostgreSQL y pgvector
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo apt install postgresql-13-pgvector  # o la versión correspondiente

# macOS con Homebrew
brew install postgresql
brew install pgvector

# Windows: Descargar desde postgresql.org
```

#### Crear la base de datos
```bash
# Conectar como usuario postgres
sudo -u postgres psql

# Crear base de datos
CREATE DATABASE tienda_biometria;
CREATE USER tienda_user WITH PASSWORD 'tu_password_seguro';
GRANT ALL PRIVILEGES ON DATABASE tienda_biometria TO tienda_user;
\q
```

#### Ejecutar el script de configuración
```bash
# Conectar a la base de datos
psql -U tienda_user -d tienda_biometria -h localhost

# Ejecutar el script SQL
\i backend/database.sql
```

### 3. Configurar variables de entorno
```bash
# Crear archivo .env en la carpeta backend
cd backend
cp .env.example .env  # si existe
```

Editar `backend/.env`:
```bash
# Configuración del servidor
PORT=3000

# Base de datos PostgreSQL
DATABASE_URL=postgresql://tienda_user:tu_password_seguro@localhost:5432/tienda_biometria

# Configuración CORS
CORS_ORIGIN=http://localhost:5173

# Umbral de similitud facial (0.0 = idéntico, 1.0 = completamente diferente)
FACE_COSINE_THRESHOLD=0.6

# Configuración de seguridad
NODE_ENV=development
```

### 4. Instalar dependencias
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 5. Ejecutar la aplicación
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

La aplicación estará disponible en:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000

### 6. Verificar la instalación
1. Abre http://localhost:5173 en tu navegador
2. Verifica que puedas acceder a la página de registro
3. Revisa la consola del navegador para errores
4. Verifica que el backend esté respondiendo en http://localhost:3000/api/health

## 🎨 Características de Diseño

### Diseño Visual
- **Paleta de colores** moderna y profesional
- **Gradientes** sutiles para elementos importantes
- **Sombras y elevaciones** para profundidad visual
- **Iconografía consistente** con Bootstrap Icons

### Experiencia de Usuario
- **Flujo guiado** paso a paso para el registro
- **Indicadores visuales** de progreso
- **Feedback inmediato** para todas las acciones
- **Diseño responsivo** para móviles y escritorio

### Accesibilidad
- **Contraste adecuado** para mejor legibilidad
- **Etiquetas descriptivas** en formularios
- **Mensajes de estado** claros y útiles
- **Navegación por teclado** soportada

## 🔒 Seguridad

### Protección de Datos
- **No se almacenan fotos** del rostro
- **Vectores encriptados** en la base de datos
- **Validación de entrada** en todos los endpoints
- **Transacciones seguras** para operaciones críticas

### Autenticación
- **Umbral configurable** de similitud facial
- **Logs de autenticación** para auditoría
- **Prevención de ataques** de fuerza bruta
- **Sesiones seguras** por usuario

## 🧪 Pruebas

### Funcionalidades a Probar
1. **Registro de usuario** con datos válidos
2. **Enrolamiento biométrico** con diferentes rostros
3. **Autenticación** con rostros enrolados
4. **Compra de productos** con saldo suficiente
5. **Validación de saldo** insuficiente

### Casos de Error
- Registro con datos duplicados
- Enrolamiento sin rostro detectado
- Autenticación con rostro no enrolado
- Compra con saldo insuficiente

## 🚧 Desarrollo Futuro

### Mejoras Planificadas
- [ ] **Autenticación de dos factores** (biometría + PIN)
- [ ] **Historial de transacciones** detallado
- [ ] **Notificaciones push** para compras
- [ ] **API REST** documentada con Swagger
- [ ] **Tests automatizados** con Jest
- [ ] **Docker** para despliegue simplificado

### Optimizaciones
- [ ] **Lazy loading** de modelos de IA
- [ ] **Cache de productos** en Redis
- [ ] **Compresión de imágenes** automática
- [ ] **PWA** para instalación en móviles

## 📞 Soporte

Para reportar bugs o solicitar nuevas características:
1. Crear un issue en el repositorio
2. Describir el problema o solicitud
3. Incluir pasos para reproducir (si aplica)
4. Adjuntar capturas de pantalla (si es necesario)

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

**Desarrollado con ❤️ para demostrar el potencial de la biometría en aplicaciones comerciales.**
