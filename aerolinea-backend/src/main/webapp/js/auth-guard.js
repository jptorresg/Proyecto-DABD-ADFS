// ============================================================
// AUTH GUARD - PROTECCIÓN DE RUTAS
// ============================================================

/**
 * Verificar si el usuario tiene sesión activa
 */
function requireAuth() {
    const session = getUserSession();
    if (!session) {
        window.location.href = `${BASE_PATH}/views/login.html`;
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
        window.location.href = `${BASE_PATH}/views/login.html`;
        return false;
    }
    if (session.tipoUsuario !== 'ADMIN') {
        alert('Acceso denegado. Solo administradores.');
        window.location.href = `${BASE_PATH}/views/index.html`;
        return false;
    }
    return true;
}

/**
 * Verificar si el usuario ya está logueado (para login/registro)
 */
function redirectIfAuthenticated() {
    const { isLoggedIn } = Utils.getSession();

    if (isLoggedIn) {
        window.location.href = `${BASE_PATH}/index.html`;
    }
}

/**
 * Bloquear acción si el usuario no está logueado
 */
function guardAction(action, errorMessage = 'Debes iniciar sesión para realizar esta acción') {
    const session = getUserSession();
    if (!session) {
        if (confirm(errorMessage + '\n\n¿Deseas iniciar sesión ahora?')) {
            window.location.href = `${BASE_PATH}/views/login.html`;
        }
        return false;
    }
    return action();
}