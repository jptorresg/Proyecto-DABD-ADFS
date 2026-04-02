const router = require('express').Router();
const ctrl = require('../controllers/reservacion.controller');
const { verifySession, requireRole } = require('../middlewares/auth.middleware');

router.post('/', verifySession, ctrl.crear);
router.get('/:id', verifySession, ctrl.obtener);
router.get('/:id/pdf', verifySession, ctrl.descargarPDF);
router.delete('/:id',verifySession, requireRole('administrador'), ctrl.cancelar);
router.get('/usuario/historial', verifySession, ctrl.historialUsuario);

module.exports = router;