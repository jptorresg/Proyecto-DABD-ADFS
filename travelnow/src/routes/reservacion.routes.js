const router = require('express').Router();
const ctrl = require('../controllers/reservacion.controller');
const { verifySession, requireRole } = require('../middlewares/auth.middleware');

router.post('/', verifySession, ctrl.crear);
router.get('/usuario/historial', verifySession, ctrl.historialUsuario);
router.get('/:id', verifySession, ctrl.obtener);
router.get('/:id/pdf', verifySession, ctrl.descargarPDF);
router.delete('/:id', verifySession, requireRole('administrador'), ctrl.cancelar);

module.exports = router;