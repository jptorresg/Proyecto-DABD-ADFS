/* ============================================================
   DATOS Y ESTADO
   ============================================================ */

const BASE_FLIGHT_PRICE = 1900; // Q950 × 2
const TAX_RATE = 0.12; // 12%

// extras seleccionados (simula que vienen de la página anterior)
const selectedExtras = {
    baggage: false,  // +Q300
    seat:    false,  // +Q160
    meal:    false   // +Q90
};

/* ============================================================
   TOGGLE MÉTODO DE PAGO (Tarjeta / PayPal)
   ============================================================ */
function initPaymentMethodToggle() {
    const radios = document.querySelectorAll('input[name="paymentType"]');
    const cardForm = document.getElementById('cardForm');
    const paypalForm = document.getElementById('paypalForm');

    radios.forEach(radio => {
        radio.addEventListener('change', function() {
            // actualizar estilos
            document.querySelectorAll('.chk-payment-option').forEach(opt => {
                opt.classList.remove('chk-payment-active');
            });
            this.closest('.chk-payment-option').classList.add('chk-payment-active');

            // mostrar/ocultar formularios
            if (this.value === 'card') {
                cardForm.style.display = 'block';
                paypalForm.style.display = 'none';
            } else {
                cardForm.style.display = 'none';
                paypalForm.style.display = 'block';
            }
        });
    });
}

/* ============================================================
   DETECCIÓN DE MARCA DE TARJETA
   ============================================================ */
const cardPatterns = {
    visa:       /^4/,
    mastercard: /^5[1-5]/,
    amex:       /^3[47]/,
    discover:   /^6(?:011|5)/,
    diners:     /^3(?:0[0-5]|[68])/,
    jcb:        /^35/
};

const cardBrandNames = {
    visa:       'Visa',
    mastercard: 'Mastercard',
    amex:       'American Express',
    discover:   'Discover',
    diners:     'Diners Club',
    jcb:        'JCB'
};

function detectCardBrand(number) {
    const clean = number.replace(/\s/g, '');
    for (const [brand, pattern] of Object.entries(cardPatterns)) {
        if (pattern.test(clean)) return brand;
    }
    return null;
}

function initCardInput() {
    const input = document.getElementById('cardNumber');
    const brandEl = document.getElementById('cardBrand');

    input.addEventListener('input', function() {
        // formatear con espacios cada 4 dígitos
        let val = this.value.replace(/\s/g, '').replace(/[^0-9]/g, '');
        let formatted = val.match(/.{1,4}/g)?.join(' ') || val;
        this.value = formatted;

        // detectar marca
        const brand = detectCardBrand(val);
        if (brand) {
            brandEl.textContent = cardBrandNames[brand];
            brandEl.style.display = 'block';
            brandEl.style.color = 'var(--primary-blue)';
        } else {
            brandEl.style.display = 'none';
        }
    });
}

/* ============================================================
   VALIDACIÓN CVV
   ============================================================ */
function initCVVInput() {
    const cvv = document.getElementById('cardCVV');
    cvv.addEventListener('input', function() {
        this.value = this.value.replace(/[^0-9]/g, '').substring(0, 4);
    });
}

/* ============================================================
   CÁLCULO RESUMEN DE PRECIO
   ============================================================ */
function updateSummary() {
    let subtotal = BASE_FLIGHT_PRICE;

    // mostrar/ocultar extras (simula selección previa)
    if (selectedExtras.baggage) {
        document.getElementById('extraBaggage').style.display = 'flex';
        subtotal += 300;
    }
    if (selectedExtras.seat) {
        document.getElementById('extraSeat').style.display = 'flex';
        subtotal += 160;
    }
    if (selectedExtras.meal) {
        document.getElementById('extraMeal').style.display = 'flex';
        subtotal += 90;
    }

    const tax = Math.round(subtotal * TAX_RATE);
    const total = subtotal + tax;

    document.getElementById('taxAmount').textContent = 'Q' + tax.toLocaleString();
    document.getElementById('summaryTotal').textContent = 'Q' + total.toLocaleString();
}

/* ============================================================
   VALIDACIÓN FORMULARIO
   ============================================================ */
