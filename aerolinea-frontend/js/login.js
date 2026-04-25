// ============================================================
// LOGIN - ALPINE.JS DATA COMPONENT
// ============================================================

/**
 * Crea y retorna el objeto `loginData` para Alpine.js, responsable del
 * formulario de inicio de sesión y recuperación de contraseña.
 *
 * @returns {Object} Un objeto Alpine con las siguientes propiedades y métodos:
 * @property {string} email - Correo electrónico del usuario.
 * @property {string} password - Contraseña del usuario.
 * @property {boolean} rememberMe - Indica si se debe recordar el correo.
 * @property {boolean} showPassword - Controla la visibilidad de la contraseña.
 * @property {boolean} showForgotModal - Controla la visibilidad del modal de recuperación.
 * @property {string} recoveryEmail - Correo para enviar el enlace de recuperación.
 * @property {boolean} isSendingRecovery - Indica si se está enviando la solicitud de recuperación.
 * @property {boolean} isLoading - Indica si se está procesando el inicio de sesión.
 * @property {Function} init - Inicializa el componente.
 * @property {Function} submitLogin - Procesa el inicio de sesión.
 * @property {Function} loginWithGoogle - Inicia sesión con Google (próximamente).
 * @property {Function} sendRecoveryEmail - Envía el correo de recuperación de contraseña.
 */
function loginData() {
    return {
        // Datos del formulario
        email: '',
        password: '',
        rememberMe: false,
        showPassword: false,
        
        // Modal recuperación
        showForgotModal: false,
        recoveryEmail: '',
        isSendingRecovery: false,
        
        // Estado
        isLoading: false,

        /**
         * Inicializa el componente.
         * <p>
         * Redirige a la página principal si el usuario ya está autenticado.
         * Carga el correo electrónico recordado desde el almacenamiento local.
         * </p>
         */
        init() {
            // Si ya está logueado, redirigir
            redirectIfAuthenticated();
            
            // Cargar email si existe
            const remembered = localStorage.getItem('rememberedEmail');
            if (remembered) {
                this.email = remembered;
                this.rememberMe = true;
            }
        },

        /**
         * Procesa el inicio de sesión enviando las credenciales a la API.
         * <p>
         * Valida los campos, envía una petición POST a {@code /api/auth/login},
         * guarda la sesión del usuario y redirige según el rol.
         * </p>
         *
         * @returns {Promise<void>}
         */
        async submitLogin() {
            // Validaciones
            if (!this.email || !this.password) {
                showNotification('Por favor completa todos los campos', 'error');
                return;
            }

            // Validar formato email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(this.email)) {
                showNotification('Por favor ingresa un correo válido', 'error');
                return;
            }

            this.isLoading = true;

            try {
                const response = await fetch(`${API_BASE}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        email: this.email,
                        password: this.password
                    })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    console.log('Datos del usuario recibidos:', data.data);
                    if (!data.data.idUsuario) {
                        console.error('⚠️ WARNING: idUsuario no viene en la respuesta!');
                    }
                    
                    // Guardar sesión
                    saveUserSession(data.data);

                    // Guardar email si "recordarme" está activo
                    if (this.rememberMe) {
                        localStorage.setItem('rememberedEmail', this.email);
                    } else {
                        localStorage.removeItem('rememberedEmail');
                    }

                    showNotification('¡Inicio de sesión exitoso!', 'success');

                    // Redirigir según rol
                    setTimeout(() => {
                        if (data.data.tipoUsuario === 'ADMIN') {
                            window.location.href = `${BASE_PATH}/views/admin/dashboard.html`;
                        } else {
                            window.location.href = `${BASE_PATH}/views/index.html`;
                        }
                    }, 1000);
                } else {
                    throw new Error(data.message || 'Credenciales incorrectas');
                }
            } catch (error) {
                console.error('Error:', error);
                showNotification(error.message || 'Error al iniciar sesión', 'error');
            } finally {
                this.isLoading = false;
            }
        },

        /**
         * Inicia el flujo de autenticación con Google (funcionalidad en desarrollo).
         */
        loginWithGoogle() {
            showNotification('Funcionalidad de Google OAuth próximamente', 'info');
            // En producción: window.location.href = '/auth/google';
        },

        /**
         * Envía un correo de recuperación de contraseña al email proporcionado.
         * <p>
         * Actualmente es una simulación (no realiza llamada real a la API).
         * </p>
         *
         * @returns {Promise<void>}
         */
        async sendRecoveryEmail() {
            if (!this.recoveryEmail) {
                showNotification('Por favor ingresa tu correo', 'error');
                return;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(this.recoveryEmail)) {
                showNotification('Por favor ingresa un correo válido', 'error');
                return;
            }

            this.isSendingRecovery = true;

            try {
                // Simular API call
                // const response = await fetch('/api/auth/forgot-password', {
                //     method: 'POST',
                //     headers: { 'Content-Type': 'application/json' },
                //     body: JSON.stringify({ email: this.recoveryEmail })
                // });

                // Simular delay
                await new Promise(resolve => setTimeout(resolve, 1500));

                showNotification(`Enlace de recuperación enviado a ${this.recoveryEmail}`, 'success');

                // Cerrar modal y limpiar
                setTimeout(() => {
                    this.showForgotModal = false;
                    this.recoveryEmail = '';
                }, 1500);

            } catch (error) {
                console.error('Error:', error);
                showNotification('Error al enviar el enlace de recuperación', 'error');
            } finally {
                this.isSendingRecovery = false;
            }
        }
    };
}

if (typeof module !== 'undefined') {
    module.exports = { loginData };
}