'use strict';

const cron = require('node-cron');
const db = require('../config/db');
const proveedorService = require('./proveedor.service');

const actualizarCacheDestinos = async () => {
    console.log('[Cron] Iniciando actualización de caché de destinos...');
    try {
        const [proveedores] = await db.query('SELECT * FROM proveedor WHERE estado = "activo"');
        for(const prov of proveedores){
            try{
                if(prov.tipo === 'aerolinea'){
                    const datos = await proveedorService.obtenerOrigenesDestinos(prov.id_proveedor);
                    await _guardarCacheAerolinea(prov.id_proveedor, datos);
                    console.log(`[Cron] Aerolínea "${prov.nombre}" actualizada.`);
                } else if (prov.tipo === 'hotel') {
                    const datos = await proveedorService.obtenerCiudades(prov.id_proveedor);
                    await _guardarCacheHotel(prov.id_proveedor, datos);
                    console.log(`[Cron] Hotel "${prov.nombre}" actualizado.`);
                }
            } catch (e) {
                console.error(`[Cron] Error actualizando proveedor "${prov.nombre}": ${e.message}`);
            }
        }
        console.log('[Cron] Caché de destinos actualizado correctamente.');
    } catch (e){
        console.error('[Cron] Error general en actualización de caché:', e.message);
    }
};

const _guardarCacheAerolinea = async (idProveedor, datos) => {
    await db.query('DELETE FROM cache_destinos WHERE id_proveedor = ?', [idProveedor]);
    const rows = [];
    (datos.origenes || []).flatMap(p => {
        if(p.nombre && p.codigo) {
            rows.push([idProveedor, 'origen', p.nombre, p.codigo, null]);
        }
    });
    (datos.destinos || []).flatMap(p => {
        if(p.nombre && p.codigo) {
            rows.push([idProveedor, 'destino', p.nombre, p.codigo, null]);
        }
    });
    if(rows.length){
        await db.query('INSERT INTO cache_destinos (id_proveedor, tipo, valor, codigo, pais) VALUES ?', [rows]);
    }
};

const _guardarCacheHotel = async (idProveedor, datos) => {
    await db.query('DELETE FROM cache_destinos WHERE id_proveedor = ? AND tipo = "ciudad"', [idProveedor]);
    const ciudades = datos.ciudades || (Array.isArray(datos) ? datos : []);
    const rows = ciudades.map(c => [idProveedor, 'ciudad', c.nombre || c, null, c.pais || null]).filter(r => r[2]);
    if(rows.length){
        await db.query('INSERT INTO cache_destinos (id_proveedor, tipo, valor, codigo, pais) VALUES ?', [rows]);
    }
};

const iniciarCron = () => {
    cron .schedule('0 * * * *', actualizarCacheDestinos);
    console.log('[Cron] Job semanal de destinos registrado (todos los días en punto).');
    db.query('SELECT COUNT(*) AS total FROM cache_destinos').then(([[{ total }]]) => {
        if(total === 0){
            console.log('[Cron] Cache vacío al inicio — ejecutando actualización inicial...');
            actualizarCacheDestinos();
        }
    }).catch(e => { console.warn('[Cron] No se pudo verificar cache_destinos:', e.message);});
};

module.exports = { iniciarCron, actualizarCacheDestinos };