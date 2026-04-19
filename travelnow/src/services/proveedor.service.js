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

const clienteHotel = (prov) => axios.create({
    baseURL: prov.endpoint_api,
    timeout: 10_000,
    headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${prov.api_password}`,
    },
});

// ── Aerolínea ────────────────────────────────────────────────

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
    if (!Array.isArray(vuelos)) {
        console.warn(`[Aerolinea] buscarVuelos: respuesta inesperada de "${prov.nombre}"`, raw);
        return [];
    }

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

const reservarVuelo = async (idProveedor, payload) => {
    const prov = await getConfig(idProveedor);
    if (!payload.id_vuelo)          throw new Error('[Aerolinea] Falta id_vuelo en el payload');
    if (!payload.pasajeros?.length) throw new Error('[Aerolinea] Se requiere al menos un pasajero');

    const body = {
        idVuelo:    payload.id_vuelo,
        metodoPago: payload.metodo_pago || 'tarjeta',
        pasajeros:  payload.pasajeros.map(p => ({
            nombres:         p.nombres,
            apellidos:       p.apellidos,
            fechaNacimiento: p.fecha_nacimiento,
            idNacionalidad:  p.id_nacionalidad ?? 83,
            numPasaporte:    p.num_pasaporte,
        })),
    };

    const raw = await _withRetry(prov, async (client) => {
        const { data } = await client.post('/api/reservaciones', body, {
            headers: { 'x-usuario-id': String(payload.id_usuario_externo ?? 1) },
        });
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

// ── Hotel ────────────────────────────────────────────────────

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