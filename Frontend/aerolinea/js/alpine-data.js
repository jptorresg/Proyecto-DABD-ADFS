// ===================================
// ALPINE.JS DATA COMPONENTS
// ===================================

// Datos del Header
function headerData() {
    return {
        isLoggedIn: false,
        userName: 'Usuario',
        searchQuery: '',
        showProfileMenu: false,
        
        init() {
            // Verificar si hay sesión guardada
            this.checkSession();
        },
        
        checkSession() {
            const session = localStorage.getItem('userSession');
            if (session) {
                try {
                    const userData = JSON.parse(session);
                    this.isLoggedIn = true;
                    this.userName = userData.nombres || 'Usuario';
                } catch (e) {
                    console.error('Error parsing session:', e);
                }
            }
        },
        
        performSearch() {
            if (this.searchQuery.trim()) {
                console.log('Buscando:', this.searchQuery);
                // Redirigir a página de resultados con query
                window.location.href = `/frontend/aerolinea/views/resultados.html?q=${encodeURIComponent(this.searchQuery)}`;
            }
        },
        
        toggleFilters() {
            console.log('Toggle filtros');
            // Implementación futura
        },
        
        toggleProfileMenu() {
            this.showProfileMenu = !this.showProfileMenu;
        },
        
        logout() {
            if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
                localStorage.removeItem('userSession');
                this.isLoggedIn = false;
                this.userName = 'Usuario';
                this.showProfileMenu = false;
                
                // Mostrar notificación
                console.log('Sesión cerrada');
                
                // Opcional: redirigir al home
                window.location.href = '/frontend/aerolinea/views/index.html';
            }
        }
    };
}

// Datos de las Info Cards
function infoCardsData() {
    return {
        navigateToHotels() {
            console.log('Navegando a hoteles...');
            // En producción: window.location.href = '/frontend/hotel/views/index.html';
            alert('Funcionalidad de hoteles aliados próximamente...');
        },
        
        navigateToAgency() {
            console.log('Navegando a agencia...');
            // En producción: window.location.href = '/frontend/agencia/views/index.html';
            alert('Funcionalidad de agencia de viajes próximamente...');
        }
    };
}

// ===================================
// UTILIDADES GLOBALES
// ===================================

// Función para guardar sesión de usuario
function saveUserSession(userData) {
    localStorage.setItem('userSession', JSON.stringify(userData));
}

// Función para obtener sesión de usuario
function getUserSession() {
    const session = localStorage.getItem('userSession');
    return session ? JSON.parse(session) : null;
}

// Función para limpiar sesión
function clearUserSession() {
    localStorage.removeItem('userSession');
}