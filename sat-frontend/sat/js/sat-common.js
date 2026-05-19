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
