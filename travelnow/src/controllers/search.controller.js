'use strict';
const db = require('../config/db');
const proveedorService = require('../services/proveedor.service');
const { ok, err } = require('../utils/response');

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
        return err(res, 'Faltan parámetros requeridos: origen, destino, fecha_salida', 400);
    } 
    try {
        const [proveedores] = await db.query(
            'SELECT id_proveedor FROM proveedor WHERE tipo = "aerolinea" AND estado = "activo"'
        ); 
        if (!proveedores.length) {
            return ok(res, { data: [], total: 0, mensaje: 'No hay aerolíneas activas configuradas' });
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
                    `[Search] Proveedor ${proveedores[i].id_proveedor} falló:`,
                    r.reason?.message
                );
            }
        });
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

const searchHotels = async (req, res) => {
    const { ciudad, fecha_checkin, fecha_checkout, num_huespedes } = req.query; 
    if (!ciudad || !fecha_checkin || !fecha_checkout) {
        return err(res, 'Faltan parámetros requeridos: ciudad, fecha_checkin, fecha_checkout', 400);
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
                    `[Search] Proveedor hotel ${proveedores[i].id_proveedor} falló:`,
                    r.reason?.message
                );
            }
        }); 
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

const searchPackages = async (req, res) => {
    req.query.tipo_vuelo = 'ida_vuelta';
    return searchFlights(req, res);
};

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
    } catch {    }
    return trimmed.toUpperCase();
};

const _registrarBusqueda = async (req, tipo, datos) => {
    try {
        const idUsuario   = req.session?.user?.id_usuario ?? null;
        const origenBusq  = req.headers['hx-request'] ? 'web' : 'rest';
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
        console.error('[Search] Error registrando búsqueda:', e.message);
    }
};

module.exports = { getOrigins, getCities, searchFlights, searchHotels, searchPackages };