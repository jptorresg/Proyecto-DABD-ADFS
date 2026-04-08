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
        comentarioActivo: null,
        respuestaTexto: '',
        precioTotal: 0,
        extras: {
            equipaje: false,
            asiento: false,
            comida: false
        },
        isLoading: true,
        pasajeros: 1,
        sortActual: 'recent',
        comentariosOriginales: [],
        distribucionRatings: {
            5: 0,
            4: 0,
            3: 0,
            2: 0,
            1: 0
        },

        // Inicialización
        async init() {
            const urlParams = new URLSearchParams(window.location.search);

            this.vueloId = urlParams.get('id') || '1';

            const pasajerosParam = urlParams.get('pasajeros');
            this.pasajeros = pasajerosParam ? parseInt(pasajerosParam) : 1;

            await this.fetchVueloDetalle();
            await this.fetchComentarios();

            this.recalcularTotal(); // 👈 IMPORTANTE
        },

        // Fetch datos del vuelo
        async fetchVueloDetalle() {
            try {
                const response = await fetch(`${API_BASE}/vuelos/${this.vueloId}`);
                const result = await response.json();

                if (!result.success) {
                    throw new Error(result.message);
                }

                const data = result.data;
                const tieneEscala = !!data.escala;

                // Mapear estructura backend → frontend
                this.vuelo = {
                    id: data.idVuelo,
                    codigo: data.codigoVuelo,
                    origen: data.origenCiudad,
                    codigoIataOrigen: data.origenCodigoIata,
                    destino: data.destinoCiudad,
                    codigoIataDestino: data.destinoCodigoIata,
                    fechaSalida: data.fechaSalida,
                    horaSalida: data.horaSalida,
                    fechaLlegada: data.fechaLlegada,
                    horaLlegada: data.horaLlegada,
                    duracion: this.calcularDuracion(data.horaSalida, data.horaLlegada),
                    tipoAsiento: data.tipoAsiento,
                    precioBase: data.precioBase,
                    rating: 0, // temporal
                    totalComentarios: 0, // temporal
                    tipoVuelo: (data.escalas && data.escalas.length > 0) ? 'escala' : 'direct',
                    escalas:   data.escalas || []
                };

            } catch (error) {
                console.error('Error fetching vuelo:', error);
                showNotification('Error al cargar el vuelo', 'error');
            } finally {
                this.isLoading = false;
            }
        },

        calcularDuracion(salida, llegada) {
            const [h1, m1] = salida.split(':').map(Number);
            const [h2, m2] = llegada.split(':').map(Number);

            const minutosSalida = h1 * 60 + m1;
            const minutosLlegada = h2 * 60 + m2;

            const diff = minutosLlegada - minutosSalida;

            const horas = Math.floor(diff / 60);
            const minutos = diff % 60;

            return `${horas}h ${minutos}m`;
        },

        calcularDistribucion() {

            // Resetear
            this.distribucionRatings = {5:0,4:0,3:0,2:0,1:0};

            let total = 0;

            // Solo comentarios raíz
            this.comentariosOriginales.forEach(c => {
                if (c.rating && c.rating >= 1 && c.rating <= 5) {
                    this.distribucionRatings[c.rating]++;
                    total++;
                }
            });

            // Convertir a porcentajes
            if (total > 0) {
                for (let i = 1; i <= 5; i++) {
                    this.distribucionRatings[i] =
                        Math.round((this.distribucionRatings[i] / total) * 100);
                }
            }
        },

        // Fetch comentarios
        async fetchComentarios() {
            try {
                const response = await fetch(`${API_BASE}/comentarios/${this.vueloId}`);
                const result = await response.json();

                if (!result.success) {
                    throw new Error(result.message);
                }

                const data = result.data;

                // Actualizar promedio y total en el vuelo
                this.vuelo.rating = data.promedio;
                this.vuelo.totalComentarios = data.totalRatings;

                // Mapear comentarios recursivamente
                const mapComentario = (comentario) => {
                    return {
                        id: comentario.idComentario,
                        autor: `Usuario ${comentario.idUsuario}`, // temporal hasta tener nombres reales
                        avatar: `U${comentario.idUsuario}`,
                        color: '#4A5F7F',
                        fechaOriginal: comentario.fechaCreacion,
                        fecha: new Date(comentario.fechaCreacion).toLocaleDateString('es-GT'),
                        rating: comentario.rating || 0,
                        likes: 0,
                        texto: comentario.textoComentario,
                        respuestas: comentario.respuestas
                            ? comentario.respuestas.map(mapComentario)
                            : []
                    };
                };

                this.comentariosOriginales = data.comentarios.map(mapComentario);
                this.calcularDistribucion();
                this.ordenarComentarios();

                // Actualizar estrellas visuales
                this.renderStarsInElements();

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

            const session = getUserSession();
            if (!session) {
                showNotification('Debes iniciar sesión para comentar', 'error');
                return;
            }

            if (comentario.getIdComentarioPadre() != null) {
                comentario.setRating(null);
            }

            try {

                const payload = {
                    idVuelo: this.vueloId,
                    idUsuario: session.idUsuario,
                    rating: this.selectedRating,
                    textoComentario: this.nuevoComentario
                };

                const response = await fetch(`${API_BASE}/comentarios`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();

                if (!result.success) {
                    throw new Error(result.message);
                }

                // Recargar comentarios desde BD
                await this.fetchComentarios();

                this.nuevoComentario = '';
                this.selectedRating = 0;

                showNotification('Comentario publicado exitosamente', 'success');

            } catch (error) {
                console.error('Error publicando comentario:', error);
                showNotification('Error al publicar comentario', 'error');
            }
        },

        async responderComentario(idComentarioPadre) {

            if (!this.respuestaTexto.trim()) {
                showNotification('Escribe una respuesta', 'warning');
                return;
            }

            const session = getUserSession();
            if (!session) {
                showNotification('Debes iniciar sesión', 'error');
                return;
            }

            try {

                const payload = {
                    idVuelo: this.vueloId,
                    idUsuario: session.idUsuario,
                    idComentarioPadre: idComentarioPadre,
                    textoComentario: this.respuestaTexto
                };

                const response = await fetch(`${API_BASE}/comentarios`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();

                if (!result.success) {
                    throw new Error(result.message);
                }

                this.respuestaTexto = '';
                this.comentarioActivo = null;

                await this.fetchComentarios();

                showNotification('Respuesta publicada', 'success');

            } catch (error) {
                console.error(error);
                showNotification('Error al responder', 'error');
            }
        },

        ordenarComentarios() {

            // Clonar array para no mutar el original
            let copia = [...this.comentariosOriginales];

            switch (this.sortActual) {

                case 'rating':
                    copia.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                    break;

                case 'likes':
                    copia.sort((a, b) => (b.likes || 0) - (a.likes || 0));
                    break;

                case 'recent':
                default:
                    copia.sort((a, b) => 
                        new Date(b.fechaOriginal) - new Date(a.fechaOriginal)
                    );
                    break;
            }

            this.comentarios = copia;
        },

        cambiarOrden(tipo) {
            this.sortActual = tipo;
            this.ordenarComentarios();
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

            if (this.sortActual === 'likes') {
                this.ordenarComentarios();
            }
        },

        // Recalcular precio total
        recalcularTotal() {
            if (!this.vuelo.precioBase) return;

            let total = this.vuelo.precioBase * this.pasajeros;

            if (this.extras.equipaje) total += 300 * this.pasajeros;
            if (this.extras.asiento) total += 160 * this.pasajeros;
            if (this.extras.comida) total += 90 * this.pasajeros;

            this.precioTotal = total;
        },

        // Proceder a checkout
        procederCompra() {
            const pasajeros = this.pasajeros || 1;

            window.location.href =
                `${BASE_PATH}/views/checkout.html?vueloId=${this.vueloId}&pasajeros=${pasajeros}&total=${this.precioTotal}`;
        }
    };
}