/**
 * @file routes/admin.routes.js
 * @description Rutas del panel de administración del sistema
 * @module routes/admin
 */

const router = require('express').Router();
const ctrl = require('../controllers/admin.controller');
const { verifySession, requireRole } = require('../middlewares/auth.middleware');

const isAdmin = [verifySession, requireRole('administrador')];

// ==================== DASHBOARD ====================
router.get('/dashboard',         ...isAdmin, ctrl.dashboard);
router.get('/dashboard/charts',  ...isAdmin, ctrl.dashboardCharts);
router.get('/usuarios',          ...isAdmin, ctrl.usuarios);
router.get('/reservaciones',     ...isAdmin, ctrl.reservaciones);
router.get('/proveedores',       ...isAdmin, ctrl.proveedores);

// ==================== PROVEEDORES (API) ====================
router.get('/proveedores/data',  ...isAdmin, ctrl.listarProveedores);
router.get('/proveedores/:id',   ...isAdmin, ctrl.obtenerProveedor);
router.post('/proveedores',      ...isAdmin, ctrl.crearProveedor);
router.put('/proveedores/:id',   ...isAdmin, ctrl.actualizarProveedor);
router.delete('/proveedores/:id',...isAdmin, ctrl.eliminarProveedor);

// ==================== USUARIOS (API) ====================
router.get('/usuarios/data',         ...isAdmin, ctrl.listarUsuarios);
router.put('/usuarios/:id/rol',      ...isAdmin, ctrl.cambiarRol);
router.put('/usuarios/:id/estado',   ...isAdmin, ctrl.cambiarEstadoUsuario);
router.delete('/usuarios/:id',       ...isAdmin, ctrl.eliminarUsuario);

// ==================== RESERVACIONES (API) ====================
router.get('/reservaciones/data', ...isAdmin, ctrl.todasReservaciones);

// ==================== AUDITORÍA DE BÚSQUEDAS ====================
router.get('/busquedas/data', ...isAdmin, ctrl.listarBusquedas);
router.get('/busquedas/pdf',  ...isAdmin, ctrl.exportarBusquedasPDF);

module.exports = router;