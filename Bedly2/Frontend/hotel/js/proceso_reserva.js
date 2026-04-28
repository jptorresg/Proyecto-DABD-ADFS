/**
 * @fileoverview Módulo de proceso de reserva para el sistema Bedly.
 * Maneja el flujo de reservación y validación de datos del cliente.
 */

/**
 * Inicializa el estado y lógica del proceso de reserva.
 * @returns {Object} Objeto reactivo con datos y métodos de reserva.
 */
function procesoReserva() {
    return {
        step: 1,
        datosCliente: { nombre: '', email: '', nit: '' },
        reserva: { 
            habitacion: 'Suite Ejecutiva', 
            precioNoche: 120, 
            noches: 1 
        },
        /**
         * Calcula el precio total de la reserva.
         * @returns {number} Precio total (precio por noche × número de noches).
         */
        get total() {
            return this.reserva.precioNoche * this.reserva.noches;
        },
        /**
         * Confirma y envía la reserva al backend.
         * Redirige a la página de confirmación al finalizar.
         */
        confirmar() {
            alert('Enviando reserva al sistema de Hoteles...');
            window.location.href = 'confirmacion.html';
        }
    }
}

/**
 * Valida todos los campos necesarios para crear una reservación.
 * @param {Object} datos - Datos de la reservación a validar.
 * @param {string} datos.nombre - Nombre completo del cliente.
 * @param {string} datos.email - Correo electrónico del cliente.
 * @param {number} datos.noches - Número de noches de la estancia.
 * @param {number} datos.precioNoche - Precio por noche de la habitación.
 * @param {string} datos.estado - Estado actual de la habitación.
 * @returns {Object} Resultado de la validación.
 * @returns {boolean} resultado.valido - Indica si la reservación es válida.
 * @returns {string[]} resultado.errores - Lista de errores encontrados.
 * @returns {number} resultado.total - Precio total calculado si es válida, 0 si no.
 * @example
 * const resultado = validarReserva({
 *   nombre: 'Juan Perez',
 *   email: 'juan@email.com',
 *   noches: 3,
 *   precioNoche: 120,
 *   estado: 'Disponible'
 * });
 * // resultado.valido === true
 * // resultado.total === 360
 */
function validarReserva(datos) {
    const errores = [];

    if (!datos.nombre || datos.nombre.trim() === '') {
        errores.push('El nombre del cliente es obligatorio');
    } else if (datos.nombre.trim().length < 3) {
        errores.push('El nombre debe tener al menos 3 caracteres');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!datos.email || datos.email.trim() === '') {
        errores.push('El email es obligatorio');
    } else if (!emailRegex.test(datos.email)) {
        errores.push('El formato del email no es válido');
    }

    if (!datos.noches || datos.noches <= 0) {
        errores.push('El número de noches debe ser mayor a 0');
    } else if (!Number.isInteger(datos.noches)) {
        errores.push('El número de noches debe ser un número entero');
    }

    if (!datos.precioNoche || datos.precioNoche <= 0) {
        errores.push('El precio por noche debe ser mayor a 0');
    }

    if (!datos.estado || datos.estado !== 'Disponible') {
        errores.push('La habitación no está disponible');
    }

    return {
        valido: errores.length === 0,
        errores: errores,
        total: errores.length === 0 ? datos.precioNoche * datos.noches : 0
    };
}

if (typeof module !== 'undefined') module.exports = { validarReserva };