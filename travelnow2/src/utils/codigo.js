/**
 * @file Generador de códigos únicos para reservaciones
 * @description Módulo que proporciona una función para generar códigos únicos de reservación
 * con formato estandarizado TN-YYYYMMDD-XXXX
 */
const { v4: uuidv4 } = require('uuid');

/**
 * Genera un código único para la reservación
 * @function generarCodigoReserva
 * @description Crea un código único con el formato TN-YYYYMMDD-XXXX donde:
 * - TN: Prefijo fijo (Travel Note)
 * - YYYYMMDD: Fecha actual (año, mes, día)
 * - XXXX: Sufijo único de 6 caracteres alfanuméricos basado en UUID v4
 * @returns {string} Código único de reservación con formato TN-YYYYMMDD-XXXX
 * @example
 * // Ejemplo de retorno: "TN-20241015-4A3F2B"
 * const codigo = generarCodigoReserva();
 */
const generarCodigoReserva = () => {
    // Obtiene la fecha actual en formato YYYYMMDD
    // toISOString() retorna: YYYY-MM-DDTHH:mm:ss.sssZ
    // slice(0,10) extrae: YYYY-MM-DD
    // replace(/-/g, '') elimina los guiones: YYYYMMDD
    const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    
    // Genera un sufijo único:
    // 1. Crea UUID v4 (ej: 123e4567-e89b-12d3-a456-426614174000)
    // 2. Elimina guiones: 123e4567e89b12d3a456426614174000
    // 3. Toma primeros 6 caracteres: 123e45
    // 4. Convierte a mayúsculas: 123E45
    const sufijo = uuidv4().replace(/-/g, '').slice(0, 6).toUpperCase();
    
    // Retorna código con formato: TN-FECHA-SUFIJO
    // Ejemplo: TN-20241015-4A3F2B
    return `TN-${fecha}-${sufijo}`;
};

// Exporta la función para su uso en otros módulos
module.exports = { generarCodigoReserva };