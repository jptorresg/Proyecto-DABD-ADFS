// ============================================================
// AUTH GUARD - PROTECCIÓN DE RUTAS
// ============================================================

/**
 * Verifica si el usuario tiene una sesión activa.
 * <p>
 * Si no hay sesión, redirige a la página de inicio de sesión.
 * </p>
 *
 * @returns {boolean} {@code true} si la sesión existe, {@code false} en caso contrario.
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
 * Verifica si el usuario tiene rol de administrador.
 * <p>
 * Si no hay sesión, redirige al login. Si el usuario no es administrador,
 * muestra una alerta y redirige a la página principal.
 * </p>
 *
 * @returns {boolean} {@code true} si el usuario es administrador, {@code false} en caso contrario.
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
 * Redirige a la página principal si el usuario ya está autenticado.
 * <p>
 * Útil para evitar que un usuario logueado acceda a las páginas de login o registro.
 * </p>
 */
function redirectIfAuthenticated() {
    const { isLoggedIn } = Utils.getSession();

    if (isLoggedIn) {
        window.location.href = `${BASE_PATH}/index.html`;
    }
}

/**
 * Bloquea una acción a menos que el usuario esté autenticado.
 * <p>
 * Si no hay sesión, muestra un diálogo de confirmación preguntando si desea iniciar sesión.
 * Si el usuario acepta, redirige al login.
 * </p>
 *
 * @param {Function} action      - Función a ejecutar si la autenticación es exitosa.
 * @param {string} [errorMessage='Debes iniciar sesión para realizar esta acción'] - Mensaje a mostrar.
 * @returns {boolean} Resultado de la ejecución de {@code action()} si hay sesión, o {@code false} si se bloquea.
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