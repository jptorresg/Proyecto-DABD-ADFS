// ============================================================
// CHECKOUT - ALPINE.JS DATA COMPONENT
// ============================================================

/**
 * Crea y retorna el objeto `checkoutData` para Alpine.js, responsable del proceso de
 * checkout (finalización de compra) de un vuelo.
 * <p>
 * Gestiona la carga de datos del vuelo, el formulario de pasajeros, el método de pago,
 * la validación y el envío de la reservación a la API.
 * </p>
 *
 * @returns {Object} Un objeto Alpine con propiedades y métodos para el flujo de checkout.
 */
function checkoutData() {
    return {
        // Datos del vuelo (vienen de URL params o sessionStorage)
        vueloInfo: {
            codigo: 'HC-305',
            origen: 'Guatemala City',
            origenIata: 'GUA',
            destino: 'Ciudad de México',
            destinoIata: 'MEX',
            fecha: '10 Feb 2026',
            horaSalida: '09:15',
            horaLlegada: '13:40',
            numPasajeros: 2,
            clase: 'Turista',
            tipoVuelo: 'escala',
            precioBase: 950
        },

        // Datos de pasajeros
        pasajeros: [],

        // Contacto de emergencia
        emergencia: {
            nombre: '',
            telefono: ''
        },

        // Método de pago
        paymentType: 'card',
        tarjeta: {
            numero: '',
            nombre: '',
            cvv: '',
            mes: '',
            año: '',
            marca: ''
        },

        // Dirección de cobro
        billing: {
            direccion: '',
            ciudad: '',
            estado: '',
            codigoPostal: '',
            pais: 'GT'
        },

        // Extras (vienen de detalle.html)
        extras: {
            equipaje: false,
            asiento: false,
            comida: false
        },

        // Términos
        acceptTerms: false,
        acceptNewsletter: false,

        // Estado
        isProcessing: false,
        
        /**
         * Calcula el precio total del vuelo según el número de pasajeros.
         *
         * @returns {number} Precio del vuelo (precio base * número de pasajeros).
         */
        get precioVuelo() {
            return this.vueloInfo.precioBase * this.vueloInfo.numPasajeros;
        },
        
        /**
         * Calcula el costo total de los extras seleccionados.
         *
         * @returns {number} Costo total de los extras.
         */
        get precioExtras() {
            let total = 0;
            if (this.extras.equipaje) total += 300;
            if (this.extras.asiento) total += 160;
            if (this.extras.comida) total += 90;
            return total;
        },
        
        /**
         * Calcula el subtotal del pedido (precio del vuelo + costo de los extras).
         *
         * @returns {number} Subtotal.
         */
        get subtotal() {
            return this.precioVuelo + this.precioExtras;
        },
        
        /**
         * Calcula el valor de los impuestos (12% sobre el subtotal).
         *
         * @returns {number} Impuestos.
         */
        get impuestos() {
            return Math.round(this.subtotal * 0.12);
        },
        
        /**
         * Calcula el costo total del pedido (subtotal + impuestos).
         *
         * @returns {number} Total a pagar.
         */
        get total() {
            return this.subtotal + this.impuestos;
        },

        /**
         * Inicializa el componente verificando autenticación, cargando datos del vuelo,
         * extras, configurando fechas y generando los pasajeros.
         *
         * @returns {Promise<void>}
         */
        async init() {
            // Verificar autenticación
            if (!requireAuth()) {
                return;
            }

            // Cargar datos de URL params o sessionStorage
            await this.loadFlightData();
            this.loadExtras();
            this.configureDateInputs();
            const params = new URLSearchParams(window.location.search);

            this.vueloId = params.get('vueloId');
            this.numPasajeros = params.get('pasajeros')
                ? parseInt(params.get('pasajeros'))
                : 1;

            console.log("Vuelo:", this.vueloId);
            console.log("Pasajeros:", this.numPasajeros);
            this.generarPasajeros();
        },

        /**
         * Carga los datos del vuelo desde la API usando el ID de la URL.
         *
         * @returns {Promise<void>}
         */
        async loadFlightData() {
            const params = new URLSearchParams(window.location.search);
            const vueloId = params.get('vueloId');
            const pasajeros = params.get('pasajeros');
            const totalUrl = params.get('total');

            if (!vueloId) return;

            try {
                const response = await fetch(`${API_BASE}/vuelos/${vueloId}`);
                const json = await response.json();

                if (json.success) {
                    const v = json.data;

                    const numPasajeros = pasajeros ? parseInt(pasajeros) : 1;
                    const total = totalUrl ? parseFloat(totalUrl) : 0;

                    // Si viene total por URL, lo usamos para sacar precio individual
                    const precioBaseCalculado = total && numPasajeros
                        ? Math.round(total / numPasajeros)
                        : v.precioBase;

                    this.vueloInfo = {
                        id: v.idVuelo,
                        codigo: v.codigoVuelo,
                        origen: v.origenCiudad,
                        origenIata: v.origenCodigoIata,
                        destino: v.destinoCiudad,
                        destinoIata: v.destinoCodigoIata,
                        fecha: v.fechaSalida,
                        horaSalida: v.horaSalida,
                        horaLlegada: v.horaLlegada,
                        numPasajeros: numPasajeros,
                        clase: v.tipoAsiento,
                        tipoVuelo: 'direct', // ajusta si manejas escalas
                        precioBase: precioBaseCalculado
                    };

                    this.numPasajeros = numPasajeros;

                }

            } catch (error) {
                console.error("Error cargando vuelo:", error);
            }
        },

        /**
         * Genera el array de objetos que representan a los pasajeros de la reserva actual.
         */
        generarPasajeros() {
            this.pasajeros = [];

            for (let i = 1; i <= this.numPasajeros; i++) {
                this.pasajeros.push({
                    numero: i,
                    tipo: 'Adulto', // luego puedes diferenciar niños
                    nombres: '',
                    apellidos: '',
                    fechaNacimiento: '',
                    genero: '',
                    pasaporte: '',
                    nacionalidad: ''
                });
            }
        },

        /**
         * Carga los extras seleccionados desde el sessionStorage.
         */
        loadExtras() {
            const stored = sessionStorage.getItem('selectedExtras');
            if (stored) {
                try {
                    this.extras = JSON.parse(stored);
                } catch (e) {
                    console.error('Error parsing extras:', e);
                }
            }
        },

        /**
         * Configura la fecha máxima para los campos de fecha de nacimiento (mayor de 18 años).
         */
        configureDateInputs() {
            const maxDate = new Date();
            maxDate.setFullYear(maxDate.getFullYear() - 18);
            this.maxBirthdate = maxDate.toISOString().split('T')[0];
        },

        /**
         * Cambia el método de pago seleccionado.
         *
         * @param {string} type - Tipo de pago ('card', 'paypal', etc.).
         */
        changePaymentMethod(type) {
            this.paymentType = type;
        },

        /**
         * Formatea el número de tarjeta agregando espacios cada 4 dígitos y detecta la marca.
         */
        formatCardNumber() {
            let value = this.tarjeta.numero.replace(/\s/g, '').replace(/[^0-9]/g, '');
            this.tarjeta.numero = value.match(/.{1,4}/g)?.join(' ') || value;
            this.detectCardBrand(value);
        },

        /**
         * Detecta la marca de la tarjeta según el número.
         *
         * @param {string} number - Número de tarjeta sin espacios.
         */
        detectCardBrand(number) {
            const patterns = {
                visa: /^4/,
                mastercard: /^5[1-5]/,
                amex: /^3[47]/,
                discover: /^6(?:011|5)/
            };

            const clean = number.replace(/\s/g, '');
            for (const [brand, pattern] of Object.entries(patterns)) {
                if (pattern.test(clean)) {
                    this.tarjeta.marca = brand.charAt(0).toUpperCase() + brand.slice(1);
                    return;
                }
            }
            this.tarjeta.marca = '';
        },

        /**
         * Formatea el CVV permitiendo solo dígitos y limitando a 4 caracteres.
         */
        formatCVV() {
            this.tarjeta.cvv = this.tarjeta.cvv.replace(/[^0-9]/g, '').substring(0, 4);
        },

        /**
         * Formatea el nombre en la tarjeta a mayúsculas.
         */
        formatCardName() {
            this.tarjeta.nombre = this.tarjeta.nombre.toUpperCase();
        },

        /**
         * Valida el formulario completo antes de procesar el pago.
         *
         * @returns {boolean} {@code true} si todos los campos requeridos son válidos.
         */
        validateForm() {
            // Validar pasajeros
            for (const p of this.pasajeros) {
                if (!p.nombres || !p.apellidos || !p.fechaNacimiento || 
                    !p.genero || !p.pasaporte || !p.nacionalidad) {
                    showNotification('Por favor complete la información de todos los pasajeros', 'error');
                    return false;
                }
            }

            // Validar emergencia
            if (!this.emergencia.nombre || !this.emergencia.telefono) {
                showNotification('Por favor complete el contacto de emergencia', 'error');
                return false;
            }

            // Validar pago (solo si es tarjeta)
            if (this.paymentType === 'card') {
                if (!this.tarjeta.numero || !this.tarjeta.nombre || 
                    !this.tarjeta.cvv || !this.tarjeta.mes || !this.tarjeta.año) {
                    showNotification('Por favor complete los datos de la tarjeta', 'error');
                    return false;
                }

                // Validar número de tarjeta (16 dígitos)
                const cardClean = this.tarjeta.numero.replace(/\s/g, '');
                if (cardClean.length !== 16) {
                    showNotification('El número de tarjeta debe tener 16 dígitos', 'error');
                    return false;
                }

                // Validar CVV
                if (this.tarjeta.cvv.length < 3) {
                    showNotification('El CVV debe tener 3 o 4 dígitos', 'error');
                    return false;
                }

                // Validar fecha de expiración
                const now = new Date();
                const expiry = new Date(parseInt(this.tarjeta.año), parseInt(this.tarjeta.mes) - 1);
                if (expiry < now) {
                    showNotification('La tarjeta está vencida', 'error');
                    return false;
                }
            }

            // Validar dirección
            if (!this.billing.direccion || !this.billing.ciudad || 
                !this.billing.estado || !this.billing.codigoPostal || !this.billing.pais) {
                showNotification('Por favor complete la dirección de cobro', 'error');
                return false;
            }

            // Validar términos
            if (!this.acceptTerms) {
                showNotification('Debe aceptar los Términos y Condiciones', 'error');
                return false;
            }

            return true;
        },

        generarPDF(data) {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            const { reservacion, vuelo, pasajeros, total } = data;

            // 🎨 Colores (tu paleta adaptada a RGB)
            const primaryBlue = [74, 95, 127];
            const darkGray = [73, 80, 87];
            const lightGray = [233, 236, 239];
            const success = [40, 167, 69];

            // =========================
            // HEADER
            // =========================
            doc.setFillColor(...primaryBlue);
            doc.rect(0, 0, 210, 30, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(16);
            doc.text("AEROLÍNEAS HALCÓN", 20, 18);

            // =========================
            // INFO RESERVA
            // =========================
            doc.setTextColor(...darkGray);
            doc.setFontSize(11);

            doc.text(`Código: ${reservacion.codigoReservacion}`, 20, 40);

            doc.setTextColor(...success);
            doc.text(`Estado: ${reservacion.estado}`, 140, 40);

            // Línea separadora
            doc.setDrawColor(...lightGray);
            doc.line(20, 45, 190, 45);

            // =========================
            // VUELO
            // =========================
            doc.setTextColor(...primaryBlue);
            doc.setFontSize(13);
            doc.text("DETALLE DEL VUELO", 20, 55);

            doc.setTextColor(...darkGray);
            doc.setFontSize(11);

            doc.text(`${vuelo.codigo} | ${vuelo.origenIata} -> ${vuelo.destinoIata}`, 20, 65);
            doc.text(`Salida: ${vuelo.horaSalida}`, 20, 75);
            doc.text(`Llegada: ${vuelo.horaLlegada}`, 20, 85);

            // Línea
            doc.line(20, 90, 190, 90);

            // =========================
            // PASAJEROS
            // =========================
            doc.setTextColor(...primaryBlue);
            doc.setFontSize(13);
            doc.text("PASAJEROS", 20, 100);

            doc.setTextColor(...darkGray);
            doc.setFontSize(11);

            let y = 110;

            pasajeros.forEach((p, i) => {
                doc.text(`${i + 1}. ${p.nombres} ${p.apellidos}`, 20, y);
                doc.setTextColor(120);
                doc.text(`Pasaporte: ${p.pasaporte}`, 25, y + 8);
                doc.setTextColor(...darkGray);
                y += 18;
            });

            // Línea
            doc.line(20, y, 190, y);

            // =========================
            // TOTAL
            // =========================
            y += 15;

            doc.setFontSize(12);
            doc.setTextColor(...darkGray);
            doc.text("TOTAL PAGADO:", 20, y);

            doc.setFontSize(16);
            doc.setTextColor(...primaryBlue);
            doc.text(`Q${total}`, 150, y);

            // =========================
            // FOOTER
            // =========================
            doc.setFontSize(10);
            doc.setTextColor(150);
            doc.text("Gracias por su compra. ¡Buen viaje! ✈", 20, 280);

            // Guardar
            doc.save(`Reservacion_${reservacion.codigoReservacion}.pdf`);
        },

        /**
         * Procesa el pago y crea la reservación en el sistema.
         * <p>
         * Valida el formulario, construye el payload y lo envía a {@code /api/reservaciones}.
         * Si la operación es exitosa, redirige a la página de confirmación.
         * </p>
         *
         * @returns {Promise<void>}
         */
        async procesarPago() {

            if (this.paymentType === 'paypal') {
                showNotification('Redirigiendo a PayPal...', 'info');
                return;
            }

            if (!this.validateForm()) {
                return;
            }

            this.isProcessing = true;

            try {

                const reservacionData = {
                    idVuelo: this.vueloId,
                    metodoPago: this.paymentType,
                    pasajeros: this.pasajeros.map(p => ({
                        nombres: p.nombres,
                        apellidos: p.apellidos,
                        fechaNacimiento: p.fechaNacimiento,
                        idNacionalidad: parseInt(p.nacionalidad) || 83,
                        numPasaporte: p.pasaporte
                    }))
                };

                const session = getUserSession();
                console.log("Reservacion enviada:", JSON.stringify(reservacionData, null, 2));
                const response = await fetch(`${API_BASE}/reservaciones`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-usuario-id': session.idUsuario
                    },
                    body: JSON.stringify(reservacionData)
                });

                const text = await response.text();
                console.log("Respuesta cruda backend:", text);
                const result = JSON.parse(text);

                if (!result.success) {
                    throw new Error(result.message);
                }

                const reservacion = result.data[0];
                const codigoReservacion = reservacion.codigoReservacion;

                showNotification('¡Compra confirmada exitosamente!', 'success');

                this.generarPDF({
                    reservacion,
                    vuelo: this.vueloInfo,
                    pasajeros: this.pasajeros,
                    total: this.total
                });

                setTimeout(() => {
                    window.location.href =
                        `${BASE_PATH}/views/perfil/reservaciones.html`;
                }, 2000);

            } catch (error) {

                console.error('Error procesando pago:', error);

                showNotification(
                    error.message || 'Error al procesar el pago.',
                    'error'
                );

            } finally {
                this.isProcessing = false;
            }
        }
    };
}