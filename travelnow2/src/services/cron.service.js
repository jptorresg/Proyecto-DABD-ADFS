'use strict';

const cron = require('node-cron');
const db   = require('../config/db');
const proveedorService = require('./proveedor.service');

/**
 * @file proveedor.cron.js
 * @brief Módulo de tareas programadas para actualización de caché de destinos
 * @author Sistema de Reservas
 * @version 1.0.0
 */

/**
 * Actualiza la caché de destinos para todos los proveedores activos
 * @async
 * @function actualizarCacheDestinos
 * @description Recorre todos los proveedores activos (aerolíneas y hoteles) y actualiza
 *              sus respectivas cachés de destinos en la base de datos.
 *              Para aerolíneas: actualiza orígenes y destinos
 *              Para hoteles: actualiza ciudades
 * @returns {Promise<void>} Promesa que se resuelve cuando la actualización completa
 * @throws {Error} Error general en la actualización (no interrumpe actualización por proveedor)
 * 
 * @example
 * // Ejecutar actualización manual
 * await actualizarCacheDestinos();
 */
const actualizarCacheDestinos = async () => {
    console.log('[Cron] Iniciando actualización de caché de destinos...');
    try {
        const [proveedores] = await db.query('SELECT * FROM proveedor WHERE estado = "activo"');
        for (const prov of proveedores) {
            try {
                if (prov.tipo === 'aerolinea') {
                    const datos = await proveedorService.obtenerOrigenesDestinos(prov.id_proveedor);
                    await _guardarCacheAerolinea(prov.id_proveedor, datos);
                    console.log(`[Cron] Aerolínea "${prov.nombre}" actualizada.`);
                } else if (prov.tipo === 'hotel') {
                    const datos = await proveedorService.obtenerCiudades(prov.id_proveedor);
                    await _guardarCacheHotel(prov.id_proveedor, datos);
                    console.log(`[Cron] Hotel "${prov.nombre}" actualizado.`);
                }
            } catch (e) {
                // FIX #12: log detallado cuando un proveedor falla.
                // El error ya puede venir del re-login automático de _withRetry;
                // si aun así falla aquí, significa que el proveedor está caído.
                // No interrumpimos el loop — los demás proveedores siguen actualizándose.
                console.error(
                    `[Cron] ⚠ Proveedor "${prov.nombre}" (id=${prov.id_proveedor}) falló:`,
                    e.message
                );
            }
        }
        console.log('[Cron] Caché de destinos actualizado correctamente.');
    } catch (e) {
        console.error('[Cron] Error general en actualización de caché:', e.message);
    }
};

/**
 * Guarda en caché los datos de orígenes y destinos de una aerolínea
 * @async
 * @function _guardarCacheAerolinea
 * @private
 * @param {number} idProveedor - ID del proveedor aerolínea
 * @param {Object} datos - Datos de orígenes y destinos
 * @param {Array<Object>} [datos.origenes] - Lista de orígenes
 * @param {string} datos.origenes[].nombre - Nombre del origen
 * @param {string} datos.origenes[].codigo - Código IATA del origen
 * @param {Array<Object>} [datos.destinos] - Lista de destinos
 * @param {string} datos.destinos[].nombre - Nombre del destino
 * @param {string} datos.destinos[].codigo - Código IATA del destino
 * @returns {Promise<void>} Promesa que se resuelve cuando se guarda la caché
 * 
 * @note Esta función elimina los registros existentes del proveedor antes de insertar los nuevos
 * @see cache_destinos Tabla donde se almacenan los datos
 */
const _guardarCacheAerolinea = async (idProveedor, datos) => {
    await db.query('DELETE FROM cache_destinos WHERE id_proveedor = ?', [idProveedor]);
    const rows = [];
    (datos.origenes || []).forEach(p => {
        if (p.nombre && p.codigo) rows.push([idProveedor, 'origen',  p.nombre, p.codigo, null]);
    });
    (datos.destinos || []).forEach(p => {
        if (p.nombre && p.codigo) rows.push([idProveedor, 'destino', p.nombre, p.codigo, null]);
    });
    if (rows.length) {
        await db.query(
            'INSERT INTO cache_destinos (id_proveedor, tipo, valor, codigo, pais) VALUES ?',
            [rows]
        );
    }
};

/**
 * Guarda en caché los datos de ciudades de un hotel
 * @async
 * @function _guardarCacheHotel
 * @private
 * @param {number} idProveedor - ID del proveedor hotel
 * @param {Object|Array} datos - Datos de ciudades
 * @param {Array<Object>} [datos.ciudades] - Lista de ciudades (formato con propiedad ciudades)
 *                                           Si es un array directo, se usa como lista de ciudades
 * @param {string} ciudad.nombre - Nombre de la ciudad
 * @param {string} [ciudad.pais] - País de la ciudad (opcional)
 * @returns {Promise<void>} Promesa que se resuelve cuando se guarda la caché
 * 
 * @note Solo elimina registros existentes del tipo 'ciudad' para el proveedor
 * @note Mantiene otros tipos de registros (origen, destino) si existieran
 */
const _guardarCacheHotel = async (idProveedor, datos) => {
    await db.query(
        'DELETE FROM cache_destinos WHERE id_proveedor = ? AND tipo = "ciudad"',
        [idProveedor]
    );
    const ciudades = datos.ciudades || (Array.isArray(datos) ? datos : []);
    const rows = ciudades
        .map(c => [idProveedor, 'ciudad', c.nombre || c, null, c.pais || null])
        .filter(r => r[2]);
    if (rows.length) {
        await db.query(
            'INSERT INTO cache_destinos (id_proveedor, tipo, valor, codigo, pais) VALUES ?',
            [rows]
        );
    }
};

/**
 * Inicia el servicio de tareas programadas para actualización de caché
 * @function iniciarCron
 * @description Configura y registra el job cron que ejecuta actualizarCacheDestinos
 *              cada hora en punto. También ejecuta una actualización inicial
 *              si la tabla cache_destinos está vacía al momento del arranque.
 * 
 * @returns {void} No retorna valor
 * 
 * @note El cron job se ejecuta automáticamente mientras la aplicación esté corriendo
 * @see actualizarCacheDestinos Función que ejecuta el job programado
 * 
 * @example
 * // Iniciar el servicio de tareas programadas
 * iniciarCron();
 * // A partir de ahora, la caché se actualizará automáticamente cada hora
 */
const iniciarCron = () => {
    // FIX #13: la expresión '0 * * * *' ejecuta el job cada hora en punto,
    // NO semanalmente. Corregimos el mensaje de log para que refleje la realidad.
    cron.schedule('0 * * * *', actualizarCacheDestinos);
    console.log('[Cron] Job de destinos registrado — se ejecuta cada hora en punto.');

    // Ejecutar inmediatamente si el caché está vacío al arrancar
    db.query('SELECT COUNT(*) AS total FROM cache_destinos')
        .then(([[{ total }]]) => {
            if (total === 0) {
                console.log('[Cron] Caché vacío al inicio — ejecutando actualización inicial...');
                actualizarCacheDestinos();
            }
        })
        .catch(e => {
            console.warn('[Cron] No se pudo verificar cache_destinos:', e.message);
        });
};

module.exports = { iniciarCron, actualizarCacheDestinos };