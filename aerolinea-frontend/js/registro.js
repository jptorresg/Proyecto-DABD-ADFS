// ============================================================
// REGISTRO - ALPINE.JS DATA COMPONENT
// ============================================================

/**
 * Crea y retorna el objeto `registroData` para Alpine.js, responsable del
 * formulario de registro de nuevos usuarios.
 *
 * @returns {Object} Un objeto Alpine con las siguientes propiedades y métodos:
 * @property {Object} formData - Datos del formulario de registro.
 * @property {Object} captcha - Datos de la pregunta CAPTCHA.
 * @property {boolean} showPassword - Controla la visibilidad de la contraseña.
 * @property {boolean} showConfirmPassword - Controla la visibilidad de la confirmación.
 * @property {boolean} termsAccepted - Indica si se aceptaron los términos.
 * @property {boolean} isLoading - Indica si se está procesando el registro.
 * @property {string} passwordStrength - (getter) Nivel de fortaleza de la contraseña.
 * @property {string} passwordStrengthText - (getter) Texto descriptivo de la fortaleza.
 * @property {boolean} passwordsMatch - (getter) Indica si las contraseñas coinciden.
 * @property {Function} init - Inicializa el componente.
 * @property {Function} generateCaptcha - Genera una nueva pregunta CAPTCHA.
 * @property {Function} submitRegistro - Envía el formulario de registro a la API.
 */
function registroData() {
    return {
        // Datos del formulario
        formData: {
            email: '',
            password: '',
            confirmPassword: '',
            nombres: '',
            apellidos: '',
            edad: '',
            codigoPais: '',
            numPasaporte: ''
        },
        
        // CAPTCHA
        captcha: {
            num1: 0,
            num2: 0,
            operation: '+',
            answer: '',
            correctAnswer: 0
        },
        
        // Toggles de contraseña
        showPassword: false,
        showConfirmPassword: false,
        
        // Términos
        termsAccepted: false,
        
        // Estado
        isLoading: false,

        /**
         * Getter que devuelve la pregunta CAPTCHA formateada.
         *
         * @returns {string} Pregunta CAPTCHA (ej. "¿Cuánto es 3 + 5?").
         */
        get captchaQuestion() {
            return `¿Cuánto es ${this.captcha.num1} ${this.captcha.operation} ${this.captcha.num2}?`;
        },

        /**
         * Getter que evalúa la fortaleza de la contraseña.
         *
         * @returns {string} 'weak' si < 8 caracteres, 'medium' si < 12, 'strong' si >= 12.
         */
        get passwordStrength() {
            const pwd = this.formData.password;
            if (pwd.length === 0) return '';
            if (pwd.length < 8) return 'weak';
            if (pwd.length < 12) return 'medium';
            return 'strong';
        },

        /**
         * Getter que devuelve el texto descriptivo de la fortaleza de la contraseña.
         *
         * @returns {string} Mensaje indicando la fortaleza.
         */
        get passwordStrengthText() {
            const strength = this.passwordStrength;
            if (strength === 'weak') return '⚠️ Contraseña débil';
            if (strength === 'medium') return '✓ Contraseña media';
            if (strength === 'strong') return '✓✓ Contraseña fuerte';
            return '';
        },

        /**
         * Getter que verifica si la contraseña y su confirmación coinciden.
         *
         * @returns {boolean} {@code true} si coinciden y no están vacías.
         */
        get passwordsMatch() {
            return this.formData.password === this.formData.confirmPassword && 
                   this.formData.confirmPassword.length > 0;
        },

        /**
         * Inicializa el componente.
         * <p>
         * Redirige a la página principal si el usuario ya está autenticado.
         * Genera la primera pregunta CAPTCHA.
         * </p>
         */
        init() {
            // Si ya está logueado, redirigir
            redirectIfAuthenticated();
            this.generateCaptcha();
        },

        /**
         * Genera una nueva pregunta CAPTCHA con dos números y una operación aleatoria.
         */
        generateCaptcha() {
            this.captcha.num1 = Math.floor(Math.random() * 10) + 1;
            this.captcha.num2 = Math.floor(Math.random() * 10) + 1;
            const operations = ['+', '-', '×'];
            this.captcha.operation = operations[Math.floor(Math.random() * operations.length)];

            switch(this.captcha.operation) {
                case '+':
                    this.captcha.correctAnswer = this.captcha.num1 + this.captcha.num2;
                    break;
                case '-':
                    this.captcha.correctAnswer = this.captcha.num1 - this.captcha.num2;
                    break;
                case '×':
                    this.captcha.correctAnswer = this.captcha.num1 * this.captcha.num2;
                    break;
            }

            this.captcha.answer = '';
        },

        /**
         * Envía el formulario de registro a la API para crear una nueva cuenta.
         * <p>
         * Realiza validaciones de campos obligatorios, coincidencia de contraseñas,
         * longitud mínima, respuesta CAPTCHA y aceptación de términos.
         * </p>
         *
         * @returns {Promise<void>}
         */
        async submitRegistro() {
            // Validaciones
            if (!this.formData.email || !this.formData.password || !this.formData.nombres || 
                !this.formData.apellidos || !this.formData.edad || !this.formData.codigoPais || 
                !this.formData.numPasaporte) {
                showNotification('Por favor completa todos los campos obligatorios', 'error');
                return;
            }

            if (this.formData.password !== this.formData.confirmPassword) {
                showNotification('Las contraseñas no coinciden', 'error');
                return;
            }

            if (this.formData.password.length < 8) {
                showNotification('La contraseña debe tener al menos 8 caracteres', 'error');
                return;
            }

            if (parseInt(this.captcha.answer) !== this.captcha.correctAnswer) {
                showNotification('Respuesta CAPTCHA incorrecta', 'error');
                this.generateCaptcha();
                return;
            }

            if (!this.termsAccepted) {
                showNotification('Debes aceptar los Términos y Condiciones', 'error');
                return;
            }

            this.isLoading = true;

            try {
                const response = await fetch(`${API_BASE}/auth/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: this.formData.email,
                        password: this.formData.password,
                        nombres: this.formData.nombres,
                        apellidos: this.formData.apellidos,
                        edad: parseInt(this.formData.edad),
                        codigoPais: this.formData.codigoPais,
                        numPasaporte: this.formData.numPasaporte
                    })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    showNotification('¡Registro exitoso! Redirigiendo al login...', 'success');
                    setTimeout(() => {
                        window.location.href = 'aerolineas/views/login.html';
                    }, 2000);
                } else {
                    throw new Error(data.message || 'Error al registrar usuario');
                }
            } catch (error) {
                console.error('Error:', error);
                showNotification(error.message || 'Error al registrar usuario', 'error');
            } finally {
                this.isLoading = false;
            }
        }
    };
}

if (typeof module !== 'undefined') {
    module.exports = { registroData };
}