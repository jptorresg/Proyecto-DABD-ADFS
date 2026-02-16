// ===================================
// DATA: Vuelos de ejemplo
// ===================================
const flightsData = [
    {
        id: 1,
        code: "HC-201",
        from: { city: "Guatemala", code: "GUA", time: "06:30", zone: "GMT-6" },
        to:   { city: "Ciudad de México", code: "MEX", time: "08:45", zone: "GMT-6" },
        type: "direct",
        duration: "2h 15m",
        class: "Turista",
        rating: 4.8,
        reviews: 312,
        price: 1250,
        bestPrice: true
    },
    {
        id: 2,
        code: "HC-305",
        from: { city: "Guatemala", code: "GUA", time: "09:15", zone: "GMT-6" },
        to:   { city: "Ciudad de México", code: "MEX", time: "13:40", zone: "GMT-6" },
        type: "layover",
        layover: { city: "Houston", code: "IAH", arrivalTime: "11:00", departureTime: "12:10", duration: "1h 10m" },
        duration: "4h 25m",
        class: "Turista",
        rating: 4.5,
        reviews: 187,
        price: 950,
        bestPrice: false
    },
    {
        id: 3,
        code: "HC-410",
        from: { city: "Guatemala", code: "GUA", time: "11:00", zone: "GMT-6" },
        to:   { city: "Ciudad de México", code: "MEX", time: "13:20", zone: "GMT-6" },
        type: "direct",
        duration: "2h 20m",
        class: "Business",
        rating: 4.9,
        reviews: 98,
        price: 2800,
        bestPrice: false
    },
    {
        id: 4,
        code: "HC-202",
        from: { city: "Guatemala", code: "GUA", time: "14:30", zone: "GMT-6" },
        to:   { city: "Ciudad de México", code: "MEX", time: "16:50", zone: "GMT-6" },
        type: "direct",
        duration: "2h 20m",
        class: "Turista",
        rating: 4.6,
        reviews: 245,
        price: 1350,
        bestPrice: false
    },
    {
        id: 5,
        code: "HC-508",
        from: { city: "Guatemala", code: "GUA", time: "16:00", zone: "GMT-6" },
        to:   { city: "Ciudad de México", code: "MEX", time: "21:30", zone: "GMT-6" },
        type: "layover",
        layover: { city: "Dallas", code: "DFW", arrivalTime: "18:15", departureTime: "19:45", duration: "1h 30m" },
        duration: "5h 30m",
        class: "Turista",
        rating: 4.2,
        reviews: 156,
        price: 890,
        bestPrice: false
    },
    {
        id: 6,
        code: "HC-411",
        from: { city: "Guatemala", code: "GUA", time: "18:45", zone: "GMT-6" },
        to:   { city: "Ciudad de México", code: "MEX", time: "21:05", zone: "GMT-6" },
        type: "direct",
        duration: "2h 20m",
        class: "Business",
        rating: 4.7,
        reviews: 74,
        price: 3100,
        bestPrice: false
    }
];

// ===================================
// REFERENCIA AL CONTENEDOR
// ===================================
const flightsList = document.getElementById('flightsList');

// ===================================
// GENERAR SVG DE RUTA
// ===================================

// Vuelo directo: línea recta con avioneta volando encima
function svgDirect() {
    return `
    <svg viewBox="0 0 110 38" xmlns="http://www.w3.org/2000/svg">
        <!-- Línea recta -->
        <line x1="8" y1="28" x2="102" y2="28" stroke="#4A5F7F" stroke-width="2.2" stroke-linecap="round"/>
        <!-- Puntos origen / destino -->
        <circle cx="8"  cy="28" r="4" fill="#4A5F7F"/>
        <circle cx="102" cy="28" r="4" fill="#4A5F7F"/>
        <!-- Avioneta (centrada, volando sobre la línea) -->
        <g transform="translate(42, 6)">
            <polygon points="13,0 0,8 26,8" fill="#4A5F7F"/>
            <polygon points="4,8 0,14 8,11" fill="#5A7299"/>
            <polygon points="22,8 26,14 18,11" fill="#5A7299"/>
            <polygon points="10,10 8,17 18,17 16,10" fill="#4A5F7F"/>
        </g>
    </svg>`;
}

