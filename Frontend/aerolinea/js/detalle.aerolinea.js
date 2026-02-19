/* ============================================================
   DATOS ESTÁTICOS
   ============================================================ */

// ── Detalles del vuelo (inyectados en el grid) ──
const flightDetails = [
    { icon: "fa-chair",          label: "Clase",            value: "Turista (Economy)" },
    { icon: "fa-exchange-alt",   label: "Duración total",   value: "4h 25m"            },
    { icon: "fa-tachometer-alt", label: "Segmentos",        value: "2 vuelos"          },
    { icon: "fa-users",          label: "Capacidad",        value: "180 pasajeros"     },
    { icon: "fa-wifi",           label: "Wi-Fi",            value: "Disponible"        },
    { icon: "fa-utensils",       label: "Comida",           value: "Snack incluido"    }
];

// ── Equipaje ──
const baggageItems = [
    { title: "Equipaje de cabina",   desc: "1 mochila pequeña (40×30×15 cm)",            included: true  },
    { title: "Artículo personal",    desc: "Bolso o monedero bajo el asiento",            included: true  },
    { title: "Equipaje facturado",   desc: "No incluido · +Q150 por maleta (23 kg)",      included: false },
    { title: "Equipaje especial",    desc: "No incluido · Consulte políticas",            included: false }
];

// ── Incluidos en el precio (panel derecho) ──
const priceIncluded = [
    "Equipaje de cabina",
    "Artículo personal",
    "Selección de asiento básica",
    "Seguro de vuelo básico"
];

// ── Extras opcionales (precio por persona × 2 pasajeros) ──
const extras = [
    { name: "Equipaje facturado",     desc: "23 kg por persona",           priceUnit: 150 },
    { name: "Asiento preferencial",   desc: "Más espacio para piernas",   priceUnit: 80  },
    { name: "Paquete de comida",      desc: "Menú completo + bebida",     priceUnit: 45  }
];

const BASE_TOTAL = 1900; // Q950 × 2

// ── Comentarios (árbol anidado) ──
let commentsData = [
    {
        id: 1,
        author: "Carlos M.", avatar: "CM", color: "#4A5F7F",
        date: "28 Ene 2026", rating: 5, likes: 24,
        text: "Excelente experiencia en todo momento. La escala en Houston fue muy manejable, el aeropuerto es grande pero bien señalizado. La tripulación fue muy amable y profesional.",
        replies: [
            {
                id: 11,
                author: "Laura P.", avatar: "LP", color: "#5A7299",
                date: "28 Ene 2026", rating: null, likes: 8,
                text: "¡Genial! Yo también tuve una experiencia muy similar la semana pasada. ¿Cuánto tiempo les dejaron en la escala?",
                replies: [
                    {
                        id: 111,
                        author: "Carlos M.", avatar: "CM", color: "#4A5F7F",
                        date: "29 Ene 2026", rating: null, likes: 5,
                        text: "En mi caso fue 1 hora 10 minutos, justo lo que dice en la boleta. Fue suficiente para pasar por migración sin problemas.",
                        replies: []
                    }
                ]
            },
            {
                id: 12,
                author: "Miguel R.", avatar: "MR", color: "#3A4D63",
                date: "29 Ene 2026", rating: null, likes: 3,
                text: "Yo volé en ese mismo vuelo hace un mes. Estoy de acuerdo con Carlos, muy buen servicio general.",
                replies: []
            }
        ]
    },
    {
        id: 2,
        author: "Sandra L.", avatar: "SL", color: "#6B8E9F",
        date: "25 Ene 2026", rating: 4, likes: 18,
        text: "El vuelo fue cómodo y el precio muy competitivo. Lo único que no me gustó tanto es que el asiento no tenía mucho espacio para las piernas, pero para un vuelo corto está bien.",
        replies: [
            {
                id: 21,
                author: "Pedro K.", avatar: "PK", color: "#8A9BB0",
                date: "25 Ene 2026", rating: null, likes: 12,
                text: "Mismo problema tuve yo. Si te importa el espacio te recomiendo pagar por el asiento preferencial, vale la pena el precio extra.",
                replies: []
            }
        ]
    },
    {
        id: 3,
        author: "Ana G.", avatar: "AG", color: "#5B8CC6",
        date: "22 Ene 2026", rating: 3, likes: 9,
        text: "La escala se hizo un poco pesada porque tuve que esperar casi 2 horas por un retraso no anunciado. Aparte todo bien, pero eso sí fue frustrante.",
        replies: [
            {
                id: 31,
                author: "Servicio al Cliente", avatar: "SC", color: "#28a745",
                date: "22 Ene 2026", rating: null, likes: 6,
                text: "Hola Ana, lamentamos mucho el inconveniente con el retraso. Por favor comuníquese al +502 2345-6789 para revisar si aplica alguna compensación. ¡Gracias por su retroalimentación!",
                oficial: true,
                replies: []
            }
        ]
    },
    {
        id: 4,
        author: "Roberto V.", avatar: "RV", color: "#7A5F9F",
        date: "20 Ene 2026", rating: 5, likes: 31,
        text: "Primera vez volando con Halcón y no me decepcionó. Todo muy profesional y organizado. Sin duda volaré otra vez con esta aerolínea.",
        replies: []
    },
    {
        id: 5,
        author: "Valentina C.", avatar: "VC", color: "#9F7A5F",
        date: "18 Ene 2026", rating: 2, likes: 4,
        text: "El avión estaba un poco sucio por dentro y la comida del paquete no era muy buena. Esperaba más dado el precio que se cobra.",
        replies: [
            {
                id: 51,
                author: "Servicio al Cliente", avatar: "SC", color: "#28a745",
                date: "18 Ene 2026", rating: null, likes: 2,
                text: "Hola Valentina, agradecemos sus comentarios. Tomamos nota y lo comunicaremos al equipo de operaciones. Su retroalimentación nos ayuda a mejorar continuamente.",
                oficial: true,
                replies: []
            },
            {
                id: 52,
                author: "Marco T.", avatar: "MT", color: "#5F9F7A",
                date: "19 Ene 2026", rating: null, likes: 1,
                text: "Raro, yo volé hace dos semanas y estaba muy limpio. Puede que fue mala suerte, no siempre es exactamente igual.",
                replies: []
            }
        ]
    }
];

