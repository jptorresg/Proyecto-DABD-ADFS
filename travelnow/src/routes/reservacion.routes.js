const router = require('express').Router();
const ctrl = require('../controllers/reservacion.controller');
const { verifySession, requireRole } = require('../middlewares/auth.middleware');

router.post('/', verifySession, ctrl.crear);
router.get('/usuario/historial', verifySession, ctrl.historialUsuario);
router.get('/:id', verifySession, ctrl.obtener);
router.get('/:id/pdf', verifySession, ctrl.descargarPDF);

// FIX #4: Cancelación — admins pueden cancelar cualquier reserva;
// usuarios autenticados pueden cancelar las suyas propias.
// El controller ya valida que un usuario solo cancele lo suyo (id_usuario check).
router.delete('/:id', verifySession, ctrl.cancelar);

module.exports = router;