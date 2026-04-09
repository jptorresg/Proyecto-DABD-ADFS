/**
 * @file rate-limit.middleware.js
 * @brief Middleware de rate limiting sin dependencias externas.
 * 
 * Implementa limitación de peticiones por IP usando un Map en memoria con ventana deslizante.
 * 
 * @author Equipo de Desarrollo
 * @version 1.0.0
 * @date 2024
 * 
 * @section FIX FIX #15 — Rate limiting sin dependencias externas.
 * 
 * Usa un Map en memoria con ventana deslizante por IP.
 * Funciona correctamente en desarrollo y en producción de instancia única.
 * 
 * @warning En producción con múltiples instancias Node (clúster / PM2 / k8s)
 *          se recomienda reemplazar el Map por un store compartido (Redis + ioredis).
 *          El contrato de la API de esta función es idéntico al de express-rate-limit,
 *          facilitando esa migración futura.
 */

/**
 * @brief Crea un middleware de rate limiting por IP.
 * 
 * @param {Object} opts - Opciones de configuración
 * @param {number} [opts.windowMs=900000] - Ventana de tiempo en ms (default: 15 minutos = 900000 ms)
 * @param {number} [opts.max=100] - Peticiones máximas permitidas por ventana
 * @param {string} [opts.message] - Mensaje de error personalizado cuando se excede el límite
 * 
 * @returns {Function} Middleware de Express (req, res, next) => void
 * 
 * @throws {Error} No lanza errores directamente, responde con 429 cuando se excede el límite
 * 
 * @note La función es idéntica en interfaz a express-rate-limit para facilitar migración futura
 * 
 * @see express-rate-limit
 */
function rateLimit({ windowMs = 15 * 60 * 1000, max = 100, message } = {}) {
    /**
     * @typedef {Object} RateLimitRecord
     * @property {number} count - Número de peticiones en la ventana actual
     * @property {number} resetAt - Timestamp (ms) cuando expira la ventana actual
     */
    
    /** @type {Map<string, RateLimitRecord>} Almacén de registros por IP */
    const store = new Map();

    /**
     * @brief Limpieza periódica de registros expirados
     * @note Previene memory leak en IPs que dejan de hacer peticiones
     */
    const cleanupInterval = setInterval(() => {
        const now = Date.now();
        for (const [ip, record] of store.entries()) {
            if (now > record.resetAt) store.delete(ip);
        }
    }, windowMs);

    /** @note Evitar que el interval bloquee el shutdown de Node */
    if (cleanupInterval.unref) cleanupInterval.unref();

    /**
     * @brief Middleware de Express que aplica el rate limiting
     * 
     * @param {Object} req - Objeto de petición de Express
     * @param {Object} res - Objeto de respuesta de Express
     * @param {Function} next - Siguiente middleware
     * 
     * @returns {void|Object} Si se excede el límite, responde con 429; si no, llama a next()
     */
    return (req, res, next) => {
        /**
         * @note Respetar proxy (Nginx, Cloudflare) si está configurado en Express
         * @see req.ip - Express trust proxy setting
         */
        const ip  = req.ip || req.connection?.remoteAddress || 'unknown';
        const now = Date.now();

        let record = store.get(ip);

        if (!record || now > record.resetAt) {
            /** @brief Primera petición o ventana expirada → reiniciar contador */
            record = { count: 1, resetAt: now + windowMs };
            store.set(ip, record);
        } else {
            record.count += 1;
        }

        /**
         * @brief Cabeceras informativas estándar
         * @note Mismo formato que express-rate-limit (estándar de facto)
         */
        res.setHeader('X-RateLimit-Limit',     max);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
        res.setHeader('X-RateLimit-Reset',     Math.ceil(record.resetAt / 1000));

        if (record.count > max) {
            const retryAfter = Math.ceil((record.resetAt - now) / 1000);
            res.setHeader('Retry-After', retryAfter);
            
            /** @return {Object} Respuesta HTTP 429 con mensaje de error */
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
 * @brief Limiter específico para endpoint de login
 * 
 * @details 10 intentos por ventana de 15 minutos por IP.
 *          Protege contra fuerza bruta de contraseñas.
 * 
 * @type {Function}
 */
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max:      10,
    message:  'Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos.',
});

/**
 * @brief Limiter específico para endpoint de registro
 * 
 * @details 5 cuentas por hora por IP.
 *          Protege contra creación masiva de cuentas spam.
 * 
 * @type {Function}
 */
const registroLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max:      5,
    message:  'Demasiados registros desde esta IP. Intenta de nuevo en 1 hora.',
});

/**
 * @brief Limiter específico para endpoint de búsquedas
 * 
 * @details 60 búsquedas por minuto por IP.
 *          Las búsquedas hacen peticiones externas a proveedores; limitar evita abuso.
 * 
 * @type {Function}
 */
const searchLimiter = rateLimit({
    windowMs: 60 * 1000,
    max:      60,
    message:  'Límite de búsquedas alcanzado. Intenta de nuevo en 1 minuto.',
});

/**
 * @brief Limiter general para API
 * 
 * @details 200 peticiones por 15 minutos.
 *          Fallback para cualquier endpoint no cubierto por los limiter específicos.
 * 
 * @type {Function}
 */
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max:      200,
});

/** @exports {Object} Módulo con funciones y middlewares preconfigurados */
module.exports = { rateLimit, loginLimiter, registroLimiter, searchLimiter, apiLimiter };