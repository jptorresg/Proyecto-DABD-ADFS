// ============================================================
// AUTH GUARD - PROTECCIÓN DE RUTAS
// ============================================================

/**
 * Verificar si el usuario tiene sesión activa
 */
function requireAuth() {
    const session = getUserSession();
    if (!session) {
        window.location.href = '/frontend/aerolinea/views/login.html';
        return false;
    }
    return true;
}

/**
 * Verificar si el usuario es ADMIN
 */
function requireAdmin() {
    const session = getUserSession();
    if (!session) {
        window.location.href = '/frontend/aerolinea/views/login.html';
        return false;
    }
    if (session.tipoUsuario !== 'ADMIN') {
        alert('Acceso denegado. Solo administradores.');
        window.location.href = '/frontend/aerolinea/views/index.html';
        return false;
    }
    return true;
}

/**
 * Verificar si el usuario ya está logueado (para login/registro)
 */
function redirectIfAuthenticated() {
    const session = getUserSession();
    if (session) {
        // Si es admin, al dashboard
        if (session.tipoUsuario === 'ADMIN') {
            window.location.href = '/frontend/aerolinea/views/admin/dashboard.html';
        } else {
            // Si es usuario normal, al home
            window.location.href = '/frontend/aerolinea/views/index.html';
        }
        return true;
    }
    return false;
}

/**
 * Bloquear acción si el usuario no está logueado
 */
function guardAction(action, errorMessage = 'Debes iniciar sesión para realizar esta acción') {
    const session = getUserSession();
    if (!session) {
        if (confirm(errorMessage + '\n\n¿Deseas iniciar sesión ahora?')) {
            window.location.href = '/frontend/aerolinea/views/login.html';
        }
        return false;
    }
    return action();
}