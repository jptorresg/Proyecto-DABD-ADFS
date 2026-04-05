// Controla la integración con Aerolíneas y Hoteles
// Aerolínea : Java/Tomcat  – auth por sesión HTTP (email+password → cookie JSESSIONID)
// Hotel     : C#/.NET      – auth Bearer token (api_password)
const axios = require('axios');
const db    = require('../config/db');

// ─────────────────────────────────────────────────────────────
//  CONFIGURACIÓN DEL PROVEEDOR (desde BD)
// ─────────────────────────────────────────────────────────────
const getConfig = async (idProveedor) => {
    const [rows] = await db.query(
        'SELECT * FROM proveedor WHERE id_proveedor = ? AND estado = "activo"',
        [idProveedor]
    );
    if (!rows.length) throw new Error('Proveedor no encontrado o inactivo');
    return rows[0];
};

// ─────────────────────────────────────────────────────────────
//  CLIENTES HTTP
// ─────────────────────────────────────────────────────────────

// Aerolínea: la API Java usa sesión HTTP.
// TravelNow actúa como agencia B2B: hace login una vez con las
// credenciales almacenadas en el proveedor y reutiliza la cookie
// JSESSIONID en cada llamada subsiguiente.
const _sessionCache = {}; // { idProveedor: { cookie, ts } }
const SESSION_TTL_MS = 50 * 60 * 1000; // 50 min (sesión Java = 60 min)

const _loginAerolinea = async (prov) => {
    const cached = _sessionCache[prov.id_proveedor];
    if (cached && (Date.now() - cached.ts) < SESSION_TTL_MS) {
        return cached.cookie;
    }
    // POST /api/auth/login devuelve Set-Cookie: JSESSIONID=...
    const resp = await axios.post(
        `${prov.endpoint_api}/api/auth/login`,
        { email: prov.api_usuario, password: prov.api_password },
        { headers: { 'Content-Type': 'application/json' }, maxRedirects: 0, validateStatus: () => true }
    );
    const setCookie = resp.headers['set-cookie'];
    if (!setCookie) throw new Error('Login a aerolínea fallido: sin cookie de sesión');
    const cookie = setCookie.map(c => c.split(';')[0]).join('; ');
    _sessionCache[prov.id_proveedor] = { cookie, ts: Date.now() };
    return cookie;
};

// Cliente axios para aerolínea (con sesión HTTP)
const clienteAerolinea = async (prov) => {
    const cookie = await _loginAerolinea(prov);
    return axios.create({
        baseURL: prov.endpoint_api,
        timeout: 10000,
        headers: {
            'Content-Type': 'application/json',
            'Cookie': cookie,
        },
    });
};

