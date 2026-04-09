/**
 * @file server.js
 * @description Punto de entrada principal para el servidor de TravelNow.
 * Configura middleware, rutas API, vistas estáticas y manejo de errores.
 * @requires dotenv
 * @requires express
 * @requires cors
 * @requires path
 * @requires express-session
 * @requires ./middlewares/limit.middleware
 * @requires ./services/cron.service
 */

require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const session = require('express-session');

// FIX #15: importar los limitadores
/**
 * Middlewares de rate limiting para diferentes endpoints
 * @type {Object}
 * @property {Function} loginLimiter - Limitador para intentos de login
 * @property {Function} registroLimiter - Limitador para registros de usuarios
 * @property {Function} searchLimiter - Limitador para búsquedas
 * @property {Function} apiLimiter - Limitador general para API
 */
const {
    loginLimiter,
    registroLimiter,
    searchLimiter,
    apiLimiter,
} = require('./middlewares/limit.middleware');

/**
 * Instancia principal de la aplicación Express
 * @type {express.Application}
 */
const app = express();

// ── Middleware global ──────────────────────────────────────────────────────
/**
 * Configura middleware globales para la aplicación
 * - CORS: Habilita peticiones cross-origin
 * - JSON: Parseo de cuerpos JSON
 * - URL-encoded: Parseo de formularios URL-encoded
 * - Session: Manejo de sesiones con express-session
 */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Configuración de sesiones HTTP
 * @see https://github.com/expressjs/session
 */
app.use(session({
    secret:            process.env.SESSION_SECRET || 'travelnow_secret',
    resave:            false,
    saveUninitialized: false,
    cookie: {
        secure:   process.env.NODE_ENV === 'production',  /**< Solo HTTPS en producción */
        httpOnly: true,                                    /**< Previene acceso XSS */
        maxAge:   8 * 60 * 60 * 1000,                     /**< 8 horas de duración */
    },
}));

// ── Archivos estáticos ─────────────────────────────────────────────────────
/**
 * Sirve archivos estáticos desde el directorio public
 * @param {string} '/public' - Ruta pública para acceder a archivos estáticos
 * @param {string} __dirname + '/../public' - Ruta física al directorio public
 */
app.use('/public', express.static(path.join(__dirname, '../public')));
app.use(express.static(path.join(__dirname, '../public')));

// ── API REST ───────────────────────────────────────────────────────────────
// FIX #15: aplicar rate limiters específicos antes de montar las rutas.
// loginLimiter y registroLimiter se aplican a nivel de router completo;
// los endpoints internos (logout, me) quedan bajo apiLimiter general.

/**
 * Aplicación de rate limiters a rutas específicas de autenticación
 * Protege contra ataques de fuerza bruta en login y registro
 */
app.use('/api/auth/login',    loginLimiter);
app.use('/api/auth/registro', registroLimiter);
app.use('/api/auth/register', registroLimiter);
app.use('/api/auth',          apiLimiter);

/**
 * Limitador específico para búsquedas - previene scraping excesivo
 */
app.use('/api/search',        searchLimiter);

/**
 * Limitadores generales para operaciones CRUD y administración
 */
app.use('/api/reservaciones', apiLimiter);
app.use('/api/notifications', apiLimiter);
app.use('/api/admin',         apiLimiter);

/**
 * Montaje de routers de la API después de aplicar limitadores
 * @see ./routes/auth.routes - Rutas de autenticación
 * @see ./routes/search.routes - Rutas de búsqueda
 * @see ./routes/reservacion.routes - Rutas de reservaciones
 * @see ./routes/notificacion.routes - Rutas de notificaciones
 * @see ./routes/admin.routes - Rutas administrativas
 */
app.use('/api/auth',          require('./routes/auth.routes'));
app.use('/api/search',        require('./routes/search.routes'));
app.use('/api/reservaciones', require('./routes/reservacion.routes'));
app.use('/api/notifications', require('./routes/notificacion.routes'));
app.use('/api/admin',         require('./routes/admin.routes'));

