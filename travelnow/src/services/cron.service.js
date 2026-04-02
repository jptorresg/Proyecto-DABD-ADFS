//Actualiza el caché de las ciudades de todos los proveedores
//Nota: se ejjecuta cada lunes a las 2 am

const cron = require('node-cron');
const db = require('../config/db');
const proveedoresService = require('./proveedor.service');

const actualizarCacheDestinos = async () => {
    console.log('Actualizando cache de destinos...');
    try {
        const [proveedores] = await db.query('SELECT * FROM proveedor WHERE estado = "activo"');
        for (const prov of proveedores){
            try{
                if(prov.tipo === 'aerolinea'){
                    const datos = await proveedoresService.obtenerOrigenesDestinos(prov.id_proveedor);
                    await guardarCacheAerolinea(prov.id_proveedor, datos);
                } else if (prov.tipo === 'hotel'){
                    const datos = await proveedoresService.obtenerCiudades(prov.id_proveedor);
                    await guardarCacheHotel(prov.id_proveedor, datos);
                }
                console.log(`Proveedor ${prov.nombre} actualizado`);
            } catch (e) { console.error(`Error proveedor ${prov.nombre}:`, e.message);}
        }
        console.log('Cache de destinos actualizado');
    } catch (e) { console.error('Error en cron de cache:', e.message);}
};

const guardarCacheAerolinea = async (idProveedor, datos) => {
    await db.query('DELETE FROM cache_destinos WHERE id_proveedor = ?', [idProveedor]);
    const rows = [];
    (datos.origenes || []).forEach(p => rows.push([idProveedor, 'origen', p.nombre, p.codigo, null]));
    (datos.destino || []).forEach(p => rows.push([idProveedor, 'destino', p.nombre, p.codigo, null]));
    if (rows.length) {
        await db.query('INSERT INTO cache_destinos (id_proveedor, tipo, valor, codigo, pais) VALUES ?', [rows]);    
    }
};

const guardarCacheHotel = async (idProveedor, datos) => {
    await db.query('DELETE FROM cache_destinos WHERE id_proveedor = ? AND tipo = "ciudad"', [idProveedor]);
    const rows = (datos.ciudades || datos || []).map(c => [idProveedor, 'ciudad', c.nombre || c, null, c.pais || null]);
    if (rows.length){
        await db.query('INSERT INTO cache_destinos (id_proveedor, tipo, valor, codigo, pais) VALUES ?' , [rows]);
    }
};

const iniciarCron = () => {
    //Se realizara cada lunes a las 2:00AM
    cron.schedule('0 2 * * 1', actualizarCacheDestinos);
    console.log('Cron de actualización semanal de destinos iniciado');
};

module.exports = { iniciarCron, actualizarCacheDestinos };