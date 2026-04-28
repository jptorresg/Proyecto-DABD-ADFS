'use strict';

const db = require('../config/db');
const proveedorService = require('../services/proveedor.service');
const { ok, err } = require('../utils/response');

/**
 * @file Controlador de búsquedas para vuelos, hoteles y destinos
 * @module controllers/searchController
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
 * Busca vuelos en todos los proveedores activos de tipo aerolínea.
 *
 * MEJORA: Antes, si TODOS los proveedores fallaban, el usuario veía
 * `{ data: [], total: 0 }` sin ninguna pista de que el problema era una falla
 * del proveedor (no "ausencia de vuelos"). Ahora incluimos un campo
 * `proveedores_fallidos` con el detalle, y si no hubo vuelos Y hubo fallas,
 * la respuesta marca `advertencia` para que la UI lo muestre. Los proveedores
 * que respondieron OK siguen aportando sus vuelos normalmente.
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
            `SELECT id_proveedor, nombre
               FROM proveedor
              WHERE tipo = "aerolinea" AND estado = "activo"`
        );

        if (!proveedores.length) {
            return ok(res, {
                data: [],
                total: 0,
                mensaje: 'No hay aerolineas activas configuradas',
            });
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

        // Recolectar proveedores caídos con su mensaje, para reportarlos al cliente.
        const proveedoresFallidos = [];
        resultados.forEach((r, i) => {
            if (r.status === 'rejected') {
                const msg = r.reason?.message || String(r.reason);
                console.error(
                    `[Search] Proveedor ${proveedores[i].id_proveedor} (${proveedores[i].nombre}) fallo:`,
                    msg
                );
                proveedoresFallidos.push({
                    id_proveedor: proveedores[i].id_proveedor,
                    nombre:       proveedores[i].nombre,
                    error:        msg,
                });
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

        // Construir respuesta. Si no hay vuelos y hubo proveedores caídos,
        // armar un mensaje de advertencia útil para la UI.
        const payload = { data: vuelos, total: vuelos.length };

        if (proveedoresFallidos.length > 0) {
            payload.proveedores_fallidos = proveedoresFallidos;
            if (vuelos.length === 0) {
                payload.advertencia =
                    `No se obtuvieron resultados porque ${proveedoresFallidos.length} de ` +
                    `${proveedores.length} proveedor(es) fallo(aron). Revisa el estado del ` +
                    `servidor de la aerolinea.`;
            } else {
                payload.advertencia =
                    `Mostrando resultados parciales: ${proveedoresFallidos.length} proveedor(es) ` +
                    `no respondio(eron) correctamente.`;
            }
        }

        return ok(res, payload);
    } catch (e) {
        return err(res, e.message);
    }
};

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
 * Busca paquetes (vuelos + hoteles) en paralelo.
 *
 * FIX (consistencia origen/destino entre proveedores):
 *   El buscador de paquetes recibe un solo campo "destino" del usuario, pero
 *   los dos proveedores esperan formatos distintos:
 *     - Aerolineas → codigo IATA en MAYUSCULAS (ej. "GUA").
 *     - Hoteles    → nombre de ciudad como string (ej. "Guatemala").
 *
 *   Antes hacíamos:
 *     paramsVuelo.destino = await _resolverIata(destino);   // ✅ obtiene "GUA"
 *     paramsHotel.ciudad  = destino;                         // ❌ usa lo crudo
 *
 *   Esto rompe en cuanto el usuario escribe el IATA directamente: a vuelos
 *   le va bien (ya es IATA), pero a hoteles le llega "GUA" como ciudad y
 *   nunca encuentra nada. Tambien rompe al reves cuando el formulario
 *   propaga un IATA (p.ej. desde resultados.html).
 *
 *   Ahora resolvemos AMBAS representaciones desde el input crudo y le
 *   damos a cada proveedor la que necesita. El mismo arreglo se aplica
 *   al "origen" — aunque hoy solo lo usan vuelos, deja la base lista por
 *   si mañana hoteles también lo necesita.
 */
