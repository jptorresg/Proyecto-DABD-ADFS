/**
 * @file auth.routes.js
 * @brief Rutas de autenticación para la aplicación
 * @module routes/auth
 */

const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');

/**
 * @brief Inicio de sesión de usuario
 * @route POST /login
 * @group Autenticación
 * @param {Object} req.body - Credenciales del usuario
 * @param {string} req.body.email - Correo electrónico
 * @param {string} req.body.password - Contraseña
 * @returns {Object} 200 - Token y datos del usuario
 * @returns {Error} 401 - Credenciales inválidas
 */
router.post('/login', ctrl.login);

/**
 * @brief Registro de nuevo usuario (ruta en español)
 * @route POST /registro
 * @group Autenticación
 * @param {Object} req.body - Datos del nuevo usuario
 * @param {string} req.body.nombre - Nombre completo
 * @param {string} req.body.email - Correo electrónico
 * @param {string} req.body.password - Contraseña
 * @returns {Object} 201 - Usuario creado exitosamente
 * @returns {Error} 400 - Datos inválidos o email ya registrado
 */
router.post('/registro', ctrl.register);

/**
 * @brief Registro de nuevo usuario (ruta en inglés)
 * @route POST /register
 * @group Autenticación
 * @param {Object} req.body - Datos del nuevo usuario
 * @param {string} req.body.name - Nombre completo
 * @param {string} req.body.email - Correo electrónico
 * @param {string} req.body.password - Contraseña
 * @returns {Object} 201 - Usuario creado exitosamente
 * @returns {Error} 400 - Datos inválidos o email ya registrado
 */
router.post('/register', ctrl.register);

/**
 * @brief Cierre de sesión de usuario
 * @route POST /logout
 * @group Autenticación
 * @param {Object} req.headers - Debe incluir token de autenticación
 * @returns {Object} 200 - Sesión cerrada exitosamente
 * @returns {Error} 401 - Token inválido o ausente
 */
router.post('/logout', ctrl.logout);

/**
 * @brief Obtener información del usuario autenticado
 * @route GET /me
 * @group Autenticación
 * @security BearerAuth
 * @param {Object} req.headers - Debe incluir token de autenticación
 * @returns {Object} 200 - Datos del usuario (sin contraseña)
 * @returns {Error} 401 - Token inválido o ausente
 * @returns {Error} 404 - Usuario no encontrado
 */
router.get('/me', ctrl.me);

module.exports = router;