// ── Vistas ─────────────────────────────────────────────────────────────────
/**
 * Helper para servir archivos HTML estáticos desde el directorio views
 * @param {string} file - Nombre del archivo HTML a servir
 * @returns {Function} Express middleware que sirve el archivo solicitado
 */
const view = (file) => (req, res) =>
    res.sendFile(path.join(__dirname, '../views', file));

/**
 * Rutas para vistas públicas de la aplicación
 */
app.get('/',           view('index.html'));          /**< Página principal */
app.get('/login',      view('login.html'));          /**< Página de inicio de sesión */
app.get('/registro',   view('registro.html'));       /**< Página de registro */
app.get('/register',   (req, res) => res.redirect('/registro')); /**< Redirección de URL alternativa */

/**
 * Rutas para búsqueda y resultados
 */
app.get('/buscar',     view('buscar.html'));         /**< Formulario de búsqueda */
app.get('/resultados', view('resultados.html'));     /**< Resultados de búsqueda */

/**
 * Rutas para detalles de productos
 */
app.get('/detalle-vuelo', view('detalle_vuelo.html')); /**< Detalles de vuelo */
app.get('/detalle-hotel', view('detalle_hotel.html')); /**< Detalles de hotel */

/**
 * Rutas para proceso de compra
 */
app.get('/checkout',    view('checkout.html'));       /**< Carrito y checkout */
app.get('/confirmacion',view('confirmacion.html'));   /**< Confirmación de reserva */

/**
 * Rutas del panel administrativo
 */
app.get('/admin',                  view('admin/dashboard.html'));     /**< Dashboard admin */
app.get('/admin/dashboard',        view('admin/dashboard.html'));     /**< Dashboard (alternativo) */
app.get('/admin/usuarios',         view('admin/usuarios.html'));      /**< Gestión de usuarios */
app.get('/admin/reservaciones',    view('admin/reservaciones.html')); /**< Gestión de reservas */
app.get('/admin/proveedores',      view('admin/proveedores.html'));   /**< Gestión de proveedores */

// ── 404 ────────────────────────────────────────────────────────────────────
/**
 * Middleware para manejar rutas no encontradas
 * @param {express.Request} req - Objeto de solicitud Express
 * @param {express.Response} res - Objeto de respuesta Express
 */
app.use((req, res) => {
    if (req.path.startsWith('/api'))
        return res.status(404).json({ ok: false, message: 'Ruta no encontrada' });
    res.status(404).sendFile(path.join(__dirname, '../views/404.html'));
});

// ── Error global ───────────────────────────────────────────────────────────
/**
 * Middleware global para manejo de errores no capturados
 * @param {Error} error - Objeto de error
 * @param {express.Request} req - Objeto de solicitud Express
 * @param {express.Response} res - Objeto de respuesta Express
 * @param {Function} next - Función next de Express
 */
app.use((error, req, res, next) => {
    console.error('Error no manejado:', error);
    res.status(500).json({ ok: false, message: 'Error interno del servidor' });
});

// ── Arrancar ───────────────────────────────────────────────────────────────
/**
 * Puerto en el que escucha el servidor
 * @constant {number|string}
 * @default 3000
 */
const PORT = process.env.PORT || 3000;

/**
 * Inicia el servidor Express y configura servicios programados
 * @event listen
 * @param {number|string} PORT - Puerto de escucha
 * @param {Function} callback - Función ejecutada al iniciar el servidor
 */
app.listen(PORT, () => {
    console.log(`TravelNow corriendo en http://localhost:${PORT}`);
    console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
    require('./services/cron.service').iniciarCron();  /**< Inicia tareas programadas */
});

/**
 * Exporta la aplicación para pruebas y otros módulos
 * @module app
 */
module.exports = app;