// ===================================
// ALPINE.JS DATA COMPONENTS
// ===================================

// Detectar automáticamente el contexto de la app
const BASE_PATH = window.location.pathname.split('/')[1]
    ? `/${window.location.pathname.split('/')[1]}`
    : '';

const API_BASE = `${BASE_PATH}/api`;

// ==================
// 1. HEADER DATA
// ==================

/**
 * Crea y retorna el objeto `headerData` para Alpine.js, responsable de gestionar
 * el estado y las acciones del encabezado de la aplicación.
 *
 * @returns {Object} Un objeto Alpine con propiedades y métodos para el header.
 */
function headerData() {
    return {
        /** @type {boolean} Indica si el usuario ha iniciado sesión. */
        isLoggedIn: false,
        
        /** @type {string} Nombre del usuario (o 'Usuario' por defecto). */
        userName: 'Usuario',
        
        /** @type {string} Rol del usuario ('ADMIN', 'REGISTRADO', 'WEBSERVICE'). */
        userRole: '',
        
        /** @type {string} Texto de búsqueda ingresado por el usuario. */
        searchQuery: '',
        
        /** @type {boolean} Controla la visibilidad del menú de perfil. */
        showProfileMenu: false,
        
        /** @type {boolean} Controla la visibilidad del panel de filtros. */
        showFilters: false,

        /** @type {Object} Filtros de búsqueda para vuelos. */
        filters: {
            /** @type {string} Código IATA de origen. */
            origen: '',
            /** @type {string} Código IATA de destino. */
            destino: '',
            /** @type {string} Fecha de salida en formato ISO (YYYY-MM-DD). */
            fechaSalida: '',
        },

        /**
         * Alterna la visibilidad del panel de filtros.
         *
         * @example
         * headerData.toggleFilters();
         */
        toggleFilters() {
            this.showFilters = !this.showFilters;
        },

        /**
         * Aplica los filtros actuales y redirige a la página de resultados.
         * <p>
         * Construye una cadena de consulta con los parámetros de los filtros
         * y navega a {@code resultados.html} con dichos parámetros.
         * </p>
         *
         * @example
         * headerData.applyFilters();
         */
        applyFilters() {
            const params = new URLSearchParams(this.filters).toString();
            window.location.href = `${BASE_PATH}/views/resultados.html?${params}`;
        },
        
        /**
         * Inicializa el componente del header.
         * <p>
         * Verifica si existe una sesión de usuario activa y registra un listener
         * para el evento {@code toggle-filters} que muestra el panel de filtros.
         * </p>
         *
         * @returns {void}
         * @example
         * headerData.init();
         */
        init() {
            this.checkSession();
            window.addEventListener('toggle-filters', () => {
                this.showFilters = true;
            });
        },
        
        /**
         * Verifica si hay una sesión de usuario activa en el almacenamiento local.
         * <p>
         * Si existe una sesión, extrae los datos del usuario y actualiza las propiedades
         * {@code isLoggedIn}, {@code userName} y {@code userRole}. En caso de error,
         * elimina la sesión inválida.
         * </p>
         *
         * @returns {void}
         * @example
         * headerData.checkSession();
         */
        checkSession() {
            const session = localStorage.getItem('userSession');
            if (session) {
                try {
                    const userData = JSON.parse(session);
                    this.isLoggedIn = true;
                    this.userName = userData.nombres || 'Usuario';
                    this.userRole = userData.tipoUsuario || '';
                } catch (e) {
                    console.error('Error parsing session:', e);
                    localStorage.removeItem('userSession');
                }
            }
        },
        
        /**
         * Verifica si el usuario actual tiene acceso a una ruta según el rol requerido.
         *
         * @param {string} [requiredRole] - Rol necesario para acceder (ej. 'ADMIN').
         * @returns {boolean} {@code true} si el usuario tiene acceso, {@code false} en caso contrario.
         * @example
         * headerData.canAccess('ADMIN');
         */
        canAccess(requiredRole) {
            if (!this.isLoggedIn && requiredRole) return false;
            if (requiredRole === 'ADMIN' && this.userRole !== 'ADMIN') return false;
            return true;
        },
        
        /**
         * Realiza una búsqueda basada en el texto ingresado en {@code searchQuery}.
         * <p>
         * Si la consulta no está vacía, redirige a la página de resultados con el
         * parámetro {@code q}.
         * </p>
         *
         * @returns {void}
         * @example
         * headerData.searchQuery = 'Madrid';
         * headerData.performSearch();
         */
        performSearch() {
            if (this.searchQuery.trim()) {
                window.location.href = `${BASE_PATH}/views/resultados.html?q=${encodeURIComponent(this.searchQuery)}`;
            }
        },
        
        /**
         * Alterna la visibilidad del menú de perfil desplegable.
         *
         * @returns {void}
         * @example
         * headerData.toggleProfileMenu();
         */
        toggleProfileMenu() {
            this.showProfileMenu = !this.showProfileMenu;
        },
        
        /**
         * Navega a la página de perfil del usuario.
         *
         * @returns {void}
         * @example
         * headerData.navigateToPerfil();
         */
        navigateToPerfil() {
            window.location.href = `${BASE_PATH}/views/perfil/index.html`;
        },
        
        /**
         * Navega a la página de reservaciones del usuario.
         *
         * @returns {void}
         * @example
         * headerData.navigateToReservaciones();
         */
        navigateToReservaciones() {
            window.location.href = `${BASE_PATH}/views/perfil/reservaciones.html`;
        },
        
        /**
         * Navega al panel de administración si el usuario tiene rol {@code ADMIN}.
         *
         * @returns {void}
         * @example
         * headerData.navigateToAdmin();
         */
        navigateToAdmin() {
            if (this.userRole === 'ADMIN') {
                window.location.href = `${BASE_PATH}/views/admin/dashboard.html`;
            }
        }
        
    };
}

// ==================
// 2. INFO CARDS DATA
// ==================

/**
 * Crea y retorna el objeto `infoCardsData` para Alpine.js, responsable de
 * gestionar las acciones asociadas a las tarjetas informativas (hoteles aliados
 * y agencia de viajes).
 *
 * @returns {Object} Un objeto Alpine con métodos de navegación a funcionalidades próximas.
 */
function infoCardsData() {
    return {
        /**
         * Navega a la sección de hoteles aliados.
         * <p>
         * Actualmente muestra una alerta indicando que la funcionalidad estará
         * disponible próximamente.
         * </p>
         *
         * @returns {void}
         * @example
         * infoCardsData.navigateToHotels();
         */
        navigateToHotels() {
            alert('Funcionalidad de hoteles aliados próximamente...');
        },
        
        /**
         * Navega a la sección de agencia de viajes.
         * <p>
         * Actualmente muestra una alerta indicando que la funcionalidad estará
         * disponible próximamente.
         * </p>
         *
         * @returns {void}
         * @example
         * infoCardsData.navigateToAgency();
         */
        navigateToAgency() {
            alert('Funcionalidad de agencia de viajes próximamente...');
        }
    };
}

// ==================
// 3. ADMIN DASHBOARD DATA
// ==================

/**
 * Crea y retorna el objeto `dashboardData` para Alpine.js, responsable de gestionar
 * el panel de administración.
 * <p>
 * Proporciona estadísticas generales del sistema, las últimas reservaciones
 * y métodos de navegación a las distintas secciones administrativas.
 * </p>
 *
 * @returns {Object} Un objeto Alpine con propiedades y métodos para el dashboard de administración.
 */
