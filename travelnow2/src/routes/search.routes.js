/**
 * @file Rutas de búsqueda.
 * @description Las búsquedas son públicas (cualquiera puede buscar), pero si
 *              viene un token B2B válido, se marca req.user.es_b2b = true para
 *              que el controlador lo registre en el historial como tipo "rest".
 */

const router = require('express').Router();
const ctrl   = require('../controllers/search.controller');
const jwt    = require('jsonwebtoken');
require('dotenv').config();

/**
 * Middleware "ligero": si hay token JWT válido lo decodifica, si no lo deja pasar.
 * Nunca rechaza la petición, solo enriquece req.user cuando es posible.
 */
const optionalAuth = (req, res, next) => {
    const header = req.headers['authorization'];
    const token  = header && header.startsWith('Bearer ') ? header.slice(7).trim() : null;
    if (token) {
        try {
            const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
            if (payload.rol === 'webservice') {
                req.user = { ...payload, es_b2b: true };
            }
        } catch {/* token inválido → ignorar, sigue como anónimo */}
    } else if (req.session?.user) {
        req.user = { ...req.session.user, es_b2b: false };
    }
    next();
};

router.get('/origins',  ctrl.getOrigins);
router.get('/cities',   ctrl.getCities);
router.get('/flights',  optionalAuth, ctrl.searchFlights);
router.get('/hotels',   optionalAuth, ctrl.searchHotels);
router.get('/packages', optionalAuth, ctrl.searchPackages);
router.get('/flight/detail', optionalAuth, ctrl.getFlightDetail);
router.get('/hotel/detail',  optionalAuth, ctrl.getHotelDetail);

module.exports = router;