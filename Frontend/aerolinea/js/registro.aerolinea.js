// ===================================
// CAPTCHA SYSTEM
// ===================================
let captchaAnswer = 0;

// Generar CAPTCHA al cargar la página
function generateCaptcha() {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const operations = ['+', '-', '×'];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    
    let question = `¿Cuánto es ${num1} ${operation} ${num2}?`;
    
    // Calcular respuesta correcta
    switch(operation) {
        case '+':
            captchaAnswer = num1 + num2;
            break;
        case '-':
            captchaAnswer = num1 - num2;
            break;
        case '×':
            captchaAnswer = num1 * num2;
            break;
    }
    
    document.getElementById('captchaQuestion').textContent = question;
    document.getElementById('captchaAnswer').value = '';
}

// Botón de refrescar CAPTCHA
document.getElementById('refreshCaptcha').addEventListener('click', () => {
    generateCaptcha();
    const captchaInput = document.getElementById('captchaAnswer');
    captchaInput.classList.remove('is-invalid', 'is-valid');
});

// ===================================
// VALIDACIÓN DE CONTRASEÑA
// ===================================
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const passwordStrength = document.getElementById('passwordStrength');

// Verificar fortaleza de contraseña
passwordInput.addEventListener('input', (e) => {
    const password = e.target.value;
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
    
    // Mostrar indicador de fortaleza
    passwordStrength.classList.remove('weak', 'medium', 'strong');
    
    if (password.length === 0) {
        passwordStrength.style.display = 'none';
    } else if (strength <= 2) {
        passwordStrength.classList.add('weak');
        passwordStrength.textContent = '⚠️ Contraseña débil';
    } else if (strength <= 3) {
        passwordStrength.classList.add('medium');
        passwordStrength.textContent = '✓ Contraseña media';
    } else {
        passwordStrength.classList.add('strong');
        passwordStrength.textContent = '✓✓ Contraseña fuerte';
    }
});

// Verificar que las contraseñas coincidan
confirmPasswordInput.addEventListener('input', (e) => {
    const password = passwordInput.value;
    const confirmPassword = e.target.value;
    
    if (confirmPassword === '') {
        confirmPasswordInput.classList.remove('is-invalid', 'is-valid');
        return;
    }
    
    if (password === confirmPassword) {
        confirmPasswordInput.classList.remove('is-invalid');
        confirmPasswordInput.classList.add('is-valid');
    } else {
        confirmPasswordInput.classList.remove('is-valid');
        confirmPasswordInput.classList.add('is-invalid');
    }
});

// ===================================
// MOSTRAR/OCULTAR CONTRASEÑAS
// ===================================
const togglePasswordButtons = document.querySelectorAll('.toggle-password');

togglePasswordButtons.forEach(button => {
    button.addEventListener('click', () => {
        const targetId = button.getAttribute('data-target');
        const targetInput = document.getElementById(targetId);
        const icon = button.querySelector('i');
        
        if (targetInput.type === 'password') {
            targetInput.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            targetInput.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    });
});

// ===================================
// VALIDACIÓN DEL FORMULARIO
// ===================================
const registrationForm = document.getElementById('registrationForm');

registrationForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Remover validaciones previas
    const inputs = registrationForm.querySelectorAll('.form-control, .form-check-input');
    inputs.forEach(input => {
        input.classList.remove('is-invalid', 'is-valid');
    });
    
    let isValid = true;
    
    // Validar email
    const email = document.getElementById('email');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.value)) {
        email.classList.add('is-invalid');
        isValid = false;
    } else {
        email.classList.add('is-valid');
    }
    
    // Validar contraseña
    const password = document.getElementById('password');
    if (password.value.length < 8) {
        password.classList.add('is-invalid');
        isValid = false;
    } else {
        password.classList.add('is-valid');
    }
    
    // Validar confirmación de contraseña
    const confirmPassword = document.getElementById('confirmPassword');
    if (confirmPassword.value !== password.value) {
        confirmPassword.classList.add('is-invalid');
        isValid = false;
    } else {
        confirmPassword.classList.add('is-valid');
    }
    
    // Validar nombres
    const firstName = document.getElementById('firstName');
    if (firstName.value.trim() === '') {
        firstName.classList.add('is-invalid');
        isValid = false;
    } else {
        firstName.classList.add('is-valid');
    }
    
    // Validar apellidos
    const lastName = document.getElementById('lastName');
    if (lastName.value.trim() === '') {
        lastName.classList.add('is-invalid');
        isValid = false;
    } else {
        lastName.classList.add('is-valid');
    }
    
    // Validar edad
    const age = document.getElementById('age');
    if (age.value < 18 || age.value > 120) {
        age.classList.add('is-invalid');
        isValid = false;
    } else {
        age.classList.add('is-valid');
    }
    
    // Validar país
    const country = document.getElementById('country');
    if (country.value === '') {
        country.classList.add('is-invalid');
        isValid = false;
    } else {
        country.classList.add('is-valid');
    }
    
    // Validar pasaporte
    const passport = document.getElementById('passport');
    const passportRegex = /^[A-Za-z0-9]{6,15}$/;
    if (!passportRegex.test(passport.value)) {
        passport.classList.add('is-invalid');
        isValid = false;
    } else {
        passport.classList.add('is-valid');
    }
    
    // Validar CAPTCHA
    const captchaInput = document.getElementById('captchaAnswer');
    if (parseInt(captchaInput.value) !== captchaAnswer) {
        captchaInput.classList.add('is-invalid');
        isValid = false;
    } else {
        captchaInput.classList.add('is-valid');
    }
    
    // Validar términos y condiciones
    const termsAccept = document.getElementById('termsAccept');
    if (!termsAccept.checked) {
        termsAccept.classList.add('is-invalid');
        isValid = false;
    } else {
        termsAccept.classList.add('is-valid');
    }
    
    // Si todo es válido, procesar el formulario
    if (isValid) {
        // Obtener todos los datos del formulario
        const formData = {
            email: email.value,
            password: password.value,
            firstName: firstName.value,
            lastName: lastName.value,
            age: age.value,
            country: country.value,
            passport: passport.value
        };
        
        console.log('Formulario válido. Datos:', formData);
        
        // Mostrar mensaje de éxito
        showSuccessMessage();
        
        // En producción, aquí enviarías los datos al servidor
        // fetch('/api/register', { method: 'POST', body: JSON.stringify(formData) })
        
    } else {
        // Scroll al primer error
        const firstInvalid = registrationForm.querySelector('.is-invalid');
        if (firstInvalid) {
            firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstInvalid.focus();
        }
    }
});

