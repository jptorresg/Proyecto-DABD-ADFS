require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');

const app = express();

// Middleware global
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

// Vistas, diseños e imagenes o tambien archivos estaticos
app.use('/public', express.static(path.join(__dirname, '../public')));
app.use(express.static(path.join(__dirname, '../public')));

// APIS REST
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/search', require('./routes/search.routes'));
app.use('/api/reservaciones', require('./routes/reservacion.routes'));
app.use('/api/notifications', require('./routes/notificacion.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

//Vistas
const view = (file) => (req, res) => res.sendFile(path.join(__dirname, '../views', file));

//Vistas públicas
app.get('/', view('index.html'));
app.get('/login', view('login.html'));
app.get('/registro', view('registro.html'));

//Redireccion a registro
app.get('/register', (req, res) => res.redirect('/registro'));

//Buscar y mostrar resultado
app.get('/buscar', view('buscar.html'));
app.get('/resultados', view('resultados.html'));

//Detalles
app.get('/detalle-vuelo', view('detalle_vuelo.html'));
app.get('/detalle-hotel', view('detalle_hotel.html'));

//Flujo de la compra
app.get('/checkout', view('checkout.html'));
app.get('/confirmacion', view('confirmacion.html'));

//Administrador
app.get('/admin', view('admin/dashboard.html'));

//Error 404
app.use((req,res) => {
    if(req.path.startsWith('/api')) {
        return res.status(404).json({ ok: false, message: 'Ruta no encontrada' });
    }
    res.status(404).sendFile(path.join(__dirname, '../views/404.html'));
});

//Error global
app.use((error, req, res, next) => {
    console.error('Error no manejado:', error);
    res.status(500).json({ ok: false, message: 'Error interno del servidor' });
});

//Inicia el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`TravelNow corriendo en http://localhost:${PORT}`);
    console.log(`Ambiente: ${process.env.NODE_ENV || "development"}`);
    require('./services/cron.service').iniciarCron();
});


module.exports = app;