/**
 * @fileoverview Módulo de catálogo de habitaciones para el sistema Bedly.
 * Maneja la visualización y filtrado de habitaciones disponibles.
 */

/**
 * Inicializa el estado y datos del catálogo de habitaciones.
 * @returns {Object} Objeto reactivo con habitaciones y campo de búsqueda.
 */
function dataHabitaciones() {
    return {
        search: '',
        habitaciones: [
            { id: 1, nombre: 'Habitación Sencilla', precio: 50, img: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=400', desc: 'Confort individual.' },
            { id: 2, nombre: 'Suite Ejecutiva', precio: 120, img: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=400', desc: 'Perfecta para negocios.' },
            { id: 3, nombre: 'Habitación Doble', precio: 85, img: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=400', desc: 'Espacio para la familia.' }
        ]
    }
}

/**
 * Filtra y ordena una lista de habitaciones según criterios específicos.
 * @param {Object[]} habitaciones - Lista de habitaciones a filtrar.
 * @param {number} habitaciones[].id - ID único de la habitación.
 * @param {string} habitaciones[].nombre - Nombre de la habitación.
 * @param {number} habitaciones[].precio - Precio por noche.
 * @param {string} habitaciones[].desc - Descripción de la habitación.
 * @param {Object} criterios - Criterios de filtrado y ordenamiento.
 * @param {string} [criterios.busqueda] - Texto para buscar en nombre o descripción.
 * @param {number} [criterios.precioMax] - Precio máximo por noche.
 * @param {number} [criterios.precioMin] - Precio mínimo por noche.
 * @param {string} [criterios.orden] - Orden por precio: 'asc' o 'desc'.
 * @returns {Object[]} Lista filtrada y ordenada de habitaciones.
 * @example
 * const resultado = filtrarHabitaciones(habitaciones, { busqueda: 'suite' });
 * // Retorna solo habitaciones cuyo nombre o descripción contenga 'suite'
 */
function filtrarHabitaciones(habitaciones, criterios) {
    let resultado = [...habitaciones];

    if (criterios.busqueda && criterios.busqueda.trim() !== '') {
        const busq = criterios.busqueda.toLowerCase().trim();
        resultado = resultado.filter(h =>
            h.nombre.toLowerCase().includes(busq) ||
            h.desc.toLowerCase().includes(busq)
        );
    }

    if (criterios.precioMax && criterios.precioMax > 0) {
        resultado = resultado.filter(h => h.precio <= criterios.precioMax);
    }

    if (criterios.precioMin && criterios.precioMin > 0) {
        resultado = resultado.filter(h => h.precio >= criterios.precioMin);
    }

    if (criterios.orden === 'asc') {
        resultado.sort((a, b) => a.precio - b.precio);
    } else if (criterios.orden === 'desc') {
        resultado.sort((a, b) => b.precio - a.precio);
    }

    return resultado;
}

if (typeof module !== 'undefined') module.exports = { filtrarHabitaciones };