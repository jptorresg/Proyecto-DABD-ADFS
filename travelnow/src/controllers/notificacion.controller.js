const db = require('../config/db');
const { sendMail } = require('../config/mailer');
const { ok, err } = require('../utils/response');

const recibirCambio = async (req, res) => {
    const { codigo_reserva_proveedor, tipo_cambio, detalle } = req.body;
    if (!codigo_reserva_proveedor, tipo_cambio, detalle) {
        return err(res, 'Fatlan campos requeridos', 400);
    }
    try {
        //Busca reserbación
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

          //Guardar notificación siempre
          await db.query(
            `INSERT INTO notificacion_proveedor
             (codigo_reserva_proveedor, id_reservacion, tipo_cambio, detalle)
             VALUES (?, ?, ?, ?)`,
            [codigo_reserva_proveedor,
             reservacion?.id_reservacion || null,
             tipo_cambio,
             JSON.stringify(detalle || {})]
          );

          if (reservacion) {
            //cancelacion
            if (tipo_cambio === 'cancelacion') {
                await db.query(
                    'UPDATE reservacion SET estado = "cancelada" WHERE id_reservacion = ?',
                    [reservacion.id_reservacion]
                );
            }
            //notificacion a usuario
            await sendMail({
                to: reservacion.correo,
                subject: `TravelNow: Cambio en tu reservación ${reservacion.codigo_reserva}`,
                html: `<p>Hola ${reservacion.nombre},</p>
                       <p>Te informamos que tu reservación <strong>${reservacion.codigo_reserva}</strong>
                       ha tenido un cambio de tipo <strong>${tipo_cambio}</strong>.</p>
                       <p>Detalle: ${JSON.stringify(detalle)}</p>
                       <p>Por favor ingresa a tu cuenta para más información.</p>`,
              });

              await db.query(
                'UPDATE notificacion_proveedor SET procesada = 1, correo_enviado = 1 WHERE codigo_reserva_proveedor = ? ORDER BY id_notificacion DESC LIMIT 1',
                [codigo_reserva_proveedor]
              );
          }
        return ok(res, { message: 'Notificacion recibida y procesada' });
    } catch (e) {
        return err(res, e.message);
    }
};

module.exports = { recibirCambio };