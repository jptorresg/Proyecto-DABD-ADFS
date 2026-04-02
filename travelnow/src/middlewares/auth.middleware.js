//Verificacion de JWT en headers (API REST) o sesión (para HTMX)
//JWT: json web token
const jwt = require('jsonwebtoken');
require('dotenv').config();

//Ruta API
const verifyToken = (req, res, next) => {
    const header = req.headers['authorization'];
    const token = header && header.split(' ')[1];
    if (!token) {
        return res.status(401).json({ ok: false, message: 'Token requerido' });
    }
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch {
        return res.status(403).json({ ok: false, message: 'Token inválido o expirado' });
    }
};

//Para vistas HTMX
const verifySession = (req, res, next) => {
    if(!req.session || !req.session.user) {
        //redigir con HX-Redirect
        if(req.headers['hx-request']) {
            res.set('HX-Redirect', '/login');
            return res.status(401).send();
        }
        return res.redirect('/login');
    }
    req.user = req.session.user;
    next();
};

//Rol - usar despues de verifySession o verifyToken
const requireRole = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user?.rol)) {
        if(req.headers['hx-request']) {
            return res.status(403).send('<p class="text-danger">Acceso denegado</p>');
        }
        return res.status(403).json({ ok: false, message: 'Acceso denegado' });
    }
    next();
};

module.exports = { verifyToken, verifySession, requireRole };