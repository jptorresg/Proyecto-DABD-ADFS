'use strict';

const axios = require('axios');
const db    = require('../config/db');

const getConfig = async (idProveedor) => {
    const [rows] = await db.query(
        'SELECT * FROM proveedor WHERE id_proveedor = ? AND estado = "activo"',
        [idProveedor]
    );
    if (!rows.length) {
        throw new Error(`Proveedor ${idProveedor} no encontrado o inactivo`);
    }
    return rows[0];
};

const _sessionCache = {};
const SESSION_TTL_MS = 50 * 60 * 1000;

/**
 * Inicia sesión contra el backend de AerolineasHalcon y cachea la cookie.
 *
 * Diagnósticos:
 *   - Valida que la configuración del proveedor incluya credenciales antes
 *     de golpear el endpoint (ahorra una llamada inútil y da un mensaje claro).
 *   - Si el backend responde con 5xx, reintenta hasta 2 veces con backoff
 *     corto — el síntoma típico de un servlet Java que está arrancando o
 *     recargando.
 *   - El mensaje de error SIEMPRE incluye status + el mensaje/cuerpo que
 *     devolvió el backend, en vez de solo "500".
 */
const _loginAerolinea = async (prov) => {
    const cached = _sessionCache[prov.id_proveedor];
    if (cached && Date.now() - cached.ts < SESSION_TTL_MS) return cached.cookie;

    if (!prov.endpoint_api) {
        throw new Error(`[Aerolinea] Proveedor "${prov.nombre}" no tiene endpoint_api configurado`);
    }
    if (!prov.api_usuario || !prov.api_password) {
        throw new Error(
            `[Aerolinea] Proveedor "${prov.nombre}" no tiene credenciales (api_usuario/api_password) ` +
            `configuradas. Revisa la tabla 'proveedor' en la BD de TravelNow.`
        );
    }

    const MAX_INTENTOS = 3;
    let resp, ultimoErr;

    for (let intento = 1; intento <= MAX_INTENTOS; intento++) {
        try {
            resp = await axios.post(
                `${prov.endpoint_api}/api/auth/login`,
                { email: prov.api_usuario, password: prov.api_password },
                {
                    headers: { 'Content-Type': 'application/json' },
                    withCredentials: true,
                    validateStatus: () => true,
                    timeout: 10_000,
                }
            );
        } catch (netErr) {
            ultimoErr = netErr;
            console.warn(
                `[Aerolinea] Intento ${intento}/${MAX_INTENTOS} fallo de red contra ${prov.endpoint_api}: ${netErr.message}`
            );
            if (intento < MAX_INTENTOS) {
                await new Promise(r => setTimeout(r, 500 * intento));
                continue;
            }
            throw new Error(`[Aerolinea] No se pudo conectar con ${prov.endpoint_api}: ${netErr.message}`);
        }

        // Reintentar solo ante 5xx — 4xx son errores del cliente (credenciales, payload)
        // y no mejoran con reintentos.
        if (resp.status >= 500 && resp.status < 600 && intento < MAX_INTENTOS) {
            console.warn(
                `[Aerolinea] Intento ${intento}/${MAX_INTENTOS} recibio ${resp.status} del backend; reintentando...`
            );
            await new Promise(r => setTimeout(r, 500 * intento));
            continue;
        }
        break;
    }

    if (!resp.data?.success) {
        // Construir un mensaje de error lo más informativo posible. El backend de Halcón
        // responde con { success: false, message: "...", data: null } pero a veces el
        // cuerpo puede venir vacío (p. ej. 500 crudo del contenedor de servlets).
        const pedazos = [`status=${resp.status}`];
        if (resp.data?.message) pedazos.push(`message="${resp.data.message}"`);
        else if (typeof resp.data === 'string' && resp.data.trim()) pedazos.push(`body="${resp.data.slice(0, 200)}"`);

        // Pista específica para el caso 500 — casi siempre es un problema del backend
        // y no algo que TravelNow pueda resolver por su cuenta.
        if (resp.status >= 500) {
            pedazos.push(
                'hint="el backend de AerolineasHalcon devolvio un error interno. ' +
                'Revisa los logs de Tomcat/el servlet AuthController en el lado del proveedor ' +
                '(SQLException, BD caida, o NPE son lo mas comun)."'
            );
        } else if (resp.status === 401) {
            pedazos.push('hint="credenciales incorrectas — verifica api_usuario/api_password en la tabla proveedor."');
        } else if (resp.status === 404) {
            pedazos.push('hint="el endpoint no existe — verifica endpoint_api en la tabla proveedor."');
        }

        throw new Error(`[Aerolinea] Login fallido para "${prov.nombre}": ${pedazos.join(' ')}`);
    }

    const setCookie = resp.headers['set-cookie'];
    if (!setCookie || !setCookie.length) {
        throw new Error(`[Aerolinea] Login exitoso pero el servidor no devolvio Set-Cookie.`);
    }

    const cookie = setCookie.map(c => c.split(';')[0]).join('; ');
    _sessionCache[prov.id_proveedor] = { cookie, ts: Date.now() };
    console.log(`[Aerolinea] Sesion establecida para proveedor "${prov.nombre}"`);
    return cookie;
};

