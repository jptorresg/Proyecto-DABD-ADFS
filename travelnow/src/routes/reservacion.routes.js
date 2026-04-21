/**
 * @file reservacion.routes.js
 * @description Rutas para la gestión de reservaciones
 * FIX 2026-04-20: se agrega POST /:id/reenviar-correo
 */

const router = require('express').Router();
const ctrl = require('../controllers/reservacion.controller');
const { verifySession } = require('../middlewares/auth.middleware');

// Crear nueva reservación
router.post('/', verifySession, ctrl.crear);

// Historial del usuario autenticado
router.get('/usuario/historial', verifySession, ctrl.historialUsuario);

// Obtener detalle de una reservación específica
router.get('/:id', verifySession, ctrl.obtener);

// Descargar PDF
router.get('/:id/pdf', verifySession, ctrl.descargarPDF);

// FIX: Reenviar correo de confirmación
router.post('/:id/reenviar-correo', verifySession, ctrl.reenviarCorreo);

// Cancelar reservación
router.put('/:id/cancelar', verifySession, ctrl.cancelar);

module.exports = router;