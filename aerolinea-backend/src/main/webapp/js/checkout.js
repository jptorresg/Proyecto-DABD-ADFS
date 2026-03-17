// ============================================================
// CHECKOUT - ALPINE.JS DATA COMPONENT
// ============================================================

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
        
        // Cálculos
        get precioVuelo() {
            return this.vueloInfo.precioBase * this.vueloInfo.numPasajeros;
        },
        
        get precioExtras() {
            let total = 0;
            if (this.extras.equipaje) total += 300;
            if (this.extras.asiento) total += 160;
            if (this.extras.comida) total += 90;
            return total;
        },
        
        get subtotal() {
            return this.precioVuelo + this.precioExtras;
        },
        
        get impuestos() {
            return Math.round(this.subtotal * 0.12);
        },
        
        get total() {
            return this.subtotal + this.impuestos;
        },

        // Inicialización
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

        // Cargar datos del vuelo
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

        // Cargar extras seleccionados
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

        // Configurar restricciones de fecha (>18 años)
        configureDateInputs() {
            const maxDate = new Date();
            maxDate.setFullYear(maxDate.getFullYear() - 18);
            this.maxBirthdate = maxDate.toISOString().split('T')[0];
        },

        // Cambiar método de pago
        changePaymentMethod(type) {
            this.paymentType = type;
        },

        // Formatear número de tarjeta
        formatCardNumber() {
            let value = this.tarjeta.numero.replace(/\s/g, '').replace(/[^0-9]/g, '');
            this.tarjeta.numero = value.match(/.{1,4}/g)?.join(' ') || value;
            this.detectCardBrand(value);
        },

        // Detectar marca de tarjeta
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

        // Formatear CVV
        formatCVV() {
            this.tarjeta.cvv = this.tarjeta.cvv.replace(/[^0-9]/g, '').substring(0, 4);
        },

        // Formatear nombre en tarjeta
        formatCardName() {
            this.tarjeta.nombre = this.tarjeta.nombre.toUpperCase();
        },

        // Validar formulario
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

        // Procesar pago
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
                    idVuelo: this.vueloInfo.id,
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

                const reservacion = result.data;
                const codigoReservacion = reservacion.codigoReservacion;

                showNotification('¡Compra confirmada exitosamente!', 'success');

                sessionStorage.setItem('lastReservation', codigoReservacion);

                setTimeout(() => {
                    window.location.href =
                        `${BASE_PATH}/views/confirmacion.html?codigo=${codigoReservacion}`;
                }, 1500);

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