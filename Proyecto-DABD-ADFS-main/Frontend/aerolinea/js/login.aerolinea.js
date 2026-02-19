/* ============================================================
   TOGGLE PASSWORD VISIBILITY
   ============================================================ */
function initPasswordToggle() {
    const btn = document.getElementById('togglePassword');
    const input = document.getElementById('loginPassword');

    if (!btn || !input) return;

    btn.addEventListener('click', function() {
        const type = input.type === 'password' ? 'text' : 'password';
        input.type = type;

        // cambiar icono
        const icon = this.querySelector('i');
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
    });
}

/* ============================================================
   LOGIN FORM SUBMISSION
   ============================================================ */
function initLoginForm() {
    const form = document.getElementById('loginForm');

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const remember = document.getElementById('rememberMe').checked;

        // validación básica
        if (!email || !password) {
            showNotification('Por favor completa todos los campos', 'error');
            return;
        }

        // validar formato email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showNotification('Por favor ingresa un correo válido', 'error');
            return;
        }

        // simular login
        const btn = form.querySelector('.login-btn-submit');
        const originalHTML = btn.innerHTML;

        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Iniciando sesión...</span>';

        setTimeout(() => {
            // éxito
            showNotification('¡Inicio de sesión exitoso!', 'success');

            // guardar en localStorage si "recordarme" está activo
            if (remember) {
                localStorage.setItem('rememberedEmail', email);
            } else {
                localStorage.removeItem('rememberedEmail');
            }

            // redirigir después de 1.5s
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);

        }, 1500);
    });
}

/* ============================================================
   SOCIAL LOGIN BUTTONS
   ============================================================ */
function initSocialLogin() {
    const googleBtn = document.getElementById('loginGoogle');
    const facebookBtn = document.getElementById('loginFacebook');

    googleBtn?.addEventListener('click', function() {
        showNotification('Redirigiendo a Google...', 'info');
        // En producción: window.location.href = '/auth/google';
        setTimeout(() => {
            alert('Login con Google\n(Esta funcionalidad requiere configurar OAuth 2.0)');
        }, 800);
    });

    facebookBtn?.addEventListener('click', function() {
        showNotification('Redirigiendo a Facebook...', 'info');
        // En producción: window.location.href = '/auth/facebook';
        setTimeout(() => {
            alert('Login con Facebook\n(Esta funcionalidad requiere configurar Facebook Login API)');
        }, 800);
    });
}

/* ============================================================
   FORGOT PASSWORD MODAL
   ============================================================ */
function initForgotPasswordModal() {
    const modal = document.getElementById('forgotPasswordModal');
    const openLink = document.getElementById('forgotPasswordLink');
    const closeBtn = document.getElementById('closeModal');
    const overlay = document.getElementById('modalOverlay');
    const form = document.getElementById('forgotPasswordForm');

    // abrir modal
    openLink?.addEventListener('click', function(e) {
        e.preventDefault();
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    // cerrar modal
    const closeModal = () => {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    };

    closeBtn?.addEventListener('click', closeModal);
    overlay?.addEventListener('click', closeModal);

    // ESC para cerrar
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });

    // submit forgot password
    form?.addEventListener('submit', function(e) {
        e.preventDefault();

        const email = document.getElementById('recoveryEmail').value.trim();

        if (!email) {
            showNotification('Por favor ingresa tu correo', 'error');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showNotification('Por favor ingresa un correo válido', 'error');
            return;
        }

        // simular envío
        const btn = form.querySelector('.login-btn-submit');
        const originalHTML = btn.innerHTML;

        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Enviando...</span>';

        setTimeout(() => {
            showNotification(`Enlace de recuperación enviado a ${email}`, 'success');

            btn.disabled = false;
            btn.innerHTML = originalHTML;

            // cerrar modal y resetear form
            setTimeout(() => {
                closeModal();
                form.reset();
            }, 1500);

        }, 1500);
    });
}

/* ============================================================
   REMEMBER ME (Auto-fill)
   ============================================================ */
function initRememberMe() {
    const emailInput = document.getElementById('loginEmail');
    const rememberCheckbox = document.getElementById('rememberMe');

    // cargar email guardado
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
        emailInput.value = rememberedEmail;
        rememberCheckbox.checked = true;
    }
}

/* ============================================================
   NOTIFICATION SYSTEM
   ============================================================ */
function showNotification(message, type = 'info') {
    // crear elemento si no existe
    let container = document.getElementById('notificationContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notificationContainer';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 99999;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        document.body.appendChild(container);
    }

    // crear notificación
    const notif = document.createElement('div');
    notif.className = `notif notif-${type}`;

    const colors = {
        success: '#28a745',
        error:   '#dc3545',
        info:    '#4A5F7F',
        warning: '#ffc107'
    };

    const icons = {
        success: 'fa-check-circle',
        error:   'fa-times-circle',
        info:    'fa-info-circle',
        warning: 'fa-exclamation-triangle'
    };

    notif.style.cssText = `
        background: ${colors[type] || colors.info};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-size: 0.95rem;
        font-weight: 600;
        min-width: 280px;
        max-width: 400px;
        animation: slideInRight 0.3s ease;
        cursor: pointer;
    `;

    notif.innerHTML = `
        <i class="fas ${icons[type] || icons.info}"></i>
        <span>${message}</span>
    `;

    container.appendChild(notif);

    // auto-remove después de 4s
    setTimeout(() => {
        notif.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notif.remove(), 300);
    }, 4000);

    // click para cerrar
    notif.addEventListener('click', function() {
        this.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => this.remove(), 300);
    });
}

// agregar animaciones al head
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { opacity: 0; transform: translateX(100px); }
        to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes slideOutRight {
        from { opacity: 1; transform: translateX(0); }
        to   { opacity: 0; transform: translateX(100px); }
    }
`;
document.head.appendChild(style);

/* ============================================================
   INPUT VALIDATION (Real-time)
   ============================================================ */
function initInputValidation() {
    const inputs = document.querySelectorAll('.login-input');

    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.hasAttribute('required') && !this.value.trim()) {
                this.style.borderColor = '#dc3545';
            }
        });

        input.addEventListener('input', function() {
            if (this.style.borderColor === 'rgb(220, 53, 69)') { // danger red
                this.style.borderColor = '';
            }
        });
    });
}

/* ============================================================
   PREVENT FORM RESUBMISSION
   ============================================================ */
window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => form.reset());
    }
});

/* ============================================================
   INICIALIZACIÓN
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    initPasswordToggle();
    initLoginForm();
    initSocialLogin();
    initForgotPasswordModal();
    initRememberMe();
    initInputValidation();

    console.log('✓ Login page initialized');
});