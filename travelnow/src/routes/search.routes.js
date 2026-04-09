/**
 * @file Módulo de rutas para búsquedas en el sistema de viajes.
 * @description Define los endpoints relacionados con búsquedas de orígenes, ciudades,
 *              vuelos, hoteles y paquetes turísticos.
 * @module routes/search.routes
 * @requires express
 * @requires ../controllers/search.controller
 */

const router = require('express').Router();
const ctrl   = require('../controllers/search.controller');

/**
 * Obtiene la lista de aeropuertos o ciudades de origen disponibles.
 * @name GET /origins
 * @function
 * @memberof module:routes/search.routes
 * @param {string} path - Ruta del endpoint
 * @param {function} ctrl.getOrigins - Controlador que procesa la solicitud
 * @returns {Array<Object>} Lista de orígenes disponibles
 */
router.get('/origins',  ctrl.getOrigins);

/**
 * Obtiene la lista de ciudades destino disponibles.
 * @name GET /cities
 * @function
 * @memberof module:routes/search.routes
 * @param {string} path - Ruta del endpoint
 * @param {function} ctrl.getCities - Controlador que procesa la solicitud
 * @returns {Array<Object>} Lista de ciudades disponibles
 */
router.get('/cities',   ctrl.getCities);

/**
 * Busca vuelos según parámetros de consulta (fecha, origen, destino, etc.).
 * @name GET /flights
 * @function
 * @memberof module:routes/search.routes
 * @param {string} path - Ruta del endpoint
 * @param {function} ctrl.searchFlights - Controlador que procesa la búsqueda de vuelos
 * @param {Object} req.query - Parámetros de búsqueda (origin, destination, date, etc.)
 * @returns {Array<Object>} Lista de vuelos que coinciden con la búsqueda
 */
router.get('/flights',  ctrl.searchFlights);

/**
 * Busca hoteles según parámetros de consulta (ciudad, fechas, huéspedes, etc.).
 * @name GET /hotels
 * @function
 * @memberof module:modules/search.routes
 * @param {string} path - Ruta del endpoint
 * @param {function} ctrl.searchHotels - Controlador que procesa la búsqueda de hoteles
 * @param {Object} req.query - Parámetros de búsqueda (city, checkIn, checkOut, guests)
 * @returns {Array<Object>} Lista de hoteles disponibles
 */
router.get('/hotels',   ctrl.searchHotels);

/**
 * Busca paquetes turísticos (vuelo + hotel) según parámetros de consulta.
 * @name GET /packages
 * @function
 * @memberof module:routes/search.routes
 * @param {string} path - Ruta del endpoint
 * @param {function} ctrl.searchPackages - Controlador que procesa la búsqueda de paquetes
 * @param {Object} req.query - Parámetros de búsqueda (origin, destination, dates, travelers)
 * @returns {Array<Object>} Lista de paquetes turísticos disponibles
 */
router.get('/packages', ctrl.searchPackages);

/**
 * Módulo de rutas exportado para ser usado en la aplicación principal.
 * @exports router
 */
module.exports = router;