function dashboardData() {
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
        
        /** @type {Array} Lista de reservaciones recientes (actualmente no utilizada). */
        recentReservations: [],
        
        /** @type {boolean} Indica si se están cargando los datos del dashboard. */
        isLoading: true,
        
        /**
         * Inicializa el objeto cargando las estadísticas del sistema.
         * <p>
         * Verifica que el usuario tenga rol de administrador. Si no es así,
         * muestra una alerta y redirige a la página principal.
         * </p>
         *
         * @returns {Promise<void>} Promesa que se resuelve cuando se han cargado los datos.
         * @throws {Error} Si ocurre un error al cargar las estadísticas.
         */
        async init() {
            // Verificar que sea admin
            const session = getUserSession();
            if (!session || session.tipoUsuario !== 'ADMIN') {
                alert('Acceso denegado. Solo administradores.');
                window.location.href = `${BASE_PATH}/views/index.html`;
                return;
            }
            
            await this.fetchDashboardData();
        },
        
        /**
         * Carga los datos del dashboard desde la API.
         * <p>
         * Realiza una petición HTTP GET a {@code /api/admin/stats} para obtener
         * las estadísticas y las asigna a la propiedad {@link stats}.
         * La carga de reservaciones recientes se encuentra actualmente comentada.
         * </p>
         *
         * @returns {Promise<void>} Promesa que se resuelve cuando se completa la carga.
         * @throws {Error} Si ocurre un error durante la petición.
         */
        async fetchDashboardData() {
            this.isLoading = true;
            try {
                // Fetch stats
                const statsResponse = await fetch(`${API_BASE}/admin/stats`, {
                    headers: {
                        'Authorization': `Bearer ${getUserSession()?.token}`
                    }
                });
                
                if (statsResponse.ok) {
                    const result = await statsResponse.json();
                    this.stats = result.data;
                }
                
                // Fetch recent reservations
                /*
                const reservationsResponse = await fetch(`${API_BASE}/admin/reservaciones/recientes?limit=5`, {
                    headers: {
                        'Authorization': `Bearer ${getUserSession()?.token}`
                    },
                    credentials: 'include'
                });
                
                
                if (reservationsResponse.ok) {
                    this.recentReservations = await reservationsResponse.json();
                }
                */
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                showNotification('Error al cargar datos del dashboard', 'error');
            } finally {
                this.isLoading = false;
            }
        },
        
        /**
         * Navega a una página específica de la sección de administración.
         *
         * @param {string} page - Nombre de la página de administración a la que navegar
         *                        (ej. 'usuarios', 'vuelos', 'reportes').
         * @returns {void}
         * @example
         * dashboardData.navigateTo('usuarios');
         */
        navigateTo(page) {
            window.location.href = `${BASE_PATH}/views/admin/${page}.html`;
        }
    };
}

// ==================
// 4. ADMIN VUELOS DATA
// ==================

/**
 * Crea y retorna el objeto `vuelosAdminData` para Alpine.js, responsable de la
 * administración de vuelos en el panel de control.
 * <p>
 * Permite listar, filtrar, crear, editar y eliminar vuelos, con validaciones
 * tanto en el frontend como en la comunicación con la API.
 * </p>
 *
 * @returns {Object} Un objeto Alpine con propiedades y métodos para la gestión de vuelos.
 */
