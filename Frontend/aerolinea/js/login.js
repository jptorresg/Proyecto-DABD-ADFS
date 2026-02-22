// ============================================================
// LOGIN - ALPINE.JS DATA COMPONENT
// ============================================================

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

        // Inicialización
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

        // Submit login
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
                const response = await fetch('http://localhost:8080/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: this.email,
                        password: this.password
                    })
                });

                const data = await response.json();

                if (response.ok && data.success) {
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
                            window.location.href = '/frontend/aerolinea/views/admin/dashboard.html';
                        } else {
                            window.location.href = '/frontend/aerolinea/views/index.html';
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

        // Login con Google
        loginWithGoogle() {
            showNotification('Funcionalidad de Google OAuth próximamente', 'info');
            // En producción: window.location.href = '/auth/google';
        },

        // Enviar email de recuperación
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