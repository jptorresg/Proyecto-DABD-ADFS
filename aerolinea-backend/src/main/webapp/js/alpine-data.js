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
function headerData() {
    return {
        isLoggedIn: false,
        userName: 'Usuario',
        userRole: '', // 'ADMIN', 'REGISTRADO', 'WEBSERVICE'
        searchQuery: '',
        showProfileMenu: false,
        showFilters: false,

        filters: {
            origen: '',
            destino: '',
            fechaSalida: '',
        },

        toggleFilters() {
            this.showFilters = !this.showFilters;
        },

        applyFilters() {
            const params = new URLSearchParams(this.filters).toString();
            window.location.href = `${BASE_PATH}/views/resultados.html?${params}`;
        },
        
        init() {
            this.checkSession();
            window.addEventListener('toggle-filters', () => {
                this.showFilters = true;
            });
        },
        
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
        
        // Verificar si el usuario tiene acceso a una ruta
        canAccess(requiredRole) {
            if (!this.isLoggedIn && requiredRole) return false;
            if (requiredRole === 'ADMIN' && this.userRole !== 'ADMIN') return false;
            return true;
        },
        
        performSearch() {
            if (this.searchQuery.trim()) {
                window.location.href = `${BASE_PATH}/views/resultados.html?q=${encodeURIComponent(this.searchQuery)}`;
            }
        },
        
        toggleProfileMenu() {
            this.showProfileMenu = !this.showProfileMenu;
        },
        
        navigateToPerfil() {
            window.location.href = `${BASE_PATH}/views/perfil/index.html`;
        },
        
        navigateToReservaciones() {
            window.location.href = `${BASE_PATH}/views/perfil/reservaciones.html`;
        },
        
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
function infoCardsData() {
    return {
        navigateToHotels() {
            alert('Funcionalidad de hoteles aliados próximamente...');
        },
        
        navigateToAgency() {
            alert('Funcionalidad de agencia de viajes próximamente...');
        }
    };
}

// ==================
// 3. ADMIN DASHBOARD DATA
// ==================
function dashboardData() {
    return {
        stats: {
            vuelosActivos: 0,
            reservacionesMes: 0,
            usuariosRegistrados: 0,
            ingresosEstimados: 0
        },
        recentReservations: [],
        isLoading: true,
        
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
                    }
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
        
        navigateTo(page) {
            window.location.href = `${BASE_PATH}/views/admin/${page}.html`;
        }
    };
}

// ==================
// 4. ADMIN VUELOS DATA
// ==================
function vuelosAdminData() {
    return {
        vuelos: [],
        filteredVuelos: [],
        filters: {
            estado: 'TODOS',
            search: ''
        },
        pagination: {
            currentPage: 1,
            perPage: 10,
            total: 0
        },
        showModal: false,
        modalMode: 'create', // 'create' o 'edit'
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
        isLoading: true,

        getQueryParams() {
            const params = new URLSearchParams(window.location.search);

            return {
                origen: params.get("origen"),
                destino: params.get("destino"),
                fechaSalida: params.get("fechaSalida"),
                tipoAsiento: params.get("tipoAsiento")
            };
        },

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

                // ⭐ FALTABAN
                fechaLlegada: v.fechaLlegada,
                horaLlegada: v.horaLlegada,

                tipoAsiento: v.tipoAsiento,
                precioBase: Number(v.precioBase),
                asientosDisponibles: v.asientosDisponibles,
                asientosTotales: v.asientosTotales,
                estado: v.estado
            };
        },

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

        marcarMejorPrecio() {
            if (!this.vuelos.length) return;

            const minPrice = Math.min(...this.vuelos.map(v => v.precioBase));
            this.vuelos.forEach(v => {
                v.bestPrice = v.precioBase === minPrice;
            });
        },
        
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
        
        get paginatedVuelos() {
            const start = (this.pagination.currentPage - 1) * this.pagination.perPage;
            const end = start + this.pagination.perPage;
            return this.filteredVuelos.slice(start, end);
        },
        
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
        
        openEditModal(vuelo) {
            this.modalMode = 'edit';
            this.currentVuelo = { ...vuelo };
            this.showModal = true;
        },
        
        closeModal() {
            this.showModal = false;
            this.currentVuelo = {};
        },
        
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
                    headers: {
                        'Content-Type': 'application/json'
                    },
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
        
        generateVueloCode() {
            return `HC-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
        }
    };
}

// ==================
// 5. ADMIN USUARIOS DATA
// ==================
function usuariosAdminData() {
    return {
        usuarios: [],
        filteredUsuarios: [],
        filters: {
            tipo: 'TODOS',
            estado: 'TODOS',
            search: ''
        },
        stats: {
            total: 0,
            admins: 0,
            registrados: 0,
            webservices: 0
        },
        pagination: {
            currentPage: 1,
            perPage: 20,
            total: 0
        },
        isLoading: true,
        
        async init() {
            const session = getUserSession();
            if (!session || session.tipoUsuario !== 'ADMIN') {
                alert('Acceso denegado');
                window.location.href = `${BASE_PATH}/views/index.html`;
                return;
            }
            
            await this.fetchUsuarios();
        },
        
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
        
        calculateStats() {
            this.stats.total = this.usuarios.length;
            this.stats.admins = this.usuarios.filter(u => u.tipoUsuario === 'ADMIN').length;
            this.stats.registrados = this.usuarios.filter(u => u.tipoUsuario === 'REGISTRADO').length;
            this.stats.webservices = this.usuarios.filter(u => u.tipoUsuario === 'WEBSERVICE').length;
        },
        
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
        
        get paginatedUsuarios() {
            const start = (this.pagination.currentPage - 1) * this.pagination.perPage;
            const end = start + this.pagination.perPage;
            return this.filteredUsuarios.slice(start, end);
        },
        
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
function agenciasAdminData() {
    return {
        agencias: [],
        showModal: false,
        showApiKeyModal: false,
        generatedApiKey: '',
        currentAgencia: {
            nombre: '',
            usuarioWebServiceId: '',
            descuento: 0
        },
        usuariosWebService: [],
        isLoading: true,
        
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
        
        openCreateModal() {
            this.currentAgencia = {
                nombre: '',
                usuarioWebServiceId: '',
                descuento: 0
            };
            this.showModal = true;
        },
        
        closeModal() {
            this.showModal = false;
            this.currentAgencia = {};
        },
        
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
        
        copyToClipboard(text) {
            navigator.clipboard.writeText(text).then(() => {
                showNotification('API Key copiada al portapapeles', 'success');
            });
        },
        
        closeApiKeyModal() {
            this.showApiKeyModal = false;
            this.generatedApiKey = '';
        }
    };
}

// ==================
// 7. PERFIL DATA
// ==================

function perfilData() {
    return {
        usuario: {},
        editMode: false,
        showPasswordModal: false,
        passwordData: {
            actual: '',
            nueva: '',
            confirmar: ''
        },
        isLoading: true,
        
        async init() {
            const session = getUserSession();
            if (!session) {
                window.location.href = `${BASE_PATH}/views/login.html`;
                return;
            }
            
            await this.fetchProfile();
        },
        
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
        
        toggleEditMode() {
            this.editMode = !this.editMode;
        },
        
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
        
        openPasswordModal() {
            this.passwordData = { actual: '', nueva: '', confirmar: '' };
            this.showPasswordModal = true;
        },
        
        closePasswordModal() {
            this.showPasswordModal = false;
            this.passwordData = { actual: '', nueva: '', confirmar: '' };
        },
        
        validatePassword() {
            if (this.passwordData.nueva.length < 8) {
                return 'La contraseña debe tener al menos 8 caracteres';
            }
            if (this.passwordData.nueva !== this.passwordData.confirmar) {
                return 'Las contraseñas no coinciden';
            }
            return null;
        },
        
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
function reservacionesData() {
    return {
        reservaciones: [],
        filteredReservaciones: [],
        filtroActivo: 'todas', // 'todas', 'confirmadas', 'pendientes', 'canceladas'
        isLoading: true,
        
        async init() {
            const session = getUserSession();
            if (!session) {
                window.location.href = `${BASE_PATH}/views/login.html`;
                return;
            }
            
            await this.fetchReservaciones();
        },
        
        async fetchReservaciones() {
            this.isLoading = true;
            try {
                const response = await fetch(`${API_BASE}/reservaciones/mis-reservaciones`, { //***revisar
                    headers: {
                        'Authorization': `Bearer ${getUserSession()?.token}`
                    }
                });
                
                const result = await response.json();


                if (response.ok && result.success) {
                    this.reservaciones = result.data;;
                    this.filtrarReservaciones();
                }
            } catch (error) {
                console.error('Error fetching reservaciones:', error);
                showNotification('Error al cargar reservaciones', 'error');
            } finally {
                this.isLoading = false;
            }
        },
        
        filtrarReservaciones() {
            if (this.filtroActivo === 'todas') {
                this.filteredReservaciones = this.reservaciones;
            } else {
                this.filteredReservaciones = this.reservaciones.filter(r => 
                    r.estado.toLowerCase() === this.filtroActivo
                );
            }
        },
        
        cambiarFiltro(filtro) {
            this.filtroActivo = filtro;
            this.filtrarReservaciones();
        },
        
        async descargarPDF(codigoReservacion) {
            try {
                const response = await fetch(`${API_BASE}/reservaciones/${codigoReservacion}/pdf`, {
                    headers: {
                        'Authorization': `Bearer ${getUserSession()?.token}`
                    }
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
        
        async cancelarReservacion(reservacionId) {
            if (!confirm('¿Estás seguro de cancelar esta reservación?')) return;
            
            try {
                const response = await fetch(`${API_BASE}/reservaciones/${reservacionId}/cancelar`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${getUserSession()?.token}`
                    }
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
function notificationsData() {
    return {
        notifications: [],
        
        show(message, type = 'info', duration = 3000) {
            const id = Date.now();
            this.notifications.push({ id, message, type });
            
            setTimeout(() => {
                this.remove(id);
            }, duration);
        },
        
        remove(id) {
            this.notifications = this.notifications.filter(n => n.id !== id);
        }
    };
}

// ==================
// 10. RESULTADOS DATA
// ==================
function resultadosData() {
    return {
        vuelos: [],
        filteredVuelos: [],
        displayedVuelos: [],
        loading: true,
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
        sortBy: 'price-asc',
        searchParams:{
            origen: '',
            destino: '',
            fechaSalida: '',
            pasajeros: 1,
            tipoViaje: 'ida'
        },

        loadSearchParams() {
            const query = this.getQueryParams();

            this.searchParams.origen = query.origen || '';
            this.searchParams.destino = query.destino || '';
            this.searchParams.fechaSalida = query.fechaSalida || '';
            this.searchParams.pasajeros = query.pasajeros || 1;
            this.searchParams.tipoViaje = query.tipoViaje || 'ida';
            this.searchParams.pasajeros = query.pasajeros ? parseInt(query.pasajeros) : 1;
        },

        openFiltersWithCurrentValues() {
            this.filters.origen = this.searchParams.origen;
            this.filters.destino = this.searchParams.destino;
            this.filters.fechaSalida = this.searchParams.fechaSalida;
            this.filters.pasajeros = this.searchParams.pasajeros;

            this.showFilters = true;
        },

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

        mapBackendVuelo(v) {
            return {
                id: v.idVuelo,
                code: v.codigoVuelo,
                type: 'direct', // luego puedes calcular escalas
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

                duration: this.calcularDuracion(
                    v.horaSalida,
                    v.horaLlegada
                ),

                rating: (Math.random() * 2 + 3).toFixed(1),
                reviews: Math.floor(Math.random() * 200) + 50,

                bestPrice: false,
                layover: null
            };
        },

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

        marcarMejorPrecio() {
            if (!this.vuelos.length) return;

            const minPrice = Math.min(...this.vuelos.map(v => v.price));
            this.vuelos.forEach(v => {
                v.bestPrice = v.price === minPrice;
            });
        },

        navigateToDetalle(id) {
            const pasajeros = this.searchParams?.pasajeros || 1;

            window.location.href =
                `${BASE_PATH}/views/detalle.html?id=${id}&pasajeros=${pasajeros}`;
        },

        convertDurationToMinutes(duration) {
            const [hPart, mPart] = duration.split(' ');
            const hours = parseInt(hPart.replace('h', ''));
            const minutes = parseInt(mPart.replace('m', ''));
            return hours * 60 + minutes;
        }
    };
}