let nextId = 200;

/* ============================================================
   UTILIDADES
   ============================================================ */

// genera HTML de estrellas para un rating dado
function starsHtml(rating) {
    let h = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= Math.floor(rating))          h += '<i class="fas fa-star"></i>';
        else if (rating - Math.floor(rating) >= 0.5 && i === Math.floor(rating) + 1)
                                              h += '<i class="fas fa-star-half-alt"></i>';
        else                                  h += '<i class="far fa-star"></i>';
    }
    return h;
}

/* ============================================================
   RENDER: detalles del vuelo
   ============================================================ */
function renderDetails() {
    const grid = document.getElementById('detailsGrid');
    grid.innerHTML = flightDetails.map(d => `
        <div class="det-detail-item">
            <div class="det-di-icon"><i class="fas ${d.icon}"></i></div>
            <div>
                <span class="det-di-label">${d.label}</span>
                <span class="det-di-value">${d.value}</span>
            </div>
        </div>
    `).join('');
}

/* ============================================================
   RENDER: equipaje
   ============================================================ */
function renderBaggage() {
    const grid = document.getElementById('baggageGrid');
    grid.innerHTML = baggageItems.map(b => `
        <div class="det-bag-item ${b.included ? 'included' : 'excluded'}">
            <div class="det-bag-icon">
                <i class="fas ${b.included ? 'fa-check-circle' : 'fa-times-circle'}"></i>
            </div>
            <div>
                <span class="det-bag-title">${b.title}</span>
                <span class="det-bag-desc">${b.desc}</span>
            </div>
        </div>
    `).join('');
}

/* ============================================================
   RENDER: barras de distribución de rating
   ============================================================ */
function renderRatingBars() {
    const percents = [42, 33, 15, 7, 3]; // 5→1
    const container = document.getElementById('ratingBars');
    container.innerHTML = percents.map((p, i) => `
        <div class="det-rs-bar-row">
            <span class="det-rs-bar-n">${5 - i}</span>
            <i class="fas fa-star det-rs-bar-star"></i>
            <div class="det-rs-bar-track"><div class="det-rs-bar-fill" style="width:${p}%"></div></div>
            <span class="det-rs-bar-pct">${p}%</span>
        </div>
    `).join('');
}

