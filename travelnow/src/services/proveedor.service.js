/**
 * @file integracion.proveedores.js
 * @brief Módulo de integración con proveedores de aerolíneas y hoteles
 * @author Sistema de Reservas
 * @version 1.0.0
 * @date 2024
 * 
 * @details Este módulo maneja la comunicación con APIs externas de aerolíneas y hoteles,
 * incluyendo autenticación, gestión de sesiones, búsqueda de disponibilidad,
 * reservas y cancelaciones. Implementa caché de sesiones, reintentos automáticos
 * y cálculo de precios con ganancia.
 */

// Control de integracion con aerolinea y hotel
const axios = require('axios');
const db    = require('../config/db');

// ─────────────────────────────────────────────────────────────
//  CONFIGURACION DEL PROVEEDOR (desde BD)
// ─────────────────────────────────────────────────────────────

/**
 * @brief Obtiene la configuración de un proveedor desde la base de datos
 * @param {number} idProveedor - ID del proveedor a consultar
 * @returns {Promise<Object>} Configuración del proveedor
 * @throws {Error} Si el proveedor no existe o está inactivo
 * 
 * @details Consulta la tabla 'proveedor' filtrando por ID y estado activo.
 * La configuración incluye endpoint, credenciales y porcentaje de ganancia.
 */
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

// ─────────────────────────────────────────────────────────────
//  CLIENTES HTTP
// ─────────────────────────────────────────────────────────────

/**
 * @brief Cache de sesiones HTTP para aerolíneas
 * @type {Object.<number, {cookie: string, ts: number}>}
 * @description Almacena cookies de sesión por ID de proveedor
 */
const _sessionCache = {};

/**
 * @brief Tiempo de vida de la sesión en milisegundos
 * @constant {number}
 * @default 3000000 (50 minutos)
 */
const SESSION_TTL_MS = 50 * 60 * 1000;

/**
 * @brief Realiza login en el sistema de aerolínea y obtiene cookie de sesión
 * @param {Object} prov - Configuración del proveedor
 * @param {string} prov.id_proveedor - ID del proveedor
 * @param {string} prov.endpoint_api - URL base de la API
 * @param {string} prov.api_usuario - Usuario para autenticación
 * @param {string} prov.api_password - Contraseña para autenticación
 * @param {string} prov.nombre - Nombre del proveedor
 * @returns {Promise<string>} Cookie de sesión para usar en requests
 * @throws {Error} Si falla la conexión o el login
 * 
 * @details Utiliza caché para evitar múltiples logins.
 * La cookie se almacena con timestamp para control de expiración.
 */
const _loginAerolinea = async (prov) => {
    const cached = _sessionCache[prov.id_proveedor];
    if (cached && Date.now() - cached.ts < SESSION_TTL_MS) {
        return cached.cookie;
    }

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
        throw new Error(
            `[Aerolinea] No se pudo conectar con ${prov.endpoint_api}: ${netErr.message}`
        );
    }

    if (!resp.data?.success) {
        throw new Error(
            `[Aerolinea] Login fallido para "${prov.nombre}": ${resp.data?.message ?? resp.status}`
        );
    }

    const setCookie = resp.headers['set-cookie'];
    if (!setCookie || !setCookie.length) {
        throw new Error(
            `[Aerolinea] Login exitoso pero Tomcat no devolvio Set-Cookie. Verifica la configuracion del servidor.`
        );
    }

    const cookie = setCookie.map(c => c.split(';')[0]).join('; ');
    _sessionCache[prov.id_proveedor] = { cookie, ts: Date.now() };
    console.log(`[Aerolinea] Sesion establecida para proveedor "${prov.nombre}"`);
    return cookie;
};

/**
 * @brief Invalida la sesión en caché para un proveedor
 * @param {number} idProveedor - ID del proveedor
 * @description Elimina la cookie almacenada, forzando nuevo login en próxima request
 */
const _invalidarSession = (idProveedor) => {
    delete _sessionCache[idProveedor];
};

/**
 * @brief Crea un cliente HTTP autenticado para aerolínea
 * @param {Object} prov - Configuración del proveedor
 * @returns {Promise<Object>} Cliente Axios configurado con cookie de sesión
 * @description Realiza login automáticamente y configura el cliente con la cookie
 */
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

/**
 * @brief Ejecuta una función con reintento automático en caso de sesión expirada
 * @param {Object} prov - Configuración del proveedor
 * @param {Function} fn - Función asíncrona que recibe el cliente autenticado
 * @returns {Promise<any>} Resultado de la función
 * @description Si la función falla con error 401/403, invalida sesión, relogin y reintenta
 */
