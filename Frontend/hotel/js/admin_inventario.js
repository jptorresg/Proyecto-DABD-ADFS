/**
 * @fileoverview Módulo de gestión de inventario para administradores de Bedly.
 * Permite crear, listar y eliminar habitaciones del inventario hotelero.
 */

/**
 * Inicializa el estado y lógica del inventario de habitaciones.
 * @returns {Object} Objeto reactivo con habitaciones y métodos de gestión.
 */
function gestionInventario() {
    return {
        /** @type {Object[]} Lista de habitaciones en el inventario. */
        habitaciones: [
            { id: 101, tipo: 'Suite', precio: 150, estado: 'Disponible' },
            { id: 102, tipo: 'Doble', precio: 85, estado: 'Ocupada' },
            { id: 103, tipo: 'Sencilla', precio: 50, estado: 'Mantenimiento' }
        ],
        /** @type {Object} Datos de la nueva habitación a agregar. */
        nuevaHab: { id: '', tipo: '', precio: '', estado: 'Disponible' },
        /**
         * Agrega una nueva habitación al inventario y resetea el formulario.
         */
        agregarHabitacion() {
            this.habitaciones.push({...this.nuevaHab});
            this.nuevaHab = { id: '', tipo: '', precio: '', estado: 'Disponible' };
        },
        /**
         * Elimina una habitación del inventario por su ID.
         * @param {number} id - ID de la habitación a eliminar.
         */
        eliminar(id) {
            this.habitaciones = this.habitaciones.filter(h => h.id !== id);
        }
    }
}
