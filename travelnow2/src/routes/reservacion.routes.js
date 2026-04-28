/**
 * @file reservacion.routes.js
 * @description Rutas para la gestión de reservaciones.
 *              Acepta tanto sesión (navegador) como JWT (cliente B2B).
 */

const router = require('express').Router();
const ctrl = require('../controllers/reservacion.controller');
const { verifyAuth } = require('../middlewares/auth.middleware');

// Crear nueva reservación (web o B2B)
router.post('/', verifyAuth, ctrl.crear);

// Historial del usuario autenticado (sus propias reservas)
router.get('/usuario/historial', verifyAuth, ctrl.historialUsuario);

// Detalle de una reservación específica
router.get('/:id', verifyAuth, ctrl.obtener);

// Descargar PDF
router.get('/:id/pdf', verifyAuth, ctrl.descargarPDF);

// Reenviar correo de confirmación
router.post('/:id/reenviar-correo', verifyAuth, ctrl.reenviarCorreo);

// Cancelar reservación
router.put('/:id/cancelar', verifyAuth, ctrl.cancelar);

module.exports = router;