const router = require('express').Router();
const ctrl = require('../controllers/admin.controller');
const { verifySession, requireRole } = require('../middlewares/auth.middleware');

const isAdmin = [verifySession, requireRole('administrador')];

// rutas del dashboard
router.get('/dashboard', ...isAdmin, ctrl.dashboard);
router.get('/usuarios', ...isAdmin, ctrl.usuarios);
router.get('/reservaciones', ...isAdmin, ctrl.reservaciones);
router.get('/proveedores', ...isAdmin, ctrl.proveedores);

// rutas de los proveedores
router.get('/proveedores/data', ...isAdmin, ctrl.listarProveedores);
router.get('/proveedores/:id', ...isAdmin, ctrl.obtenerProveedor);
router.post('/proveedores', ...isAdmin, ctrl.crearProveedor);
router.put('/proveedores/:id', ...isAdmin, ctrl.actualizarProveedor);
router.delete('/proveedores/:id', isAdmin, ctrl.eliminarProveedor);

//rutas de los usuarios
router.get('/usuarios/data', ...isAdmin, ctrl.listarUsuarios);
router.put('/usuarios/:id/rol', ...isAdmin, ctrl.cambiarRol);
router.put('/usuarios/:id/estado', ...isAdmin, ctrl.cambiarEstadoUsuario);
router.delete('/usuarios/:id', ...isAdmin, ctrl.eliminarUsuario);

//rutas de las reservaciones
router.get('/reservaciones/data', ...isAdmin, ctrl.todasReservaciones);

module.exports = router;