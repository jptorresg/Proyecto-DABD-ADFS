'use strict';

/**
 * @file Controlador para el módulo B2B (clientes empresariales).
 * @description Maneja autenticación JWT y endpoints utilitarios del API REST
 *              que TravelNow expone a otras empresas (otras agencias, hoteles, aerolíneas).
 * @module controllers/b2bController
 */

const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { sendMail } = require('../config/mailer');
const { ok, err } = require('../utils/response');
require('dotenv').config();

/**
 * Autentica un cliente B2B (rol = 'webservice') y devuelve un JWT.
 * 
 * Endpoint: POST /api/b2b/auth/login
 * Body: { correo, contrasena }
 * Response: { ok, token, expira_en, usuario: { id_usuario, correo, nombre, rol } }
 */
const login = async (req, res) => {
    const { correo, contrasena } = req.body;

    if (!correo || !contrasena) {
        return err(res, 'Correo y contraseña requeridos', 400);
    }

    try {
        const [rows] = await db.query(
            'SELECT * FROM usuario WHERE correo = ? AND estado = "activo"',
            [correo]
        );
        if (!rows.length) return err(res, 'Credenciales incorrectas', 401);

        const usuario = rows[0];

        // Solo usuarios webservice pueden usar el API B2B
        if (usuario.rol !== 'webservice') {
            return err(res, 'Este usuario no tiene permisos para acceder al API B2B', 403);
        }

        if (contrasena !== usuario.contrasena) {
            return err(res, 'Credenciales incorrectas', 401);
        }

        const payload = {
            id_usuario: usuario.id_usuario,
            nombre:     usuario.nombre,
            correo:     usuario.correo,
            rol:        usuario.rol,
        };

        const expiresIn = process.env.JWT_EXPIRES_IN || '8h';
        const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn });

        return ok(res, {
            token,
            expira_en: expiresIn,
            usuario:   payload,
        });
    } catch (e) {
        return err(res, e.message);
    }
};

/**
 * Devuelve los datos del cliente B2B autenticado.
 * Útil para que el cliente verifique que su token sigue siendo válido.
 * 
 * Endpoint: GET /api/b2b/me
 * Header: Authorization: Bearer <token>
 */
const me = (req, res) => {
    if (!req.user || !req.user.es_b2b) {
        return err(res, 'Solo accesible desde API B2B con token válido', 403);
    }
    return ok(res, {
        usuario: {
            id_usuario: req.user.id_usuario,
            correo:     req.user.correo,
            nombre:     req.user.nombre,
            rol:        req.user.rol,
        },
    });
};

/**
 * Recibe notificaciones de cambios desde proveedores (aerolíneas/hoteles).
 * Es la versión autenticada del antiguo /api/notifications/webhook.
 * 
 * Endpoint: POST /api/b2b/notifications/cambio
 * Header: Authorization: Bearer <token de proveedor>
 * Body: { codigo_reserva_proveedor, tipo_cambio, detalle }
 * 
 * @description El proveedor primero hace login en /api/b2b/auth/login con su
 *              usuario webservice, y luego usa el token para reportar el cambio.
 *              La lógica de procesamiento es la misma que el webhook anterior.
 */
const recibirCambio = async (req, res) => {
    const { codigo_reserva_proveedor, tipo_cambio, detalle } = req.body;

    if (!codigo_reserva_proveedor || !tipo_cambio) {
        return err(res, 'Faltan campos requeridos: codigo_reserva_proveedor, tipo_cambio', 400);
    }

    try {
        // Buscar la reservación afectada (vuelo o hotel)
        const [detalleVuelo] = await db.query(
            `SELECT dv.id_reservacion, r.id_usuario, u.correo, u.nombre,
                    r.codigo_reserva, r.tipo
               FROM detalle_vuelo dv
               JOIN reservacion r ON r.id_reservacion = dv.id_reservacion
               JOIN usuario u     ON u.id_usuario     = r.id_usuario
              WHERE dv.codigo_reserva_proveedor = ?`,
            [codigo_reserva_proveedor]
        );

        const [detalleHotel] = await db.query(
            `SELECT dh.id_reservacion, r.id_usuario, u.correo, u.nombre,
                    r.codigo_reserva, r.tipo
               FROM detalle_hotel dh
               JOIN reservacion r ON r.id_reservacion = dh.id_reservacion
               JOIN usuario u     ON u.id_usuario     = r.id_usuario
              WHERE dh.codigo_reserva_proveedor = ?`,
            [codigo_reserva_proveedor]
        );

        const reservacion = detalleVuelo[0] || detalleHotel[0] || null;

        // Registrar siempre la notificación (incluso si no encontramos la reserva)
        await db.query(
            `INSERT INTO notificacion_proveedor
               (codigo_reserva_proveedor, id_reservacion, tipo_cambio, detalle)
             VALUES (?, ?, ?, ?)`,
            [
                codigo_reserva_proveedor,
                reservacion?.id_reservacion || null,
                tipo_cambio,
                JSON.stringify(detalle || {}),
            ]
        );

        if (reservacion) {
            // Si es cancelación, actualizar estado
            if (tipo_cambio === 'cancelacion') {
                await db.query(
                    'UPDATE reservacion SET estado = "cancelada" WHERE id_reservacion = ?',
                    [reservacion.id_reservacion]
                );
            }

            // Notificar al usuario por correo
            try {
                await sendMail({
                    to: reservacion.correo,
                    subject: `TravelNow: Cambio en tu reservación ${reservacion.codigo_reserva}`,
                    html: `<p>Hola ${reservacion.nombre},</p>
                           <p>Te informamos que tu reservación <strong>${reservacion.codigo_reserva}</strong>
                              tuvo un cambio reportado por el proveedor. Tipo de cambio: <strong>${tipo_cambio}</strong>.</p>
                           <p>Detalle: ${JSON.stringify(detalle)}</p>
                           <p>Ingresa a tu cuenta para ver más información.</p>`,
                });
                await db.query(
                    `UPDATE notificacion_proveedor
                        SET procesada = 1, correo_enviado = 1
                      WHERE codigo_reserva_proveedor = ?
                      ORDER BY id_notificacion DESC LIMIT 1`,
                    [codigo_reserva_proveedor]
                );
            } catch (mailErr) {
                console.error('[B2B] Correo de notificación falló:', mailErr.message);
            }
        }

        return ok(res, {
            message:       'Notificación recibida y procesada',
            reportado_por: req.user.correo,
            reserva_encontrada: !!reservacion,
        });
    } catch (e) {
        return err(res, e.message);
    }
};

module.exports = { login, me, recibirCambio };