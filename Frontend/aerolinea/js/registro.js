// ============================================================
// REGISTRO - ALPINE.JS DATA COMPONENT
// ============================================================

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

        // Computed: Pregunta CAPTCHA
        get captchaQuestion() {
            return `¿Cuánto es ${this.captcha.num1} ${this.captcha.operation} ${this.captcha.num2}?`;
        },

        // Computed: Fortaleza de contraseña
        get passwordStrength() {
            const pwd = this.formData.password;
            if (pwd.length === 0) return '';
            if (pwd.length < 8) return 'weak';
            if (pwd.length < 12) return 'medium';
            return 'strong';
        },

        get passwordStrengthText() {
            const strength = this.passwordStrength;
            if (strength === 'weak') return '⚠️ Contraseña débil';
            if (strength === 'medium') return '✓ Contraseña media';
            if (strength === 'strong') return '✓✓ Contraseña fuerte';
            return '';
        },

        // Computed: Contraseñas coinciden
        get passwordsMatch() {
            return this.formData.password === this.formData.confirmPassword && 
                   this.formData.confirmPassword.length > 0;
        },

        // Inicialización
        init() {
            // Si ya está logueado, redirigir
            redirectIfAuthenticated();
            this.generateCaptcha();
        },

        // Generar CAPTCHA
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

        // Submit registro
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
                const response = await fetch('http://localhost:8080/api/auth/register', {
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
                        window.location.href = '/frontend/aerolinea/views/login.html';
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