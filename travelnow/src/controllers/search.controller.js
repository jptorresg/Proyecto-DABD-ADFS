'use strict';

const db = require('../config/db');
const proveedorService = require('../services/proveedor.service');
const { ok, err } = require('../utils/response');

/**
 * @file Controlador de búsquedas para vuelos, hoteles y destinos
 * @module controllers/searchController
 * @requires ../config/db
 * @requires ../services/proveedor.service
 * @requires ../utils/response
 */

/**
 * Obtiene todos los orígenes y destinos disponibles de proveedores activos
 * @async
 * @function getOrigins
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 * @returns {Promise<Object>} Respuesta HTTP con lista de orígenes/destinos
 * @example
 * // GET /api/origins
 * // Respuesta: { data: [{ id_cache_destino, valor, codigo, proveedor, ... }] }
 */
const getOrigins = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT cd.*, p.nombre AS proveedor
             FROM cache_destinos cd
             JOIN proveedor p ON p.id_proveedor = cd.id_proveedor
             WHERE cd.tipo IN ("origen", "destino") AND p.estado = "activo"
             ORDER BY cd.valor ASC`
        );
        return ok(res, { data: rows });
    } catch (e) {
        return err(res, e.message);
    }
};

/**
 * Obtiene todas las ciudades disponibles de proveedores activos
 * @async
 * @function getCities
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 * @returns {Promise<Object>} Respuesta HTTP con lista de ciudades
 * @example
 * // GET /api/cities
 * // Respuesta: { data: [{ id_cache_destino, valor, codigo, proveedor, ... }] }
 */
const getCities = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT cd.*, p.nombre AS proveedor
             FROM cache_destinos cd
             JOIN proveedor p ON p.id_proveedor = cd.id_proveedor
             WHERE cd.tipo = "ciudad" AND p.estado = "activo"
             ORDER BY cd.valor ASC`
        );
        return ok(res, { data: rows });
    } catch (e) {
        return err(res, e.message);
    }
};

/**
 * Busca vuelos en todos los proveedores activos de tipo aerolínea
 * @async
 * @function searchFlights
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} req.query - Parámetros de consulta
 * @param {string} req.query.origen - Código IATA o nombre del origen
 * @param {string} req.query.destino - Código IATA o nombre del destino
 * @param {string} req.query.fecha_salida - Fecha de salida (YYYY-MM-DD)
 * @param {string} [req.query.fecha_regreso] - Fecha de regreso (YYYY-MM-DD)
 * @param {string} [req.query.tipo_asiento] - Tipo de asiento (economy, business, etc.)
 * @param {number} [req.query.num_pasajeros] - Número de pasajeros
 * @param {string} [req.query.tipo_vuelo] - Tipo de vuelo (ida, ida_vuelta)
 * @param {Object} res - Objeto de respuesta HTTP
 * @returns {Promise<Object>} Respuesta HTTP con lista de vuelos ordenados por precio
 * @throws {Error} Si faltan parámetros requeridos
 */
const searchFlights = async (req, res) => {
    const {
        origen,
        destino,
        fecha_salida,
        fecha_regreso,
        tipo_asiento,
        num_pasajeros,
        tipo_vuelo,
    } = req.query;

    if (!origen || !destino || !fecha_salida) {
        return err(res, 'Faltan parametros requeridos: origen, destino, fecha_salida', 400);
    }

    try {
        const [proveedores] = await db.query(
            'SELECT id_proveedor FROM proveedor WHERE tipo = "aerolinea" AND estado = "activo"'
        );

        if (!proveedores.length) {
            return ok(res, { data: [], total: 0, mensaje: 'No hay aerolineas activas configuradas' });
        }

        const origenNorm  = await _resolverIata(origen);
        const destinoNorm = await _resolverIata(destino);

        const params = {
            origen:        origenNorm,
            destino:       destinoNorm,
            fecha_salida,
            fecha_regreso,
            tipo_asiento,
            num_pasajeros,
            tipo_vuelo,
        };

        const resultados = await Promise.allSettled(
            proveedores.map(p => proveedorService.buscarVuelos(p.id_proveedor, params))
        );

        resultados.forEach((r, i) => {
            if (r.status === 'rejected') {
                console.error(
                    `[Search] Proveedor ${proveedores[i].id_proveedor} fallo:`,
                    r.reason?.message
                );
            }
        });

        // BUG CORREGIDO: flatMap en lugar de forEach
        const vuelos = resultados
            .filter(r => r.status === 'fulfilled')
            .flatMap(r => r.value)
            .sort((a, b) => a.precio_agencia - b.precio_agencia);

        await _registrarBusqueda(req, 'vuelo', {
            origen:        origenNorm,
            destino:       destinoNorm,
            fecha_inicio:  fecha_salida,
            fecha_fin:     fecha_regreso,
            num_pasajeros,
        });

        return ok(res, { data: vuelos, total: vuelos.length });
    } catch (e) {
        return err(res, e.message);
    }
};

