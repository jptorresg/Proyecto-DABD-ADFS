/**
 * @file routes/admin.routes.js
 * @description Rutas del panel de administración del sistema
 * @module routes/admin
 */

const router = require('express').Router();
const ctrl = require('../controllers/admin.controller');
const { verifySession, requireRole } = require('../middlewares/auth.middleware');

/**
 * Middleware de autenticación y autorización para administradores
 * @constant {Array<Function>}
 * @description Combina la verificación de sesión y el rol de administrador
 */
const isAdmin = [verifySession, requireRole('administrador')];

// ==================== RUTAS DEL DASHBOARD ====================

/**
 * @route GET /admin/dashboard
 * @description Muestra el panel principal de administración
 * @access Admin
 * @middleware isAdmin - Verifica autenticación y rol de administrador
 * @returns {HTML|JSON} Vista del dashboard o datos estadísticos
 */
router.get('/dashboard', ...isAdmin, ctrl.dashboard);

/**
 * @route GET /admin/usuarios
 * @description Muestra la página de gestión de usuarios
 * @access Admin
 * @middleware isAdmin
 * @returns {HTML} Vista de administración de usuarios
 */
router.get('/usuarios', ...isAdmin, ctrl.usuarios);

/**
 * @route GET /admin/reservaciones
 * @description Muestra la página de gestión de reservaciones
 * @access Admin
 * @middleware isAdmin
 * @returns {HTML} Vista de administración de reservaciones
 */
router.get('/reservaciones', ...isAdmin, ctrl.reservaciones);

/**
 * @route GET /admin/proveedores
 * @description Muestra la página de gestión de proveedores
 * @access Admin
 * @middleware isAdmin
 * @returns {HTML} Vista de administración de proveedores
 */
router.get('/proveedores', ...isAdmin, ctrl.proveedores);

// ==================== RUTAS DE PROVEEDORES (API) ====================

/**
 * @route GET /admin/proveedores/data
 * @description Obtiene listado de todos los proveedores (datos para DataTable)
 * @access Admin
 * @middleware isAdmin
 * @returns {Array<Object>} Lista de proveedores en formato JSON
 */
router.get('/proveedores/data', ...isAdmin, ctrl.listarProveedores);

/**
 * @route GET /admin/proveedores/:id
 * @description Obtiene un proveedor específico por su ID
 * @access Admin
 * @middleware isAdmin
 * @param {string} id - ID del proveedor
 * @returns {Object} Datos del proveedor solicitado
 */
router.get('/proveedores/:id', ...isAdmin, ctrl.obtenerProveedor);

/**
 * @route POST /admin/proveedores
 * @description Crea un nuevo proveedor en el sistema
 * @access Admin
 * @middleware isAdmin
 * @param {Object} req.body - Datos del nuevo proveedor
 * @returns {Object} Proveedor creado con su ID asignado
 */
router.post('/proveedores', ...isAdmin, ctrl.crearProveedor);

/**
 * @route PUT /admin/proveedores/:id
 * @description Actualiza los datos de un proveedor existente
 * @access Admin
 * @middleware isAdmin
 * @param {string} id - ID del proveedor a actualizar
 * @param {Object} req.body - Datos actualizados del proveedor
 * @returns {Object} Proveedor actualizado
 */
router.put('/proveedores/:id', ...isAdmin, ctrl.actualizarProveedor);

/**
 * @route DELETE /admin/proveedores/:id
 * @description Elimina un proveedor del sistema
 * @access Admin
 * @middleware isAdmin
 * @param {string} id - ID del proveedor a eliminar
 * @returns {Object} Confirmación de eliminación
 */
router.delete('/proveedores/:id', ...isAdmin, ctrl.eliminarProveedor);

// ==================== RUTAS DE USUARIOS (API) ====================

/**
 * @route GET /admin/usuarios/data
 * @description Obtiene listado de todos los usuarios del sistema
 * @access Admin
 * @middleware isAdmin
 * @returns {Array<Object>} Lista de usuarios en formato JSON
 */
router.get('/usuarios/data', ...isAdmin, ctrl.listarUsuarios);

/**
 * @route PUT /admin/usuarios/:id/rol
 * @description Cambia el rol de un usuario específico
 * @access Admin
 * @middleware isAdmin
 * @param {string} id - ID del usuario
 * @param {Object} req.body.rol - Nuevo rol del usuario
 * @returns {Object} Usuario actualizado
 */
router.put('/usuarios/:id/rol', ...isAdmin, ctrl.cambiarRol);

/**
 * @route PUT /admin/usuarios/:id/estado
 * @description Activa o desactiva la cuenta de un usuario
 * @access Admin
 * @middleware isAdmin
 * @param {string} id - ID del usuario
 * @param {Object} req.body.estado - Nuevo estado (activo/inactivo)
 * @returns {Object} Usuario con estado actualizado
 */
router.put('/usuarios/:id/estado', ...isAdmin, ctrl.cambiarEstadoUsuario);

/**
 * @route DELETE /admin/usuarios/:id
 * @description Elimina un usuario del sistema permanentemente
 * @access Admin
 * @middleware isAdmin
 * @param {string} id - ID del usuario a eliminar
 * @returns {Object} Confirmación de eliminación
 */
router.delete('/usuarios/:id', ...isAdmin, ctrl.eliminarUsuario);

// ==================== RUTAS DE RESERVACIONES (API) ====================

/**
 * @route GET /admin/reservaciones/data
 * @description Obtiene listado completo de todas las reservaciones del sistema
 * @access Admin
 * @middleware isAdmin
 * @returns {Array<Object>} Lista de todas las reservaciones en formato JSON
 */
router.get('/reservaciones/data', ...isAdmin, ctrl.todasReservaciones);

module.exports = router;