/**
 * @file Módulo de rutas para notificaciones
 * @module routes/notificacion
 * @requires express
 * @requires ../controllers/notificacion.controller
 */

const router = require('express').Router();
const ctrl = require('../controllers/notificacion.controller');

/**
 * Ruta raíz de verificación del estado del servicio de notificaciones
 * @name GET /
 * @function
 * @memberof module:routes/notificacion
 * @param {Object} req - Objeto de solicitud HTTP (Express)
 * @param {Object} res - Objeto de respuesta HTTP (Express)
 * @returns {Object} JSON con estado ok y mensaje informativo
 * @example
 * // Respuesta exitosa:
 * // { "ok": true, "message": "Notificaciones OK" }
 */
router.get('/', (req, res) => res.json({ ok: true, message: 'Notificaciones OK' }));

/**
 * Ruta para recibir webhooks de notificaciones
 * @name POST /webhook
 * @function
 * @memberof module:routes/notificacion
 * @param {Object} req - Objeto de solicitud HTTP (Express)
 * @param {Object} res - Objeto de respuesta HTTP (Express)
 * @param {Function} next - Siguiente middleware (opcional)
 * @description Procesa cambios recibidos a través del webhook. Llama al controlador
 *              `recibirCambio` que contiene la lógica de negocio para manejar
 *              las notificaciones entrantes.
 * @see module:controllers/notificacion.controller~recibirCambio
 */
router.post('/webhook', ctrl.recibirCambio);

/**
 * Exporta el router configurado para ser utilizado por la aplicación principal
 * @exports module:routes/notificacion
 */
module.exports = router;