/* ============================================================
   RENDER: panel precio (incluidos + extras)
   ============================================================ */
function renderPricePanel() {
    // incluidos
    document.getElementById('ppIncluded').innerHTML = priceIncluded.map(item =>
        `<li><i class="fas fa-check"></i> ${item}</li>`
    ).join('');

    // extras
    document.getElementById('ppExtras').innerHTML = extras.map((e, i) => `
        <label class="det-pp-extra">
            <input type="checkbox" data-extra="${i}">
            <div class="det-pp-extra-info">
                <span class="det-pp-extra-name">${e.name}</span>
                <span class="det-pp-extra-desc">${e.desc}</span>
            </div>
            <span class="det-pp-extra-price">+Q${e.priceUnit * 2}</span>
        </label>
    `).join('');

    // escuchar cambios en extras
    document.querySelectorAll('.det-pp-extra input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', recalcTotal);
    });
}

function recalcTotal() {
    let total = BASE_TOTAL;
    document.querySelectorAll('.det-pp-extra input[type="checkbox"]').forEach((cb, i) => {
        if (cb.checked) total += extras[i].priceUnit * 2;
    });
    document.getElementById('ppTotalPrice').textContent = 'Q' + total.toLocaleString();
}

/* ============================================================
   RENDER: estrellas en elementos fijos (hero + resumen)
   ============================================================ */
function renderStarsInto(id, rating) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = starsHtml(rating);
}

/* ============================================================
   COMENTARIOS – renderizado recursivo
   ============================================================ */
function renderComment(comment) {
    const div = document.createElement('div');
    div.className = 'det-comment';
    div.dataset.id = comment.id;

    const oficialBadge = comment.oficial
        ? '<span class="det-comment-oficial">✓ Oficial</span>' : '';

    const starsEl = comment.rating
        ? `<span class="det-comment-stars">${starsHtml(comment.rating)}</span>` : '';

    div.innerHTML = `
        <div class="det-comment-header">
            <div class="det-comment-avatar" style="background:${comment.color}">${comment.avatar}</div>
            <span class="det-comment-author">${comment.author}${oficialBadge}</span>
            <span class="det-comment-date">${comment.date}</span>
            ${starsEl}
        </div>
        <p class="det-comment-text">${comment.text}</p>
        <div class="det-comment-actions">
            <button class="det-comment-action" data-action="like" data-id="${comment.id}">
                <i class="fas fa-thumbs-up"></i>
                <span class="det-like-count">${comment.likes}</span>
            </button>
            <button class="det-comment-action" data-action="reply" data-id="${comment.id}">
                <i class="fas fa-reply"></i> Responder
            </button>
        </div>
        <div class="det-reply-box" id="replyBox${comment.id}">
            <textarea placeholder="Escribe tu respuesta…"></textarea>
            <div class="det-reply-box-actions">
                <button class="det-reply-cancel" data-id="${comment.id}">Cancelar</button>
                <button class="det-reply-send"   data-id="${comment.id}">Responder</button>
            </div>
        </div>
    `;

    // respuestas anidadas (recursivo)
    if (comment.replies && comment.replies.length) {
        const repliesWrap = document.createElement('div');
        repliesWrap.className = 'det-comment-replies';
        comment.replies.forEach(r => repliesWrap.appendChild(renderComment(r)));
        div.appendChild(repliesWrap);
    }

    return div;
}

function renderComments(data) {
    const tree = document.getElementById('commentsTree');
    tree.innerHTML = '';
    data.forEach(c => tree.appendChild(renderComment(c)));
    bindCommentEvents();
}

/* ============================================================
   EVENTOS DE COMENTARIOS
   ============================================================ */
