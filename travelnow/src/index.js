/**
 * @file server.js
 * @description Punto de entrada principal para el servidor de TravelNow.
 */

require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const session = require('express-session');

const {
    loginLimiter,
    registroLimiter,
    searchLimiter,
    apiLimiter,
} = require('./middlewares/limit.middleware');

const app = express();

// ── Middleware global ──────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(session({
    secret:            process.env.SESSION_SECRET || 'travelnow_secret',
    resave:            false,
    saveUninitialized: false,
    cookie: {
        secure:   process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge:   8 * 60 * 60 * 1000,
    },
}));

// ── Archivos estáticos ─────────────────────────────────────────────────────
app.use('/public', express.static(path.join(__dirname, '../public')));
app.use(express.static(path.join(__dirname, '../public')));

// ── Rate limiters ──────────────────────────────────────────────────────────
app.use('/api/auth/login',    loginLimiter);
app.use('/api/auth/registro', registroLimiter);
app.use('/api/auth/register', registroLimiter);
app.use('/api/auth',          apiLimiter);
app.use('/api/search',        searchLimiter);
app.use('/api/reservaciones', apiLimiter);
app.use('/api/notifications', apiLimiter);
app.use('/api/admin',         apiLimiter);
app.use('/api/b2b',           apiLimiter);

// ── Routers ────────────────────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth.routes'));
app.use('/api/search',        require('./routes/search.routes'));
app.use('/api/reservaciones', require('./routes/reservacion.routes'));
app.use('/api/notifications', require('./routes/notificacion.routes'));
app.use('/api/admin',         require('./routes/admin.routes'));
app.use('/api/b2b',           require('./routes/b2b.routes'));

// ── Vistas ─────────────────────────────────────────────────────────────────
const view = (file) => (req, res) =>
    res.sendFile(path.join(__dirname, '../views', file));

app.get('/',           view('index.html'));
app.get('/login',      view('login.html'));
app.get('/registro',   view('registro.html'));
app.get('/register',   (req, res) => res.redirect('/registro'));

app.get('/buscar',     view('buscar.html'));
app.get('/resultados', view('resultados.html'));
app.get('/historial',  view('historial.html'));

app.get('/detalle-vuelo', view('detalle_vuelo.html'));
app.get('/detalle-hotel', view('detalle_hotel.html'));
app.get('/paquetes',      view('paquetes.html'));

app.get('/checkout',     view('checkout.html'));
app.get('/confirmacion', view('confirmacion.html'));

// Panel admin
app.get('/admin',                  view('admin/dashboard.html'));
app.get('/admin/dashboard',        view('admin/dashboard.html'));
app.get('/admin/usuarios',         view('admin/usuarios.html'));
app.get('/admin/reservaciones',    view('admin/reservaciones.html'));
app.get('/admin/proveedores',      view('admin/proveedores.html'));
app.get('/admin/auditoria',        view('admin/auditoria.html'));

// Vistas informativas
app.get('/about',    view('about.html'));
app.get('/services', view('services.html'));
app.get('/contact',  view('contact.html'));

// ── 404 ────────────────────────────────────────────────────────────────────
app.use((req, res) => {
    if (req.path.startsWith('/api'))
        return res.status(404).json({ ok: false, message: 'Ruta no encontrada' });
    res.status(404).sendFile(path.join(__dirname, '../views/404.html'));
});

// ── Error global ───────────────────────────────────────────────────────────
app.use((error, req, res, next) => {
    console.error('Error no manejado:', error);
    res.status(500).json({ ok: false, message: 'Error interno del servidor' });
});

// ── Arrancar ───────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`TravelNow corriendo en http://localhost:${PORT}`);
    console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
    require('./services/cron.service').iniciarCron();
});

module.exports = app;