// Cliente axios para hotel (Bearer token = api_password)
const clienteHotel = (prov) => axios.create({
    baseURL: prov.endpoint_api,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${prov.api_password}`,
    },
});

// ─────────────────────────────────────────────────────────────
//  AEROLÍNEA
// ─────────────────────────────────────────────────────────────

// VueloController.java → GET /api/vuelos
const buscarVuelos = async (idProveedor, params) => {
    const prov   = await getConfig(idProveedor);
    const client = await clienteAerolinea(prov);

    // Nombres de campo que espera la API Java (camelCase)
    const queryParams = {
        origen:      params.origen,
        destino:     params.destino,
        fechaSalida: params.fecha_salida,
        tipoAsiento: params.tipo_asiento,
    };

    const { data } = await client.get('/api/vuelos', { params: queryParams });

    // La aerolínea envuelve en { success, data, message }
    const vuelos = data.data || data || [];
    return vuelos.map(v => ({
        id_vuelo:             v.idVuelo,
        codigo_vuelo:         v.codigoVuelo,
        origen_ciudad:        v.origenCiudad,
        origen_iata:          v.origenCodigoIata,
        destino_ciudad:       v.destinoCiudad,
        destino_iata:         v.destinoCodigoIata,
        fecha_salida:         v.fechaSalida,
        hora_salida:          v.horaSalida,
        fecha_llegada:        v.fechaLlegada,
        hora_llegada:         v.horaLlegada,
        tipo_asiento:         v.tipoAsiento,
        asientos_disponibles: v.asientosDisponibles,
        precio_proveedor:     parseFloat(v.precioBase),
        precio_agencia:       calcularPrecioConGanancia(v.precioBase, prov.porcentaje_ganancia),
        porcentaje_ganancia:  prov.porcentaje_ganancia,
        nombre_proveedor:     prov.nombre,
        id_proveedor:         prov.id_proveedor,
        tipo:                 'vuelo',
    }));
};

// ReservacionController.java → POST /api/reservaciones
// El header x-usuario-id es obligatorio para la API Java.
const reservarVuelo = async (idProveedor, payload) => {
    const prov   = await getConfig(idProveedor);
    const client = await clienteAerolinea(prov);

    // Campos en camelCase tal como espera ReservacionController.java
    const body = {
        idVuelo:    payload.id_vuelo,
        metodoPago: payload.metodo_pago || 'tarjeta',
        pasajeros:  payload.pasajeros.map(p => ({
            nombres:         p.nombres,
            apellidos:       p.apellidos,
            fechaNacimiento: p.fecha_nacimiento,
            idNacionalidad:  p.id_nacionalidad,
            numPasaporte:    p.num_pasaporte,
        })),
    };

    const { data } = await client.post('/api/reservaciones', body, {
        headers: {
            // La API Java identifica al usuario comprador vía este header
            'x-usuario-id': String(payload.id_usuario_externo || 1),
        },
    });

    // Desenvuelve { success, data } → devuelve el objeto de reservación
    return data.data || data;
};

// Cancelar vuelo → PUT /api/reservaciones/{id}/cancelar
const cancelarVuelo = async (idProveedor, idReservacionProveedor) => {
    const prov   = await getConfig(idProveedor);
    const client = await clienteAerolinea(prov);
    const { data } = await client.put(`/api/reservaciones/${idReservacionProveedor}/cancelar`);
    return data.data || data;
};

// PaisDAO.findAll() → GET /api/paises
const obtenerOrigenesDestinos = async (idProveedor) => {
    const prov   = await getConfig(idProveedor);
    const client = await clienteAerolinea(prov);
    const { data } = await client.get('/api/paises');
    const paises = data.data || data || [];
    const lista = paises.map(p => ({
        id:     p.id,
        nombre: p.name,
        codigo: p.alfa2,
        alfa3:  p.alfa3,
    }));
    return { origenes: lista, destinos: lista };
};

// ─────────────────────────────────────────────────────────────
//  HOTEL (B2BController.cs)
// ─────────────────────────────────────────────────────────────

// GET /api/b2b/disponibilidad
const buscarHoteles = async (idProveedor, params) => {
    const prov   = await getConfig(idProveedor);
    const client = clienteHotel(prov);

    // Nombres que espera B2BController.cs
    const queryParams = {
        checkIn:   params.fecha_checkin,
        checkOut:  params.fecha_checkout,
        capacidad: params.num_huespedes || 1,
    };

    const { data } = await client.get('/api/b2b/disponibilidad', { params: queryParams });

    const habitaciones = data.data?.habitaciones || data.habitaciones || [];
    return habitaciones.map(h => ({
        id_habitacion:          h.idHabitacion  || h.IdHabitacion,
        num_habitacion:         h.numHabitacion || h.NumHabitacion,
        tipo_habitacion:        h.tipoHabitacion || h.TipoHabitacion,
        nombre_hotel:           h.nombreHotel   || h.NombreHotel,
        capacidad_max:          h.capacidadMax  || h.CapacidadMax,
        precio_noche_proveedor: parseFloat(h.precioNoche || h.PrecioNoche),
        precio_noche_agencia:   calcularPrecioConGanancia(
            h.precioNoche || h.PrecioNoche,
            prov.porcentaje_ganancia
        ),
        amenidades:             h.amenidades || [],
        estado:                 h.estado || h.Estado,
        porcentaje_ganancia:    prov.porcentaje_ganancia,
        nombre_proveedor:       prov.nombre,
        id_proveedor:           prov.id_proveedor,
        tipo:                   'hotel',
    }));
};

// POST /api/b2b/reservaciones
const reservarHotel = async (idProveedor, payload) => {
    const prov   = await getConfig(idProveedor);
    const client = clienteHotel(prov);

    // PascalCase tal como espera B2BController.cs
    const body = {
        IdHabitacion:    payload.id_habitacion,
        FechaCheckIn:    payload.fecha_checkin,
        FechaCheckOut:   payload.fecha_checkout,
        NumHuespedes:    payload.num_huespedes,
        IdUsuario:       payload.id_usuario_externo || 1,
        MetodoPago:      payload.metodo_pago || 'transferencia',
        NotasEspeciales: payload.notas || '',
    };

    const { data } = await client.post('/api/b2b/reservar', body);
    return data.data || data;
};

// PUT /api/b2b/reservas/{id}/cancelar
const cancelarHotel = async (idProveedor, idReservacionProveedor) => {
    const prov   = await getConfig(idProveedor);
    const client = clienteHotel(prov);
    const { data } = await client.put(`/api/b2b/reservas/${idReservacionProveedor}/cancelar`);
    return data.data || data;
};

// GET /api/habitaciones → extrae ciudades únicas
const obtenerCiudades = async (idProveedor) => {
    const prov   = await getConfig(idProveedor);
    const client = clienteHotel(prov);
    const { data } = await client.get('/api/habitaciones');
    const habitaciones = data.data || data || [];
    const ciudades = [
        ...new Set(habitaciones.map(h => h.ciudad || h.Ciudad).filter(Boolean))
    ];
    return { ciudades: ciudades.map(c => ({ nombre: c })) };
};

// ─────────────────────────────────────────────────────────────
//  UTILIDAD DE PRECIO
// ─────────────────────────────────────────────────────────────
const calcularPrecioConGanancia = (precioBase, porcentaje) => {
    const base = parseFloat(precioBase) || 0;
    const pct  = parseFloat(porcentaje) || 0;
    return parseFloat((base * (1 + pct / 100)).toFixed(2));
};

// ─────────────────────────────────────────────────────────────
//  EXPORTS
// ─────────────────────────────────────────────────────────────
module.exports = {
    buscarVuelos,
    buscarHoteles,
    reservarVuelo,
    reservarHotel,
    cancelarVuelo,
    cancelarHotel,
    obtenerOrigenesDestinos,
    obtenerCiudades,
    calcularPrecioConGanancia,
};

module.exports.buscarConfig = getConfig;