/**
 * Busca hoteles en todos los proveedores activos de tipo hotel
 * @async
 * @function searchHotels
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} req.query - Parámetros de consulta
 * @param {string} req.query.ciudad - Ciudad de destino
 * @param {string} req.query.fecha_checkin - Fecha de check-in (YYYY-MM-DD)
 * @param {string} req.query.fecha_checkout - Fecha de check-out (YYYY-MM-DD)
 * @param {number} [req.query.num_huespedes] - Número de huéspedes
 * @param {Object} res - Objeto de respuesta HTTP
 * @returns {Promise<Object>} Respuesta HTTP con lista de hoteles ordenados por precio
 * @throws {Error} Si faltan parámetros requeridos
 */
const searchHotels = async (req, res) => {
    const { ciudad, fecha_checkin, fecha_checkout, num_huespedes } = req.query;

    if (!ciudad || !fecha_checkin || !fecha_checkout) {
        return err(res, 'Faltan parametros requeridos: ciudad, fecha_checkin, fecha_checkout', 400);
    }

    try {
        const [proveedores] = await db.query(
            'SELECT id_proveedor FROM proveedor WHERE tipo = "hotel" AND estado = "activo"'
        );

        if (!proveedores.length) {
            return ok(res, { data: [], total: 0, mensaje: 'No hay hoteles activos configurados' });
        }

        const params = { ciudad, fecha_checkin, fecha_checkout, num_huespedes };

        const resultados = await Promise.allSettled(
            proveedores.map(p => proveedorService.buscarHoteles(p.id_proveedor, params))
        );

        resultados.forEach((r, i) => {
            if (r.status === 'rejected') {
                console.error(
                    `[Search] Proveedor hotel ${proveedores[i].id_proveedor} fallo:`,
                    r.reason?.message
                );
            }
        });

        // BUG CORREGIDO: flatMap en lugar de forEach
        const hoteles = resultados
            .filter(r => r.status === 'fulfilled')
            .flatMap(r => r.value)
            .sort((a, b) => a.precio_noche_agencia - b.precio_noche_agencia);

        await _registrarBusqueda(req, 'hotel', {
            ciudad,
            fecha_inicio:  fecha_checkin,
            fecha_fin:     fecha_checkout,
            num_pasajeros: num_huespedes,
        });

        return ok(res, { data: hoteles, total: hoteles.length });
    } catch (e) {
        return err(res, e.message);
    }
};

/**
 * Busca paquetes turísticos (vuelo ida y vuelta)
 * @async
 * @function searchPackages
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 * @returns {Promise<Object>} Redirige la búsqueda a searchFlights con tipo_vuelo="ida_vuelta"
 */
const searchPackages = async (req, res) => {
    req.query.tipo_vuelo = 'ida_vuelta';
    return searchFlights(req, res);
};

/**
 * Resuelve un nombre de ciudad a su código IATA
 * @private
 * @async
 * @function _resolverIata
 * @param {string} valor - Nombre de ciudad o código IATA
 * @returns {Promise<string>} Código IATA normalizado en mayúsculas
 * @description Si el valor es un código IATA válido (2-4 letras), lo devuelve directamente.
 * Si no, busca en la base de datos el código asociado a ese nombre de ciudad.
 */
const _resolverIata = async (valor) => {
    if (!valor) return valor;
    const trimmed = valor.trim();
    if (/^[A-Za-z]{2,4}$/.test(trimmed)) return trimmed.toUpperCase();
    try {
        const [rows] = await db.query(
            `SELECT codigo FROM cache_destinos
             WHERE LOWER(valor) = LOWER(?) AND codigo IS NOT NULL
             LIMIT 1`,
            [trimmed]
        );
        if (rows.length && rows[0].codigo) return rows[0].codigo.toUpperCase();
    } catch {}
    return trimmed.toUpperCase();
};

/**
 * Registra una búsqueda en el historial
 * @private
 * @async
 * @function _registrarBusqueda
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {string} tipo - Tipo de búsqueda ('vuelo' o 'hotel')
 * @param {Object} datos - Datos de la búsqueda
 * @param {string} [datos.origen] - Origen del vuelo
 * @param {string} [datos.destino] - Destino del vuelo
 * @param {string} [datos.ciudad] - Ciudad para hotel
 * @param {string} [datos.fecha_inicio] - Fecha de inicio
 * @param {string} [datos.fecha_fin] - Fecha de fin
 * @param {number} [datos.num_pasajeros] - Número de pasajeros/huéspedes
 * @returns {Promise<void>}
 * @description Registra la búsqueda en la tabla historial_busqueda.
 * No lanza errores que interrumpan la ejecución principal.
 */
const _registrarBusqueda = async (req, tipo, datos) => {
    try {
        const idUsuario  = req.session?.user?.id_usuario ?? null;
        const origenBusq = req.headers['hx-request'] ? 'web' : 'rest';
        await db.query(
            `INSERT INTO historial_busqueda
             (id_usuario, tipo_busqueda, origen_busqueda, origen, destino,
              ciudad, fecha_inicio, fecha_fin, num_pasajeros)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                idUsuario,
                tipo,
                origenBusq,
                datos.origen       ?? null,
                datos.destino      ?? null,
                datos.ciudad       ?? null,
                datos.fecha_inicio ?? null,
                datos.fecha_fin    ?? null,
                datos.num_pasajeros ?? null,
            ]
        );
    } catch (e) {
        console.error('[Search] Error registrando busqueda:', e.message);
    }
};

module.exports = { getOrigins, getCities, searchFlights, searchHotels, searchPackages };