'use strict';

const cron = require('node-cron');
const db   = require('../config/db');
const proveedorService = require('./proveedor.service');

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