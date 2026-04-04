//Controla la integración con Aerolíneas y Hoteles
//Información estraída de los controllers
const axios = require('axios');
const db = require('../config/db');

//Configuración del proveedor desde la base de datos
const getConfig = async (idProveedor) => {
    const [rows] = await db.query(
        'SELECT * FROM proveedor WHERE id_proveedor = ? AND estado = "activo"',
        [idProveedor]
    );
    if (!rows.length) throw new Error('Proveedor no encontrado o inactivo');
    return rows[0];
};

//Cliente HTTP para Aerolínea con autenticación basica (usuario/contraseña en Base64)
const clienteAerolinea = (prov) => axios.create({
    baseURL: prov.endpoint_api,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(
            `${prov.api_usuario}:${prov.api_password}`
        ).toString('base64'),
    },
});

//Cliente HTTP para Hotel con autenticación basica (usuario/contraseña en Base64)
const clienteHotel = (prov) => axios.create({
    baseURL: prov.endpoint_api,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${prov.api_password}`,
    },
});

//--------------------------------------------------------
//-------------- Aerolinea --------------
//--------------------------------------------------------
// Aerolínea - VueloController.java
const buscarVuelos = async (idProveedor, params) => {
    const prov = await getConfig(idProveedor);
    const client = clienteAerolinea(prov);

    //Mapea nombres de la aerolinea
    const queryParams = {
        origen: params.origen,
        destino: params.destino,
        fechaSalida: params.fecha_salida,
        tipoAsiento: params.tipo_asiento,
    };

    const { data } = await client.get('/api/vuelos', { params: queryParams });

    //Aerolinea devuelve datos de los vuelos
    const vuelos = data.data || data || [];
    return vuelos.map(v => ({
        id_vuelo: v.idVuelo || v.id,
        codigo_vuelo: v.codigoVuelo,
        origen_ciudad: v.origenCiudad,
        oriten_iata: v.origenCodigoIata,
        destino_ciudad: v.destinoCiudad,
        fecha_salida: v.fechaSalida,
        hora_salida: v.horaSalida,
        fecha_llegada: v.fechaLlegada,
        hora_llegada: v.horaLlegada,
        tipo_asiento: v.tipoAsiento,
        asientos_disponibles: v.asientosDisponibles,
        precio_proveedor: parseFloat(v.precioBase),
        precio_agencia: calcularPrecioConGanancia(v.precioBase, prov.porcentaje_ganancia),
        porcentaje_ganancia: prov.porcentaje_ganancia,
        nombre_proveedor: prov.nombre,
        id_proveedor: prov.id_proveedor,
        tipo: 'vuelo',
    }));
};

//Aerolínea - ReservacionController.java
const reservarVuelo = async (idProveedor, payload) => {
    const prov = await getConfig(idProveedor);
    const client = clienteAerolinea(prov);
    const body = {
        idVuelo: payload.id_vuelo,
        metodoPago: payload.metodo_pago || 'tarjeta',
        pasajeros: payload.pasajeros.map(p => ({
            nombres: p.nombres,
            apellidos: p.apellidos,
            fechaNacimiento: p.fecha_nacimiento,
            idNacionalidad: p.id_nacionalidad,
            numPasaporte: p.num_pasaporte,
        })),
    };
    const { data } = await client.post('/api/reservaciones', body);
    return data;
};

const obtenerOrigenesDestinos = async (idProveedor) => {
    const prov = await getConfig(idProveedor);
    const client = clienteAerolinea(prov);
    const { data } = await client.get('/api/paises');
    const paises = data.data || data || [];
    const lista = paises.map(p => ({
        id: p.id,
        nombre: p.name,
        codigo: p.alfa2,
        alfa3: p.alfa3,
    }));
    return { origenes: lista, destinos: lista };
};

//--------------------------------------------------------
//-------------- Hotel --------------
//--------------------------------------------------------
// Hotel - Disponibilidad - B2BController.cs
const buscarHoteles = async (idProveedor, params) => {
    const prov = await getConfig(idProveedor);
    const client = clienteHotel(prov);

    const queryParams = {
        checkIn: params.fecha_checkin,
        checkOut: params.fecha_checkout,
        capacidad: params.num_huespedes || 1,
    };

    const { data } = await client.get('/api/b2b/disponibilidad', { params: queryParams });

    const habitaciones = data.data?.habitaciones || data.habitaciones || [];
    return habitaciones.map(h => ({
        id_habitacion: h.idHabitacion || h.IdHabitacion,
        num_habitacion: h.numHabitacion || h.NumHabitacion,
        tipo_habitacion: h.tipoHabitacion || h.TipoHabitacion,
        nombre_hotel: h.nombreHotel || h.NombreHoltel,
        capacidad_max: h.capacidadMax || h.CapacidadMax,
        precio_noche_proveedor: parseFloat(h.precioNoche || h.PrecioNoche),
        precio_noche_agencia: calcularPrecioConGanancia(h.precioNoche || h.PrecioNoche, prov.porcentaje_ganancia),
        amenidades: h.amenidades || [],
        estado: h.estado || h.Estado,
        porcentaje_ganancia: prov.porcentaje_ganancia,
        nombre_proveedor: prov.nombre,
        id_proveedor: prov.id_proveedor,
        tipo: 'hotel',
    }));
};

// Hotel - Reservacion - B2BController.cs
const reservarHotel = async (idProveedor, payload) => {
    const prov = await getConfig(idProveedor);
    const client = clienteHotel(prov);

    const body = {
        IdHabitacion: payload.id_habitacion,
        FechaCheckIn: payload.fecha_checkin,
        FechaCheckOut: payload.fecha_checkout,
        NumHuespedes: payload.num_huespedes,
        IdUsuario: payload.id_usuario_externo || 1,
        MetodoPago: payload.metodo_pago || 'transferencia',
        NotasEspeciales: payload.notas || '',
    };
    const { data } = await client.post('/api/b2b/reservaciones', body);
    return data;
}; 

// Hotel - Cancelacion - B2BController.cs
const cancelarHotel = async (idProveedor, idReservacionProveedor) => {
    const prov = await getConfig(idProveedor);
    const client = clienteHotel(prov);
    const { data } = await client.put(`/api/b2b/reservas/${idReservacionProveedor}/cancelar`);
    return data;
};

//Hotel - Ciudades
const obtenerCiudades = async (idProveedor) => {
    const prov = await getConfig(idProveedor);
    const client = clienteHotel(prov);
    const { data } = await client.get('/api/habitaciones');
    const habitaciones = data.data || data || [];
    const ciudades = [...new Set(habitaciones.map(h => h.ciudad || h.Ciudad).filter(Boolean))];
    return { ciudades: ciudades.map(c => ({ nombre: c })) };
};

// Precio Ganancia --------
const calcularPrecioConGanancia = (precioBase, porcentaje) => {
    const base = parseFloat(precioBase) || 0;
    const pct = parseFloat(porcentaje) || 0;
    return parseFloat((base * (1 + pct / 100))).toFixed(2);
};

module.exports = {
    buscarVuelos,
    buscarHoteles,
    reservarVuelo,
    reservarHotel,
    cancelarHotel,
    obtenerOrigenesDestinos,
    obtenerCiudades,
    calcularPrecioConGanancia,
};

module.exports.buscarConfig = getConfig;