function vuelosAdminData() {
    return {
        /** @type {Array<Object>} Lista completa de vuelos cargados desde el backend. */
        vuelos: [],
        
        /** @type {Array<Object>} Lista de vuelos después de aplicar filtros. */
        filteredVuelos: [],
        
        /** @type {Object} Filtros aplicados a la lista de vuelos. */
        filters: {
            estado: 'TODOS',
            search: ''
        },
        
        /** @type {Object} Configuración de paginación. */
        pagination: {
            currentPage: 1,
            perPage: 10,
            total: 0
        },
        
        /** @type {boolean} Controla la visibilidad del modal de creación/edición. */
        showModal: false,
        
        /** @type {string} Modo del modal ('create' o 'edit'). */
        modalMode: 'create',
        
        /** @type {Object} Datos del vuelo actual en edición o creación. */
        currentVuelo: {
            codigo: '',
            origen: '',
            codigoIataOrigen: '',
            destino: '',
            codigoIataDestino: '',
            fechaSalida: '',
            horaSalida: '',
            fechaLlegada: '',
            horaLlegada: '',
            tipoAsiento: 'TURISTA',
            precioBase: 0,
            asientosTotales: 0
        },
        
        /** @type {boolean} Indica si se están cargando los datos. */
        isLoading: true,

        /**
         * Obtiene los parámetros de búsqueda de la URL actual.
         *
         * @returns {Object} Un objeto con los siguientes parámetros:
         * @property {string} origen      - Código IATA de origen.
         * @property {string} destino     - Código IATA de destino.
         * @property {string} fechaSalida - Fecha de salida en formato ISO.
         * @property {string} tipoAsiento - Tipo de asiento.
         */
        getQueryParams() {
            const params = new URLSearchParams(window.location.search);
            return {
                origen: params.get("origen"),
                destino: params.get("destino"),
                fechaSalida: params.get("fechaSalida"),
                tipoAsiento: params.get("tipoAsiento")
            };
        },

        /**
         * Convierte un objeto vuelo proveniente del backend al formato utilizado en la vista.
         *
         * @param {Object} v - Objeto vuelo del backend.
         * @returns {Object} Objeto normalizado con los siguientes campos:
         * @property {number} id                 - Identificador único.
         * @property {string} codigo             - Código alfanumérico del vuelo.
         * @property {string} origen             - Ciudad de origen.
         * @property {string} codigoIataOrigen   - Código IATA del aeropuerto de origen.
         * @property {string} destino            - Ciudad de destino.
         * @property {string} codigoIataDestino  - Código IATA del aeropuerto de destino.
         * @property {string} fechaSalida        - Fecha de salida.
         * @property {string} horaSalida         - Hora de salida.
         * @property {string} fechaLlegada       - Fecha de llegada.
         * @property {string} horaLlegada        - Hora de llegada.
         * @property {string} tipoAsiento        - Tipo de asiento.
         * @property {number} precioBase         - Precio base.
         * @property {number} asientosDisponibles - Asientos disponibles.
         * @property {number} asientosTotales    - Total de asientos.
         * @property {string} estado             - Estado del vuelo.
         */
        mapBackendVuelo(v) {
            return {
                id: v.idVuelo,
                codigo: v.codigoVuelo,
                origen: v.origenCiudad,
                codigoIataOrigen: v.origenCodigoIata,
                destino: v.destinoCiudad,
                codigoIataDestino: v.destinoCodigoIata,
                fechaSalida: v.fechaSalida,
                horaSalida: v.horaSalida,
                fechaLlegada: v.fechaLlegada,
                horaLlegada: v.horaLlegada,
                tipoAsiento: v.tipoAsiento,
                precioBase: Number(v.precioBase),
                asientosDisponibles: v.asientosDisponibles,
                asientosTotales: v.asientosTotales,
                estado: v.estado
            };
        },

        /**
         * Calcula la duración de un vuelo en horas y minutos.
         *
         * @param {string} horaSalida - Hora de salida (formato "HH:mm").
         * @param {string} horaLlegada - Hora de llegada (formato "HH:mm").
         * @returns {string} Duración en formato "Xh Ym".
         */
        calcularDuracion(horaSalida, horaLlegada) {
            const [hs, ms] = horaSalida.split(':').map(Number);
            const [hl, ml] = horaLlegada.split(':').map(Number);

            let inicio = hs * 60 + ms;
            let fin = hl * 60 + ml;

            if (fin < inicio) fin += 24 * 60;

            const diff = fin - inicio;
            const h = Math.floor(diff / 60);
            const m = diff % 60;

            return `${h}h ${m}m`;
        },

        /**
         * Marca el vuelo (o vuelos) con el precio base más bajo como "mejor precio".
         * <p>
         * Recorre la lista de vuelos y establece la propiedad {@code bestPrice} en {@code true}
         * para aquellos cuyo precio base sea igual al mínimo encontrado.
         * </p>
         */
        marcarMejorPrecio() {
            if (!this.vuelos.length) return;

            const minPrice = Math.min(...this.vuelos.map(v => v.precioBase));
            this.vuelos.forEach(v => {
                v.bestPrice = v.precioBase === minPrice;
            });
        },
        
        /**
         * Inicializa el componente.
         * <p>
         * Verifica que el usuario tenga rol de administrador. Si no es así,
         * muestra una alerta y redirige a la página principal. Luego, carga
         * los vuelos disponibles y obtiene los parámetros de consulta de la URL.
         * </p>
         *
         * @returns {Promise<void>}
         */
        async init() {
            const session = getUserSession();
            if (!session || session.tipoUsuario !== 'ADMIN') {
                alert('Acceso denegado');
                window.location.href = `${BASE_PATH}/views/index.html`;
                return;
            }
            
            await this.fetchVuelos();
            const query = this.getQueryParams();
        },
        
        /**
         * Carga la lista de vuelos desde la API de administración.
         * <p>
         * Realiza una petición GET a {@code /api/vuelos/admin} y actualiza
         * las propiedades {@code vuelos} y {@code filteredVuelos}.
         * </p>
         *
         * @returns {Promise<void>}
         * @throws {Error} Si la petición falla o la respuesta no es exitosa.
         */
        async fetchVuelos() {
            this.isLoading = true;
            try {
                const response = await fetch(`${API_BASE}/vuelos/admin`, {
                    credentials: 'include'
                });
                const data = await response.json();
                console.log("Respuesta backend:", data);

                if (response.ok && data.success) {
                    this.vuelos = data.data.map(v => this.mapBackendVuelo(v));
                    console.log("Vuelos mapeados:", this.vuelos);
                    this.applyFilters();
                } else {
                    throw new Error(`HTTP error: ${response.status}`);
                }
            } catch (error) {
                console.error('Error cargando vuelos:', error);
                showNotification('Error al cargar vuelos', 'error');
            } finally {
                this.isLoading = false;
            }
        },
        
        /**
         * Aplica los filtros de estado y búsqueda a la lista de vuelos.
         * <p>
         * Filtra por {@code filters.estado} (si no es "TODOS") y por
         * {@code filters.search} en los campos código, origen y destino.
         * Actualiza {@code filteredVuelos} y {@code pagination.total}.
         * </p>
         */
        applyFilters() {
            let filtered = [...this.vuelos];
            
            // Filtro por estado
            if (this.filters.estado !== 'TODOS') {
                filtered = filtered.filter(v => v.estado === this.filters.estado);
            }
            
            // Filtro por búsqueda
            if (this.filters.search.trim()) {
                const search = this.filters.search.toLowerCase();
                filtered = filtered.filter(v => 
                    v.codigo.toLowerCase().includes(search) ||
                    v.origen.toLowerCase().includes(search) ||
                    v.destino.toLowerCase().includes(search)
                );
            }
            
            this.filteredVuelos = filtered;
            this.pagination.total = filtered.length;
        },
        
        /**
         * Getter que retorna los vuelos correspondientes a la página actual.
         *
         * @returns {Array<Object>} Sublista de vuelos para la página activa.
         */
        get paginatedVuelos() {
            const start = (this.pagination.currentPage - 1) * this.pagination.perPage;
            const end = start + this.pagination.perPage;
            return this.filteredVuelos.slice(start, end);
        },
        
        /**
         * Abre el modal para crear un nuevo vuelo.
         * <p>
         * Establece el modo en {@code 'create'}, genera un código de vuelo
         * automáticamente y limpia el objeto {@code currentVuelo}.
         * </p>
         */
        openCreateModal() {
            this.modalMode = 'create';
            this.currentVuelo = {
                codigo: this.generateVueloCode(),
                origen: '',
                codigoIataOrigen: '',
                destino: '',
                codigoIataDestino: '',
                fechaSalida: '',
                horaSalida: '',
                fechaLlegada: '',
                horaLlegada: '',
                tipoAsiento: 'TURISTA',
                precioBase: 0,
                asientosTotales: 0
            };
            this.showModal = true;
        },
        
        /**
         * Abre el modal para editar un vuelo existente.
         *
         * @param {Object} vuelo - El vuelo a editar.
         */
        openEditModal(vuelo) {
            this.modalMode = 'edit';
            this.currentVuelo = { ...vuelo };
            this.showModal = true;
        },
        
        /**
         * Cierra el modal y limpia el objeto {@code currentVuelo}.
         */
        closeModal() {
            this.showModal = false;
            this.currentVuelo = {};
        },
        
        /**
         * Guarda un vuelo (crea o actualiza) en la base de datos.
         * <p>
         * Realiza validaciones frontend, construye el payload y envía una
         * petición POST (crear) o PUT (editar) al endpoint correspondiente.
         * Al finalizar, recarga la lista de vuelos.
         * </p>
         *
         * @returns {Promise<void>}
         * @throws {Error} Si ocurre un error durante la operación.
         */
        async saveVuelo() {
            try {
                // ======================
                // VALIDACIONES FRONTEND
                // ======================
                if (this.currentVuelo.origen === this.currentVuelo.destino) {
                    showNotification('Origen y destino no pueden ser iguales', 'error');
                    return;
                }
                if (this.currentVuelo.fechaLlegada < this.currentVuelo.fechaSalida) {
                    showNotification('La fecha de llegada no puede ser anterior a la salida', 'error');
                    return;
                }
                if (this.currentVuelo.precioBase <= 0) {
                    showNotification('El precio debe ser mayor a 0', 'error');
                    return;
                }
                if (this.currentVuelo.asientosTotales <= 0) {
                    showNotification('Debe haber al menos 1 asiento', 'error');
                    return;
                }

                // ======================
                // CONSTRUIR PAYLOAD
                // ======================
                const session = getUserSession();
                if (!session || !session.idUsuario) {
                    showNotification('Error: No hay sesión activa', 'error');
                    console.error('Session data:', session);
                    return;
                }
                console.log('Usuario logueado:', session);

                const vueloPayload = {
                    codigoVuelo: this.currentVuelo.codigo,
                    origenCiudad: this.currentVuelo.origen,
                    origenIata: this.currentVuelo.codigoIataOrigen,
                    destinoCiudad: this.currentVuelo.destino,
                    destinoIata: this.currentVuelo.codigoIataDestino,
                    fechaSalida: this.currentVuelo.fechaSalida,
                    horaSalida: this.currentVuelo.horaSalida,
                    fechaLlegada: this.currentVuelo.fechaLlegada,
                    horaLlegada: this.currentVuelo.horaLlegada,
                    tipoAsiento: this.currentVuelo.tipoAsiento,
                    precioBase: this.currentVuelo.precioBase,
                    asientosTotales: this.currentVuelo.asientosTotales,
                    asientosDisponibles: this.currentVuelo.asientosDisponibles,
                    estado: this.currentVuelo.estado,
                    idUsuarioCreador: session.idUsuario
                };

                console.log('Payload con idUsuarioCreador:', vueloPayload);

                const url = this.modalMode === 'create'
                    ? `${API_BASE}/vuelos`
                    : `${API_BASE}/vuelos/${this.currentVuelo.id}`;
                const method = this.modalMode === 'create' ? 'POST' : 'PUT';

                console.log("Payload enviado:", JSON.stringify(vueloPayload, null, 2));
                const response = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(vueloPayload)
                });

                const data = await response.json();
                console.log("Respuesta backend:", data);

                if (response.ok && data.success) {
                    showNotification(
                        this.modalMode === 'create'
                            ? 'Vuelo creado exitosamente'
                            : 'Vuelo actualizado exitosamente',
                        'success'
                    );
                    this.closeModal();
                    await this.fetchVuelos();
                } else {
                    console.error("Backend response:", data);
                    throw new Error(data.message || 'Error al guardar vuelo');
                }
            } catch (error) {
                console.error('Error saving vuelo:', error);
                showNotification('Error al guardar vuelo', 'error');
            }
        },
        
        /**
         * Elimina un vuelo por su ID.
         * <p>
         * Muestra una confirmación antes de proceder. Realiza una petición DELETE
         * a {@code /api/vuelos/{id}} y recarga la lista de vuelos al finalizar.
         * </p>
         *
         * @param {number} vueloId - Identificador del vuelo a eliminar.
         * @returns {Promise<void>}
         */
        async deleteVuelo(vueloId) {
            if (!confirm('¿Estás seguro de eliminar este vuelo?')) return;

            try {
                const response = await fetch(`${API_BASE}/vuelos/${vueloId}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
                const data = await response.json();

                if (response.ok && data.success) {
                    showNotification('Vuelo eliminado exitosamente', 'success');
                    await this.fetchVuelos();
                } else {
                    throw new Error(data.message);
                }
            } catch (error) {
                console.error('Error deleting vuelo:', error);
                showNotification('Error al eliminar vuelo', 'error');
            }
        },
        
        /**
         * Genera un código de vuelo aleatorio con el formato 'HC-XXXX'.
         *
         * @returns {string} Código de vuelo generado.
         */
        generateVueloCode() {
            return `HC-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
        }
    };
}