// Vuelo con escala: arco curvo con punto de escala en el centro
function svgLayover() {
    return `
    <svg viewBox="0 0 110 44" xmlns="http://www.w3.org/2000/svg">
        <!-- Arco curvo (parabola) -->
        <path d="M 8 34 Q 55 2 102 34" fill="none" stroke="#4A5F7F" stroke-width="2.2" stroke-linecap="round"/>
        <!-- Puntos origen / destino -->
        <circle cx="8"   cy="34" r="4" fill="#4A5F7F"/>
        <circle cx="102" cy="34" r="4" fill="#4A5F7F"/>
        <!-- Punto de escala (centro del arco) -->
        <circle cx="55" cy="17" r="5" fill="#FFFFFF" stroke="#4A5F7F" stroke-width="2.5"/>
        <circle cx="55" cy="17" r="2" fill="#4A5F7F"/>
        <!-- Avioneta (entre origen y escala) -->
        <g transform="translate(18, 13) rotate(-18)">
            <polygon points="10,0 0,6 20,6" fill="#4A5F7F"/>
            <polygon points="3,6 0,10 6,8" fill="#5A7299"/>
            <polygon points="17,6 20,10 14,8" fill="#5A7299"/>
            <polygon points="8,7 7,13 13,13 12,7" fill="#4A5F7F"/>
        </g>
    </svg>`;
}

// ===================================
// GENERAR ESTRELLAS HTML
// ===================================
function renderStars(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= Math.floor(rating)) {
            html += '<i class="fas fa-star"></i>';
        } else if (i - rating < 1 && i - rating > 0) {
            html += '<i class="fas fa-star-half-alt"></i>';
        } else {
            html += '<i class="far fa-star"></i>';
        }
    }
    return html;
}

// ===================================
// RENDERIZAR UNA TARJETA DE VUELO
// ===================================
function renderFlightCard(flight) {
    const card = document.createElement('div');
    card.className = 'flight-card' + (flight.bestPrice ? ' best-price' : '');
    card.setAttribute('data-price', flight.price);
    card.setAttribute('data-type', flight.type);
    card.setAttribute('data-rating', flight.rating);
    card.setAttribute('data-departure', flight.from.time);
    card.setAttribute('data-class', flight.class);

    // Info de escala (si aplica)
    let layoverInfo = '';
    if (flight.type === 'layover' && flight.layover) {
        layoverInfo = `
            <div style="margin-top: 0.25rem; font-size: 0.78rem; color: var(--medium-gray);">
                Escala en <strong style="color: var(--dark-gray);">${flight.layover.city}</strong>
                (${flight.layover.duration})
            </div>`;
    }

    card.innerHTML = `
        ${flight.bestPrice ? '<div class="best-price-badge"><i class="fas fa-tag"></i> Mejor Precio</div>' : ''}

        <div class="flight-card-inner">

            <!-- Horarios -->
            <div class="flight-times">
                <div class="flight-time-block">
                    <div class="time-value">${flight.from.time}</div>
                    <div class="time-zone">${flight.from.zone}</div>
                </div>
                <div class="time-divider"><i class="fas fa-chevron-down"></i></div>
                <div class="flight-time-block">
                    <div class="time-value">${flight.to.time}</div>
                    <div class="time-zone">${flight.to.zone}</div>
                </div>
            </div>

            <!-- Gráfico de ruta SVG -->
            <div class="flight-route-graphic">
                <div class="route-svg-wrapper">
                    ${flight.type === 'direct' ? svgDirect() : svgLayover()}
                </div>
                <div class="route-duration">${flight.duration}</div>
            </div>

            <!-- Info del vuelo -->
            <div class="flight-info">
                <div class="flight-code-row">
                    <span class="flight-code">${flight.code}</span>
                    <span class="flight-type-badge ${flight.type === 'direct' ? 'badge-direct' : 'badge-layover'}">
                        ${flight.type === 'direct' ? '<i class="fas fa-minus"></i> Directo' : '<i class="fas fa-circle" style="font-size:0.5rem;"></i> Con Escala'}
                    </span>
                    <span style="font-size:0.8rem; color:var(--medium-gray); margin-left:auto;">
                        <i class="fas fa-chair"></i> ${flight.class}
                    </span>
                </div>

                <div class="flight-cities">
                    <span class="city-from">${flight.from.city}</span>
                    <span class="cities-arrow"><i class="fas fa-long-arrow-alt-right"></i></span>
                    <span class="city-to">${flight.to.city}</span>
                </div>

                ${layoverInfo}

                <div class="flight-rating">
                    <span class="rating-stars">${renderStars(flight.rating)}</span>
                    <span class="rating-value">${flight.rating}</span>
                    <span class="rating-count">(${flight.reviews})</span>
                </div>
            </div>

            <!-- Precio y botón -->
            <div class="flight-price-section">
                <div class="price-label">Precio por persona</div>
                <div class="price-value">
                    <span class="price-currency">Q</span>${flight.price.toLocaleString()}
                </div>
                <div class="price-per">Total: Q${(flight.price * 2).toLocaleString()}</div>
                <button class="btn-select-flight" onclick="event.stopPropagation(); alert('Redirigiendo a detalle del vuelo ${flight.code}...')">
                    Ver Detalle
                </button>
            </div>

        </div>
    `;

    // Click en la tarjeta completa
    card.addEventListener('click', () => {
        alert(`Abriendo detalle del vuelo ${flight.code}`);
    });

    return card;
}

