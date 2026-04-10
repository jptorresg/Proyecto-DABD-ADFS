// ============================================================
// UTILS.JS - SISTEMA DE SESIÓN UNIFICADO
// ============================================================

// ⭐ FUNCIONES GLOBALES (las que usa Alpine)

/**
 * Guarda la sesión del usuario en el almacenamiento local.
 *
 * @param {Object} userData - Datos del usuario a almacenar en la sesión.
 */
function saveUserSession(userData) {
    console.log('💾 Guardando sesión en userSession:', userData);
    localStorage.setItem('userSession', JSON.stringify(userData));
    localStorage.setItem('isLoggedIn', 'true');
}

/**
 * Obtiene la sesión del usuario desde el almacenamiento local.
 * <p>
 * Si no hay sesión, devuelve {@code null}.
 * </p>
 *
 * @returns {Object|null} La sesión del usuario, o {@code null} si no hay sesión.
 */
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

/**
 * Limpia la sesión del usuario en el almacenamiento local.
 * <p>
 * Elimina las propiedades {@code userSession}, {@code isLoggedIn} y {@code user}.
 * </p>
 */
function clearUserSession() {
    console.log('🗑️ Limpiando sesión');
    localStorage.removeItem('userSession');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user'); // Por si acaso quedó basura
}

// ⭐ OBJETO Utils (compatibilidad con código viejo)
window.Utils = {
    /**
     * Guarda la sesión del usuario en el almacenamiento local.
     * <p>
     * Delega en {@link saveUserSession} para mantener un sistema unificado.
     * </p>
     * 
     * @param {Object} user - Información del usuario.
     */
    saveSession(user) {
        saveUserSession(user); // ← Redirigir al sistema unificado
    },

    /**
     * Obtiene la sesión del usuario actual.
     * <p>
     * Devuelve un objeto con dos propiedades:
     * <ul>
     *   <li>{@code isLoggedIn}: indica si hay una sesión activa (boolean).</li>
     *   <li>{@code user}: información del usuario (Object).</li>
     * </ul>
     * </p>
     *
     * @returns {Object} Un objeto con las propiedades {@code isLoggedIn} y {@code user}.
     */
    getSession() {
        const user = getUserSession();
        const isLoggedIn = !!user;
        return { isLoggedIn, user };
    },

    /**
     * Limpia la sesión del usuario en el almacenamiento local.
     * <p>
     * Delega en {@link clearUserSession}.
     * </p>
     */
    clearSession() {
        clearUserSession();
    }
};

/**
 * Cierra la sesión del usuario actual.
 * <p>
     * Solicita confirmación al usuario antes de eliminar la sesión.
     * Si se acepta, limpia la sesión y redirige a la página de inicio.
     * </p>
     *
     * @example
     * logout();
     */
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

/**
 * Formatea un valor numérico como moneda guatemalteca (GTQ).
 *
 * @param {number} amount - Cantidad a formatear.
 * @returns {string} Cadena formateada en quetzales.
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-GT', {
        style: 'currency',
        currency: 'GTQ'
    }).format(amount);
}

/**
 * Formatea una fecha en formato "día de mes de año" en español de Guatemala.
 * <p>
 * Recibe una cadena de fecha en formato ISO 8601 (YYYY-MM-DD) y devuelve
 * la fecha formateada según la configuración regional {@code es-GT}.
 * </p>
 *
 * @param {string} dateString - Cadena de fecha en formato ISO 8601.
 * @returns {string} Fecha formateada (ej. "1 de enero de 2022").
 * @example
 * formatDate('2022-01-01'); // "1 de enero de 2022"
 */
function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00'); 
    return date.toLocaleDateString('es-GT', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Extrae la parte de la hora de una cadena de tiempo ISO.
 * <p>
 * Recibe una cadena en formato "HH:MM" o "YYYY-MM-DDTHH:MM:SS" y devuelve
 * únicamente los primeros 5 caracteres (HH:MM).
 * </p>
 *
 * @param {string} timeString - Cadena que contiene la hora.
 * @returns {string} Hora en formato "HH:MM".
 * @example
 * formatTime('2022-01-01T08:45:00'); // "08:45"
 */
function formatTime(timeString) {
    return timeString.substring(0, 5); // HH:MM
}

// ⭐ NOTIFICACIONES

/**
 * Muestra una notificación en la interfaz disparando un evento personalizado.
 *
 * @param {string} message - Mensaje a mostrar.
 * @param {string} [type='info'] - Tipo de notificación ('info', 'success', 'warning', 'danger').
 * @param {number} [duration=3000] - Duración en milisegundos.
 */
function showNotification(message, type = 'info', duration = 3000) {
    window.dispatchEvent(new CustomEvent('show-notification', {
        detail: { message, type, duration }
    }));
}

console.log('✅ utils.js cargado - Sistema de sesión UNIFICADO en userSession');