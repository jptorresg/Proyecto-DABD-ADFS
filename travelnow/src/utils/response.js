//Respuesta estandarizada para la API REST
const ok = (res, data, status = 200) => res.status(status).json({ ok: true, ...data });
const err = (res, message, status = 500) => res.status(status).json({ ok: false, message });

module.exports = { ok, err };