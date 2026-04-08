'use strict';
const db = require('../config/db');
const proveedorService = require('../services/proveedor.service');
const { sendMail } = require('../config/mailer');
const { ok, err } = require('../utils/response');
const { generarCodigoReserva } = require('../utils/codigo');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

//Crear reservación
const crear = async (req, res) => {
    const usuario = req.user;
    const { tipo, metodo_pago, datos_cobro, vuelo, vuelo_regreso, hotel } = req.body;
    if(!tipo || !metodo_pago){
        return err(res, 'Faltan campos requeridos: tipo y metodo_pago', 400);
    }
    const conn = await db.getConnection();
    try{
        await conn.beginTransaction();
        let totalAgencia = 0;
        const codigoReserva = generarCodigoReserva();
        const [resResult] = await conn.query(`INSERT INTO reservacion (codigo_reserva, id_usuario, tipo, total, moneda, estado, metodo_pago, datos_cobro) VALUES (?, ?, ?, 0, "USD", "pendiente", ?, ?)`, [codigoReserva, usuario.id_usuario, tipo, metodo_pago, JSON.stringify(datos_cobro || {})]);
        const idReservacion = resResult.insertId;
        if ((tipo === 'vuelo' || tipo === 'paquete') && vuelo){
            if(!vuelo.id_proveedor) throw new Error('Falta id_proveedor en el vuelo');
            if(!vuelo.pasajeros?.length) throw new Error('Se requiere al menos un pasajero');
            const prov = await proveedorService.buscarConfig(vuelo.id_proveedor);
            const respVuelo = await proveedorService.reservarVuelo(vuelo.id_proveedor, {
                id_vuelo: vuelo.id_vuelo,
                metodo_pago: 'agencia',
                id_usuario_externo: usuario.id_usuario,
                pasajeros: vuelo.pasajeros,
            });
            const codigoVueloProv = String(respVuelo?.codigoReservacion ?? respVuelo?.idReservacion ?? '');
            const precioTotal = proveedorService.calcularPrecioConGanancia(vuelo.precio_proveedor, prov.porcentaje_ganancia);
            totalAgencia += parseFloat(precioTotal);
            await conn.query(
                `INSERT INTO detalle_vuelo
                 (id_reservacion, id_proveedor, codigo_reserva_proveedor, codigo_vuelo,
                  origen, destino, fecha_salida, tipo_asiento, num_pasajeros,
                  precio_unitario_proveedor, porcentaje_ganancia, precio_total,
                  es_regreso, datos_pasajeros)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
                [
                    idReservacion,
                    vuelo.id_proveedor,
                    codigoVueloProv,
                    vuelo.codigo_vuelo       || '',
                    vuelo.origen             || '',
                    vuelo.destino            || '',
                    vuelo.fecha_salida       || null,
                    vuelo.tipo_asiento       || 'turista',
                    vuelo.pasajeros.length,
                    vuelo.precio_proveedor,
                    prov.porcentaje_ganancia,
                    precioTotal,
                    JSON.stringify(vuelo.pasajeros),
                ]
            );
        }
        if (tipo === 'vuelo' && vuelo_regreso) {
            const prov = await proveedorService.buscarConfig(vuelo_regreso.id_proveedor);
            const resReg = await proveedorService.reservarVuelo(vuelo_regreso.id_proveedor, {
                id_vuelo: vuelo_regreso.id_vuelo,
                metodo_pago: 'agencia',
                id_usuario_externo: usuario.id_usuario,
                pasajeros: vuelo_regreso.pasajeros,
            });
            const codigoReg = String(resReg?.codigoReservacion ?? resReg?.idReservacion ?? '');
            const precioReg = proveedorService.calcularPrecioConGanancia(vuelo_regreso.precio_proveedor, prov.porcentaje_ganancia);
            totalAgencia += parseFloat(precioReg);
            await conn.query(
                `INSERT INTO detalle_vuelo
                 (id_reservacion, id_proveedor, codigo_reserva_proveedor, codigo_vuelo,
                  origen, destino, fecha_salida, tipo_asiento, num_pasajeros,
                  precio_unitario_proveedor, porcentaje_ganancia, precio_total,
                  es_regreso, datos_pasajeros)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
                [
                    idReservacion,
                    vuelo_regreso.id_proveedor,
                    codigoReg,
                    vuelo_regreso.codigo_vuelo  || '',
                    vuelo_regreso.origen        || '',
                    vuelo_regreso.destino       || '',
                    vuelo_regreso.fecha_salida  || null,
                    vuelo_regreso.tipo_asiento  || 'turista',
                    vuelo_regreso.pasajeros.length,
                    vuelo_regreso.precio_proveedor,
                    prov.porcentaje_ganancia,
                    precioReg,
                    JSON.stringify(vuelo_regreso.pasajeros),
                ]
            );
        }
        if ((tipo === 'hotel' || tipo === 'paquete') && hotel) {
            const prov = await proveedorService.buscarConfig(hotel.id_proveedor);
 
            const respHotel = await proveedorService.reservarHotel(hotel.id_proveedor, {
                id_habitacion:      hotel.id_habitacion,
                fecha_checkin:      hotel.fecha_checkin,
                fecha_checkout:     hotel.fecha_checkout,
                num_huespedes:      hotel.num_huespedes,
                id_usuario_externo: usuario.id_usuario,
                metodo_pago:        'transferencia',
                notas:              `Agencia TravelNow - usuario ${usuario.id_usuario}`,
            });
 
            const codigoHotelProv = String(respHotel?.idReservacion ?? '');
            const totalHotel      = parseFloat(respHotel?.total ?? 0);
            const precioNocheAgencia = proveedorService.calcularPrecioConGanancia(
                hotel.precio_noche_proveedor,
                prov.porcentaje_ganancia
            );
            const montoHotel = totalHotel > 0 ? totalHotel : parseFloat(precioNocheAgencia);
            totalAgencia += montoHotel;
 
            await conn.query(
                `INSERT INTO detalle_hotel
                 (id_reservacion, id_proveedor, codigo_reserva_proveedor, nombre_hotel,
                  ciudad, tipo_habitacion, fecha_checkin, fecha_checkout,
                  num_huespedes, precio_por_noche_proveedor, porcentaje_ganancia, precio_total)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    idReservacion,
                    hotel.id_proveedor,
                    codigoHotelProv,
                    hotel.nombre_hotel    || '',
                    hotel.ciudad          || '',
                    hotel.tipo_habitacion || 'doble',
                    hotel.fecha_checkin,
                    hotel.fecha_checkout,
                    hotel.num_huespedes,
                    hotel.precio_noche_proveedor,
                    prov.porcentaje_ganancia,
                    montoHotel,
                ]
            );
        }
        await conn.query(
            'UPDATE reservacion SET total = ?, estado = "confirmada" WHERE id_reservacion = ?',
            [totalAgencia.toFixed(2), idReservacion]
        );
        await conn.commit();
        const [rows] = await db.query(`SELECT r.*, u.correo, u.nombre, u.apellido FROM reservacion r JOIN usuario u ON u.id_usuario = r.id_usuario WHERE r.id_reservacion = ?`, [idReservacion]);
        const reservacion = rows[0];
        const pdfPath = await _generarPDF(reservacion, idReservacion);
        await db.query('UPDATE reservacion SET comprobante_pdf = ? WHERE id_reservacion = ?', [pdfPath, idReservacion]);
        await sendMail({
            to: reservacion.correo,
            subject: `Confirmación de reserva ${codigoReserva}`,
            html: `<h2>¡Tu reserva está confirmada!</h2>
                    <p>Hola ${reservacion.nombre}, tu reservación
                    <strong>${codigoReserva}</strong> ha sido confirmada por un total de
                    <strong>$${totalAgencia.toFixed(2)} USD</strong>.</p>
                    <p>Puedes descargar tu comprobante desde tu historial de reservas.</p>`
        }).catch(mailErr => { console.error('[Reservación] Error enviando correo de confirmación:', mailErr.message); });
        return ok(
            res,
            {
                message: 'Reservación creada exitosamente',
                reservacion: {
                    id_reservacion: idReservacion,
                    codigo_reserva: codigoReserva,
                    total:          totalAgencia.toFixed(2),
                    estado:         'confirmada',
                },
            },
            201
        );
    } catch (e) {
        await conn.rollback();
        console.error('[Reservación] Error al crear la reservacion:', e.message);
        return err(res,`Error al crear la reservacion: ${e.message}`);
    } finally {
        conn.release();
    }
};

// obtener reserva
const obtener = async (req, res) => {
    const { id }  = req.params;
    const usuario = req.user;
    try {
        const [rows] = await db.query(
            `SELECT r.*, u.nombre, u.apellido, u.correo
             FROM reservacion r
             JOIN usuario u ON u.id_usuario = r.id_usuario
             WHERE r.id_reservacion = ?`,
            [id]
        );
        if (!rows.length) return err(res, 'Reservación no encontrada', 404);
 
        const reservacion = rows[0];
        if (reservacion.id_usuario !== usuario.id_usuario && usuario.rol !== 'administrador') {
            return err(res, 'Acceso denegado', 403);
        }
 
        const [vuelos]  = await db.query('SELECT * FROM detalle_vuelo WHERE id_reservacion = ?', [id]);
        const [hoteles] = await db.query('SELECT * FROM detalle_hotel WHERE id_reservacion = ?', [id]);
 
        return ok(res, { data: { ...reservacion, vuelos, hoteles } });
    } catch (e) {
        return err(res, e.message);
    }
};

//Geneara y obtener PDF
const descargarPDF = async (req, res) => {
    const { id } = req.params;
    const usuario = req.user;
    try {
        const [rows] = await db.query('SELECT * FROM reservacion WHERE id_reservacion = ?', [id]);
        if(!rows.length) return err(res, 'Reservacion no encontrada', 404);
        const reservacion = rows[0];
        if (reservacion.id_usuario !== usuario.id_usuario && usuario.rol !== 'administrador') {
            return err(res, 'Acceso denegado', 403);
        }
 
        const pdfDir  = process.env.PDF_OUTPUT_DIR || './public/comprobantes';
        const pdfFile = path.join(pdfDir, `reserva-${reservacion.codigo_reserva}.pdf`);
        if (!fs.existsSync(pdfFile)) {
            await _generarPDF(reservacion, id);
        }
 
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="TravelNow-${reservacion.codigo_reserva}.pdf"`
        );
        fs.createReadStream(pdfFile).pipe(res);
    } catch (e) { return err(res, e.message); }
};

const cancelar = async (req, res) => {
    const { id } = req.params;
    const admin  = req.user;
    try {
        const [rows] = await db.query('SELECT * FROM reservacion WHERE id_reservacion = ?', [id]);
        if (!rows.length) return err(res, 'Reservación no encontrada', 404);
 
        const reservacion = rows[0];
        if (reservacion.estado === 'cancelada') {
            return err(res, 'La reservación ya está cancelada', 400);
        }
 
        await db.query(
            'UPDATE reservacion SET estado = "cancelada" WHERE id_reservacion = ?',
            [id]
        );
        await db.query(
            `INSERT INTO cancelacion (id_reservacion, origen, procesado_por, motivo)
             VALUES (?, 'administrador', ?, ?)`,
            [id, admin.id_usuario, req.body.motivo || 'Cancelado por administrador']
        );
 
        const [uRows] = await db.query(
            `SELECT u.correo, u.nombre
             FROM usuario u
             JOIN reservacion r ON r.id_usuario = u.id_usuario
             WHERE r.id_reservacion = ?`,
            [id]
        );
        if (uRows.length) {
            await sendMail({
                to:      uRows[0].correo,
                subject: `TravelNow — Tu reserva ${reservacion.codigo_reserva} fue cancelada`,
                html:    `<p>Hola ${uRows[0].nombre}, tu reservación
                          <strong>${reservacion.codigo_reserva}</strong> ha sido cancelada.
                          ${req.body.motivo ? 'Motivo: ' + req.body.motivo : ''}
                          Contáctanos si tienes preguntas.</p>`,
            }).catch(() => {});
        }
 
        return ok(res, { message: 'Reservación cancelada exitosamente' });
    } catch (e) {
        return err(res, e.message);
    }
};

const historialUsuario = async (req, res) => {
    const usuario = req.user;
    const page    = parseInt(req.query.page  || 1);
    const limit   = parseInt(req.query.limit || 10);
    const offset  = (page - 1) * limit;
    try {
        const [rows] = await db.query(
            `SELECT id_reservacion, codigo_reserva, tipo, total, moneda, estado,
                    fecha_reserva, comprobante_pdf
             FROM reservacion
             WHERE id_usuario = ?
             ORDER BY fecha_reserva DESC
             LIMIT ? OFFSET ?`,
            [usuario.id_usuario, limit, offset]
        );
        const [[{ total }]] = await db.query(
            'SELECT COUNT(*) AS total FROM reservacion WHERE id_usuario = ?',
            [usuario.id_usuario]
        );
        return ok(res, { data: rows, total, page, limit });
    } catch (e) {
        return err(res, e.message);
    }
};

const _generarPDF = async (reservacion, idReservacion) => {
    const pdfDir = process.env.PDF_OUTPUT_DIR
        || path.join(__dirname, '../../public/comprobantes');
 
    if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });
 
    const pdfPath = path.join(pdfDir, `reserva-${reservacion.codigo_reserva}.pdf`);
    const doc     = new PDFDocument({ margin: 50 });
    doc.pipe(fs.createWriteStream(pdfPath));
 
    doc.fontSize(24).font('Helvetica-Bold').text('TravelNow', { align: 'center' });
    doc.fontSize(12).font('Helvetica').text('Comprobante de Reservación', { align: 'center' });
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown();
 
    doc.fontSize(14).font('Helvetica-Bold').text('Datos de la Reservación');
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica');
    doc.text(`Código:  ${reservacion.codigo_reserva}`);
    doc.text(`Tipo:    ${(reservacion.tipo || '').toUpperCase()}`);
    doc.text(`Estado:  ${reservacion.estado}`);
    doc.text(`Fecha:   ${new Date(reservacion.fecha_reserva).toLocaleString('es-GT')}`);
    doc.text(`Total:   $${parseFloat(reservacion.total).toFixed(2)} ${reservacion.moneda}`);
    doc.moveDown();
 
    try {
        const [vuelos] = await db.query(
            'SELECT * FROM detalle_vuelo WHERE id_reservacion = ?',
            [idReservacion]
        );
        if (vuelos.length) {
            doc.fontSize(14).font('Helvetica-Bold').text('Vuelo(s)');
            doc.moveDown(0.5);
            vuelos.forEach(v => {
                doc.fontSize(11).font('Helvetica');
                doc.text(`${v.es_regreso ? 'Regreso' : 'Ida'}: ${v.origen} → ${v.destino}`);
                doc.text(`Código: ${v.codigo_vuelo}   Asiento: ${v.tipo_asiento}`);
                doc.text(`Precio: $${parseFloat(v.precio_total).toFixed(2)} USD`);
                doc.moveDown(0.5);
            });
        }
 
        const [hoteles] = await db.query(
            'SELECT * FROM detalle_hotel WHERE id_reservacion = ?',
            [idReservacion]
        );
        if (hoteles.length) {
            doc.fontSize(14).font('Helvetica-Bold').text('Hotel');
            doc.moveDown(0.5);
            hoteles.forEach(h => {
                doc.fontSize(11).font('Helvetica');
                doc.text(`Hotel: ${h.nombre_hotel}   Ciudad: ${h.ciudad}`);
                doc.text(`Habitación: ${h.tipo_habitacion}`);
                doc.text(`Check-in:  ${new Date(h.fecha_checkin).toLocaleDateString('es-GT')}`);
                doc.text(`Check-out: ${new Date(h.fecha_checkout).toLocaleDateString('es-GT')}`);
                doc.text(`Precio: $${parseFloat(h.precio_total).toFixed(2)} USD`);
            });
        }
    } catch (e) {
        console.error('[PDF] Error obteniendo detalles:', e.message);
    }
 
    doc.moveDown(2);
    doc.fontSize(9).fillColor('gray')
        .text('Comprobante oficial de reserva TravelNow.', { align: 'center' });
    doc.end();
 
    return pdfPath;
};

module.exports = { crear, obtener, descargarPDF, cancelar, historialUsuario };