const searchPackages = async (req, res) => {
    const {
        origen,
        destino,
        fecha_salida,
        fecha_regreso,
        num_pasajeros,
        tipo_asiento,
    } = req.query;
    if(!origen || !destino || !fecha_salida || !fecha_regreso){
        return err(res, ' Paquetes requieren: origen, destino, fecha salida, fecha regreso ', 400);
    }
    try{
        //Busca vuelos de ida y vuelta en paralelo con hoteles
        const [vuelosProveedores, hotelesProveedores] = await Promise.all([
            db.query('SELECT id_proveedor FROM proveedor WHERE tipo = "aerolinea" AND estado = "activo"'),
            db.query('SELECT id_proveedor FROM proveedor WHERE tipo = "hotel" AND estado = "activo"'),
        ]);

        // Resolvemos ambas formas (IATA y ciudad) para origen y destino.
        // _resolverDestino devuelve { iata, ciudad } sin importar lo que
        // haya escrito el usuario, así garantizamos que vuelos y hoteles
        // reciban el formato que cada uno espera.
        const origenResuelto  = await _resolverDestino(origen);
        const destinoResuelto = await _resolverDestino(destino);

        //Vuelos
        const paramsVuelo = {
            origen:        origenResuelto.iata,
            destino:       destinoResuelto.iata,
            fecha_salida,
            fecha_regreso,
            tipo_asiento,
            num_pasajeros,
            tipo_vuelo: 'ida_vuelta',
        };
        const vuelosPromises = vuelosProveedores[0].map(p =>
            proveedorService.buscarVuelos(p.id_proveedor, paramsVuelo).catch(e => {
                // FIX: era `console.err` (no existe) → debe ser `console.error`.
                // Dejaba caer la promesa pero también tiraba un TypeError silencioso.
                console.error(`[Packages] Aerolinea ${p.id_proveedor} fallo:`, e.message);
                return [];
            })
        );

        //Para los hoteles usamos el destino como la ciudad de busqueda,
        //pero ahora con el nombre de ciudad ya resuelto (no el IATA).
        const paramsHotel = {
            ciudad:         destinoResuelto.ciudad,
            fecha_checkin:  fecha_salida,
            fecha_checkout: fecha_regreso,
            num_huespedes:  num_pasajeros,
        };
        const hotelesPromises = hotelesProveedores[0].map(p =>
            proveedorService.buscarHoteles(p.id_proveedor, paramsHotel).catch(e => {
                console.error(`[Packages] Hotel ${p.id_proveedor} fallo:`, e.message);
                return [];
            })
        );

        const [vuelosResults, hotelesResults] = await Promise.all([
            Promise.all(vuelosPromises),
            Promise.all(hotelesPromises),
        ]);
        const vuelos  = vuelosResults.flat().sort((a,b) => a.precio_agencia - b.precio_agencia);
        const hoteles = hotelesResults.flat().sort((a,b) => a.precio_noche_agencia - b.precio_noche_agencia);

        //Se registra la busqueda
        await _registrarBusqueda(req, 'vuelo', {
            origen:       origenResuelto.iata,
            destino:      destinoResuelto.iata,
            fecha_inicio: fecha_salida,
            fecha_fin:    fecha_regreso,
            num_pasajeros,
        });
        await _registrarBusqueda(req, 'hotel', {
            ciudad:       destinoResuelto.ciudad,
            fecha_inicio: fecha_salida,
            fecha_fin:    fecha_regreso,
            num_pasajeros,
        });
        return ok(res,{
            data: { vuelos, hoteles },
            total_vuelos:  vuelos.length,
            total_hoteles: hoteles.length,
            // Devolvemos lo que se acabó usando para que el frontend lo pueda
            // mostrar al usuario ("Buscando hoteles en Guatemala City...").
            destino_resuelto: {
                iata:   destinoResuelto.iata,
                ciudad: destinoResuelto.ciudad,
            },
        });
    } catch (e){
        return err(res, e.message);
    }
};

/**
 * Devuelve un código IATA a partir de cualquier valor que haya escrito el
 * usuario (un IATA ya bien formateado, un nombre de ciudad, etc.).
 *
 * - Si el valor luce como IATA (2-4 letras), lo devuelve en MAYÚSCULAS.
 * - Si no, busca en cache_destinos por nombre exacto (case-insensitive)
 *   y devuelve el codigo IATA asociado.
 * - Como último recurso, devuelve el valor original en mayúsculas (mejor
 *   un intento que un fallo silencioso).
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
 * Operación inversa a _resolverIata: dado un IATA, busca el nombre de
 * ciudad asociado en cache_destinos. Útil cuando un proveedor (hoteles)
 * espera nombres de ciudad pero el usuario escribió un código IATA.
 *
 * - Si el valor NO luce como IATA (tiene espacios o más de 4 chars),
 *   se asume que ya es nombre de ciudad y se devuelve tal cual.
 * - Si luce como IATA, se busca en cache_destinos un registro con ese
 *   código y se devuelve su `valor` (nombre).
 * - Si no se encuentra, devuelve el valor original (es lo único que
 *   tenemos, mejor que romper la búsqueda).
 */
// Fallback estático para los IATA más comunes en Latinoamérica/Centroamérica.
// Solo se usa cuando cache_destinos no tiene el código (cache vacío al
// arrancar, o el cron de un proveedor falló). Si tu mercado crece, agrega
// más entradas aquí o (mejor) asegurate de que el cron esté corriendo.
const IATA_CIUDAD_FALLBACK = {
    GUA: 'Guatemala',
    SAL: 'San Salvador',
    TGU: 'Tegucigalpa',
    SAP: 'San Pedro Sula',
    MGA: 'Managua',
    SJO: 'San José',
    PTY: 'Ciudad de Panamá',
    MEX: 'Ciudad de México',
    CUN: 'Cancún',
    GDL: 'Guadalajara',
    MTY: 'Monterrey',
    BOG: 'Bogotá',
    MDE: 'Medellín',
    CTG: 'Cartagena',
    LIM: 'Lima',
    CUZ: 'Cusco',
    UIO: 'Quito',
    GYE: 'Guayaquil',
    SCL: 'Santiago',
    EZE: 'Buenos Aires',
    MVD: 'Montevideo',
    GIG: 'Río de Janeiro',
    GRU: 'São Paulo',
    CCS: 'Caracas',
    HAV: 'La Habana',
    MIA: 'Miami',
    JFK: 'Nueva York',
    LAX: 'Los Ángeles',
    MAD: 'Madrid',
    BCN: 'Barcelona',
};