// ==================
// 5. ADMIN USUARIOS DATA
// ==================

/**
 * Crea y retorna el objeto `usuariosAdminData` para Alpine.js, responsable de la
 * administración de usuarios en el panel de control.
 * <p>
 * Permite listar, filtrar, activar/desactivar y cambiar roles de usuarios registrados.
 * </p>
 *
 * @returns {Object} Un objeto Alpine con propiedades y métodos para la gestión de usuarios.
 */
function usuariosAdminData() {
    return {
        /** @type {Array<Object>} Lista completa de usuarios cargados desde el backend. */
        usuarios: [],
        
        /** @type {Array<Object>} Lista de usuarios después de aplicar filtros. */
        filteredUsuarios: [],
        
        /** @type {Object} Filtros aplicados a la lista de usuarios. */
        filters: {
            tipo: 'TODOS',
            estado: 'TODOS',
            search: ''
        },
        
        /** @type {Object} Estadísticas resumidas de los usuarios. */
        stats: {
            total: 0,
            admins: 0,
            registrados: 0,
            webservices: 0
        },
        
        /** @type {Object} Configuración de paginación. */
        pagination: {
            currentPage: 1,
            perPage: 20,
            total: 0
        },
        
        /** @type {boolean} Indica si se están cargando los datos. */
        isLoading: true,
        
        /**
         * Inicializa el componente verificando los permisos de administrador
         * y cargando la lista de usuarios.
         *
         * @returns {Promise<void>}
         * @throws {Error} Si el usuario no es administrador o falla la carga.
         */
        async init() {
            const session = getUserSession();
            if (!session || session.tipoUsuario !== 'ADMIN') {
                alert('Acceso denegado');
                window.location.href = `${BASE_PATH}/views/index.html`;
                return;
            }
            
            await this.fetchUsuarios();
        },
        
        /**
         * Obtiene la lista de usuarios desde el endpoint de administración.
         * <p>
         * Realiza una petición GET a {@code /api/admin/usuarios}. Si la respuesta
         * es exitosa, actualiza {@code usuarios}, recalcula estadísticas y aplica filtros.
         * </p>
         *
         * @returns {Promise<void>}
         */
        async fetchUsuarios() {
            this.isLoading = true;
            try {
                const response = await fetch(`${API_BASE}/admin/usuarios`, {
                    headers: {
                        'Authorization': `Bearer ${getUserSession()?.token}`
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        this.usuarios = data.data;
                        this.calculateStats();
                        this.applyFilters();
                    }
                }
            } catch (error) {
                console.error('Error fetching usuarios:', error);
                showNotification('Error al cargar usuarios', 'error');
            } finally {
                this.isLoading = false;
            }
        },
        
        /**
         * Calcula las estadísticas de los usuarios (total, admins, registrados, webservices)
         * y actualiza el objeto {@code stats}.
         */
        calculateStats() {
            this.stats.total = this.usuarios.length;
            this.stats.admins = this.usuarios.filter(u => u.tipoUsuario === 'ADMIN').length;
            this.stats.registrados = this.usuarios.filter(u => u.tipoUsuario === 'REGISTRADO').length;
            this.stats.webservices = this.usuarios.filter(u => u.tipoUsuario === 'WEBSERVICE').length;
        },
        
        /**
         * Aplica los filtros de tipo, estado y búsqueda a la lista de usuarios.
         * <p>
         * Actualiza {@code filteredUsuarios} y {@code pagination.total}.
         * </p>
         */
        applyFilters() {
            let filtered = [...this.usuarios];
            
            if (this.filters.tipo !== 'TODOS') {
                filtered = filtered.filter(u => u.tipoUsuario === this.filters.tipo);
            }
            
            if (this.filters.estado !== 'TODOS') {
                const isActivo = this.filters.estado === 'ACTIVO';
                filtered = filtered.filter(u => u.activo === isActivo);
            }
            
            if (this.filters.search.trim()) {
                const search = this.filters.search.toLowerCase();
                filtered = filtered.filter(u => 
                    u.email.toLowerCase().includes(search) ||
                    `${u.nombres} ${u.apellidos}`.toLowerCase().includes(search)
                );
            }
            
            this.filteredUsuarios = filtered;
            this.pagination.total = filtered.length;
        },
        
        /**
         * Getter que retorna los usuarios correspondientes a la página actual.
         *
         * @returns {Array<Object>} Sublista de usuarios para la página activa.
         */
        get paginatedUsuarios() {
            const start = (this.pagination.currentPage - 1) * this.pagination.perPage;
            const end = start + this.pagination.perPage;
            return this.filteredUsuarios.slice(start, end);
        },
        
        /**
         * Activa o desactiva un usuario.
         * <p>
         * Envía una petición PUT a {@code /api/admin/usuarios/{id}/toggle-activo}
         * y actualiza el estado local en caso de éxito.
         * </p>
         *
         * @param {Object} usuario - El usuario a modificar (debe tener propiedad {@code id} y {@code activo}).
         * @returns {Promise<void>}
         */
        async toggleActivo(usuario) {
            try {
                const response = await fetch(`${API_BASE}/admin/usuarios/${usuario.id}/toggle-activo`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${getUserSession()?.token}`
                    }
                });
                
                if (response.ok) {
                    usuario.activo = !usuario.activo;
                    showNotification('Estado actualizado', 'success');
                }
            } catch (error) {
                console.error('Error toggling activo:', error);
                showNotification('Error al actualizar estado', 'error');
            }
        },
        
        /**
         * Cambia el rol de un usuario.
         * <p>
         * Solicita confirmación y envía una petición PUT a {@code /api/admin/usuarios/{id}/rol}
         * con el nuevo rol. Si la operación es exitosa, recarga la lista de usuarios.
         * </p>
         *
         * @param {number} userId   - Identificador del usuario.
         * @param {string} nuevoRol - Nuevo rol a asignar (ej. 'ADMIN', 'REGISTRADO').
         * @returns {Promise<void>}
         */
        async cambiarRol(userId, nuevoRol) {
            if (!confirm(`¿Cambiar rol del usuario a ${nuevoRol}?`)) return;
            
            try {
                const response = await fetch(`${API_BASE}/admin/usuarios/${userId}/rol`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${getUserSession()?.token}`
                    },
                    body: JSON.stringify({ tipoUsuario: nuevoRol })
                });
                
                if (response.ok) {
                    showNotification('Rol actualizado exitosamente', 'success');
                    await this.fetchUsuarios();
                }
            } catch (error) {
                console.error('Error changing rol:', error);
                showNotification('Error al cambiar rol', 'error');
            }
        }
    };
}

// ==================
// 6. ADMIN AGENCIAS DATA
// ==================

/**
 * Crea y retorna el objeto `agenciasAdminData` para Alpine.js, responsable de la
 * administración de agencias de viajes en el panel de control.
 * <p>
 * Permite listar, crear agencias, generar y regenerar claves API para
 * integraciones con web services.
 * </p>
 *
 * @returns {Object} Un objeto Alpine con propiedades y métodos para la gestión de agencias.
 */
