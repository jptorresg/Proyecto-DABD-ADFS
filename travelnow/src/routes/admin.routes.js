const router = require('express').Router();
const ctrl = require('../controllers/admin.controller');
const { verifySession, requireRole } = require('../middlewares/auth.middleware');

router.get('/proveedores', verifySession, requireRole('administrador'), ctrl.listarProveedores);
router.get('/usuarios', verifySession, requireRole('administrador'), ctrl.listarUsuarios);
router.get('/reservaciones', verifySession, requireRole('administrador'), ctrl.todasReservaciones);
router.get('/historial-busqueda', verifySession, requireRole('administrador'), ctrl.historialBusqueda);

router.get('/dashboard', verifySession, requireRole('administrador'), (req, res) => {
    res.json({ ok: true, message: 'Dashboard Admin OK', user: req.user });
});

module.exports = router;