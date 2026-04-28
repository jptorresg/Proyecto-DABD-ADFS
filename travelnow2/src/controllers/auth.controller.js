/**
 * @file authController.js
 * @brief Controlador de autenticación para el manejo de usuarios
 * @details Proporciona funciones para registro, login, logout y obtención de datos del usuario
 */

const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { ok, err } = require('../utils/response');
require('dotenv').config();

/**
 * @brief Registra un nuevo usuario en el sistema
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} req.body - Cuerpo de la solicitud
 * @param {string} req.body.nombre - Nombre del usuario
 * @param {string} req.body.apellido - Apellido del usuario
 * @param {string} req.body.correo - Correo electrónico del usuario
 * @param {string} req.body.contrasena - Contraseña del usuario
 * @param {string} req.body.fecha_nacimiento - Fecha de nacimiento (YYYY-MM-DD)
 * @param {string} [req.body.pais_origen] - País de origen (opcional)
 * @param {string} [req.body.nacionalidad] - Nacionalidad (opcional)
 * @param {string} [req.body.numero_pasaporte] - Número de pasaporte (opcional)
 * @param {Object} res - Objeto de respuesta HTTP
 * @returns {Promise<Object>} Respuesta con mensaje de éxito o error
 */
const register = async (req, res) => {
    const { nombre, apellido, correo, contrasena, fecha_nacimiento, pais_origen, nacionalidad, numero_pasaporte } = req.body;
    
    /// @brief Validación de campos obligatorios
    if (!nombre || !apellido || !correo || !contrasena || !fecha_nacimiento) {
        return err(res, 'Campos obligatorios faltantes', 400);
    }
    
    try {
        /// @brief Verificar si el correo ya existe en la base de datos
        const [exist] = await db.query('SELECT id_usuario FROM usuario WHERE correo = ?', [correo]);
        if (exist.length) return err(res, 'El correo ya está registrado', 409);
        
        /// @brief Insertar nuevo usuario en la base de datos
        /// @note Los campos opcionales se asignan como NULL si no se proporcionan
        const [result] = await db.query(
            'INSERT INTO usuario (nombre, apellido, correo, contrasena, fecha_nacimiento, pais_origen, nacionalidad, numero_pasaporte) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [nombre, apellido, correo, contrasena, fecha_nacimiento, pais_origen || null, nacionalidad || null, numero_pasaporte || null]
        );
        
        return ok(res, { message: 'Usuario registrado', id: result.insertId }, 201);
    } catch (e) { 
        /// @brief Manejo de errores inesperados
        return err(res, e.message); 
    }
};

/**
 * @brief Autentica un usuario y genera un token JWT
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} req.body - Cuerpo de la solicitud
 * @param {string} req.body.correo - Correo electrónico del usuario
 * @param {string} req.body.contrasena - Contraseña del usuario
 * @param {Object} req.headers - Headers HTTP
 * @param {string} [req.headers['hx-request']] - Indica si es una petición HTMX
 * @param {Object} res - Objeto de respuesta HTTP
 * @returns {Promise<Object>} Token JWT y datos del usuario o mensaje de error
 */
const login = async (req, res) => {
    const { correo, contrasena } = req.body;
    
    /// @brief Validación de credenciales
    if (!correo || !contrasena) return err(res, 'Correo y contraseña requeridos', 400);
   
    try {
        /// @brief Buscar usuario activo por correo electrónico
        const [rows] = await db.query(
            'SELECT * FROM usuario WHERE correo = ? AND estado = "activo"', [correo]
        );
        if (!rows.length) return err(res, 'Credenciales incorrectas', 401);
   
        const usuario = rows[0];
        const bcrypt = require('bcrypt');
        
        /// @brief Verificar contraseña (NOTA: Se recomienda usar bcrypt.compare)
        if (contrasena !== usuario.contrasena) return err(res, 'Credenciales incorrectas', 401);
   
        /// @brief Construir payload del token JWT
        const payload = {
            id_usuario: usuario.id_usuario,
            nombre:     usuario.nombre,
            correo:     usuario.correo,
            rol:        usuario.rol,
        };
   
        /// @brief Guardar usuario en sesión
        req.session.user = payload;
   
        /// @brief Generar token JWT con expiración configurable
        const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', {
            expiresIn: process.env.JWT_EXPIRES_IN || '8h',
        });
   
        /// @brief Manejo especial para peticiones HTMX
        if (req.headers['hx-request']) {
            /// @brief Redirección según el rol del usuario
            res.set('HX-Redirect', usuario.rol === 'administrador' ? '/admin' : '/');
            return res.status(200).send();
        }
        
        return ok(res, { token, usuario: payload });
    } catch (e) {
        return err(res, e.message);
    }
};
   
/**
 * @brief Cierra la sesión del usuario actual
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} req.session - Objeto de sesión
 * @param {Object} req.headers - Headers HTTP
 * @param {string} [req.headers['hx-request']] - Indica si es una petición HTMX
 * @param {Object} res - Objeto de respuesta HTTP
 * @returns {void} Redirecciona o responde según el tipo de petición
 */
const logout = (req, res) => {
    /// @brief Destruir la sesión del usuario
    req.session.destroy();
    
    /// @brief Manejo especial para peticiones HTMX
    if (req.headers['hx-request']) {
        res.set('HX-Redirect', '/login');
        return res.status(200).send();
    }
    
    res.redirect('/login');
};
   
/**
 * @brief Obtiene los datos del usuario autenticado actualmente
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} req.session - Objeto de sesión
 * @param {Object} req.session.user - Datos del usuario autenticado
 * @param {Object} res - Objeto de respuesta HTTP
 * @returns {Object} Datos del usuario autenticado o mensaje de error
 */
const me = (req, res) => {
    /// @brief Verificar si el usuario está autenticado
    if (req.session?.user) {
        return ok(res, { usuario: req.session.user });
    }
    return err(res, 'No autenticado', 401);
};
   
/// @brief Exportar funciones del controlador
module.exports = { register, login, logout, me };