function agenciasAdminData() {
    return {
        /** @type {Array<Object>} Lista de agencias cargadas desde el backend. */
        agencias: [],
        
        /** @type {boolean} Controla la visibilidad del modal de creación de agencia. */
        showModal: false,
        
        /** @type {boolean} Controla la visibilidad del modal que muestra la API Key generada. */
        showApiKeyModal: false,
        
        /** @type {string} Clave API generada o regenerada recientemente. */
        generatedApiKey: '',
        
        /** @type {Object} Datos de la agencia en creación o edición. */
        currentAgencia: {
            nombre: '',
            usuarioWebServiceId: '',
            descuento: 0
        },
        
        /** @type {Array<Object>} Lista de usuarios con rol WEBSERVICE disponibles para asignar. */
        usuariosWebService: [],
        
        /** @type {boolean} Indica si se están cargando los datos. */
        isLoading: true,
        
        /**
         * Inicializa el componente verificando los permisos de administrador,
         * cargando las agencias y los usuarios de tipo web service.
         *
         * @returns {Promise<void>}
         * @throws {Error} Si el usuario no es administrador.
         */
        async init() {
            const session = getUserSession();
            if (!session || session.tipoUsuario !== 'ADMIN') {
                alert('Acceso denegado');
                window.location.href = `${BASE_PATH}/views/index.html`;
                return;
            }
            
            await this.fetchAgencias();
            await this.fetchUsuariosWebService();
        },
        
        /**
         * Obtiene la lista de agencias desde la API.
         * <p>
         * Realiza una petición GET a {@code /api/admin/agencias}. Si es exitosa,
         * actualiza la propiedad {@code agencias}.
         * </p>
         *
         * @returns {Promise<void>}
         */
        async fetchAgencias() {
            this.isLoading = true;
            try {
                const response = await fetch(`${API_BASE}/admin/agencias`, {
                    headers: {
                        'Authorization': `Bearer ${getUserSession()?.token}`
                    }
                });
                
                if (response.ok) {
                    this.agencias = await response.json();
                }
            } catch (error) {
                console.error('Error fetching agencias:', error);
                showNotification('Error al cargar agencias', 'error');
            } finally {
                this.isLoading = false;
            }
        },
        
        /**
         * Obtiene la lista de usuarios con rol {@code WEBSERVICE} para asignar a agencias.
         * <p>
         * Realiza una petición GET a {@code /api/admin/usuarios?tipo=WEBSERVICE}.
         * </p>
         *
         * @returns {Promise<void>}
         */
        async fetchUsuariosWebService() {
            try {
                const response = await fetch(`${API_BASE}/admin/usuarios?tipo=WEBSERVICE`, {
                    headers: {
                        'Authorization': `Bearer ${getUserSession()?.token}`
                    }
                });
                
                if (response.ok) {
                    this.usuariosWebService = await response.json();
                }
            } catch (error) {
                console.error('Error fetching usuarios webservice:', error);
            }
        },
        
        /**
         * Abre el modal para crear una nueva agencia.
         * <p>
         * Reinicia el objeto {@code currentAgencia} con valores por defecto.
         * </p>
         */
        openCreateModal() {
            this.currentAgencia = {
                nombre: '',
                usuarioWebServiceId: '',
                descuento: 0
            };
            this.showModal = true;
        },
        
        /**
         * Cierra el modal de creación/edición de agencia.
         */
        closeModal() {
            this.showModal = false;
            this.currentAgencia = {};
        },
        
        /**
         * Crea una nueva agencia enviando los datos a la API.
         * <p>
         * Realiza una petición POST a {@code /api/admin/agencias}. Si la creación es exitosa,
         * muestra el modal con la clave API generada, cierra el modal de creación y
         * recarga la lista de agencias.
         * </p>
         *
         * @returns {Promise<void>}
         */
        async createAgencia() {
            try {
                const response = await fetch(`${API_BASE}/admin/agencias`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${getUserSession()?.token}`
                    },
                    body: JSON.stringify(this.currentAgencia)
                });
                
                if (response.ok) {
                    const result = await response.json();
                    this.generatedApiKey = result.apiKey;
                    this.showApiKeyModal = true;
                    this.closeModal();
                    await this.fetchAgencias();
                }
            } catch (error) {
                console.error('Error creating agencia:', error);
                showNotification('Error al crear agencia', 'error');
            }
        },
        
        /**
         * Regenera la clave API de una agencia existente.
         * <p>
         * Solicita confirmación al usuario y, si se acepta, envía una petición POST a
         * {@code /api/admin/agencias/{id}/regenerate-key}. Muestra la nueva clave en el modal.
         * </p>
         *
         * @param {number} agenciaId - Identificador de la agencia.
         * @returns {Promise<void>}
         */
        async regenerateApiKey(agenciaId) {
            if (!confirm('¿Regenerar API Key? La anterior dejará de funcionar.')) return;
            
            try {
                const response = await fetch(`${API_BASE}/admin/agencias/${agenciaId}/regenerate-key`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${getUserSession()?.token}`
                    }
                });
                
                if (response.ok) {
                    const result = await response.json();
                    this.generatedApiKey = result.apiKey;
                    this.showApiKeyModal = true;
                }
            } catch (error) {
                console.error('Error regenerating API key:', error);
                showNotification('Error al regenerar API Key', 'error');
            }
        },
        
        /**
         * Copia el texto proporcionado al portapapeles del sistema.
         *
         * @param {string} text - Texto a copiar.
         */
        copyToClipboard(text) {
            navigator.clipboard.writeText(text).then(() => {
                showNotification('API Key copiada al portapapeles', 'success');
            });
        },
        
        /**
         * Cierra el modal que muestra la clave API generada y limpia su valor.
         */
        closeApiKeyModal() {
            this.showApiKeyModal = false;
            this.generatedApiKey = '';
        }
    };
}

// ==================
// 7. PERFIL DATA
// ==================

/**
 * Crea y retorna el objeto `perfilData` para Alpine.js, responsable de la
 * gestión del perfil de usuario.
 * <p>
 * Permite visualizar y editar la información personal, así como cambiar la
 * contraseña del usuario autenticado.
 * </p>
 *
 * @returns {Object} Un objeto Alpine con propiedades y métodos para el perfil de usuario.
 */