function bindCommentEvents() {

    // ── Like ──
    document.querySelectorAll('[data-action="like"]').forEach(btn => {
        btn.addEventListener('click', function() {
            const countEl = this.querySelector('.det-like-count');
            let n = parseInt(countEl.textContent);
            if (this.classList.contains('liked')) { n--; this.classList.remove('liked'); }
            else                                  { n++; this.classList.add('liked');   }
            countEl.textContent = n;
        });
    });

    // ── Abrir caja respuesta ──
    document.querySelectorAll('[data-action="reply"]').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            const box = document.getElementById('replyBox' + id);
            // cerrar todas las abiertas
            document.querySelectorAll('.det-reply-box.visible').forEach(b => b.classList.remove('visible'));
            if (!box.classList.contains('visible')) {
                box.classList.add('visible');
                box.querySelector('textarea').focus();
            }
        });
    });

    // ── Cancelar respuesta ──
    document.querySelectorAll('.det-reply-cancel').forEach(btn => {
        btn.addEventListener('click', function() {
            const box = document.getElementById('replyBox' + this.dataset.id);
            box.classList.remove('visible');
            box.querySelector('textarea').value = '';
        });
    });

    // ── Enviar respuesta ──
    document.querySelectorAll('.det-reply-send').forEach(btn => {
        btn.addEventListener('click', function() {
            const parentId = parseInt(this.dataset.id);
            const box      = document.getElementById('replyBox' + parentId);
            const text     = box.querySelector('textarea').value.trim();
            if (!text) return;

            const nuevo = {
                id: nextId++,
                author: "Tú", avatar: "TU", color: "#4A5F7F",
                date: new Date().toLocaleDateString('es-GT', { day:'numeric', month:'short', year:'numeric' }),
                rating: null, likes: 0, text,
                replies: []
            };

            insertReply(commentsData, parentId, nuevo);
            renderComments(commentsData);
        });
    });
}

// busca recursivo y agrega la respuesta
function insertReply(arr, parentId, nuevo) {
    for (const c of arr) {
        if (c.id === parentId) { c.replies.push(nuevo); return true; }
        if (c.replies && insertReply(c.replies, parentId, nuevo)) return true;
    }
    return false;
}

/* ============================================================
   NUEVO COMENTARIO PRINCIPAL
   ============================================================ */
let selectedRating = 0;

function initStarInput() {
    const container = document.getElementById('ncStars');
    const stars     = container.querySelectorAll('i');

    function highlight(n) {
        stars.forEach((s, i) => s.classList.toggle('active', i < n));
    }

    stars.forEach((star, idx) => {
        star.addEventListener('mouseenter', () => highlight(idx + 1));
        star.addEventListener('mouseleave', () => highlight(selectedRating));
        star.addEventListener('click',      () => { selectedRating = idx + 1; highlight(selectedRating); });
    });

    document.getElementById('ncPostBtn').addEventListener('click', () => {
        const text = document.getElementById('ncTextarea').value.trim();
        if (!text)            return;
        if (!selectedRating)  { alert('Por favor deja una calificación.'); return; }

        commentsData.unshift({
            id: nextId++,
            author: "Tú", avatar: "TU", color: "#4A5F7F",
            date: new Date().toLocaleDateString('es-GT', { day:'numeric', month:'short', year:'numeric' }),
            rating: selectedRating, likes: 0, text,
            replies: []
        });

        renderComments(commentsData);

        // limpiar
        document.getElementById('ncTextarea').value = '';
        selectedRating = 0;
        highlight(0);
    });
}

/* ============================================================
   ORDENAMIENTO DE COMENTARIOS
   ============================================================ */
function initCommentSort() {
    document.querySelectorAll('.det-sort-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.det-sort-btn').forEach(b => b.classList.remove('det-sort-active'));
            this.classList.add('det-sort-active');

            let sorted = [...commentsData];
            switch (this.dataset.sort) {
                case 'top':    sorted.sort((a,b) => b.likes  - a.likes);  break;
                case 'high':   sorted.sort((a,b) => (b.rating||0) - (a.rating||0)); break;
                case 'low':    sorted.sort((a,b) => (a.rating||0) - (b.rating||0)); break;
                // 'recent' → orden original
            }
            renderComments(sorted);
        });
    });
}

/* ============================================================
   BOTÓN COMPRA
   ============================================================ */
function initCheckout() {
    document.getElementById('ppCheckout').addEventListener('click', () => {
        const total = document.getElementById('ppTotalPrice').textContent;
        alert(`Redirigiendo a la página de compra…\nTotal: ${total}`);
    });
}

/* ============================================================
   INICIALIZACIÓN
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    renderStarsInto('heroStars',    4.5);
    renderStarsInto('summaryStars', 4.5);
    renderDetails();
    renderBaggage();
    renderRatingBars();
    renderPricePanel();
    renderComments(commentsData);
    initStarInput();
    initCommentSort();
    initCheckout();
});