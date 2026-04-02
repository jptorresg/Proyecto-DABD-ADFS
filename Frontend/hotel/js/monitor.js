/**
 * @fileoverview Módulo de monitoreo de API para el sistema Bedly.
 * Permite visualizar los logs de peticiones realizadas a la API REST.
 */

/**
 * Inicializa el estado del monitor de API con logs de ejemplo.
 * @returns {Object} Objeto reactivo con logs y ejemplo de JSON B2B.
 */
function monitorAPI() {
    return {
        /**
         * @type {Object[]} Lista de logs de peticiones a la API.
         * @property {number} id - ID único del log.
         * @property {string} metodo - Método HTTP (GET, POST, PUT, DELETE).
         * @property {string} endpoint - Ruta del endpoint consultado.
         * @property {number} status - Código de respuesta HTTP.
         * @property {string} tiempo - Tiempo de respuesta en milisegundos.
         */
        logs: [
            { id: 1, metodo: 'GET', endpoint: '/api/habitaciones', status: 200, tiempo: '15ms' },
            { id: 2, metodo: 'POST', endpoint: '/api/reservar', status: 201, tiempo: '45ms' },
            { id: 3, metodo: 'GET', endpoint: '/api/disponibilidad', status: 404, tiempo: '5ms' }
        ],
        /**
         * Ejemplo de JSON para integración B2B con agencias de viajes.
         * @type {Object}
         */
        jsonEjemplo: {
            "habitacion_id": 101,
            "fecha_inicio": "2026-02-15",
            "huesped": "Juan Perez",
            "agencia_id": "AG-TRAVEL-01"
        }
    }
}