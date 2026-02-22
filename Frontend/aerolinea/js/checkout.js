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
        pasajeros: [
            {
                numero: 1,
                tipo: 'Adulto',
                nombres: '',
                apellidos: '',
                fechaNacimiento: '',
                genero: '',
                pasaporte: '',
                nacionalidad: ''
            },
            {
                numero: 2,
                tipo: 'Adulto',
                nombres: '',
                apellidos: '',
                fechaNacimiento: '',
                genero: '',
                pasaporte: '',
                nacionalidad: ''
            }
        ],

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
        init() {
            // Verificar autenticación
            if (!requireAuth()) {
                return;
            }

            // Cargar datos de URL params o sessionStorage
            this.loadFlightData();
            this.loadExtras();
            this.configureDateInputs();
        },

        // Cargar datos del vuelo
        loadFlightData() {
            const urlParams = new URLSearchParams(window.location.search);
            const vueloId = urlParams.get('vueloId');
            
            if (vueloId) {
                // En producción, fetch del backend
                // const response = await fetch(`/api/vuelos/${vueloId}`);
                // this.vueloInfo = await response.json();
                
                console.log('Vuelo cargado:', vueloId);
            }

            // Cargar de sessionStorage si existe
            const stored = sessionStorage.getItem('checkoutFlight');
            if (stored) {
                try {
                    const data = JSON.parse(stored);
                    this.vueloInfo = { ...this.vueloInfo, ...data };
                } catch (e) {
                    console.error('Error parsing flight data:', e);
                }
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
                // Simular redirección a PayPal
                setTimeout(() => {
                    showNotification('Funcionalidad de PayPal próximamente', 'info');
                }, 1500);
                return;
            }

            if (!this.validateForm()) {
                return;
            }

            this.isProcessing = true;

            try {
                // Preparar datos de la reservación
                const reservacionData = {
                    idVuelo: this.vueloInfo.id || 1,
                    pasajeros: this.pasajeros,
                    emergencia: this.emergencia,
                    precioTotal: this.total,
                    metodoPago: this.paymentType,
                    tarjeta: this.paymentType === 'card' ? {
                        // NO enviar datos reales en producción - usar tokenización
                        numero: this.tarjeta.numero.substring(this.tarjeta.numero.length - 4),
                        nombre: this.tarjeta.nombre,
                        // CVV nunca se guarda
                    } : null,
                    billing: this.billing,
                    extras: this.extras
                };

                // Simular API call
                // const response = await fetch('/api/reservaciones', {
                //     method: 'POST',
                //     headers: { 'Content-Type': 'application/json' },
                //     body: JSON.stringify(reservacionData)
                // });

                // Simular respuesta exitosa
                await new Promise(resolve => setTimeout(resolve, 2000));

                const codigoReservacion = 'HC-' + Math.random().toString(36).substr(2, 6).toUpperCase();

                showNotification('¡Compra confirmada exitosamente!', 'success');

                // Guardar código de reservación
                sessionStorage.setItem('lastReservation', codigoReservacion);

                // Redirigir a confirmación
                setTimeout(() => {
                    window.location.href = `/frontend/aerolinea/views/confirmacion.html?codigo=${codigoReservacion}`;
                }, 1500);

            } catch (error) {
                console.error('Error procesando pago:', error);
                showNotification('Error al procesar el pago. Intente nuevamente.', 'error');
            } finally {
                this.isProcessing = false;
            }
        }
    };
}