// ===================================
// ALPINE.JS DATA COMPONENTS
// ===================================

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
        
        init() {
            this.checkSession();
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
                }
            }
        },
        
        performSearch() {
            if (this.searchQuery.trim()) {
                window.location.href = `/frontend/aerolinea/views/resultados.html?q=${encodeURIComponent(this.searchQuery)}`;
            }
        },
        
        toggleProfileMenu() {
            this.showProfileMenu = !this.showProfileMenu;
        },
        
        navigateToPerfil() {
            window.location.href = '/frontend/aerolinea/views/perfil/index.html';
        },
        
        navigateToReservaciones() {
            window.location.href = '/frontend/aerolinea/views/perfil/reservaciones.html';
        },
        
        navigateToAdmin() {
            if (this.userRole === 'ADMIN') {
                window.location.href = '/frontend/aerolinea/views/admin/dashboard.html';
            }
        },
        
        logout() {
            if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
                localStorage.removeItem('userSession');
                this.isLoggedIn = false;
                this.userName = 'Usuario';
                this.userRole = '';
                this.showProfileMenu = false;
                window.location.href = '/frontend/aerolinea/views/index.html';
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
                window.location.href = '/frontend/aerolinea/views/index.html';
                return;
            }
            
            await this.fetchDashboardData();
        },
        
        async fetchDashboardData() {
            this.isLoading = true;
            try {
                // Fetch stats
                const statsResponse = await fetch('http://localhost:8080/api/admin/estadisticas', {
                    headers: {
                        'Authorization': `Bearer ${getUserSession()?.token}`
                    }
                });
                
                if (statsResponse.ok) {
                    this.stats = await statsResponse.json();
                }
                
                // Fetch recent reservations
                const reservationsResponse = await fetch('http://localhost:8080/api/admin/reservaciones/recientes?limit=5', {
                    headers: {
                        'Authorization': `Bearer ${getUserSession()?.token}`
                    }
                });
                
                if (reservationsResponse.ok) {
                    this.recentReservations = await reservationsResponse.json();
                }
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                showNotification('Error al cargar datos del dashboard', 'error');
            } finally {
                this.isLoading = false;
            }
        },
        
        navigateTo(page) {
            window.location.href = `/frontend/aerolinea/views/admin/${page}.html`;
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
        
        async init() {
            const session = getUserSession();
            if (!session || session.tipoUsuario !== 'ADMIN') {
                alert('Acceso denegado');
                window.location.href = '/frontend/aerolinea/views/index.html';
                return;
            }
            
            await this.fetchVuelos();
        },
        
        async fetchVuelos() {
            this.isLoading = true;
            try {
                const response = await fetch('http://localhost:8080/api/vuelos', {
                    headers: {
                        'Authorization': `Bearer ${getUserSession()?.token}`
                    }
                });
                
                if (response.ok) {
                    this.vuelos = await response.json();
                    this.applyFilters();
                }
            } catch (error) {
                console.error('Error fetching vuelos:', error);
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
                const url = this.modalMode === 'create' 
                    ? 'http://localhost:8080/api/vuelos'
                    : `http://localhost:8080/api/vuelos/${this.currentVuelo.id}`;
                
                const method = this.modalMode === 'create' ? 'POST' : 'PUT';
                
                const response = await fetch(url, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${getUserSession()?.token}`
                    },
                    body: JSON.stringify(this.currentVuelo)
                });
                
                if (response.ok) {
                    showNotification(
                        this.modalMode === 'create' ? 'Vuelo creado exitosamente' : 'Vuelo actualizado exitosamente',
                        'success'
                    );
                    this.closeModal();
                    await this.fetchVuelos();
                } else {
                    throw new Error('Error al guardar vuelo');
                }
            } catch (error) {
                console.error('Error saving vuelo:', error);
                showNotification('Error al guardar vuelo', 'error');
            }
        },
        
        async deleteVuelo(vueloId) {
            if (!confirm('¿Estás seguro de eliminar este vuelo?')) return;
            
            try {
                const response = await fetch(`http://localhost:8080/api/vuelos/${vueloId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${getUserSession()?.token}`
                    }
                });
                
                if (response.ok) {
                    showNotification('Vuelo eliminado exitosamente', 'success');
                    await this.fetchVuelos();
                } else {
                    throw new Error('Error al eliminar vuelo');
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
                window.location.href = '/frontend/aerolinea/views/index.html';
                return;
            }
            
            await this.fetchUsuarios();
        },
        
        async fetchUsuarios() {
            this.isLoading = true;
            try {
                const response = await fetch('http://localhost:8080/api/admin/usuarios', {
                    headers: {
                        'Authorization': `Bearer ${getUserSession()?.token}`
                    }
                });
                
                if (response.ok) {
                    this.usuarios = await response.json();
                    this.calculateStats();
                    this.applyFilters();
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
                const response = await fetch(`http://localhost:8080/api/admin/usuarios/${usuario.id}/toggle-activo`, {
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
                const response = await fetch(`http://localhost:8080/api/admin/usuarios/${userId}/rol`, {
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
                window.location.href = '/frontend/aerolinea/views/index.html';
                return;
            }
            
            await this.fetchAgencias();
            await this.fetchUsuariosWebService();
        },
        
        async fetchAgencias() {
            this.isLoading = true;
            try {
                const response = await fetch('http://localhost:8080/api/admin/agencias', {
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
                const response = await fetch('http://localhost:8080/api/admin/usuarios?tipo=WEBSERVICE', {
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
                const response = await fetch('http://localhost:8080/api/admin/agencias', {
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
                const response = await fetch(`http://localhost:8080/api/admin/agencias/${agenciaId}/regenerate-key`, {
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
                window.location.href = '/frontend/aerolinea/views/login.html';
                return;
            }
            
            await this.fetchProfile();
        },
        
        async fetchProfile() {
            this.isLoading = true;
            try {
                const response = await fetch('http://localhost:8080/api/perfil', {
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
                const response = await fetch('http://localhost:8080/api/perfil', {
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
                const response = await fetch('http://localhost:8080/api/perfil/cambiar-password', {
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
                window.location.href = '/frontend/aerolinea/views/login.html';
                return;
            }
            
            await this.fetchReservaciones();
        },
        
        async fetchReservaciones() {
            this.isLoading = true;
            try {
                const response = await fetch('http://localhost:8080/api/reservaciones/mis-reservaciones', {
                    headers: {
                        'Authorization': `Bearer ${getUserSession()?.token}`
                    }
                });
                
                if (response.ok) {
                    this.reservaciones = await response.json();
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
                const response = await fetch(`http://localhost:8080/api/reservaciones/${codigoReservacion}/pdf`, {
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
                const response = await fetch(`http://localhost:8080/api/reservaciones/${reservacionId}/cancelar`, {
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

// Función global para mostrar notificaciones
function showNotification(message, type = 'info', duration = 3000) {
    // Emitir evento personalizado que el componente de notificaciones escuchará
    window.dispatchEvent(new CustomEvent('show-notification', {
        detail: { message, type, duration }
    }));
}

// ===================================
// UTILIDADES GLOBALES
// ===================================

function saveUserSession(userData) {
    localStorage.setItem('userSession', JSON.stringify(userData));
}

function getUserSession() {
    const session = localStorage.getItem('userSession');
    return session ? JSON.parse(session) : null;
}

function clearUserSession() {
    localStorage.removeItem('userSession');
}

// Formatear moneda
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-GT', {
        style: 'currency',
        currency: 'GTQ'
    }).format(amount);
}

// Formatear fecha
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('es-GT', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Formatear hora
function formatTime(timeString) {
    return timeString.substring(0, 5); // HH:MM
}