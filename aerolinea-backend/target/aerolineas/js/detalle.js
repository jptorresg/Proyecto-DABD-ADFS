// ============================================================
// DETALLE DE VUELO - ALPINE.JS DATA COMPONENT
// ============================================================

/**
 * Crea y retorna el objeto `detalleData` para Alpine.js, responsable de la vista
 * de detalle de un vuelo.
 * <p>
 * Carga la información completa del vuelo, gestiona los comentarios y valoraciones,
 * y permite al usuario seleccionar extras y proceder al checkout.
 * </p>
 *
 * @returns {Object} Un objeto Alpine con propiedades y métodos para la vista de detalle.
 */
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

        /**
         * Inicializa el componente extrayendo los parámetros de la URL,
         * cargando el detalle del vuelo y los comentarios, y calculando el total.
         *
         * @returns {Promise<void>}
         */
        async init() {
            const urlParams = new URLSearchParams(window.location.search);

            this.vueloId = urlParams.get('id') || '1';

            const pasajerosParam = urlParams.get('pasajeros');
            this.pasajeros = pasajerosParam ? parseInt(pasajerosParam) : 1;

            await this.fetchVueloDetalle();
            await this.fetchComentarios();

            this.recalcularTotal(); // 👈 IMPORTANTE
        },

        /**
         * Obtiene los detalles del vuelo desde la API.
         *
         * @returns {Promise<void>}
         */
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

        /**
         * Calcula la duración en horas y minutos entre dos horas en formato "HH:mm".
         * <p>
         * Si la hora de llegada es menor que la de salida, se asume que corresponde al día siguiente.
         * </p>
         *
         * @param {string} salida - Hora de salida (formato "HH:mm").
         * @param {string} llegada - Hora de llegada (formato "HH:mm").
         * @returns {string} Duración en formato "Xh Ym".
         */
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

        /**
         * Calcula la distribución porcentual de las valoraciones (ratings) del vuelo.
         * <p>
         * Recorre los comentarios raíz (aquellos con rating) y cuenta cuántos hay de cada
         * estrella (1-5), luego los convierte a porcentajes sobre el total.
         * </p>
         */
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

        /**
         * Obtiene los comentarios del vuelo desde la API.
         * <p>
         * Mapea la respuesta jerárquica y actualiza el promedio de rating y el total de comentarios.
         * </p>
         *
         * @returns {Promise<void>}
         */
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

        /**
         * Renderiza las estrellas del rating en elementos HTML fijos (hero y resumen).
         */
        renderStarsInElements() {
            this.$nextTick(() => {
                const heroStars = document.getElementById('heroStars');
                const summaryStars = document.getElementById('summaryStars');
                
                if (heroStars) heroStars.innerHTML = this.renderStars(this.vuelo.rating);
                if (summaryStars) summaryStars.innerHTML = this.renderStars(this.vuelo.rating);
            });
        },

        /**
         * Genera el HTML de estrellas según una calificación numérica.
         *
         * @param {number} rating - Calificación (1-5).
         * @returns {string} HTML con iconos de estrellas.
         */
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

        /**
         * Establece la calificación seleccionada para un nuevo comentario.
         *
         * @param {number} stars - Número de estrellas (1-5).
         */
        setRating(stars) {
            this.selectedRating = stars;
        },

        /**
         * Publica un nuevo comentario en el vuelo.
         * <p>
         * Requiere autenticación. Envía el comentario y la calificación a la API.
         * </p>
         *
         * @returns {Promise<void>}
         */
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

        /**
         * Responde a un comentario existente.
         *
         * @param {number} idComentarioPadre - Identificador del comentario padre.
         * @returns {Promise<void>}
         */
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

        /**
         * Ordena la lista de comentarios según el criterio actual.
         * <p>
         * Los criterios disponibles son:
         * <ul>
         *   <li>{@code 'recent'} - Más recientes primero.</li>
         *   <li>{@code 'rating'} - Mayor calificación primero.</li>
         *   <li>{@code 'likes'}  - Mayor número de "me gusta" primero.</li>
         * </ul>
         * </p>
         */
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

        /**
         * Cambia el criterio de ordenamiento de los comentarios.
         *
         * @param {string} tipo - Nuevo criterio ('recent', 'rating', 'likes').
         */
        cambiarOrden(tipo) {
            this.sortActual = tipo;
            this.ordenarComentarios();
        },

        /**
         * Alterna el estado "me gusta" de un comentario.
         *
         * @param {Object} comentario - Objeto comentario (debe tener propiedades `likes` y `liked`).
         */
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

        /**
         * Recalcula el precio total en base al precio base, número de pasajeros y extras seleccionados.
         */
        recalcularTotal() {
            if (!this.vuelo.precioBase) return;

            let total = this.vuelo.precioBase * this.pasajeros;

            if (this.extras.equipaje) total += 300 * this.pasajeros;
            if (this.extras.asiento) total += 160 * this.pasajeros;
            if (this.extras.comida) total += 90 * this.pasajeros;

            this.precioTotal = total;
        },

        /**
         * Navega a la página de checkout con los parámetros del vuelo y el total calculado.
         */
        procederCompra() {
            const pasajeros = this.pasajeros || 1;

            window.location.href =
                `${BASE_PATH}/views/checkout.html?vueloId=${this.vueloId}&pasajeros=${pasajeros}&total=${this.precioTotal}`;
        }
    };
}