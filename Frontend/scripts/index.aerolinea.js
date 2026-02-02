// ===================================
// ELEMENTOS DEL DOM
// ===================================
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loginModal = document.getElementById('loginModal');
const closeLoginModal = document.getElementById('closeLoginModal');
const loginForm = document.getElementById('loginForm');
const guestSection = document.getElementById('guestSection');
const loggedSection = document.getElementById('loggedSection');
const profileDropdown = document.getElementById('profileDropdown');

// ===================================
// ESTADO DE LA APLICACIÓN
// ===================================
let isUserLoggedIn = false;

// ===================================
// FUNCIONES PRINCIPALES
// ===================================

// Abrir modal de login
function openLoginModal() {
    loginModal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevenir scroll
}

// Cerrar modal de login
function closeLoginModalFunc() {
    loginModal.classList.remove('active');
    document.body.style.overflow = 'auto'; // Restaurar scroll
    loginForm.reset();
}

// Cambiar a vista de usuario registrado
function loginUser() {
    isUserLoggedIn = true;
    guestSection.style.display = 'none';
    loggedSection.style.display = 'flex';
    
    // Animación suave
    loggedSection.style.opacity = '0';
    setTimeout(() => {
        loggedSection.style.transition = 'opacity 0.3s ease';
        loggedSection.style.opacity = '1';
    }, 10);
}

// Cambiar a vista de visitante
function logoutUser() {
    isUserLoggedIn = false;
    loggedSection.style.display = 'none';
    guestSection.style.display = 'flex';
    
    // Animación suave
    guestSection.style.opacity = '0';
    setTimeout(() => {
        guestSection.style.transition = 'opacity 0.3s ease';
        guestSection.style.opacity = '1';
    }, 10);
}

// ===================================
// EVENT LISTENERS
// ===================================

// Botón "Iniciar Sesión" - Abre el modal
loginBtn.addEventListener('click', () => {
    openLoginModal();
});

// Botón "Registrarse" - Por ahora también simula login
registerBtn.addEventListener('click', () => {
    // En producción, esto abriría un modal de registro
    // Para demostración, directamente hace login
    loginUser();
    console.log('Botón registrarse clickeado - Usuario logueado para demostración');
});

// Botón cerrar modal (X)
closeLoginModal.addEventListener('click', () => {
    closeLoginModalFunc();
});

// Cerrar modal al hacer click fuera de él
loginModal.addEventListener('click', (e) => {
    if (e.target === loginModal) {
        closeLoginModalFunc();
    }
});

// Cerrar modal con tecla ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && loginModal.classList.contains('active')) {
        closeLoginModalFunc();
    }
});

// Submit del formulario de login
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Obtener valores del formulario
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // Validación simple para demostración
    if (email && password) {
        console.log('Login simulado con:', { email, password });
        
        // Cerrar modal
        closeLoginModalFunc();
        
        // Cambiar a vista de usuario registrado
        loginUser();
        
        // Mostrar mensaje de éxito (opcional)
        console.log('¡Login exitoso! Bienvenido');
    } else {
        alert('Por favor complete todos los campos');
    }
});

// Botón "Cerrar Sesión"
logoutBtn.addEventListener('click', () => {
    logoutUser();
    console.log('Usuario ha cerrado sesión');
});

// Click en perfil - Podría mostrar un dropdown menu
profileDropdown.addEventListener('click', () => {
    console.log('Perfil clickeado - Aquí iría un menú desplegable');
    // Implementación futura: mostrar dropdown con opciones como:
    // - Mi Perfil
    // - Mis Reservaciones
    // - Configuración
    // - etc.
});

// ===================================
// FUNCIONES AUXILIARES
// ===================================

// Inicializar estado por defecto
function initializeApp() {
    // Por defecto, el usuario no está logueado
    isUserLoggedIn = false;
    guestSection.style.display = 'flex';
    loggedSection.style.display = 'none';
    
    console.log('Aplicación inicializada - Estado: Usuario visitante');
}

// ===================================
// INICIALIZACIÓN
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    console.log('DOM cargado completamente');
});

// ===================================
// FUNCIONES ADICIONALES (Futuras)
// ===================================

// Simular almacenamiento de sesión
function saveUserSession(userData) {
    // En producción, usar localStorage o sessionStorage
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('isLoggedIn', 'true');
}

function getUserSession() {
    // Recuperar sesión del usuario
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const userData = JSON.parse(localStorage.getItem('user'));
    return { isLoggedIn, userData };
}

function clearUserSession() {
    // Limpiar sesión
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
}

// ===================================
// FILTROS (Para implementación futura)
// ===================================
const filterBtn = document.querySelector('.filter-btn');

filterBtn.addEventListener('click', () => {
    console.log('Botón de filtros clickeado');
    // Implementación futura: abrir panel de filtros
});

// ===================================
// BÚSQUEDA (Para implementación futura)
// ===================================
const searchInput = document.querySelector('.search-input');

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const searchTerm = e.target.value;
        console.log('Búsqueda realizada:', searchTerm);
        // Implementación futura: realizar búsqueda
    }
});

// ===================================
// HERO Y CARDS - NAVEGACIÓN
// ===================================

// Botón "Explorar Vuelos" del Hero
const exploreFlightsBtn = document.getElementById('exploreFlightsBtn');
if (exploreFlightsBtn) {
    exploreFlightsBtn.addEventListener('click', () => {
        console.log('Navegando a página de vuelos...');
        // En producción: window.location.href = 'vuelos.html';
        alert('Redirigiendo a la página de búsqueda de vuelos...');
    });
}

// Botón "Ver Hoteles" - Partner Card
const hotelsBtn = document.getElementById('hotelsBtn');
if (hotelsBtn) {
    hotelsBtn.addEventListener('click', () => {
        console.log('Navegando a hoteles aliados...');
        // En producción: window.location.href = 'hoteles.html';
        alert('Redirigiendo a la página de hoteles aliados...');
    });
}

// Botón "Ver Paquetes" - Partner Card
const agencyBtn = document.getElementById('agencyBtn');
if (agencyBtn) {
    agencyBtn.addEventListener('click', () => {
        console.log('Navegando a agencia de viajes...');
        // En producción: window.location.href = 'agencia.html';
        alert('Redirigiendo a la página de la agencia de viajes...');
    });
}

// ===================================
// ANIMACIONES DE SCROLL
// ===================================

// Función para observar elementos y animarlos al hacer scroll
function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observar todas las info cards
    const infoCards = document.querySelectorAll('.info-card, .partner-card');
    infoCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `all 0.6s ease ${index * 0.1}s`;
        observer.observe(card);
    });
}

// Inicializar animaciones cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    setupScrollAnimations();
});