const _resolverCiudad = async (valor) => {
    if (!valor) return valor;
    const trimmed = valor.trim();
    // Si no parece IATA, asumimos que ya es un nombre de ciudad legible.
    if (!/^[A-Za-z]{2,4}$/.test(trimmed)) return trimmed;
    try {
        const [rows] = await db.query(
            `SELECT valor FROM cache_destinos
             WHERE UPPER(codigo) = UPPER(?) AND valor IS NOT NULL
             LIMIT 1`,
            [trimmed]
        );
        if (rows.length && rows[0].valor) return rows[0].valor;
    } catch {}
    // Si no se encontró en cache, intentar el mapa estático antes de tirar
    // el IATA crudo. Esto cubre el caso real visto en producción donde el
    // usuario llega a /paquetes con destino="GUA" y cache_destinos no tiene
    // entradas para esa cadena hotelera todavía.
    const fallback = IATA_CIUDAD_FALLBACK[trimmed.toUpperCase()];
    if (fallback) return fallback;

    // Última opción: devolver lo que tenemos. Mejor que tirar el flujo.
    return trimmed;
};

/**
 * Resuelve un input de ubicación a sus dos formas (IATA + nombre de ciudad)
 * para que distintos proveedores puedan recibir el formato que esperan en
 * una misma búsqueda. Pensado para `searchPackages`, donde el usuario solo
 * escribe el destino una vez pero alimenta dos APIs.
 *
 * Ejemplos:
 *   _resolverDestino("GUA")        → { iata: "GUA", ciudad: "Guatemala" }
 *   _resolverDestino("Guatemala")  → { iata: "GUA", ciudad: "Guatemala" }
 *   _resolverDestino("xyz")        → { iata: "XYZ", ciudad: "xyz" } (fallback)
 */
const _resolverDestino = async (valor) => {
    const iata   = await _resolverIata(valor);
    const ciudad = await _resolverCiudad(valor);
    return { iata, ciudad };
};

const _registrarBusqueda = async (req, tipo, datos) => {
    try {
        const idUsuario  = req.user?.id_usuario ?? req.session?.user?.id_usuario ?? null;
        const origenBusq = req.user?.es_b2b ? 'rest' : (req.headers['hx-request'] ? 'web' : 'web');
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

const getFlightDetail = async (req, res) => {
    const {
        id_vuelo,
        id_proveedor,
        origen,
        destino,
        fecha_salida,
        fecha_regreso,
        tipo_asiento,
        num_pasajeros,
    } = req.query;
    if(!id_vuelo || !id_proveedor) {
        return err(res, 'Faltan parametros: id_vuelo, id_proveedor', 400);
    }
    if(!origen || !destino || !fecha_salida){
        return err(res, 'Faltan parametros: origen, destino, fecha_salida', 400);
    }
    try {
        const origenNorm = await _resolverIata(origen);
        const destinoNorm = await _resolverIata(destino);
        const params = {
            origen: origenNorm,
            destino: destinoNorm,
            fecha_salida,
            fecha_regreso,
            tipo_asiento,
            num_pasajeros,
        };
        const vuelos = await proveedorService.buscarVuelos(parseInt(id_proveedor), params);
        const vuelo = vuelos.find(v => String(v.id_vuelo) === String(id_vuelo));
        if(!vuelo){
            return err(res, ' Vuelo no encontrado o ya no esta disponible ', 404);
        }
        return ok(res, { data: vuelo });
    } catch (e) {
        return err(res, e.message);
    }
};

const getHotelDetail = async (req, res) => {
    const {
        id_habitacion,
        id_proveedor,
        ciudad,
        fecha_checkin,
        fecha_checkout,
        num_huespedes,
    } = req.query;

    if (!id_habitacion || !id_proveedor) {
        return err(res, 'Faltan parametros: id_habitacion, id_proveedor', 400);
    }
    if (!ciudad || !fecha_checkin || !fecha_checkout) {
        return err(res, 'Faltan parametros: ciudad, fecha_checkin, fecha_checkout', 400);
    }

    try {
        const params = { ciudad, fecha_checkin, fecha_checkout, num_huespedes };
        const hoteles = await proveedorService.buscarHoteles(parseInt(id_proveedor), params);
        const hotel = hoteles.find(h => String(h.id_habitacion) === String(id_habitacion));

        if (!hotel) {
            return err(res, 'Habitacion no encontrada o ya no esta disponible', 404);
        }

        return ok(res, { data: hotel });
    } catch (e) {
        return err(res, e.message);
    }
};

module.exports = { getOrigins, getCities, searchFlights, searchHotels, searchPackages, getFlightDetail, getHotelDetail };