const _withRetry = async (prov, fn) => {
    try {
        const client = await _crearClienteAerolinea(prov);
        return await fn(client);
    } catch (err) {
        const status = err.response?.status;
        if (status === 401 || status === 403) {
            // BUG CORREGIDO: "warn" en lugar de "warm"
            console.warn(`[Aerolinea] Sesion expirada para "${prov.nombre}", reintentando login...`);
            _invalidarSession(prov.id_proveedor);
            const client = await _crearClienteAerolinea(prov);
            return await fn(client);
        }
        throw err;
    }
};

/**
 * @brief Crea un cliente HTTP para API de hotel con autenticación Bearer
 * @param {Object} prov - Configuración del proveedor
 * @param {string} prov.endpoint_api - URL base de la API
 * @param {string} prov.api_password - Token Bearer para autenticación
 * @returns {Object} Cliente Axios configurado con Bearer token
 */
const clienteHotel = (prov) => axios.create({
    baseURL: prov.endpoint_api,
    timeout: 10000,
    headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${prov.api_password}`,
    },
});

// ─────────────────────────────────────────────────────────────
//  Aerolinea
// ─────────────────────────────────────────────────────────────

/**
 * @brief Busca vuelos disponibles en aerolínea
 * @param {number} idProveedor - ID del proveedor de aerolínea
 * @param {Object} params - Parámetros de búsqueda
 * @param {string} [params.origen] - Código IATA de origen
 * @param {string} [params.destino] - Código IATA de destino
 * @param {string} [params.fecha_salida] - Fecha de salida (YYYY-MM-DD)
 * @param {string} [params.tipo_asiento] - Tipo de asiento (economy, business, etc)
 * @returns {Promise<Array>} Lista de vuelos disponibles con precios calculados
 * 
 * @details Convierte la respuesta del proveedor al formato interno de la agencia.
 * Calcula el precio de agencia aplicando el porcentaje de ganancia.
 */
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
        // BUG CORREGIDO: "warn" en lugar de "warm"
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

/**
 * @brief Realiza una reserva de vuelo en el sistema de aerolínea
 * @param {number} idProveedor - ID del proveedor de aerolínea
 * @param {Object} payload - Datos de la reserva
 * @param {string} payload.id_vuelo - ID del vuelo a reservar
 * @param {Array} payload.pasajeros - Lista de pasajeros
 * @param {string} payload.metodo_pago - Método de pago (tarjeta, transferencia, etc)
 * @param {number} payload.id_usuario_externo - ID del usuario en sistema externo
 * @returns {Promise<Object>} Datos de la reservación creada
 * @throws {Error} Si falta id_vuelo o la lista de pasajeros
 */
const reservarVuelo = async (idProveedor, payload) => {
    const prov = await getConfig(idProveedor);
    if (!payload.id_vuelo)        throw new Error('[Aerolinea] Falta id_vuelo en el payload');
    if (!payload.pasajeros?.length) throw new Error('[Aerolinea] Se requiere al menos un pasajero');

    const body = {
        idVuelo:     payload.id_vuelo,
        metodoPago:  payload.metodo_pago || 'tarjeta',
        pasajeros:   payload.pasajeros.map(p => ({
            nombres:          p.nombres,
            apellidos:        p.apellidos,
            fechaNacimiento:  p.fecha_nacimiento,
            idNacionalidad:   p.id_nacionalidad ?? 83,
            numPasaporte:     p.num_pasaporte,
        })),
    };

    const raw = await _withRetry(prov, async (client) => {
        const { data } = await client.post('/api/reservaciones', body, {
            headers: {
                'x-usuario-id': String(payload.id_usuario_externo ?? 1),
            },
        });
        return data;
    });

    const reservacion = raw?.data ?? raw;
    if (!reservacion?.codigoReservacion && !reservacion?.idReservacion) {
        throw new Error(
            `[Aerolinea] La reservacion no devolvio un identificador valido. Respuesta: ${JSON.stringify(raw)}`
        );
    }
    return reservacion;
};

/**
 * @brief Cancela una reserva de vuelo existente
 * @param {number} idProveedor - ID del proveedor de aerolínea
 * @param {string} idReservacionProveedor - ID de la reservación en sistema del proveedor
 * @returns {Promise<Object>} Confirmación de cancelación
 */
const cancelarVuelo = async (idProveedor, idReservacionProveedor) => {
    const prov = await getConfig(idProveedor);
    const raw  = await _withRetry(prov, async (client) => {
        const { data } = await client.put(`/api/reservaciones/${idReservacionProveedor}/cancelar`);
        return data;
    });
    return raw?.data ?? raw;
};

/**
 * @brief Obtiene listados de orígenes y destinos disponibles
 * @param {number} idProveedor - ID del proveedor de aerolínea
 * @returns {Promise<Object>} Objeto con arrays 'origenes' y 'destinos'
 * @description Extrae países/ciudades desde el endpoint /api/paises
 */
const obtenerOrigenesDestinos = async (idProveedor) => {
    const prov = await getConfig(idProveedor);
    try {
        const raw = await _withRetry(prov, async (client) => {
            const { data } = await client.get('/api/paises');
            return data;
        });
        const paises = raw?.data ?? (Array.isArray(raw) ? raw : []);
        if (!Array.isArray(paises) || !paises.length) {
            return { origenes: [], destinos: [] };
        }
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

// ─────────────────────────────────────────────────────────────
//  Hotel
// ─────────────────────────────────────────────────────────────

/**
 * @brief Busca hoteles disponibles según fechas y capacidad
 * @param {number} idProveedor - ID del proveedor de hotel
 * @param {Object} params - Parámetros de búsqueda
 * @param {string} params.fecha_checkin - Fecha de entrada (YYYY-MM-DD)
 * @param {string} params.fecha_checkout - Fecha de salida (YYYY-MM-DD)
 * @param {number} params.num_huespedes - Número de huéspedes (default: 1)
 * @returns {Promise<Array>} Lista de habitaciones disponibles con precios calculados
 */
const buscarHoteles = async (idProveedor, params) => {
    const prov   = await getConfig(idProveedor);
    const client = clienteHotel(prov);

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
        amenidades:          h.amenidades || [],
        estado:              h.estado || h.Estado,
        porcentaje_ganancia: prov.porcentaje_ganancia,
        nombre_proveedor:    prov.nombre,
        id_proveedor:        prov.id_proveedor,
        tipo:                'hotel',
    }));
};

/**
 * @brief Realiza una reserva de hotel
 * @param {number} idProveedor - ID del proveedor de hotel
 * @param {Object} payload - Datos de la reserva
 * @param {string} payload.id_habitacion - ID de la habitación a reservar
 * @param {string} payload.fecha_checkin - Fecha de entrada
 * @param {string} payload.fecha_checkout - Fecha de salida
 * @param {number} payload.num_huespedes - Número de huéspedes
 * @param {number} payload.id_usuario_externo - ID del usuario en sistema externo
 * @param {string} payload.metodo_pago - Método de pago
 * @param {string} [payload.notas] - Notas especiales
 * @returns {Promise<Object>} Datos de la reservación creada
 */
const reservarHotel = async (idProveedor, payload) => {
    const prov   = await getConfig(idProveedor);
    const client = clienteHotel(prov);

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

/**
 * @brief Cancela una reserva de hotel existente
 * @param {number} idProveedor - ID del proveedor de hotel
 * @param {string} idReservacionProveedor - ID de la reservación en sistema del proveedor
 * @returns {Promise<Object>} Confirmación de cancelación
 */
const cancelarHotel = async (idProveedor, idReservacionProveedor) => {
    const prov   = await getConfig(idProveedor);
    const client = clienteHotel(prov);
    const { data } = await client.put(`/api/b2b/reservas/${idReservacionProveedor}/cancelar`);
    return data.data || data;
};

/**
 * @brief Obtiene lista de ciudades disponibles desde el proveedor hotelero
 * @param {number} idProveedor - ID del proveedor de hotel
 * @returns {Promise<Object>} Objeto con array 'ciudades' de {nombre}
 * @description Extrae ciudades únicas del listado de habitaciones
 */
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

/**
 * @brief Calcula el precio final incluyendo porcentaje de ganancia de la agencia
 * @param {number|string} precioBase - Precio base del proveedor
 * @param {number|string} porcentaje - Porcentaje de ganancia (ej: 15 para 15%)
 * @returns {number} Precio final redondeado a 2 decimales
 * 
 * @example
 * calcularPrecioConGanancia(100, 15) // Retorna 115.00
 */
const calcularPrecioConGanancia = (precioBase, porcentaje) => {
    const base = parseFloat(precioBase) || 0;
    const pct  = parseFloat(porcentaje) || 0;
    return parseFloat((base * (1 + pct / 100)).toFixed(2));
};

// ─────────────────────────────────────────────────────────────
//  EXPORTS
// ─────────────────────────────────────────────────────────────

/**
 * @module integracion.proveedores
 * @description Módulo principal de integración con proveedores externos
 */
module.exports = {
    buscarVuelos,           /**< Busca vuelos disponibles */
    reservarVuelo,          /**< Reserva un vuelo */
    cancelarVuelo,          /**< Cancela reserva de vuelo */
    obtenerOrigenesDestinos,/**< Obtiene orígenes/destinos disponibles */
    buscarHoteles,          /**< Busca hoteles disponibles */
    reservarHotel,          /**< Reserva un hotel */
    cancelarHotel,          /**< Cancela reserva de hotel */
    obtenerCiudades,        /**< Obtiene ciudades disponibles */
    calcularPrecioConGanancia, /**< Calcula precio con ganancia */
    buscarConfig: getConfig,    /**< Obtiene configuración de proveedor */
};