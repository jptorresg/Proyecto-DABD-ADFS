/**
 * @file authMiddleware.js
 * @brief Middlewares de autenticación y autorización para la aplicación.
 * 
 * Este archivo contiene middlewares para verificar JWT en APIs REST,
 * verificar sesiones para vistas HTMX, y controlar roles de usuario.
 * 
 * @author Tu Nombre
 * @date 2026-04-09
 */

//Verificacion de JWT en headers (API REST) o sesión (para HTMX)
//JWT: json web token
const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * @brief Middleware para verificar token JWT en peticiones API REST.
 * 
 * Extrae el token del header 'Authorization' (formato Bearer token),
 * lo verifica con la clave secreta JWT_SECRET y almacena los datos
 * del usuario decodificados en `req.user`.
 * 
 * @param {Object} req - Objeto de petición de Express
 * @param {Object} res - Objeto de respuesta de Express
 * @param {Function} next - Función next de Express
 * 
 * @returns {Object} Respuesta JSON con error si el token no es válido o no existe
 * 
 * @example
 * // Uso en ruta API
 * app.get('/api/protected', verifyToken, (req, res) => {
 *   res.json({ user: req.user });
 * });
 */
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

/**
 * @brief Middleware para verificar sesión de usuario en vistas HTMX.
 * 
 * Verifica si existe una sesión activa con datos de usuario.
 * Para peticiones HTMX, usa HX-Redirect para redirigir sin recargar.
 * Para peticiones normales, redirige a /login.
 * 
 * @param {Object} req - Objeto de petición de Express (debe tener session)
 * @param {Object} res - Objeto de respuesta de Express
 * @param {Function} next - Función next de Express
 * 
 * @returns {void|Object} Redirección o respuesta vacía en caso de error
 * 
 * @example
 * // Uso en ruta de vista
 * app.get('/dashboard', verifySession, (req, res) => {
 *   res.render('dashboard', { user: req.user });
 * });
 */
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

/**
 * @brief Middleware factory para verificar roles de usuario.
 * 
 * Crea un middleware que verifica si el rol del usuario autenticado
 * está incluido en la lista de roles permitidos.
 * 
 * @param {...string} roles - Lista de roles permitidos (ej: 'admin', 'user')
 * @returns {Function} Middleware de Express que valida roles
 * 
 * @description
 * Este middleware debe usarse DESPUÉS de `verifyToken` o `verifySession`,
 * ya que depende de `req.user` previamente establecido.
 * 
 * @example
 * // Ruta solo para administradores
 * app.delete('/api/user/:id', verifyToken, requireRole('admin'), (req, res) => {
 *   // Lógica de eliminación
 * });
 * 
 * @example
 * // Ruta para admin o editor
 * app.put('/api/post/:id', verifyToken, requireRole('admin', 'editor'), (req, res) => {
 *   // Lógica de edición
 * });
 */
const requireRole = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user?.rol)) {
        if(req.headers['hx-request']) {
            return res.status(403).send('<p class="text-danger">Acceso denegado</p>');
        }
        return res.status(403).json({ ok: false, message: 'Acceso denegado' });
    }
    next();
};

/**
 * @brief Middleware de autenticación dual: acepta JWT o sesión.
 * 
 * Prioridad:
 *   1. Si viene header Authorization: Bearer <token> → valida JWT (cliente B2B).
 *      El payload del token debe incluir { id_usuario, correo, rol } y rol === 'webservice'.
 *   2. Si hay sesión activa (req.session.user) → usa la sesión (navegador).
 *   3. Si no hay ninguna → 401.
 * 
 * Marca req.user.es_b2b = true cuando la auth fue por JWT,
 * para que los controladores puedan diferenciar (logs, registros, etc.).
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next
 */
const verifyAuth = (req, res, next) => {
    const header = req.headers['authorization'];
    const token  = header && header.startsWith('Bearer ') ? header.slice(7).trim() : null;

    // 1) Intentar JWT primero (cliente B2B)
    if (token) {
        try {
            const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
            if (payload.rol !== 'webservice') {
                return res.status(403).json({
                    ok: false,
                    message: 'Token válido pero el rol no es webservice. Solo usuarios B2B pueden usar el API REST.',
                });
            }
            req.user = { ...payload, es_b2b: true };
            return next();
        } catch {
            return res.status(401).json({ ok: false, message: 'Token JWT inválido o expirado' });
        }
    }

    // 2) Fallback a sesión del navegador
    if (req.session?.user) {
        req.user = { ...req.session.user, es_b2b: false };
        return next();
    }

    // 3) Nada autenticado
    if (req.headers['hx-request']) {
        res.set('HX-Redirect', '/login');
        return res.status(401).send();
    }
    return res.status(401).json({ ok: false, message: 'No autenticado. Inicia sesión o envía un token JWT.' });
};

/**
 * @module authMiddleware
 * @description Middlewares exportados para autenticación y autorización
 * 
 * @property {Function} verifyToken - Middleware para verificar JWT en APIs
 * @property {Function} verifySession - Middleware para verificar sesión en vistas
 * @property {Function} requireRole - Middleware factory para verificar roles
 */
module.exports = { verifyToken, verifySession, verifyAuth, requireRole };