// ===================================
// RENDERIZAR TODOS LOS VUELOS
// ===================================
function renderFlights(flights) {
    flightsList.innerHTML = '';
    flights.forEach((flight, i) => {
        const card = renderFlightCard(flight);
        // Animación escalonada
        card.style.opacity = '0';
        card.style.transform = 'translateY(12px)';
        card.style.transition = `all 0.35s ease ${i * 0.07}s`;
        flightsList.appendChild(card);

        // Disparar animación en el siguiente frame
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            });
        });
    });
}

// ===================================
// ORDENAMIENTO
// ===================================
function sortFlights(flights, criteria) {
    return [...flights].sort((a, b) => {
        switch (criteria) {
            case 'price-asc':  return a.price - b.price;
            case 'price-desc': return b.price - a.price;
            case 'duration':   return a.duration.localeCompare(b.duration);
            case 'rating':     return b.rating - a.rating;
            case 'departure':  return a.from.time.localeCompare(b.from.time);
            default:           return 0;
        }
    });
}

document.getElementById('sortSelect').addEventListener('change', function () {
    const sorted = sortFlights(flightsData, this.value);
    renderFlights(sorted);
});

// ===================================
// FILTRO DE PRECIO (range)
// ===================================
document.getElementById('priceRange').addEventListener('input', function () {
    const max = parseInt(this.value);
    document.getElementById('priceMax').textContent = 'Q' + max.toLocaleString();

    // Actualizar gradiente visual del slider
    const pct = ((max - 800) / (3500 - 800)) * 100;
    this.style.setProperty('--range-progress', pct + '%');

    applyFilters();
});

// ===================================
// FILTROS COMBINADOS
// ===================================
function applyFilters() {
    const maxPrice = parseInt(document.getElementById('priceRange').value);

    // Tipo de vuelo
    const showDirect  = document.querySelector('.filter-group:nth-child(3) .filter-check:nth-child(2) input').checked;
    const showLayover = document.querySelector('.filter-group:nth-child(3) .filter-check:nth-child(3) input').checked;

    const filtered = flightsData.filter(f => {
        if (f.price > maxPrice) return false;
        if (f.type === 'direct'  && !showDirect)  return false;
        if (f.type === 'layover' && !showLayover) return false;
        return true;
    });

    // Actualizar contador
    document.querySelector('.results-count strong').textContent = filtered.length;

    // Ordenar según el criterio actual y renderizar
    const sortCriteria = document.getElementById('sortSelect').value;
    renderFlights(sortFlights(filtered, sortCriteria));
}

// Escuchar cambios en todos los checkboxes
document.querySelectorAll('.filter-check input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', applyFilters);
});

// ===================================
// LIMPIAR FILTROS
// ===================================
document.getElementById('clearFilters').addEventListener('click', () => {
    // Resetear range
    const range = document.getElementById('priceRange');
    range.value = 3500;
    range.style.setProperty('--range-progress', '100%');
    document.getElementById('priceMax').textContent = 'Q3,500';

    // Resetear checkboxes a estado por defecto
    document.querySelectorAll('.filter-check input[type="checkbox"]').forEach((cb, i) => {
        // Los primeros 7 están checkeados por defecto, los demás no
        cb.checked = i < 7;
    });

    renderFlights(sortFlights(flightsData, 'price-asc'));
});

// ===================================
// INICIALIZACIÓN
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    renderFlights(sortFlights(flightsData, 'price-asc'));
});