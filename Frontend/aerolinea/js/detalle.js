// ============================================================
// DETALLE DE VUELO - ALPINE.JS DATA COMPONENT
// ============================================================

function detalleData() {
    return {
        // Estado
        vueloId: null,
        vuelo: {},
        comentarios: [],
        selectedRating: 0,
        nuevoComentario: '',
        precioTotal: 1900,
        extras: {
            equipaje: false,
            asiento: false,
            comida: false
        },
        isLoading: true,

        // Inicialización
        async init() {
            // Obtener ID del vuelo de la URL
            const urlParams = new URLSearchParams(window.location.search);
            this.vueloId = urlParams.get('id') || '1';
            
            await this.fetchVueloDetalle();
            await this.fetchComentarios();
            this.renderStarsInElements();
        },

        // Fetch datos del vuelo
        async fetchVueloDetalle() {
            try {
                // Simular API call (reemplazar con endpoint real)
                // const response = await fetch(`/api/vuelos/${this.vueloId}`);
                // this.vuelo = await response.json();
                
                // Datos de ejemplo
                this.vuelo = {
                    id: 1,
                    codigo: 'HC-305',
                    origen: 'Guatemala City',
                    codigoIataOrigen: 'GUA',
                    destino: 'Ciudad de México',
                    codigoIataDestino: 'MEX',
                    fechaSalida: '2026-02-10',
                    horaSalida: '09:15',
                    fechaLlegada: '2026-02-10',
                    horaLlegada: '13:40',
                    duracion: '4h 25m',
                    tipoAsiento: 'Turista',
                    precioBase: 950,
                    rating: 4.5,
                    totalComentarios: 187,
                    tipoVuelo: 'escala',
                    escala: {
                        ciudad: 'Houston',
                        codigo: 'IAH',
                        llegada: '11:00',
                        salida: '12:10',
                        duracion: '1h 10m'
                    }
                };
            } catch (error) {
                console.error('Error fetching vuelo:', error);
                showNotification('Error al cargar el vuelo', 'error');
            } finally {
                this.isLoading = false;
            }
        },

        // Fetch comentarios
        async fetchComentarios() {
            try {
                // const response = await fetch(`/api/vuelos/${this.vueloId}/comentarios`);
                // this.comentarios = await response.json();
                
                // Datos de ejemplo (estructura recursiva)
                this.comentarios = [
                    {
                        id: 1,
                        autor: 'Carlos M.',
                        avatar: 'CM',
                        color: '#4A5F7F',
                        fecha: '28 Ene 2026',
                        rating: 5,
                        likes: 24,
                        texto: 'Excelente experiencia en todo momento.',
                        respuestas: [
                            {
                                id: 11,
                                autor: 'Laura P.',
                                avatar: 'LP',
                                color: '#5A7299',
                                fecha: '28 Ene 2026',
                                likes: 8,
                                texto: '¡Genial! Yo también tuve buena experiencia.',
                                respuestas: []
                            }
                        ]
                    }
                ];
            } catch (error) {
                console.error('Error fetching comentarios:', error);
            }
        },

        // Renderizar estrellas en elementos fijos
        renderStarsInElements() {
            this.$nextTick(() => {
                const heroStars = document.getElementById('heroStars');
                const summaryStars = document.getElementById('summaryStars');
                
                if (heroStars) heroStars.innerHTML = this.renderStars(this.vuelo.rating);
                if (summaryStars) summaryStars.innerHTML = this.renderStars(this.vuelo.rating);
            });
        },

        // Helper: renderizar estrellas
        renderStars(rating) {
            let html = '';
            for (let i = 1; i <= 5; i++) {
                if (i <= Math.floor(rating)) {
                    html += '<i class="fas fa-star"></i>';
                } else if (rating - Math.floor(rating) >= 0.5 && i === Math.floor(rating) + 1) {
                    html += '<i class="fas fa-star-half-alt"></i>';
                } else {
                    html += '<i class="far fa-star"></i>';
                }
            }
            return html;
        },

        // Calificación de estrellas (nuevo comentario)
        setRating(stars) {
            this.selectedRating = stars;
        },

        // Publicar comentario
        async publicarComentario() {
            if (!this.nuevoComentario.trim()) {
                showNotification('Por favor escribe un comentario', 'warning');
                return;
            }

            if (!this.selectedRating) {
                showNotification('Por favor selecciona una calificación', 'warning');
                return;
            }

            // Verificar sesión
            const session = getUserSession();
            if (!session) {
                showNotification('Debes iniciar sesión para comentar', 'error');
                window.location.href = '/frontend/aerolinea/views/login.html';
                return;
            }

            try {
                // Simular publicación
                const nuevoComentarioObj = {
                    id: Date.now(),
                    autor: session.nombres || 'Usuario',
                    avatar: session.nombres?.charAt(0) || 'U',
                    color: '#4A5F7F',
                    fecha: new Date().toLocaleDateString('es-GT'),
                    rating: this.selectedRating,
                    likes: 0,
                    texto: this.nuevoComentario,
                    respuestas: []
                };

                this.comentarios.unshift(nuevoComentarioObj);
                this.nuevoComentario = '';
                this.selectedRating = 0;

                showNotification('Comentario publicado exitosamente', 'success');
            } catch (error) {
                console.error('Error publicando comentario:', error);
                showNotification('Error al publicar comentario', 'error');
            }
        },

        // Toggle like en comentario
        toggleLike(comentario) {
            if (!comentario.liked) {
                comentario.likes++;
                comentario.liked = true;
            } else {
                comentario.likes--;
                comentario.liked = false;
            }
        },

        // Recalcular precio total
        recalcularTotal() {
            let total = this.vuelo.precioBase * 2; // 2 pasajeros

            if (this.extras.equipaje) total += 300;
            if (this.extras.asiento) total += 160;
            if (this.extras.comida) total += 90;

            this.precioTotal = total;
        },

        // Proceder a checkout
        procederCompra() {
            window.location.href = `/frontend/aerolinea/views/checkout.html?vueloId=${this.vueloId}&total=${this.precioTotal}`;
        }
    };
}