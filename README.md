# TiendaBiometria

Tienda inteligente con autenticación biométrica facial para mejorar la experiencia de compra y seguridad de los usuarios.

## Tabla de Contenidos

- [Descripción](#descripción)
- [Características](#características)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Uso](#uso)
- [Dependencias Principales](#dependencias-principales)
- [Contribución](#contribución)
- [Créditos](#créditos)
- [Licencia](#licencia)

## Descripción

TiendaBiometria es una plataforma web que integra reconocimiento facial para la autenticación de usuarios en una tienda inteligente. Permite registrar, autenticar y gestionar usuarios y compras de manera segura y eficiente, utilizando tecnologías modernas tanto en el frontend como en el backend.

## Características

- Registro y login biométrico facial.
- Gestión de productos y carrito de compras.
- Interfaz moderna y responsiva con React y Vite.
- Backend robusto con Node.js y Express.
- Integración de modelos de IA para reconocimiento facial (face-api.js).

## Estructura del Proyecto

```
TiendaBiometria/
├── backend/           # Servidor Node.js (API REST)
│   ├── package.json
│   └── server.js
├── frontend/          # Aplicación web React + Vite
│   ├── src/
│   │   ├── components/    # Componentes reutilizables
│   │   ├── pages/         # Páginas principales
│   │   ├── lib/           # Lógica y utilidades
│   │   └── assets/        # Recursos estáticos
│   ├── public/models/     # Modelos de IA para biometría
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Instalación

### Requisitos previos

- Node.js >= 16.x
- npm >= 8.x

### Clonar el repositorio

```bash
git clone https://github.com/Wilmer1404/TiendaBiometria.git
cd TiendaBiometria
```

### Backend

```bash
cd backend
npm install
npm start
```

### Frontend

En otra terminal:

```bash
cd frontend
npm install
npm run dev
```

La aplicación estará disponible en `http://localhost:5173` por defecto.

## Configuración

Puedes configurar variables de entorno en el backend (por ejemplo, puerto, conexión a base de datos) creando un archivo `.env` en la carpeta `backend/`.

## Uso

1. Inicia el backend y el frontend como se indica arriba.
2. Accede a la aplicación web desde tu navegador.
3. Regístrate usando tu rostro y comienza a comprar.
4. El sistema reconocerá tu rostro para iniciar sesión y gestionar tu carrito de compras.

## Dependencias Principales

### Backend
- express
- cors
- body-parser

### Frontend
- react
- vite
- face-api.js
- axios

## Contribución

¡Las contribuciones son bienvenidas! Por favor, abre un issue o pull request para sugerencias o mejoras.

## Créditos

Desarrollado por Wilmer1404 y colaboradores.

## Licencia

Este proyecto está bajo la licencia MIT.
