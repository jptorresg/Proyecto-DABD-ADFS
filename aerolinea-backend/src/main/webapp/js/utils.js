// ============================================================
// UTILS.JS - SISTEMA DE SESIÓN UNIFICADO
// ============================================================

// ⭐ FUNCIONES GLOBALES (las que usa Alpine)
function saveUserSession(userData) {
    console.log('💾 Guardando sesión en userSession:', userData);
    localStorage.setItem('userSession', JSON.stringify(userData));
    localStorage.setItem('isLoggedIn', 'true');
}

function getUserSession() {
    const session = localStorage.getItem('userSession');
    if (!session) {
        console.log('❌ No hay sesión en userSession');
        return null;
    }
    
    try {
        const userData = JSON.parse(session);
        console.log('📦 Sesión leída de userSession:', userData);
        return userData;
    } catch (e) {
        console.error('Error parsing userSession:', e);
        return null;
    }
}

function clearUserSession() {
    console.log('🗑️ Limpiando sesión');
    localStorage.removeItem('userSession');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user'); // Por si acaso quedó basura
}

// ⭐ OBJETO Utils (compatibilidad con código viejo)
window.Utils = {
    saveSession(user) {
        saveUserSession(user); // ← Redirigir al sistema unificado
    },

    getSession() {
        const user = getUserSession();
        const isLoggedIn = !!user;
        return { isLoggedIn, user };
    },

    clearSession() {
        clearUserSession();
    }
};

function logout() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        localStorage.removeItem('userSession');
        this.isLoggedIn = false;
        this.userName = 'Usuario';
        this.userRole = '';
        this.showProfileMenu = false;
        window.location.href = `${BASE_PATH}/views/index.html`;
    }
}

// ⭐ FORMATEO (mover aquí desde alpine-data.js)
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-GT', {
        style: 'currency',
        currency: 'GTQ'
    }).format(amount);
}

function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00'); 
    return date.toLocaleDateString('es-GT', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatTime(timeString) {
    return timeString.substring(0, 5); // HH:MM
}

// ⭐ NOTIFICACIONES
function showNotification(message, type = 'info', duration = 3000) {
    window.dispatchEvent(new CustomEvent('show-notification', {
        detail: { message, type, duration }
    }));
}

console.log('✅ utils.js cargado - Sistema de sesión UNIFICADO en userSession');