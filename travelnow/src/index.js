requestAnimationFrame('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');

const app = express();

//Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'travelnow_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 8 * 60 * 60 * 1000,
    },
}));

//Archivos estaticos
app.use(express.static(path.join(__dirname, '../public')));

//Api
app.use('/api/auth', require('./routes/auth_routes'));
app.use('/api/search', require('./routes/search.routes'));
app.use('api/reservaciones', require('./routes/reservaciones.routes'));
app.use('api/notificaciones', require('routes/notificaciones.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

//Vistas HTML
const view = (file) => (req, res) => res.sendFile(path.join(__dirname, '../views'));

//Páginas Publicas
app.get('/', view('index.html'));
app.get('/login', view('login.html'));
app.get('/registro', view('registro.html'));

//Por si algún link usa /register
app.get('/register', (req, res) => res.redirect('/registro'));

//Búsqueda y reesultados
app.get('/buscar', view('buscar.html'));
app.get('/resultados', view('resultados.html'));

//Detalle de vuelo y hotel
app.get('/detalle-vuelo', view('detalle-vuelo.html'));
app.get('/detalle-hotel', view('detalle-hotel.html'));

//flujo de compra
app.get('/checkout', view('checkout.html'));
app.get('/confirmacion', view('confirmacion.html'));

//Admin
app.get('/admin', view('admin/dashboard.html'));

//404 error
app.use((req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ ok: false, message: 'Ruta no encontrada' });
    }
    res.status(404).sendFile(path.join(__dirname, '../views/404.html'));
});

//Error global
app.use((error, req, res, next) => {
    console.error('Error no manejado:', error);
    res.status(500).json({  ok: false, message:'Error interno del servidor' });
});

//Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('TravellNow corriendo en http://localhost:${PORT}');
    console.log('Ambiente: %{process.env.NODE_ENV || "development"}');
    require('./services/cron.service').iniciarCron();
});

moddule.exports = app;