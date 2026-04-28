/**
 * @file Controlador para gestión de notificaciones de cambios en reservaciones
 * @description Maneja las notificaciones enviadas por proveedores sobre cambios en reservaciones de vuelos y hoteles
 * @module controllers/notificacionController
 */

const db = require('../config/db');
const { sendMail } = require('../config/mailer');
const { ok, err } = require('../utils/response');

/**
 * Procesa una notificación de cambio enviada por un proveedor
 * @async
 * @function recibirCambio
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} req.body - Cuerpo de la solicitud
 * @param {string} req.body.codigo_reserva_proveedor - Código único de reservación del proveedor
 * @param {string} req.body.tipo_cambio - Tipo de cambio (ej: 'cancelacion', 'modificacion')
 * @param {Object} req.body.detalle - Detalles adicionales del cambio en formato JSON
 * @param {Object} res - Objeto de respuesta HTTP
 * @returns {Promise<Object>} Respuesta HTTP con resultado de la operación
 * 
 * @throws {Error} Error de base de datos o envío de correo
 * 
 * @example
 * // Ejemplo de solicitud
 * POST /api/notificaciones/cambio
 * Body: {
 *   "codigo_reserva_proveedor": "ABC123",
 *   "tipo_cambio": "cancelacion",
 *   "detalle": { "motivo": "Cambio de horario" }
 * }
 */
const recibirCambio = async (req, res) => {
    const { codigo_reserva_proveedor, tipo_cambio, detalle } = req.body;
    
    /**
     * Validación de campos requeridos
     * @description Verifica que todos los campos obligatorios estén presentes
     */
    if (!codigo_reserva_proveedor || !tipo_cambio || !detalle) {
        return err(res, 'Faltan campos requeridos', 400);
    }
    
    try {
        /**
         * Búsqueda de reservación de vuelo
         * @description Busca la reservación en la tabla de detalles de vuelo usando el código del proveedor
         */
        const [detalleVuelo] = await db.query(
            `SELECT dv.id_reservacion, r.id_usuario, u.correo, u.nombre,
                    r.codigo_reserva, r.tipo
             FROM detalle_vuelo dv
             JOIN reservacion r ON r.id_reservacion = dv.id_reservacion
             JOIN usuario u     ON u.id_usuario     = r.id_usuario
             WHERE dv.codigo_reserva_proveedor = ?`,
            [codigo_reserva_proveedor]
          );
       
        /**
         * Búsqueda de reservación de hotel
         * @description Busca la reservación en la tabla de detalles de hotel usando el código del proveedor
         */
        const [detalleHotel] = await db.query(
            `SELECT dh.id_reservacion, r.id_usuario, u.correo, u.nombre,
                    r.codigo_reserva, r.tipo
             FROM detalle_hotel dh
             JOIN reservacion r ON r.id_reservacion = dh.id_reservacion
             JOIN usuario u     ON u.id_usuario     = r.id_usuario
             WHERE dh.codigo_reserva_proveedor = ?`,
            [codigo_reserva_proveedor]
          );

          /**
           * @type {Object|null} reservacion - Datos de la reservación encontrada (vuelo o hotel)
           */
          const reservacion = detalleVuelo[0] || detalleHotel[0] || null;

          /**
           * Registro de notificación en base de datos
           * @description Siempre guarda la notificación del proveedor, incluso si no se encuentra la reservación
           */
          await db.query(
            `INSERT INTO notificacion_proveedor
             (codigo_reserva_proveedor, id_reservacion, tipo_cambio, detalle)
             VALUES (?, ?, ?, ?)`,
            [codigo_reserva_proveedor,
             reservacion?.id_reservacion || null,
             tipo_cambio,
             JSON.stringify(detalle || {})]
          );

          /**
           * Procesamiento condicional si se encontró la reservación
           */
          if (reservacion) {
            /**
             * Actualización de estado por cancelación
             * @description Si el cambio es de tipo 'cancelacion', actualiza el estado de la reservación
             */
            if (tipo_cambio === 'cancelacion') {
                await db.query(
                    'UPDATE reservacion SET estado = "cancelada" WHERE id_reservacion = ?',
                    [reservacion.id_reservacion]
                );
            }
            
            /**
             * Envío de notificación por correo electrónico
             * @description Envía un email al usuario informando sobre el cambio en su reservación
             */
            await sendMail({
                to: reservacion.correo,
                subject: `TravelNow: Cambio en tu reservación ${reservacion.codigo_reserva}`,
                html: `<p>Hola ${reservacion.nombre},</p>
                       <p>Te informamos que tu reservación <strong>${reservacion.codigo_reserva}</strong>
                       ha tenido un cambio de tipo <strong>${tipo_cambio}</strong>.</p>
                       <p>Detalle: ${JSON.stringify(detalle)}</p>
                       <p>Por favor ingresa a tu cuenta para más información.</p>`,
              });

              /**
               * Actualización de estado de la notificación
               * @description Marca la notificación como procesada y con correo enviado
               */
              await db.query(
                'UPDATE notificacion_proveedor SET procesada = 1, correo_enviado = 1 WHERE codigo_reserva_proveedor = ? ORDER BY id_notificacion DESC LIMIT 1',
                [codigo_reserva_proveedor]
              );
          }
          
        /**
         * Respuesta exitosa
         * @returns {Object} Respuesta con mensaje de éxito
         */
        return ok(res, { message: 'Notificacion recibida y procesada' });
    } catch (e) {
        /**
         * Manejo de errores
         * @description Captura y retorna cualquier error durante el procesamiento
         */
        return err(res, e.message);
    }
};

/**
 * Exportación de módulo
 * @exports controllers/notificacionController
 */
module.exports = { recibirCambio };