function perfilData() {
    return {
        /** @type {Object} Datos del perfil del usuario. */
        usuario: {},
        
        /** @type {boolean} Indica si el perfil está en modo edición. */
        editMode: false,
        
        /** @type {boolean} Controla la visibilidad del modal de cambio de contraseña. */
        showPasswordModal: false,
        
        /** @type {Object} Datos del formulario de cambio de contraseña. */
        passwordData: {
            actual: '',
            nueva: '',
            confirmar: ''
        },
        
        /** @type {boolean} Indica si se están cargando los datos. */
        isLoading: true,
        
        /**
         * Inicializa el componente verificando si el usuario está autenticado.
         * <p>
         * Si no hay sesión activa, redirige a la página de inicio de sesión.
         * En caso contrario, carga el perfil del usuario.
         * </p>
         *
         * @returns {Promise<void>}
         */
        async init() {
            const session = getUserSession();
            if (!session) {
                window.location.href = `${BASE_PATH}/views/login.html`;
                return;
            }
            
            await this.fetchProfile();
        },
        
        /**
         * Obtiene los datos del perfil del usuario desde la API.
         * <p>
         * Realiza una petición GET a {@code /api/perfil}. Si es exitosa,
         * actualiza la propiedad {@code usuario}.
         * </p>
         *
         * @returns {Promise<void>}
         */
        async fetchProfile() {
            this.isLoading = true;
            try {
                const response = await fetch(`${API_BASE}/perfil`, {
                    headers: {
                        'Authorization': `Bearer ${getUserSession()?.token}`
                    }
                });
                
                if (response.ok) {
                    this.usuario = await response.json();
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
                showNotification('Error al cargar perfil', 'error');
            } finally {
                this.isLoading = false;
            }
        },
        
        /**
         * Alterna el modo de edición del perfil.
         */
        toggleEditMode() {
            this.editMode = !this.editMode;
        },
        
        /**
         * Actualiza los datos del perfil del usuario en la base de datos.
         * <p>
         * Envía una petición PUT a {@code /api/perfil} con los datos modificados.
         * Si la actualización es exitosa, se sincroniza la información en la sesión local.
         * </p>
         *
         * @returns {Promise<void>}
         */
        async updateProfile() {
            try {
                const response = await fetch(`${API_BASE}/perfil`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${getUserSession()?.token}`
                    },
                    body: JSON.stringify(this.usuario)
                });
                
                if (response.ok) {
                    showNotification('Perfil actualizado exitosamente', 'success');
                    this.editMode = false;
                    
                    // Actualizar sesión
                    const session = getUserSession();
                    session.nombres = this.usuario.nombres;
                    session.apellidos = this.usuario.apellidos;
                    saveUserSession(session);
                }
            } catch (error) {
                console.error('Error updating profile:', error);
                showNotification('Error al actualizar perfil', 'error');
            }
        },
        
        /**
         * Abre el modal para cambiar la contraseña.
         * <p>
         * Reinicia el objeto {@code passwordData} con valores vacíos.
         * </p>
         */
        openPasswordModal() {
            this.passwordData = { actual: '', nueva: '', confirmar: '' };
            this.showPasswordModal = true;
        },
        
        /**
         * Cierra el modal de cambio de contraseña y limpia los datos del formulario.
         */
        closePasswordModal() {
            this.showPasswordModal = false;
            this.passwordData = { actual: '', nueva: '', confirmar: '' };
        },
        
        /**
         * Valida los datos del formulario de cambio de contraseña.
         *
         * @returns {string|null} Mensaje de error si la validación falla, o {@code null} si es válida.
         */
        validatePassword() {
            if (this.passwordData.nueva.length < 8) {
                return 'La contraseña debe tener al menos 8 caracteres';
            }
            if (this.passwordData.nueva !== this.passwordData.confirmar) {
                return 'Las contraseñas no coinciden';
            }
            return null;
        },
        
        /**
         * Cambia la contraseña del usuario.
         * <p>
         * Valida los datos, y si son correctos, envía una petición PUT a
         * {@code /api/perfil/cambiar-password}. Al finalizar, muestra la notificación
         * correspondiente y cierra el modal en caso de éxito.
         * </p>
         *
         * @returns {Promise<void>}
         */
        async changePassword() {
            const error = this.validatePassword();
            if (error) {
                showNotification(error, 'error');
                return;
            }
            
            try {
                const response = await fetch(`${API_BASE}/perfil/cambiar-password`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${getUserSession()?.token}`
                    },
                    body: JSON.stringify({
                        passwordActual: this.passwordData.actual,
                        passwordNueva: this.passwordData.nueva
                    })
                });
                
                if (response.ok) {
                    showNotification('Contraseña actualizada exitosamente', 'success');
                    this.closePasswordModal();
                } else {
                    throw new Error('Contraseña actual incorrecta');
                }
            } catch (error) {
                console.error('Error changing password:', error);
                showNotification('Error al cambiar contraseña', 'error');
            }
        }
    };
}

// ==================
// 8. RESERVACIONES DATA
// ==================

/**
 * Crea y retorna el objeto `reservacionesData` para Alpine.js, responsable de la
 * gestión de las reservaciones del usuario.
 * <p>
 * Permite listar, filtrar, descargar comprobantes en PDF y cancelar reservaciones
 * según las reglas de negocio.
 * </p>
 *
 * @returns {Object} Un objeto Alpine con propiedades y métodos para las reservaciones.
 */