const _invalidarSession = (idProveedor) => {
    delete _sessionCache[idProveedor];
};

const _crearClienteAerolinea = async (prov) => {
    const cookie = await _loginAerolinea(prov);
    return axios.create({
        baseURL: prov.endpoint_api,
        timeout: 15_000,
        withCredentials: true,
        headers: {
            'Content-Type': 'application/json',
            'Cookie':       cookie,
        },
    });
};

const _withRetry = async (prov, fn) => {
    try {
        const client = await _crearClienteAerolinea(prov);
        return await fn(client);
    } catch (err) {
        const status = err.response?.status;
        if (status === 401 || status === 403) {
            console.warn(`[Aerolinea] Sesion expirada para "${prov.nombre}", reintentando login...`);
            _invalidarSession(prov.id_proveedor);
            const client = await _crearClienteAerolinea(prov);
            return await fn(client);
        }
        throw err;
    }
};

const clienteHotel = (prov) => axios.create({
    baseURL: prov.endpoint_api,
    timeout: 10_000,
    headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${prov.api_password}`,
    },
});

// ── Aerolínea ────────────────────────────────────────────────

/**
 * Busca vuelos en el backend de AerolineasHalcon.
 *
 * FIX (Bugs #1, #2, #3):
 *   - El backend lee los query params en camelCase (`fechaSalida`, `tipoAsiento`),
 *     no en snake_case. Antes enviábamos `fecha_salida` y `tipo_asiento`, que el
 *     backend ignoraba silenciosamente, devolviendo resultados sin filtrar.
 *   - `fecha_salida` NO debe pasar por `.toUpperCase()`; es una fecha ISO estricta
 *     que el backend parsea con `LocalDate.parse()`.
 *   - `tipo_asiento` debe ir en minúsculas: la BD de Halcon almacena 'turista',
 *     'business', etc. en minúsculas; enviarlo en mayúsculas daba 0 resultados.
 */
/**
 * Busca vuelos en el backend de AerolineasHalcon.
 *
 * FIX (Bugs #1, #2, #3):
 *   - El backend lee los query params en camelCase (`fechaSalida`, `tipoAsiento`),
 *     no en snake_case. Antes enviábamos `fecha_salida` y `tipo_asiento`, que el
 *     backend ignoraba silenciosamente, devolviendo resultados sin filtrar.
 *   - `fecha_salida` NO debe pasar por `.toUpperCase()`; es una fecha ISO estricta
 *     que el backend parsea con `LocalDate.parse()`.
 *   - `tipo_asiento` debe ir en MAYÚSCULAS: la tabla VUELOS de Oracle tiene un
 *     CHECK constraint `tipo_asiento IN ('TURISTA', 'BUSINESS')` y Oracle
 *     compara strings case-sensitive. Si TravelNow envía "turista" en minúsculas,
 *     el WHERE nunca matchea y devuelve 0 resultados.
 */
const buscarVuelos = async (idProveedor, params) => {
    const prov = await getConfig(idProveedor);
    const queryParams = {};
    if (params.origen)       queryParams.origen       = params.origen.toUpperCase().trim();
    if (params.destino)      queryParams.destino      = params.destino.toUpperCase().trim();
    if (params.fecha_salida) queryParams.fechaSalida  = String(params.fecha_salida).trim();
    if (params.tipo_asiento) queryParams.tipoAsiento  = String(params.tipo_asiento).toUpperCase().trim();

    console.log(
        `[Aerolinea] buscarVuelos → proveedor="${prov.nombre}"`,
        `params=${JSON.stringify(queryParams)}`
    );

    const hacerRequest = async (qp) => {
        const raw = await _withRetry(prov, async (client) => {
            const { data } = await client.get('/api/vuelos', { params: qp });
            return data;
        });
        return raw;
    };

    let raw = await hacerRequest(queryParams);
    let vuelos = raw?.data ?? (Array.isArray(raw) ? raw : []);

    // Fallback: si se filtró por tipoAsiento y no hubo resultados, probar sin ese filtro.
    // La BD del proveedor podría tener una variante del valor que nuestro mapeo no
    // reconozca todavía. Así devolvemos algo útil en vez de un array vacío.
    if (Array.isArray(vuelos) && vuelos.length === 0 && queryParams.tipoAsiento) {
        console.warn(
            `[Aerolinea] "${prov.nombre}" devolvio 0 vuelos con tipoAsiento="${queryParams.tipoAsiento}". ` +
            `Reintentando sin ese filtro...`
        );
        const { tipoAsiento, ...sinAsiento } = queryParams;
        raw = await hacerRequest(sinAsiento);
        vuelos = raw?.data ?? (Array.isArray(raw) ? raw : []);
        if (Array.isArray(vuelos) && vuelos.length > 0) {
            console.log(
                `[Aerolinea] "${prov.nombre}" devolvio ${vuelos.length} vuelos SIN filtro de asiento. ` +
                `Valores reales: ${[...new Set(vuelos.map(v => v.tipoAsiento))].join(', ')}`
            );
        }
    }

    if (!Array.isArray(vuelos)) {
        console.warn(`[Aerolinea] buscarVuelos: respuesta inesperada de "${prov.nombre}"`, raw);
        return [];
    }

    console.log(`[Aerolinea] "${prov.nombre}" devolvio ${vuelos.length} vuelo(s)`);

    return vuelos.map(v => ({
        id_vuelo:             v.idVuelo,
        codigo_vuelo:         v.codigoVuelo,
        origen_ciudad:        v.origenCiudad,
        origen_iata:          v.origenCodigoIata,
        destino_ciudad:       v.destinoCiudad,
        destino_iata:         v.destinoCodigoIata,
        fecha_salida:         v.fechaSalida,
        fecha_llegada:        v.fechaLlegada,
        hora_salida:          v.horaSalida,
        hora_llegada:         v.horaLlegada,
        tipo_asiento:         v.tipoAsiento,
        asientos_disponibles: v.asientosDisponibles ?? 0,
        precio_proveedor:     parseFloat(v.precioBase) || 0,
        precio_agencia:       calcularPrecioConGanancia(v.precioBase, prov.porcentaje_ganancia),
        porcentaje_ganancia:  prov.porcentaje_ganancia,
        nombre_proveedor:     prov.nombre,
        id_proveedor:         prov.id_proveedor,
        tipo:                 'vuelo',
    }));
};

/**
 * Reserva un vuelo (directo o con escalas) contra AerolineasHalcon.
 *
 * FIX (Bugs #4, #5):
 *   - El backend SIEMPRE responde con `data` como un ARRAY de reservaciones,
 *     incluso para vuelos directos (un array con un solo elemento). Antes
 *     leíamos `.codigoReservacion` sobre el array, lo que siempre daba
 *     `undefined` y tiraba "La reservacion no devolvio un identificador
 *     valido". Consecuencia: TODA reserva de vuelo fallaba.
 *   - Para vuelos con escalas (idVuelo "81-82-83") el backend crea una
 *     reservación por cada tramo. Devolvemos la lista completa al controlador
 *     para que pueda rastrearlas todas (si no, los tramos extra quedaban
 *     huérfanos y no se podían cancelar).
 *   - `idNacionalidad` ahora se normaliza a entero con fallback 83, tolerando
 *     null/undefined/strings vacíos sin tirar NPE en el backend Java.
 *
 * @returns {Object} `{ reservaciones: [...], codigosConcatenados: "A-B-C",
 *                      principal: <primera reservación> }`
 */
const reservarVuelo = async (idProveedor, payload) => {
    const prov = await getConfig(idProveedor);
    if (!payload.id_vuelo)          throw new Error('[Aerolinea] Falta id_vuelo en el payload');
    if (!payload.pasajeros?.length) throw new Error('[Aerolinea] Se requiere al menos un pasajero');

    const _normalizarNacionalidad = (v) => {
        const n = parseInt(v, 10);
        return Number.isFinite(n) && n > 0 ? n : 83;
    };

    const body = {
        idVuelo:    String(payload.id_vuelo),
        metodoPago: (payload.metodo_pago || 'tarjeta').toUpperCase(),
        pasajeros:  payload.pasajeros.map(p => ({
            nombres:         p.nombres,
            apellidos:       p.apellidos,
            fechaNacimiento: p.fecha_nacimiento,
            idNacionalidad:  _normalizarNacionalidad(p.id_nacionalidad),
            numPasaporte:    p.num_pasaporte,
        })),
    };

    const raw = await _withRetry(prov, async (client) => {
        const { data } = await client.post('/api/reservaciones', body, {
            headers: { 'x-usuario-id': String(payload.id_usuario_externo ?? 1) },
        });
        return data;
    });

    // El backend responde: { success, message, data: [reservacion, ...] }
    // Normalizamos a un array en todos los casos.
    const payloadData = raw?.data ?? raw;
    const reservaciones = Array.isArray(payloadData)
        ? payloadData
        : (payloadData ? [payloadData] : []);

    if (!reservaciones.length) {
        throw new Error(`[Aerolinea] La reservacion no devolvio datos. Respuesta: ${JSON.stringify(raw)}`);
    }

    // Validar que todas las reservaciones tengan identificador válido.
    const sinId = reservaciones.find(r => !r?.codigoReservacion && !r?.idReservacion);
    if (sinId) {
        throw new Error(`[Aerolinea] Al menos un tramo no devolvio identificador. Respuesta: ${JSON.stringify(raw)}`);
    }

    const codigosConcatenados = reservaciones
        .map(r => String(r.codigoReservacion ?? r.idReservacion))
        .join('-');

    return {
        reservaciones,
        principal:            reservaciones[0],
        codigosConcatenados,  // útil para guardar como codigo_reserva_proveedor
        // Aliases de compatibilidad (por si algún otro consumidor los espera):
        codigoReservacion:    reservaciones[0].codigoReservacion,
        idReservacion:        reservaciones[0].idReservacion,
    };
};

const cancelarVuelo = async (idProveedor, idReservacionProveedor) => {
    const prov = await getConfig(idProveedor);
    // Para vuelos con escalas, idReservacionProveedor puede venir como "123-124-125".
    // Cancelamos cada tramo por separado.
    const ids = String(idReservacionProveedor).split('-').filter(Boolean);
    const resultados = [];
    for (const id of ids) {
        try {
            const raw = await _withRetry(prov, async (client) => {
                const { data } = await client.put(`/api/reservaciones/${id}/cancelar`);
                return data;
            });
            resultados.push(raw?.data ?? raw);
        } catch (e) {
            console.error(`[Aerolinea] Fallo cancelando tramo ${id}: ${e.message}`);
            resultados.push({ id, error: e.message });
        }
    }
    return ids.length === 1 ? resultados[0] : resultados;
};

const obtenerOrigenesDestinos = async (idProveedor) => {
    const prov = await getConfig(idProveedor);
    try {
        const raw = await _withRetry(prov, async (client) => {
            const { data } = await client.get('/api/paises');
            return data;
        });
        const paises = raw?.data ?? (Array.isArray(raw) ? raw : []);
        if (!Array.isArray(paises) || !paises.length) return { origenes: [], destinos: [] };
        const lista = paises.map(p => ({
            id:     p.idPais,
            nombre: p.name ?? p.nombre,
            codigo: p.alfa2,
            alfa3:  p.alfa3,
        })).filter(p => p.nombre ?? p.codigo);
        return { origenes: lista, destinos: lista };
    } catch (e) {
        console.warn(`[Aerolinea] obtenerOrigenesDestinos fallo para "${prov.nombre}": ${e.message}`);
        return { origenes: [], destinos: [] };
    }
};

// ── Hotel ────────────────────────────────────────────────────
// ⚠️ LÓGICA DE HOTELES NO MODIFICADA — sin cambios respecto a la versión original.

const buscarHoteles = async (idProveedor, params) => {
    const prov   = await getConfig(idProveedor);
    const client = clienteHotel(prov);

    const queryParams = {
        checkIn:   new Date(params.fecha_checkin).toISOString().split('T')[0],
        checkOut:  new Date(params.fecha_checkout).toISOString().split('T')[0],
        capacidad: parseInt(params.num_huespedes) || 1,
    };

    if (params.ciudad) {
        queryParams.ciudad = params.ciudad.trim();
    }

    const { data } = await client.get('/api/b2b/disponibilidad', { params: queryParams });

    const habitaciones = data.data?.habitaciones || data.habitaciones || [];

    return habitaciones.map(h => {
        const precioBase = parseFloat(h.precioNoche ?? h.PrecioNoche ?? 0);

        return {
            id_habitacion:          h.idHabitacion   ?? h.IdHabitacion,
            num_habitacion:         h.numHabitacion  ?? h.NumHabitacion,
            tipo_habitacion:        (h.tipoHabitacion ?? h.TipoHabitacion ?? 'doble').toLowerCase(),
            nombre_hotel:           h.nombreHotel    ?? h.NombreHotel,
            ciudad:                 h.ubicacion      ?? h.Ubicacion ?? params.ciudad,
            capacidad_max:          h.capacidadMax   ?? h.CapacidadMax,
            precio_noche_proveedor: precioBase,
            precio_noche_agencia:   calcularPrecioConGanancia(precioBase, prov.porcentaje_ganancia),
            amenidades:             h.amenidades     ?? h.Amenidades ?? [],
            estado:                 h.estado         ?? h.Estado,
            porcentaje_ganancia:    prov.porcentaje_ganancia,
            nombre_proveedor:       prov.nombre,
            id_proveedor:           prov.id_proveedor,
            tipo:                   'hotel',
        };
    });
};

const reservarHotel = async (idProveedor, payload) => {
    const prov   = await getConfig(idProveedor);
    const client = clienteHotel(prov);

    const agenciaUserId = process.env.HOTELES_USUARIO_AGENCIA_ID
        ? parseInt(process.env.HOTELES_USUARIO_AGENCIA_ID)
        : null;

    if (!agenciaUserId) {
        throw new Error(
            '[Hotel] HOTELES_USUARIO_AGENCIA_ID no está configurado en el .env de TravelNow. ' +
            'Pídele a tu compañero el id_usuario de TravelNow en la tabla Usuario de BedlyHoteles.'
        );
    }

    const idUsuarioResuelto = agenciaUserId;

    const body = {
        idHabitacion:    payload.id_habitacion,
        idUsuario:       idUsuarioResuelto,
        fechaCheckIn:    new Date(payload.fecha_checkin).toISOString().split('T')[0],
        fechaCheckOut:   new Date(payload.fecha_checkout).toISOString().split('T')[0],
        numHuespedes:    parseInt(payload.num_huespedes) || 1,
        metodoPago:      payload.metodo_pago || 'transferencia',
        notasEspeciales: payload.notas || '',
    };

    const { data } = await client.post('/api/b2b/reservar', body);
    return data.data || data;
};

const cancelarHotel = async (idProveedor, idReservacionProveedor) => {
    const prov   = await getConfig(idProveedor);
    const client = clienteHotel(prov);
    const { data } = await client.put(`/api/b2b/reservas/${idReservacionProveedor}/cancelar`);
    return data.data || data;
};

const obtenerCiudades = async (idProveedor) => {
    const prov   = await getConfig(idProveedor);
    const client = clienteHotel(prov);
    const { data } = await client.get('/api/habitaciones');
    const habitaciones = data.data || data || [];
    const ciudades = [
        ...new Set(habitaciones.map(h => h.ubicacion ?? h.Ubicacion ?? h.ciudad ?? h.Ciudad).filter(Boolean))
    ];
    return { ciudades: ciudades.map(c => ({ nombre: c })) };
};

// ── Precio ───────────────────────────────────────────────────

const calcularPrecioConGanancia = (precioBase, porcentaje) => {
    const base = parseFloat(precioBase) || 0;
    const pct  = parseFloat(porcentaje) || 0;
    return parseFloat((base * (1 + pct / 100)).toFixed(2));
};

// ── Exports ──────────────────────────────────────────────────

module.exports = {
    buscarVuelos,
    reservarVuelo,
    cancelarVuelo,
    obtenerOrigenesDestinos,
    buscarHoteles,
    reservarHotel,
    cancelarHotel,
    obtenerCiudades,
    calcularPrecioConGanancia,
    buscarConfig: getConfig,
};