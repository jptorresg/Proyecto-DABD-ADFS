/**
 * rate-limit.middleware.js
 *
 * FIX #15 — Rate limiting sin dependencias externas.
 *
 * Usa un Map en memoria con ventana deslizante por IP.
 * Funciona correctamente en desarrollo y en producción de instancia única.
 *
 * NOTA: en producción con múltiples instancias Node (clúster / PM2 / k8s)
 * se recomienda reemplazar el Map por un store compartido (Redis + ioredis).
 * El contrato de la API de esta función es idéntico al de express-rate-limit,
 * facilitando esa migración futura.
 */

/**
 * Crea un middleware de rate limiting por IP.
 *
 * @param {object} opts
 * @param {number} opts.windowMs   - Ventana de tiempo en ms (default: 15 minutos)
 * @param {number} opts.max        - Peticiones máximas por ventana (default: 100)
 * @param {string} [opts.message]  - Mensaje de error personalizado
 */
function rateLimit({ windowMs = 15 * 60 * 1000, max = 100, message } = {}) {
    // Map<ip, { count: number, resetAt: number }>
    const store = new Map();

    // Limpieza periódica para evitar memory leak en IPs que dejan de peticionar
    const cleanupInterval = setInterval(() => {
        const now = Date.now();
        for (const [ip, record] of store.entries()) {
            if (now > record.resetAt) store.delete(ip);
        }
    }, windowMs);

    // Evitar que el interval bloquee el shutdown de Node
    if (cleanupInterval.unref) cleanupInterval.unref();

    return (req, res, next) => {
        // Respetar proxy (Nginx, Cloudflare) si está configurado en Express
        const ip  = req.ip || req.connection?.remoteAddress || 'unknown';
        const now = Date.now();

        let record = store.get(ip);

        if (!record || now > record.resetAt) {
            // Primera petición o ventana expirada → reiniciar contador
            record = { count: 1, resetAt: now + windowMs };
            store.set(ip, record);
        } else {
            record.count += 1;
        }

        // Cabeceras informativas (estándar de facto, igual a express-rate-limit)
        res.setHeader('X-RateLimit-Limit',     max);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
        res.setHeader('X-RateLimit-Reset',     Math.ceil(record.resetAt / 1000));

        if (record.count > max) {
            const retryAfter = Math.ceil((record.resetAt - now) / 1000);
            res.setHeader('Retry-After', retryAfter);
            return res.status(429).json({
                ok:      false,
                message: message || `Demasiadas peticiones. Intenta de nuevo en ${retryAfter} segundos.`,
            });
        }

        next();
    };
}

// ── Configuraciones predefinidas por tipo de endpoint ──────────────────────

/**
 * Login — 10 intentos por ventana de 15 minutos por IP.
 * Protege contra fuerza bruta de contraseñas.
 */
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max:      10,
    message:  'Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos.',
});

/**
 * Registro — 5 cuentas por hora por IP.
 * Protege contra creación masiva de cuentas spam.
 */
const registroLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max:      5,
    message:  'Demasiados registros desde esta IP. Intenta de nuevo en 1 hora.',
});

/**
 * Búsquedas — 60 búsquedas por minuto por IP.
 * Las búsquedas hacen peticiones externas a proveedores; limitar evita abuso.
 */
const searchLimiter = rateLimit({
    windowMs: 60 * 1000,
    max:      60,
    message:  'Límite de búsquedas alcanzado. Intenta de nuevo en 1 minuto.',
});

/**
 * API general — 200 peticiones por 15 minutos.
 * Fallback para cualquier endpoint no cubierto por los anteriores.
 */
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max:      200,
});

module.exports = { rateLimit, loginLimiter, registroLimiter, searchLimiter, apiLimiter };