function reservacionesData() {
    return {
        /** @type {Array<Object>} Lista completa de reservaciones del usuario. */
        reservaciones: [],
        
        /** @type {Array<Object>} Lista de reservaciones después de aplicar el filtro. */
        filteredReservaciones: [],
        
        /** @type {string} Filtro activo ('todas', 'confirmadas', 'pendientes', 'canceladas'). */
        filtroActivo: 'todas',
        
        /** @type {boolean} Indica si se están cargando los datos. */
        isLoading: true,
        
        /**
         * Inicializa el componente verificando la sesión del usuario.
         * <p>
         * Si no hay sesión activa, redirige al login. En caso contrario, carga las reservaciones.
         * </p>
         *
         * @returns {Promise<void>}
         */
        async init() {
            const session = getUserSession();
            if (!session) {
                window.location.href = `${BASE_PATH}/views/login.html`;
                return;
            }
            
            await this.fetchReservaciones();
        },
        
        /**
         * Obtiene las reservaciones del usuario autenticado desde la API.
         * <p>
         * Realiza una petición GET a {@code /api/reservaciones/mis-reservaciones}
         * enviando el ID del usuario en la cabecera {@code x-usuario-id}.
         * Al recibir los datos, aplica el filtro activo.
         * </p>
         *
         * @returns {Promise<void>}
         */
        async fetchReservaciones() {
            this.isLoading = true;
            try {
                const session = getUserSession();

                const response = await fetch(`${API_BASE}/reservaciones/mis-reservaciones`, { 
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-usuario-id': session.idUsuario // 👈 AQUÍ
                    }
                });
                
                const result = await response.json();

                if (response.ok && result.success) {
                    console.log("🔥 RAW BACKEND:", result.data);
                    this.reservaciones = result.data;
                    this.filtrarReservaciones();
                }
            } catch (error) {
                console.error('Error fetching reservaciones:', error);
                showNotification('Error al cargar reservaciones', 'error');
            } finally {
                this.isLoading = false;
            }
        },
        
        /**
         * Aplica el filtro activo a la lista de reservaciones.
         * <p>
         * Si el filtro es {@code 'todas'}, asigna la lista completa; de lo contrario,
         * filtra por el estado de la reservación.
         * </p>
         */
        filtrarReservaciones() {
            if (this.filtroActivo === 'todas') {
                this.filteredReservaciones = this.reservaciones;
                console.log("🎯 Reservaciones filtradas:", this.filteredReservaciones);
            } else {
                this.filteredReservaciones = this.reservaciones.filter(r => 
                    r.estado.toLowerCase() === this.filtroActivo
                );
            }
        },
        
        /**
         * Cambia el filtro activo y actualiza la lista mostrada.
         *
         * @param {string} filtro - Nuevo filtro a aplicar ('todas', 'confirmadas', etc.).
         */
        cambiarFiltro(filtro) {
            this.filtroActivo = filtro;
            this.filtrarReservaciones();
        },
        
        /**
         * Descarga el comprobante de una reservación en formato PDF.
         *
         * @param {string} codigoReservacion - Código único de la reservación.
         * @returns {Promise<void>}
         */
        async descargarPDF(codigoReservacion) {
            try {
                const response = await fetch(`${API_BASE}/reservaciones/${codigoReservacion}/pdf`, {
                    headers: {
                        'Authorization': `Bearer ${getUserSession()?.token}`
                    },
                    credentials: 'include'
                });
                
                if (response.ok) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `reservacion_${codigoReservacion}.pdf`;
                    a.click();
                    showNotification('Descargando comprobante...', 'success');
                }
            } catch (error) {
                console.error('Error downloading PDF:', error);
                showNotification('Error al descargar comprobante', 'error');
            }
        },
        
        /**
         * Cancela una reservación previa confirmación del usuario.
         * <p>
         * Envía una petición PUT a {@code /api/reservaciones/{id}/cancelar}.
         * Si la operación es exitosa, recarga la lista de reservaciones.
         * </p>
         *
         * @param {number} reservacionId - Identificador de la reservación a cancelar.
         * @returns {Promise<void>}
         */
        async cancelarReservacion(reservacionId) {
            if (!confirm('¿Estás seguro de cancelar esta reservación?')) return;
            
            try {
                const response = await fetch(`${API_BASE}/reservaciones/${reservacionId}/cancelar`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${getUserSession()?.token}`
                    },
                    credentials: 'include'
                });
                
                if (response.ok) {
                    showNotification('Reservación cancelada exitosamente', 'success');
                    await this.fetchReservaciones();
                }
            } catch (error) {
                console.error('Error canceling reservacion:', error);
                showNotification('Error al cancelar reservación', 'error');
            }
        },
        
        /**
         * Determina si una reservación puede ser cancelada según las reglas de negocio.
         * <p>
         * Requisitos:
         * <ul>
         *   <li>Estado de la reservación: {@code 'CONFIRMADA'}.</li>
         *   <li>Fecha de salida del vuelo: al menos 24 horas en el futuro.</li>
         * </ul>
         * </p>
         *
         * @param {Object} reservacion - Objeto de reservación.
         * @returns {boolean} {@code true} si la reservación puede cancelarse, {@code false} en caso contrario.
         */
        puedeSerCancelada(reservacion) {
            if (reservacion.estado !== 'CONFIRMADA') return false;
            
            const fechaVuelo = new Date(reservacion.vuelo.fechaSalida);
            const ahora = new Date();
            const diferenciaHoras = (fechaVuelo - ahora) / (1000 * 60 * 60);
            
            return diferenciaHoras > 24;
        }
    };
}

// ==================
// 9. NOTIFICACIONES
// ==================

/**
 * Crea y retorna el objeto `notificationsData` para Alpine.js, responsable de la
 * gestión de notificaciones en pantalla.
 * <p>
 * Permite mostrar mensajes temporales al usuario con diferentes niveles de severidad.
 * </p>
 *
 * @returns {Object} Un objeto Alpine con un array de notificaciones y métodos para mostrarlas y eliminarlas.
 */
function notificationsData() {
    return {
        /** @type {Array<Object>} Lista de notificaciones activas. */
        notifications: [],
        
        /**
         * Muestra una notificación en la interfaz.
         * <p>
         * La notificación se agrega al array {@code notifications} y se elimina automáticamente
         * después del tiempo especificado.
         * </p>
         *
         * @param {string} message  - Mensaje a mostrar.
         * @param {string} [type='info'] - Tipo de notificación ('info', 'success', 'warning', 'danger').
         * @param {number} [duration=3000] - Tiempo en milisegundos que permanece visible.
         */
        show(message, type = 'info', duration = 3000) {
            const id = Date.now();
            this.notifications.push({ id, message, type });
            
            setTimeout(() => {
                this.remove(id);
            }, duration);
        },
        
        /**
         * Elimina una notificación específica por su identificador.
         *
         * @param {number} id - Identificador de la notificación a eliminar.
         */
        remove(id) {
            this.notifications = this.notifications.filter(n => n.id !== id);
        }
    };
}

// ==================
// 10. RESULTADOS DATA
// ==================

/**
 * Crea y retorna el objeto `resultadosData` para Alpine.js, responsable de la
 * página de resultados de búsqueda de vuelos.
 * <p>
 * Carga los vuelos según los parámetros de la URL, aplica filtros y ordenamiento,
 * y renderiza las tarjetas de vuelos (directos y con escalas).
 * </p>
 *
 * @returns {Object} Un objeto Alpine con propiedades y métodos para la vista de resultados.
 */
function resultadosData() {
    return {
        /** @type {Array<Object>} Lista completa de vuelos cargados desde el backend. */
        vuelos: [],
        
        /** @type {Array<Object>} Lista de vuelos después de aplicar filtros. */
        filteredVuelos: [],
        
        /** @type {Array<Object>} Lista de vuelos que se muestran actualmente (ordenados). */
        displayedVuelos: [],
        
        /** @type {boolean} Indica si se están cargando los datos. */
        loading: true,
        
        /** @type {Object} Filtros aplicados por el usuario. */
        filters: {
            precioMax: 3500,
            tipoVuelo: {
                directo: true,
                escala: true
            },
            claseAsiento: {
                turista: true,
                business: true
            }
        },
        
        /** @type {string} Criterio de ordenamiento seleccionado. */
        sortBy: 'price-asc',
        
        /** @type {Object} Parámetros de búsqueda provenientes de la URL. */
        searchParams: {
            origen: '',
            destino: '',
            fechaSalida: '',
            pasajeros: 1,
            tipoViaje: 'ida'
        },

        /**
         * Carga los parámetros de búsqueda desde la URL actual y los asigna a {@code searchParams}.
         */
        loadSearchParams() {
            const query = this.getQueryParams();

            this.searchParams.origen = query.origen || '';
            this.searchParams.destino = query.destino || '';
            this.searchParams.fechaSalida = query.fechaSalida || '';
            this.searchParams.pasajeros = query.pasajeros || 1;
            this.searchParams.tipoViaje = query.tipoViaje || 'ida';
            this.searchParams.pasajeros = query.pasajeros ? parseInt(query.pasajeros) : 1;
        },

        /**
         * Abre el panel de filtros con los valores actuales de búsqueda.
         * <p>
         * Copia los valores de {@code searchParams} a los campos de filtro correspondientes
         * y establece {@code showFilters = true}.
         * </p>
         */
        openFiltersWithCurrentValues() {
            this.filters.origen = this.searchParams.origen;
            this.filters.destino = this.searchParams.destino;
            this.filters.fechaSalida = this.searchParams.fechaSalida;
            this.filters.pasajeros = this.searchParams.pasajeros;

            this.showFilters = true;
        },

        /**
         * Obtiene los parámetros de búsqueda de la URL actual.
         *
         * @returns {Object} Objeto con las propiedades:
         * @property {string} origen      - Código IATA de origen.
         * @property {string} destino     - Código IATA de destino.
         * @property {string} fechaSalida - Fecha de salida en formato ISO.
         * @property {string} tipoAsiento - Tipo de asiento.
         * @property {string} pasajeros   - Número de pasajeros.
         */
        getQueryParams() {
            const params = new URLSearchParams(window.location.search);
            return {
                origen: params.get('origen'),
                destino: params.get('destino'),
                fechaSalida: params.get('fechaSalida'),
                tipoAsiento: params.get('tipoAsiento'),
                pasajeros: params.get('pasajeros')
            };
        },

        /**
         * Aplica el criterio de ordenamiento seleccionado a la lista de vuelos filtrados.
         * <p>
         * Valores soportados para {@code sortBy}:
         * <ul>
         *   <li>'price-asc'   - Precio ascendente</li>
         *   <li>'price-desc'  - Precio descendente</li>
         *   <li>'rating'      - Calificación</li>
         *   <li>'departure'   - Hora de salida</li>
         *   <li>'duration'    - Duración</li>
         * </ul>
         * </p>
         */
        applySort() {
            let vuelos = [...this.filteredVuelos];

            switch (this.sortBy) {
                case 'price-asc':
                    vuelos.sort((a,b) => a.price - b.price);
                    break;
                case 'price-desc':
                    vuelos.sort((a,b) => b.price - a.price);
                    break;
                case 'rating':
                    vuelos.sort((a,b) => b.rating - a.rating);
                    break;
                case 'departure':
                    vuelos.sort((a,b) => a.from.time.localeCompare(b.from.time));
                    break;
                case 'duration':
                    vuelos.sort((a,b) => this.convertDurationToMinutes(a.duration) - this.convertDurationToMinutes(b.duration));
                    break;
            }

            this.displayedVuelos = vuelos;
        },

        /**
         * Aplica los filtros de precio, tipo de vuelo y clase de asiento a la lista de vuelos.
         * <p>
         * Actualiza {@code filteredVuelos} y luego invoca {@code applySort()}.
         * </p>
         */
        applyFilters() {
            this.filteredVuelos = this.vuelos.filter(v => {
                if (v.price > this.filters.precioMax) return false;

                if (!this.filters.tipoVuelo.directo && v.type === 'direct') return false;
                if (!this.filters.tipoVuelo.escala && v.type === 'layover') return false;

                if (!this.filters.claseAsiento.turista && v.class === 'TURISTA') return false;
                if (!this.filters.claseAsiento.business && v.class === 'BUSINESS') return false;

                return true;
            });

            this.applySort();
        },

        /**
         * Actualiza el estilo de fondo de la barra de rango de precio para reflejar el valor actual.
         */
        updatePriceProgress() {
            const min = 800;
            const max = 3500;
            const value = this.filters.precioMax;

            const percentage = ((value - min) / (max - min)) * 100;

            const range = document.querySelector('.form-range');
            if (range) {
                range.style.background = `
                    linear-gradient(to right, 
                        #0d6efd 0%, 
                        #0d6efd ${percentage}%, 
                        #ddd ${percentage}%, 
                        #ddd 100%)
                `;
            }
        },

        /**
         * Genera el HTML para el gráfico de ruta según el tipo de vuelo.
         *
         * @param {string} type - Tipo de vuelo ('direct' o 'layover').
         * @returns {string} HTML con el gráfico de ruta.
         */
        renderRouteGraphic(type) {
            if (type === 'direct') {
                return `
                <div class="route-direct">
                    <span class="route-dot"></span>
                    <span class="route-line"></span>
                    <i class="fa-solid fa-plane route-plane"></i>
                    <span class="route-dot"></span>
                </div>
                `;
            }

            return `
            <div class="route-layover">
                <span class="route-dot"></span>
                <span class="route-curve"></span>
                <span class="route-stop"></span>
                <i class="fa-solid fa-plane route-plane-layover"></i>
                <span class="route-dot"></span>
            </div>
            `;
        },

        /**
         * Genera el HTML de estrellas según la calificación numérica.
         *
         * @param {number} rating - Calificación (1-5).
         * @returns {string} HTML con iconos de estrellas.
         */
        renderStars(rating) {
            let html = '';
            for (let i = 1; i <= 5; i++) {
                if (i <= Math.floor(rating)) {
                    html += '<i class="fas fa-star"></i>';
                } else if (i - rating < 1 && i - rating > 0) {
                    html += '<i class="fas fa-star-half-alt"></i>';
                } else {
                    html += '<i class="far fa-star"></i>';
                }
            }
            return html;
        },

        /**
         * Inicializa el componente.
         * <p>
         * Carga los parámetros de la URL, obtiene los vuelos desde la API,
         * y si se requiere, abre el panel de filtros. Finalmente actualiza
         * el progreso de la barra de precio.
         * </p>
         *
         * @returns {Promise<void>}
         */
        async init() {
            this.loadSearchParams();
            await this.fetchVuelos();
            const query = this.getQueryParams();

            if (query.openFilters === 'true') {
                window.dispatchEvent(new CustomEvent('toggle-filters'));
            }

            this.$nextTick(() => {
                this.updatePriceProgress();
            });
        },

        /**
         * Obtiene los vuelos desde la API utilizando los parámetros de búsqueda actuales.
         * <p>
         * Realiza una petición GET a {@code /api/vuelos} con los filtros correspondientes.
         * Al recibir los datos, los mapea al formato de vista, aplica filtros y marca el mejor precio.
         * </p>
         *
         * @returns {Promise<void>}
         */
        async fetchVuelos() {
            try {
                const query = this.getQueryParams();

                const params = new URLSearchParams();

                if (query.origen) params.append("origen", query.origen);
                if (query.destino) params.append("destino", query.destino);
                if (query.fechaSalida) params.append("fechaSalida", query.fechaSalida);
                if (query.tipoAsiento) params.append("tipoAsiento", query.tipoAsiento);

                const url = params.toString()
                    ? `${API_BASE}/vuelos?${params.toString()}`
                    : `${API_BASE}/vuelos`;

                console.log("Fetching:", url); // 👈 DEBUG

                const response = await fetch(url);
                const json = await response.json();

                if (json.success) {
                    this.vuelos = json.data.map(v => this.mapBackendVuelo(v));

                    this.filteredVuelos = this.vuelos;
                    this.displayedVuelos = this.vuelos;

                    this.marcarMejorPrecio();
                }

            } catch (error) {
                console.error('Error cargando vuelos:', error);
            } finally {
                this.loading = false;
            }
        },

        /**
         * Convierte un objeto vuelo proveniente del backend al formato utilizado en la vista.
         *
         * @param {Object} v - Objeto vuelo del backend.
         * @returns {Object} Objeto normalizado con los siguientes campos:
         * @property {number} id          - Identificador único.
         * @property {string} code        - Código alfanumérico del vuelo.
         * @property {string} type        - 'direct' o 'layover'.
         * @property {string} class       - Tipo de asiento.
         * @property {number} price       - Precio base.
         * @property {Object} from        - Información de origen (city, time, zone).
         * @property {Object} to          - Información de destino (city, time, zone).
         * @property {string} duration    - Duración calculada.
         * @property {string} rating      - Calificación simulada.
         * @property {number} reviews     - Número de reseñas simulado.
         * @property {boolean} bestPrice  - Indica si es el mejor precio.
         * @property {Array} escalas      - Lista completa de escalas (si aplica).
         * @property {Object} layover     - Resumen de la primera escala para la tarjeta.
         */
        mapBackendVuelo(v) {
            const tieneEscala = v.escalas && v.escalas.length > 0;

            // Para la card de resultados mostramos solo la primera escala como resumen
            const primeraEscala = tieneEscala ? v.escalas[0] : null;

            return {
                id:    v.idVuelo,
                code:  v.codigoVuelo,
                type:  tieneEscala ? 'layover' : 'direct',
                class: v.tipoAsiento,
                price: Number(v.precioBase),

                from: {
                    city: v.origenCiudad,
                    time: formatTime(v.horaSalida),
                    zone: v.origenCodigoIata
                },
                to: {
                    city: v.destinoCiudad,
                    time: formatTime(v.horaLlegada),
                    zone: v.destinoCodigoIata
                },

                duration: this.calcularDuracion(v.horaSalida, v.horaLlegada),
                rating:   (Math.random() * 2 + 3).toFixed(1),
                reviews:  Math.floor(Math.random() * 200) + 50,
                bestPrice: false,

                escalas: tieneEscala ? v.escalas : [],

                // layover sigue siendo el resumen para la card (primera escala)
                layover: primeraEscala ? {
                    city:     primeraEscala.ciudad,
                    code:     primeraEscala.codigo,
                    duration: primeraEscala.duracion,
                    llegada:  primeraEscala.llegada,
                    salida:   primeraEscala.salida,
                    totalEscalas: v.escalas.length  // para mostrar "2 escalas" si aplica
                } : null
            };
        },

        /**
         * Calcula la duración en horas y minutos entre dos horas en formato "HH:mm".
         * <p>
         * Si la hora de llegada es menor que la de salida, se asume que corresponde al día siguiente.
         * </p>
         *
         * @param {string} horaSalida - Hora de salida (formato "HH:mm").
         * @param {string} horaLlegada - Hora de llegada (formato "HH:mm").
         * @returns {string} Duración en formato "Xh Ym".
         */
        calcularDuracion(horaSalida, horaLlegada) {
            const [hs, ms] = horaSalida.split(':').map(Number);
            const [hl, ml] = horaLlegada.split(':').map(Number);

            let inicio = hs * 60 + ms;
            let fin = hl * 60 + ml;

            if (fin < inicio) fin += 24 * 60;

            const diff = fin - inicio;
            const h = Math.floor(diff / 60);
            const m = diff % 60;

            return `${h}h ${m}m`;
        },

        /**
         * Marca el vuelo (o vuelos) con el precio base más bajo como "mejor precio".
         * <p>
         * Recorre {@code this.vuelos} y establece la propiedad {@code bestPrice = true}
         * para aquellos cuyo precio sea igual al mínimo encontrado.
         * </p>
         */
        marcarMejorPrecio() {
            if (!this.vuelos.length) return;

            const minPrice = Math.min(...this.vuelos.map(v => v.price));
            this.vuelos.forEach(v => {
                v.bestPrice = v.price === minPrice;
            });
        },

        /**
         * Navega a la vista de detalle del vuelo seleccionado.
         *
         * @param {number} id - Identificador del vuelo.
         */
        navigateToDetalle(id) {
            const pasajeros = this.searchParams?.pasajeros || 1;

            window.location.href =
                `${BASE_PATH}/views/detalle.html?id=${id}&pasajeros=${pasajeros}`;
        },

        /**
         * Convierte una duración en formato "Xh Ym" a su equivalente en minutos.
         *
         * @param {string} duration - Duración en formato "Xh Ym".
         * @returns {number} Duración total en minutos.
         */
        convertDurationToMinutes(duration) {
            const [hPart, mPart] = duration.split(' ');
            const hours = parseInt(hPart.replace('h', ''));
            const minutes = parseInt(mPart.replace('m', ''));
            return hours * 60 + minutes;
        }
    };
}