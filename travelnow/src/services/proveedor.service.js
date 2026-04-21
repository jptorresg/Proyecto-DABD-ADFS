'use strict';

const axios = require('axios');
const db = require('../config/db');

const calcularPrecioConGanancia = (precioBase, porcentaje) => {
    const base = parseFloat(precioBase) || 0;
    const pct = parseFloat(porcentaje) || 0;
    return +(base * (1 + pct / 100)).toFixed(2);   
}

const getConfig = async (idProveedor) => {
    const [rows] = await db.query('SELECT * FROM proveedor WHERE id_proveedor = ? AND estado = "activo"', [idProveedor]);
    if(!rows.length){
        throw new Error(`Proveedor ${idProveedor} no encontrado o inactivo`);
    }
    return rows[0];
};

const buscarConfig = getConfig;

// ---------------------------- Aerolineas --------------------------

const _sessionCache = {};
const SESSION_TTL_MS = 50 * 60 * 1000;
 
const _loginAerolinea = async (prov) => {
    const cached = _sessionCache[prov.id_proveedor];
    if (cached && Date.now() - cached.ts < SESSION_TTL_MS) return cached.cookie;
 
    let resp;
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
        throw new Error(`[Aerolinea] No se pudo conectar con ${prov.endpoint_api}: ${netErr.message}`);
    }
 
    if (!resp.data?.success) {
        throw new Error(`[Aerolinea] Login fallido para "${prov.nombre}": ${resp.data?.message ?? resp.status}`);
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

// -------------------------- HOTEL -----------------------------------

const _validarTokenHotel = (prov) => {
    const tokenRaw = prov.api_password || '';
    const token = tokenRaw.trim();
    if (!token) {
        throw new Error(
            `[Hotel] El proveedor "${prov.nombre}" (id=${prov.id_proveedor}) ` +
            `no tiene token B2B configurado. Edita el proveedor en /admin/proveedores ` +
            `y pega el token de la tabla Agencias de BedlyHoteles en el campo "Password / Token API".`
        );
    }
    console.log('[DEBUG Hotel] ===========================================');
    console.log(`[DEBUG Hotel] Token visible: "${token}"`);
    console.log(`[DEBUG Hotel] Largo raw: ${tokenRaw.length} | Largo trim: ${token.length}`);
    console.log(`[DEBUG Hotel] Códigos Unicode de cada carácter:`);
    console.log([...token].map((c, i) => `${i}: "${c}" = U+${c.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}`).join('\n'));
    console.log(`[DEBUG Hotel] Comparación con esperado:`);
    const esperado = '16DDD7A8-C4EF-40BF-AAF8-CAEDF53D0F70';
    console.log(`[DEBUG Hotel]   token === esperado ? ${token === esperado}`);
    console.log(`[DEBUG Hotel]   token.toUpperCase() === esperado ? ${token.toUpperCase() === esperado}`);
    console.log(`[DEBUG Hotel]   JSON.stringify(token): ${JSON.stringify(token)}`);
    console.log(`[DEBUG Hotel]   Buffer hex: ${Buffer.from(token, 'utf8').toString('hex')}`);
    console.log('[DEBUG Hotel] ===========================================');
    return token;
};
 
const clienteHotel = (prov) => {
    const token = _validarTokenHotel(prov);
    const instance = axios.create({
        baseURL: prov.endpoint_api,
        timeout: 10_000,
        validateStatus: (status) => status < 500,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    });
    instance.interceptors.request.use((config) => {
        console.log('[DEBUG HTTP] ============ REQUEST ============');
        console.log(`[DEBUG HTTP] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
        console.log(`[DEBUG HTTP] params:`, config.params);
        const authHeader = config.headers?.Authorization ?? config.headers?.authorization;
        console.log(`[DEBUG HTTP] Authorization header: "${authHeader}"`);
        console.log(`[DEBUG HTTP] Largo del Authorization header: ${authHeader?.length}`);
        console.log(`[DEBUG HTTP] Hex: ${authHeader ? Buffer.from(authHeader, 'utf8').toString('hex') : '(vacio)'}`);
        console.log('[DEBUG HTTP] Todos los headers:', JSON.stringify(config.headers, null, 2));
        console.log('[DEBUG HTTP] =========================================');
        return config;
    });
    return instance;
};

const _errorHotel = (prov, resp, accion) => {
    const status = resp?.status;
    const msg    = resp?.data?.message
                ?? resp?.data?.error
                ?? resp?.statusText
                ?? 'error desconocido';
 
    if (status === 401) {
        return new Error(
            `[Hotel] 401 Unauthorized en "${prov.nombre}" al ${accion}. ` +
            `El token enviado no esta en la tabla Agencias de BedlyHoteles, ` +
            `o la agencia esta marcada como inactiva. Detalle: ${msg}`
        );
    }
    if (status === 404) {
        return new Error(
            `[Hotel] 404 en "${prov.nombre}" al ${accion}. ` +
            `Verifica que el endpoint_api (${prov.endpoint_api}) sea correcto y exponga /api/b2b/*. Detalle: ${msg}`
        );
    }
    return new Error(`[Hotel] ${status ?? '???'} en "${prov.nombre}" al ${accion}: ${msg}`);
};
 
const _llamarHotel = async (prov, accion, fn) => {
    let resp;
    try {
        resp = await fn(clienteHotel(prov));
    } catch (netErr) {
        // axios solo llega aqui si validateStatus devolvio false (>=500) o fallo de red.
        if (netErr.response) {
            throw _errorHotel(prov, netErr.response, accion);
        }
        throw new Error(
            `[Hotel] No se pudo conectar con "${prov.nombre}" (${prov.endpoint_api}) al ${accion}: ${netErr.message}`
        );
    }
    if (resp.status >= 400) {
        throw _errorHotel(prov, resp, accion);
    }
    return resp.data;
};

// -------------------------- AEROLINEA BUSQUEDA Y RESERVA ----------------------------
const buscarVuelos = async (idProveedor, params) => {
    const prov = await getConfig(idProveedor);
    const queryParams = {};
    if (params.origen)       queryParams.origen       = params.origen.toUpperCase().trim();
    if (params.destino)      queryParams.destino      = params.destino.toUpperCase().trim();
    if (params.fecha_salida) queryParams.fecha_salida = params.fecha_salida.toUpperCase().trim();
    if (params.tipo_asiento) queryParams.tipo_asiento = params.tipo_asiento.toUpperCase().trim();
 
    const raw = await _withRetry(prov, async (client) => {
        const { data } = await client.get('/api/vuelos', { params: queryParams });
        return data;
    });
 
    const vuelos = raw?.data ?? (Array.isArray(raw) ? raw : []);
    return vuelos.map(v => ({
        ...v,
        id_proveedor:        prov.id_proveedor,
        nombre_proveedor:    prov.nombre,
        porcentaje_ganancia: prov.porcentaje_ganancia,
        precio_proveedor:    v.precio,
        precio_agencia:      calcularPrecioConGanancia(v.precio, prov.porcentaje_ganancia),
        tipo:                'vuelo',
    }));
};
 
const reservarVuelo = async (idProveedor, payload) => {
    const prov = await getConfig(idProveedor);
    const raw  = await _withRetry(prov, async (client) => {
        const { data } = await client.post('/api/reservaciones', payload);
        return data;
    });
    const reservacion = raw?.data ?? raw;
    if (!reservacion?.codigoReservacion && !reservacion?.idReservacion) {
        throw new Error(`[Aerolinea] La reservacion no devolvio un identificador valido. Respuesta: ${JSON.stringify(raw)}`);
    }
    return reservacion;
};
 
const cancelarVuelo = async (idProveedor, idReservacionProveedor) => {
    const prov = await getConfig(idProveedor);
    const raw  = await _withRetry(prov, async (client) => {
        const { data } = await client.put(`/api/reservaciones/${idReservacionProveedor}/cancelar`);
        return data;
    });
    return raw?.data ?? raw;
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

// ----------------------------- HOTEL BUSQUEDA Y RESERVA -------------------------------
const buscarHoteles = async (idProveedor, params) => {
    const prov = await getConfig(idProveedor);
 
    const queryParams = {
        checkIn:   new Date(params.fecha_checkin).toISOString().split('T')[0],
        checkOut:  new Date(params.fecha_checkout).toISOString().split('T')[0],
        capacidad: parseInt(params.num_huespedes) || 1,
    };
    if (params.ciudad) queryParams.ciudad = params.ciudad.trim();
 
    const data = await _llamarHotel(prov, 'buscar disponibilidad', (client) =>
        client.get('/api/b2b/disponibilidad', { params: queryParams })
    );
 
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
    const prov = await getConfig(idProveedor);
 
    const agenciaUserId = process.env.HOTELES_USUARIO_AGENCIA_ID
        ? parseInt(process.env.HOTELES_USUARIO_AGENCIA_ID)
        : null;
 
    const idUsuarioResuelto = payload.id_usuario_externo ?? agenciaUserId;
    if (!idUsuarioResuelto) {
        throw new Error(
            '[Hotel] No se pudo resolver idUsuario para la reserva. ' +
            'Configura HOTELES_USUARIO_AGENCIA_ID en el .env de TravelNow.'
        );
    }
 
    const body = {
        idHabitacion:    payload.id_habitacion,
        idUsuario:       idUsuarioResuelto,
        fechaCheckIn:    new Date(payload.fecha_checkin).toISOString().split('T')[0],
        fechaCheckOut:   new Date(payload.fecha_checkout).toISOString().split('T')[0],
        numHuespedes:    parseInt(payload.num_huespedes) || 1,
        metodoPago:      payload.metodo_pago || 'transferencia',
        notasEspeciales: payload.notas || '',
    };
 
    const data = await _llamarHotel(prov, 'crear reserva', (client) =>
        client.post('/api/b2b/reservar', body)
    );
    return data.data || data;
};
 
const cancelarHotel = async (idProveedor, idReservacionProveedor) => {
    const prov = await getConfig(idProveedor);
    const data = await _llamarHotel(prov, 'cancelar reserva', (client) =>
        client.put(`/api/b2b/reservas/${idReservacionProveedor}/cancelar`)
    );
    return data.data || data;
};
 
const obtenerCiudades = async (idProveedor) => {
    const prov = await getConfig(idProveedor);
    // /api/habitaciones es publico en Bedly, no requiere token. Usamos axios directo
    // con validateStatus para no romper la actualizacion de cache si el server esta caido.
    let resp;
    try {
        resp = await axios.get(`${prov.endpoint_api}/api/habitaciones`, {
            timeout: 10_000,
            validateStatus: () => true,
        });
    } catch (netErr) {
        throw new Error(`[Hotel] No se pudo conectar con "${prov.nombre}" para listar ciudades: ${netErr.message}`);
    }
    if (resp.status >= 400) {
        throw _errorHotel(prov, resp, 'listar habitaciones');
    }
    const habitaciones = resp.data.data || resp.data || [];
    const ciudades = [
        ...new Set(habitaciones.map(h => h.ubicacion ?? h.Ubicacion ?? h.ciudad ?? '').filter(Boolean))
    ];
    return { ciudades: ciudades.map(c => ({ nombre: c })) };
};
 
/**
 * Diagnostica la conexion con un proveedor hotel sin reventar.
 * Devuelve un objeto { ok, status, mensaje, detalle } para mostrar en el admin.
 *
 * Uso: GET /api/admin/proveedores/:id/probar
 */
const probarConexionHotel = async (idProveedor) => {
    let prov;
    try {
        prov = await getConfig(idProveedor);
    } catch (e) {
        return { ok: false, etapa: 'config', mensaje: e.message };
    }
 
    if (prov.tipo !== 'hotel') {
        return { ok: false, etapa: 'config', mensaje: `El proveedor ${idProveedor} no es de tipo hotel (es "${prov.tipo}").` };
    }
 
    if (!prov.api_password || !prov.api_password.trim()) {
        return {
            ok: false,
            etapa: 'token',
            mensaje: `Falta el token B2B en "Password / Token API". Pega el GUID de la tabla Agencias.token de BedlyHoteles.`,
        };
    }
 
    // 1) Probamos endpoint publico para ver que el server responde.
    try {
        const ping = await axios.get(`${prov.endpoint_api}/api/habitaciones`, {
            timeout: 7_000,
            validateStatus: () => true,
        });
        if (ping.status >= 500) {
            return { ok: false, etapa: 'red', mensaje: `BedlyHoteles devolvio ${ping.status} en /api/habitaciones (servidor caido o BD).` };
        }
    } catch (netErr) {
        return {
            ok: false,
            etapa: 'red',
            mensaje: `No se pudo conectar a ${prov.endpoint_api}. Revisa que el endpoint_api del proveedor sea la URL base correcta (ej: http://localhost:5000) y que la API este corriendo. Detalle: ${netErr.message}`,
        };
    }
 
    // 2) Probamos el token con /api/b2b/disponibilidad usando un rango minimo.
    const hoy   = new Date();
    const manana = new Date(hoy.getTime() + 24 * 60 * 60 * 1000);
    const queryParams = {
        checkIn:   hoy.toISOString().split('T')[0],
        checkOut:  manana.toISOString().split('T')[0],
        capacidad: 1,
    };
 
    let resp;
    try {
        resp = await clienteHotel(prov).get('/api/b2b/disponibilidad', { params: queryParams });
    } catch (netErr) {
        return { ok: false, etapa: 'red', mensaje: `Fallo de red al validar token: ${netErr.message}` };
    }
 
    if (resp.status === 401) {
        return {
            ok: false,
            etapa: 'token',
            mensaje:
                `Token rechazado por BedlyHoteles (401). Causas posibles:\n` +
                `  1) El valor en api_password no coincide con Agencias.token en la BD de Bedly.\n` +
                `  2) La agencia existe pero esta marcada como activo=0.\n` +
                `  3) Hay espacios o saltos de linea al inicio/fin del token.`,
            detalle: resp.data,
        };
    }
    if (resp.status >= 400) {
        return { ok: false, etapa: 'api', mensaje: `BedlyHoteles devolvio ${resp.status}: ${resp.data?.message ?? resp.statusText}` };
    }
 
    const totalHab = resp.data?.data?.totalDisponibles ?? resp.data?.totalDisponibles ?? 0;
    return {
        ok: true,
        etapa: 'completo',
        mensaje: `Conexion OK con "${prov.nombre}". Agencia reconocida, ${totalHab} habitacion(es) disponibles para hoy.`,
        agencia: resp.data?.data?.agencia ?? resp.data?.agencia,
    };
};

// exports
module.exports = {
    // util
    calcularPrecioConGanancia,
    getConfig,
    buscarConfig,
    // aerolinea
    buscarVuelos,
    reservarVuelo,
    cancelarVuelo,
    obtenerOrigenesDestinos,
    // hotel
    buscarHoteles,
    reservarHotel,
    cancelarHotel,
    obtenerCiudades,
    probarConexionHotel,
};