// ===================================
// MENSAJE DE ÉXITO
// ===================================
function showSuccessMessage() {
    // Crear overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(44, 62, 80, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        animation: fadeIn 0.3s ease;
    `;
    
    // Crear mensaje
    const message = document.createElement('div');
    message.style.cssText = `
        background: white;
        padding: 3rem;
        border-radius: 16px;
        text-align: center;
        max-width: 500px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        animation: slideIn 0.4s ease;
    `;
    
    message.innerHTML = `
        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); 
                    border-radius: 50%; display: flex; align-items: center; justify-content: center; 
                    margin: 0 auto 1.5rem;">
            <i class="fas fa-check" style="color: white; font-size: 2.5rem;"></i>
        </div>
        <h2 style="color: #2C3E50; font-size: 1.75rem; margin-bottom: 1rem; font-weight: 700;">
            ¡Registro Exitoso!
        </h2>
        <p style="color: #6c757d; font-size: 1.1rem; margin-bottom: 2rem;">
            Tu cuenta ha sido creada exitosamente. Serás redirigido al inicio de sesión.
        </p>
        <button onclick="window.location.href='index.html'" 
                style="background: linear-gradient(135deg, #4A5F7F 0%, #5A7299 100%); 
                       color: white; border: none; padding: 1rem 2.5rem; 
                       border-radius: 50px; font-size: 1rem; font-weight: 700; 
                       cursor: pointer; box-shadow: 0 4px 12px rgba(74, 95, 127, 0.3);">
            Ir al Inicio
        </button>
    `;
    
    overlay.appendChild(message);
    document.body.appendChild(overlay);
    
    // Auto-redirigir después de 5 segundos
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 5000);
}

// ===================================
// VALIDACIÓN EN TIEMPO REAL
// ===================================
const formInputs = registrationForm.querySelectorAll('.form-control');

formInputs.forEach(input => {
    input.addEventListener('blur', () => {
        // Solo validar si el campo tiene contenido
        if (input.value !== '') {
            validateField(input);
        }
    });
});

function validateField(input) {
    const inputId = input.id;
    
    switch(inputId) {
        case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (emailRegex.test(input.value)) {
                input.classList.remove('is-invalid');
                input.classList.add('is-valid');
            } else {
                input.classList.remove('is-valid');
                input.classList.add('is-invalid');
            }
            break;
            
        case 'passport':
            const passportRegex = /^[A-Za-z0-9]{6,15}$/;
            if (passportRegex.test(input.value)) {
                input.classList.remove('is-invalid');
                input.classList.add('is-valid');
            } else {
                input.classList.remove('is-valid');
                input.classList.add('is-invalid');
            }
            break;
            
        case 'age':
            if (input.value >= 18 && input.value <= 120) {
                input.classList.remove('is-invalid');
                input.classList.add('is-valid');
            } else {
                input.classList.remove('is-valid');
                input.classList.add('is-invalid');
            }
            break;
    }
}

// ===================================
// INICIALIZACIÓN
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    generateCaptcha();
    console.log('Formulario de registro inicializado');
});

// Agregar estilos de animación
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(-30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);