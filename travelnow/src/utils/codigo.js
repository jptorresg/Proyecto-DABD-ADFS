//Genera el código único para la reservación
const { v4: uuidv4 } = require('uuid');

const generarCodigoReserva = () => {
    //Formato a usar es: TN-YYYYMMDD-XXXX
    const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const sufijo = uuidv4().replace(/-/g, '').slice(0, 6).toUpperCase();
    return `TN-${fecha}-${sufijo}`;
};

module.exports = { generarCodigoReserva };