function validateForm() {
    const required = [
        'p1nombre', 'p1apellido', 'p1fecha', 'p1genero', 'p1pasaporte', 'p1nacionalidad',
        'p2nombre', 'p2apellido', 'p2fecha', 'p2genero', 'p2pasaporte', 'p2nacionalidad',
        'emergenciaNombre', 'emergenciaTel',
        'cardNumber', 'cardName', 'cardCVV', 'cardMonth', 'cardYear',
        'billAddress', 'billCity', 'billState', 'billZip', 'billCountry'
    ];

    // validar campos requeridos
    for (const id of required) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (!el.value.trim()) {
            el.focus();
            el.classList.add('is-invalid');
            alert(`Por favor complete el campo: ${el.previousElementSibling?.textContent || id}`);
            return false;
        }
    }

    // validar número de tarjeta (16 dígitos)
    const cardNum = document.getElementById('cardNumber').value.replace(/\s/g, '');
    if (cardNum.length !== 16) {
        alert('El número de tarjeta debe tener 16 dígitos');
        document.getElementById('cardNumber').focus();
        return false;
    }

    // validar CVV (3-4 dígitos)
    const cvv = document.getElementById('cardCVV').value;
    if (cvv.length < 3 || cvv.length > 4) {
        alert('El CVV debe tener 3 o 4 dígitos');
        document.getElementById('cardCVV').focus();
        return false;
    }

    // validar fecha expiración (no pasada)
    const month = parseInt(document.getElementById('cardMonth').value);
    const year = parseInt(document.getElementById('cardYear').value);
    const now = new Date();
    const expiry = new Date(year, month - 1);
    if (expiry < now) {
        alert('La tarjeta está vencida');
        document.getElementById('cardMonth').focus();
        return false;
    }

    // validar términos
    if (!document.getElementById('acceptTerms').checked) {
        alert('Debe aceptar los Términos y Condiciones para continuar');
        document.getElementById('acceptTerms').focus();
        return false;
    }

    return true;
}

/* ============================================================
   CONFIRMACIÓN DE COMPRA
   ============================================================ */
function initCheckout() {
    const btn = document.getElementById('btnConfirm');

    btn.addEventListener('click', function() {
        // validar si es PayPal
        const paymentType = document.querySelector('input[name="paymentType"]:checked').value;
        if (paymentType === 'paypal') {
            alert('Redirigiendo a PayPal...\n(Esta funcionalidad se implementaría con la API de PayPal)');
            return;
        }

        // validar formulario de tarjeta
        if (!validateForm()) return;

        // simular procesamiento
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';

        setTimeout(() => {
            // éxito
            const total = document.getElementById('summaryTotal').textContent;
            const code = 'HC-' + Math.random().toString(36).substr(2, 6).toUpperCase();

            alert(`¡Compra confirmada exitosamente!\n\nCódigo de reservación: ${code}\nTotal pagado: ${total}\n\nRecibirás un correo de confirmación en breve.`);

            // resetear botón
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-lock"></i> Confirmar y Pagar';

            // redirigir (en producción iría a página de confirmación)
            // window.location.href = 'confirmacion.html?code=' + code;
        }, 2000);
    });
}

/* ============================================================
   AGREGAR HOTEL
   ============================================================ */
function initHotelButton() {
    const btn = document.querySelector('.chk-hotel-btn');
    if (!btn) return;

    btn.addEventListener('click', function() {
        const added = this.classList.toggle('hotel-added');

        if (added) {
            this.innerHTML = '<i class="fas fa-check-circle"></i> Hotel Agregado';
            this.style.background = 'var(--success)';
            this.style.borderColor = 'var(--success)';
            this.style.color = 'var(--white)';
            alert('Hotel agregado al pedido.\n(En producción, esto actualizaría el total)');
        } else {
            this.innerHTML = '<i class="fas fa-plus-circle"></i> Agregar Hotel';
            this.style.background = '';
            this.style.borderColor = '';
            this.style.color = '';
        }
    });
}

/* ============================================================
   VALIDACIÓN EN TIEMPO REAL
   ============================================================ */
function initRealtimeValidation() {
    const inputs = document.querySelectorAll('.chk-input');

    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.hasAttribute('required')) {
                if (!this.value.trim()) {
                    this.classList.add('is-invalid');
                    this.classList.remove('is-valid');
                } else {
                    this.classList.remove('is-invalid');
                    this.classList.add('is-valid');
                }
            }
        });

        input.addEventListener('input', function() {
            if (this.classList.contains('is-invalid') && this.value.trim()) {
                this.classList.remove('is-invalid');
                this.classList.add('is-valid');
            }
        });
    });
}

/* ============================================================
   AUTO-UPPERCASE NOMBRE EN TARJETA
   ============================================================ */
function initCardNameInput() {
    const input = document.getElementById('cardName');
    input.addEventListener('input', function() {
        this.value = this.value.toUpperCase();
    });
}

/* ============================================================
   RESTRINGIR FECHA DE NACIMIENTO (> 18 años)
   ============================================================ */
function initBirthdateInputs() {
    const inputs = ['p1fecha', 'p2fecha'];
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() - 18);
    const maxStr = maxDate.toISOString().split('T')[0];

    inputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.max = maxStr;
        }
    });
}

/* ============================================================
   INICIALIZACIÓN
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    updateSummary();
    initPaymentMethodToggle();
    initCardInput();
    initCVVInput();
    initCardNameInput();
    initBirthdateInputs();
    initCheckout();
    initHotelButton();
    initRealtimeValidation();

    console.log('✓ Checkout initialized');
});