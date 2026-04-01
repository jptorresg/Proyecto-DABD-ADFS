const router = require('express').Router();
const ctrl = require('../controllers/reservacion.controller');

router.post('/', verifySession, ctrl.crear);
router.get('/:id', verifySession, ctrl.obtener);
router.get('/:id/pdf', verifySession, ctrl.desgarPDF);
router.delete('/:id',verifySession, requireRole('administrador'), ctrl.cancelar);
router.get('/usuario/historial', verifySession, ctrl.historialUsuario);

module.exports = router;