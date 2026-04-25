'use strict';

/**
 * @file Rutas del módulo B2B.
 * @description Expone los endpoints REST autenticados con JWT para que otras
 *              empresas (agencias, hoteles, aerolíneas) operen con TravelNow.
 *
 * Todos los endpoints (excepto /auth/login) requieren header:
 *   Authorization: Bearer <token JWT>
 *
 * Las búsquedas y reservaciones B2B reutilizan los endpoints existentes
 * en /api/search y /api/reservaciones, que ahora aceptan auth dual.
 */

const router = require('express').Router();
const ctrl   = require('../controllers/b2b.controller');
const { verifyAuth } = require('../middlewares/auth.middleware');

/**
 * @route POST /api/b2b/auth/login
 * @description Login de cliente B2B. Devuelve JWT.
 * @access Público (validado por credenciales)
 */
router.post('/auth/login', ctrl.login);

/**
 * @route GET /api/b2b/me
 * @description Devuelve información del cliente B2B autenticado.
 * @access B2B (JWT requerido)
 */
router.get('/me', verifyAuth, ctrl.me);

/**
 * @route POST /api/b2b/notifications/cambio
 * @description Endpoint para que proveedores reporten cambios en reservaciones.
 *              Reemplaza al antiguo /api/notifications/webhook (que queda como
 *              fallback público para proveedores legacy sin auth).
 * @access B2B (JWT requerido)
 */
router.post('/notifications/cambio', verifyAuth, ctrl.recibirCambio);

module.exports = router;