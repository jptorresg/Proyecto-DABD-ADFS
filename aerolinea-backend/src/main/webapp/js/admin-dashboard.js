/**
 * Crea y retorna el objeto `adminDashboard`, responsable de proporcionar
 * estadísticas generales del sistema y gestionar la lógica de negocio
 * para operaciones administrativas.
 *
 * @returns {Object} Un objeto con las siguientes propiedades:
 *   <ul>
 *     <li>{@code stats}   - Objeto que contiene las estadísticas del sistema.</li>
 *     <li>{@code init}    - Método asíncrono que inicializa el objeto cargando las estadísticas.</li>
 *     <li>{@code cargarStats} - Método asíncrono que obtiene las estadísticas desde la API.</li>
 *     <li>{@code formatCurrency} - Método que formatea un valor numérico como moneda guatemalteca.</li>
 *   </ul>
 */
function adminDashboard() {

    return {

        /**
         * Objeto que almacena las estadísticas generales del sistema.
         * @type {Object}
         * @property {number} vuelosActivos        - Número de vuelos actualmente activos.
         * @property {number} reservacionesMes     - Total de reservaciones del mes actual.
         * @property {number} usuariosRegistrados  - Total de usuarios registrados.
         * @property {number} ingresosEstimados    - Ingresos estimados del mes actual.
         */
        stats: {
            vuelosActivos: 0,
            reservacionesMes: 0,
            usuariosRegistrados: 0,
            ingresosEstimados: 0
        },

        /**
         * Inicializa el objeto cargando las estadísticas del sistema.
         *
         * @returns {Promise<void>} Promesa que se resuelve cuando se han cargado las estadísticas.
         * @throws {Error} Si ocurre un error al cargar las estadísticas.
         */
        async init() {

            await this.cargarStats();

        },

        /**
         * Carga las estadísticas del sistema desde el endpoint correspondiente.
         * <p>
         * Realiza una petición HTTP GET a {@code /api/admin/stats} y asigna
         * los datos recibidos a la propiedad {@link stats}.
         * </p>
         *
         * @returns {Promise<void>} Promesa que se resuelve al completar la carga.
         * @throws {Error} Si la petición falla o la respuesta no es exitosa.
         */
        async cargarStats() {

            try {

                const response = await fetch("/api/admin/stats");

                const data = await response.json();

                if (data.success) {

                    this.stats = data.data;

                }

            } catch (error) {

                console.error("Error cargando stats:", error);

            }

        },

        /**
         * Formatea un valor numérico como moneda guatemalteca (GTQ).
         * <p>
         * Utiliza {@link Intl.NumberFormat} con configuración regional {@code es-GT}
         * y estilo {@code currency}.
         * </p>
         *
         * @param {number} value - Valor numérico a formatear.
         * @returns {string} Cadena formateada en quetzales (ej. "Q1,234.56").
         */
        formatCurrency(value) {

            return new Intl.NumberFormat("es-GT", {
                style: "currency",
                currency: "GTQ"
            }).format(value);

        }

    };

}