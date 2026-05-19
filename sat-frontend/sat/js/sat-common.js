// =============================================================
// SAT Common - auth, api wrapper, helpers
// =============================================================

const SAT_API_BASE = 'http://localhost:8090';
const SAT_BEDLY_BASE = 'http://localhost:5043';

const TOKEN_KEY = 'sat_token';
const USER_KEY = 'sat_user';

function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function getUser() {
    const u = localStorage.getItem(USER_KEY);
    return u ? JSON.parse(u) : null;
}

function setAuth(user, token) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

function logout() {
    clearAuth();
    window.location.href = 'login.html';
}

function requireAuth() {
    if (!getToken()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

function authHeaders(extra) {
    const h = { ...(extra || {}) };
    const token = getToken();
    if (token) h['Authorization'] = 'Bearer ' + token;
    return h;
}

/** Fetch JSON con auth. Retorna data parseada o lanza error. */
async function api(path, options) {
    options = options || {};
    const res = await fetch(SAT_API_BASE + path, {
        method: options.method || 'GET',
        headers: authHeaders({
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(options.headers || {})
        }),
        body: options.body ? JSON.stringify(options.body) : undefined
    });
    if (res.status === 401 || res.status === 403) {
        clearAuth();
        window.location.href = 'login.html';
        throw new Error('No autorizado');
    }
    if (!res.ok) {
        let msg = res.statusText;
        try { const j = await res.json(); msg = j.error || j.message || msg; } catch (e) {}
        throw new Error(msg);
    }
    if (res.status === 204) return null;
    return res.json();
}

/** Descargar archivo (PDF/Excel) protegido y dispararlo como descarga. */
async function downloadFile(path, filename) {
    const res = await fetch(SAT_API_BASE + path, {
        method: 'GET',
        headers: authHeaders()
    });
    if (res.status === 401 || res.status === 403) {
        clearAuth();
        window.location.href = 'login.html';
        return;
    }
    if (!res.ok) {
        alert('Error al descargar: ' + res.statusText);
        return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function fmtMoney(v) {
    if (v == null) return 'Q 0.00';
    return 'Q ' + Number(v).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(v) {
    if (!v) return '-';
    const d = new Date(v);
    if (isNaN(d.getTime())) return v;
    return d.toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' });
}

/**
 * Inyecta el sidebar lateral en el body. Llamar al inicio de cada pagina
 * autenticada con el activePage correspondiente.
 */
function renderSatLayout(activePage) {
    const u = getUser();
    const userEmail = u ? u.email : 'Usuario';
    const userTipo = u ? u.tipoUsuario : '';
    const mark = (p) => activePage === p ? 'active' : '';
    const html = `
    <button class="sat-burger" onclick="document.querySelector('.sat-sidebar').classList.toggle('open')">
        <i class="bi bi-list"></i>
    </button>
    <aside class="sat-sidebar">
        <div class="sat-brand">
            <i class="bi bi-shield-shaded"></i>
            <div>
                <div class="sat-brand-title">SAT</div>
                <div class="sat-brand-sub">Admin. Tributaria</div>
            </div>
        </div>
        <div class="sat-user">
            <i class="bi bi-person-circle"></i>
            <div>
                <div>${userEmail}</div>
                <div style="font-size:0.7rem; color:rgba(255,255,255,0.5);">${userTipo}</div>
            </div>
        </div>
        <nav class="sat-nav">
            <div class="sat-nav-section">Principal</div>
            <a href="dashboard.html" class="sat-nav-item ${mark('dashboard')}">
                <i class="bi bi-speedometer2"></i> Dashboard
            </a>

            <div class="sat-nav-section">Facturas</div>
            <a href="facturas.html" class="sat-nav-item ${mark('facturas')}">
                <i class="bi bi-file-earmark-text"></i> Listado
            </a>
            <a href="crear-factura.html" class="sat-nav-item ${mark('crear')}">
                <i class="bi bi-plus-circle"></i> Crear factura
            </a>
            <a href="desde-bedly.html" class="sat-nav-item ${mark('bedly')}">
                <i class="bi bi-link-45deg"></i> Desde Bedly
            </a>

            <div class="sat-nav-section">Reportería</div>
            <a href="reportes.html" class="sat-nav-item ${mark('reportes')}">
                <i class="bi bi-graph-up"></i> Reportes y PDFs
            </a>
        </nav>
        <div class="sat-bottom">
            <a href="landing.html" class="sat-nav-item">
                <i class="bi bi-globe"></i> Ver Sitio
            </a>
            <a href="#" onclick="logout(); return false;" class="sat-nav-item sat-logout">
                <i class="bi bi-box-arrow-left"></i> Cerrar Sesión
            </a>
        </div>
    </aside>`;
    document.body.insertAdjacentHTML('afterbegin', html);
}
