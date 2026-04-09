/**
 * @file Módulo de rutas para la gestión de reservaciones
 * @module routes/reservacion
 * @requires express
 * @requires ../controllers/reservacion.controller
 * @requires ../middlewares/auth.middleware
 */

/**
 * Enrutador de Express para las rutas de reservaciones
 * @type {object}
 */
const router = require('express').Router();

/**
 * Controlador de reservaciones
 * @type {object}
 */
const ctrl = require('../controllers/reservacion.controller');

/**
 * Middlewares de autenticación y autorización
 * @type {object}
 */
const { verifySession, requireRole } = require('../middlewares/auth.middleware');

/**
 * Ruta para crear una nueva reservación
 * @name POST /
 * @function
 * @memberof module:routes/reservacion
 * @inner
 * @param {string} path - Ruta base '/'
 * @param {Function} verifySession - Middleware que verifica la sesión del usuario
 * @param {Function} ctrl.crear - Controlador que procesa la creación de la reservación
 * @example POST /api/reservaciones/
 */
router.post('/', verifySession, ctrl.crear);

/**
 * Ruta para obtener el historial de reservaciones del usuario autenticado
 * @name GET /usuario/historial
 * @function
 * @memberof module:routes/reservacion
 * @inner
 * @param {string} path - Ruta '/usuario/historial'
 * @param {Function} verifySession - Middleware que verifica la sesión del usuario
 * @param {Function} ctrl.historialUsuario - Controlador que retorna el historial del usuario
 * @example GET /api/reservaciones/usuario/historial
 */
router.get('/usuario/historial', verifySession, ctrl.historialUsuario);

/**
 * Ruta para obtener los detalles de una reservación específica por su ID
 * @name GET /:id
 * @function
 * @memberof module:routes/reservacion
 * @inner
 * @param {string} path - Ruta '/:id' donde :id es el identificador de la reservación
 * @param {Function} verifySession - Middleware que verifica la sesión del usuario
 * @param {Function} ctrl.obtener - Controlador que retorna los detalles de la reservación
 * @param {string} id - Parámetro de ruta con el ID de la reservación
 * @example GET /api/reservaciones/1234567890
 */
router.get('/:id', verifySession, ctrl.obtener);

/**
 * Ruta para descargar el PDF de una reservación específica
 * @name GET /:id/pdf
 * @function
 * @memberof module:routes/reservacion
 * @inner
 * @param {string} path - Ruta '/:id/pdf' donde :id es el identificador de la reservación
 * @param {Function} verifySession - Middleware que verifica la sesión del usuario
 * @param {Function} ctrl.descargarPDF - Controlador que genera y envía el PDF
 * @param {string} id - Parámetro de ruta con el ID de la reservación
 * @example GET /api/reservaciones/1234567890/pdf
 */
router.get('/:id/pdf', verifySession, ctrl.descargarPDF);

/**
 * Ruta para cancelar una reservación
 * @name DELETE /:id
 * @function
 * @memberof module:routes/reservacion
 * @inner
 * @param {string} path - Ruta '/:id' donde :id es el identificador de la reservación
 * @param {Function} verifySession - Middleware que verifica la sesión del usuario
 * @param {Function} ctrl.cancelar - Controlador que procesa la cancelación
 * @param {string} id - Parámetro de ruta con el ID de la reservación
 * @description
 * **Reglas de negocio (FIX #4):**
 * - Los administradores pueden cancelar cualquier reservación
 * - Los usuarios autenticados solo pueden cancelar sus propias reservaciones
 * - El controlador valida que un usuario común solo cancele reservaciones propias mediante verificación de id_usuario
 * @example DELETE /api/reservaciones/1234567890
 * @see {@link module:controllers/reservacion.controller~cancelar}
 */
router.delete('/:id', verifySession, ctrl.cancelar);

/**
 * Exporta el enrutador configurado
 * @module routes/reservacion
 * @exports router
 */
module.exports = router;