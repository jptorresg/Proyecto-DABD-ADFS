const router = require('express').Router();
const ctrl = require('../controllers/admin.controller');
const { verifySession, requireRole } = require('../middlewares/auth.middleware');

router.get('/dashboard', verifySession, requireRole('administrador'), ctrl.dashboard);
router.get('/usuarios', verifySession, requireRole('administrador'), ctrl.usuarios);
router.get('/reservaciones', verifySession, requireRole('administrador'), ctrl.reservaciones);
router.get('/proveedores', verifySession, requireRole('administrador'), ctrl.proveedores);

router.get('/api/proveedores', verifySession, requireRole('administrador'), ctrl.listarProveedores);
router.get('/api/usuarios', verifySession, requireRole('administrador'), ctrl.listarUsuarios);
router.get('/api/reservaciones', verifySession, requireRole('administrador'), ctrl.todasReservaciones);
router.put('/api/usuarios/:id/rol', verifySession, requireRole('administrador'), ctrl.cambiarRol);

module.exports = router;