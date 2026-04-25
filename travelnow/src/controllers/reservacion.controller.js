'use strict';

/**
 * @file Controlador de reservaciones
 * @description Maneja todas las operaciones relacionadas con reservaciones de vuelos, hoteles y paquetes
 * @module controllers/reservacionController
 *
 * FIX 2026-04-20:
 *   - `_generarPDF` ahora incluye datos del cliente, método de pago, subtotal/impuestos
 *     y datos de pasajeros/huéspedes.
 *   - Se agrega la función `historialUsuario` que faltaba (referenciada en routes).
 *   - Se agrega `reenviarCorreo` para que el usuario pueda pedir un reenvío.
 *   - `descargarPDF` ahora valida mejor y responde con `Content-Length`.
 */

const db = require('../config/db');
const proveedorService = require('../services/proveedor.service');
const { sendMail } = require('../config/mailer');
const { ok, err } = require('../utils/response');
const { generarCodigoReserva } = require('../utils/codigo');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs   = require('fs');
require('dotenv').config();

const TAX_RATE = 0.12; // IVA Guatemala

/* ──────────────────────────────────────────────────────────────────────
 * CREAR RESERVACIÓN
 * ────────────────────────────────────────────────────────────────────── */
const crear = async (req, res) => {
    const usuario = req.user;
    const { tipo, metodo_pago, datos_cobro, vuelo, vuelo_regreso, hotel } = req.body;

    if (!tipo || !metodo_pago) {
        return err(res, 'Faltan campos requeridos: tipo y metodo_pago', 400);
    }

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        let totalAgencia = 0;
        const codigoReserva = generarCodigoReserva();

        const [resResult] = await conn.query(
            `INSERT INTO reservacion
               (codigo_reserva, id_usuario, tipo, total, moneda, estado, metodo_pago, datos_cobro)
             VALUES (?, ?, ?, 0, "USD", "pendiente", ?, ?)`,
            [codigoReserva, usuario.id_usuario, tipo, metodo_pago, JSON.stringify(datos_cobro || {})]
        );
        const idReservacion = resResult.insertId;

        /// Procesar vuelo de ida (para vuelos o paquetes)
        //
        // FIX (Bug #4): reservarVuelo ahora devuelve { reservaciones, principal,
        // codigosConcatenados }. Antes leíamos .codigoReservacion sobre lo que
        // en realidad era un array, lo que siempre daba undefined y reventaba
        // con "no devolvio un identificador valido". Ahora:
        //   - El array completo lo guardamos concatenado en
        //     codigo_reserva_proveedor (p. ej. "HC123-HC124") para que la
        //     cancelación posterior pueda ubicar todos los tramos.
        //   - datos_pasajeros también registra la lista de reservaciones del
        //     proveedor, para trazabilidad y auditoría.
        if ((tipo === 'vuelo' || tipo === 'paquete') && vuelo) {
            if (!vuelo.id_proveedor)      throw new Error('Falta id_proveedor en el vuelo');
            if (!vuelo.pasajeros?.length) throw new Error('Se requiere al menos un pasajero');
 
            const prov      = await proveedorService.buscarConfig(vuelo.id_proveedor);
            const respVuelo = await proveedorService.reservarVuelo(vuelo.id_proveedor, {
                id_vuelo:           vuelo.id_vuelo,
                metodo_pago:        'agencia',
                pasajeros:          vuelo.pasajeros,
            });
 
            // respVuelo.codigosConcatenados maneja tanto vuelos directos (1 tramo)
            // como con escalas (N tramos) uniforme: "HC123" o "HC123-HC124-HC125".
            const codigoVueloProv = String(
                respVuelo?.codigosConcatenados
                ?? respVuelo?.principal?.codigoReservacion
                ?? respVuelo?.principal?.idReservacion
                ?? ''
            );
 
            if (!codigoVueloProv) {
                throw new Error('El proveedor no devolvio un codigo de reservacion para el vuelo de ida');
            }
 
            const precioTotal = proveedorService.calcularPrecioConGanancia(
                vuelo.precio_proveedor, prov.porcentaje_ganancia
            );
            totalAgencia += parseFloat(precioTotal);
 
            await conn.query(
                `INSERT INTO detalle_vuelo
                   (id_reservacion, id_proveedor, codigo_reserva_proveedor, codigo_vuelo,
                    origen, destino, fecha_salida, tipo_asiento, num_pasajeros,
                    precio_unitario_proveedor, porcentaje_ganancia, precio_total,
                    es_regreso, datos_pasajeros)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
                [
                    idReservacion, vuelo.id_proveedor, codigoVueloProv,
                    vuelo.codigo_vuelo || '', vuelo.origen || '', vuelo.destino || '',
                    vuelo.fecha_salida || null, vuelo.tipo_asiento || 'turista',
                    vuelo.pasajeros.length, vuelo.precio_proveedor,
                    prov.porcentaje_ganancia, precioTotal,
                    JSON.stringify({
                        pasajeros: vuelo.pasajeros,
                        tramos_proveedor: respVuelo?.reservaciones ?? [],
                    }),
                ]
            );
        }
 
        /// Procesar vuelo de regreso (solo para tipo vuelo con ida y vuelta)
        //
        // FIX (Bug #4): mismo patrón que el bloque anterior — leemos
        // codigosConcatenados en vez de asumir objeto plano.
        if (tipo === 'vuelo' && vuelo_regreso) {
            if (!vuelo_regreso.id_proveedor)      throw new Error('Falta id_proveedor en el vuelo de regreso');
            if (!vuelo_regreso.pasajeros?.length) throw new Error('Se requiere al menos un pasajero para el vuelo de regreso');
 
            const prov   = await proveedorService.buscarConfig(vuelo_regreso.id_proveedor);
            const resReg = await proveedorService.reservarVuelo(vuelo_regreso.id_proveedor, {
                id_vuelo:           vuelo_regreso.id_vuelo,
                metodo_pago:        'agencia',
                pasajeros:          vuelo_regreso.pasajeros,
            });
 
            const codigoReg = String(
                resReg?.codigosConcatenados
                ?? resReg?.principal?.codigoReservacion
                ?? resReg?.principal?.idReservacion
                ?? ''
            );
 
            if (!codigoReg) {
                throw new Error('El proveedor no devolvio un codigo de reservacion para el vuelo de regreso');
            }
 
            const precioReg = proveedorService.calcularPrecioConGanancia(
                vuelo_regreso.precio_proveedor, prov.porcentaje_ganancia
            );
            totalAgencia += parseFloat(precioReg);
 
            await conn.query(
                `INSERT INTO detalle_vuelo
                   (id_reservacion, id_proveedor, codigo_reserva_proveedor, codigo_vuelo,
                    origen, destino, fecha_salida, tipo_asiento, num_pasajeros,
                    precio_unitario_proveedor, porcentaje_ganancia, precio_total,
                    es_regreso, datos_pasajeros)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
                [
                    idReservacion, vuelo_regreso.id_proveedor, codigoReg,
                    vuelo_regreso.codigo_vuelo || '', vuelo_regreso.origen || '',
                    vuelo_regreso.destino || '', vuelo_regreso.fecha_salida || null,
                    vuelo_regreso.tipo_asiento || 'turista', vuelo_regreso.pasajeros.length,
                    vuelo_regreso.precio_proveedor, prov.porcentaje_ganancia, precioReg,
                    JSON.stringify({
                        pasajeros: vuelo_regreso.pasajeros,
                        tramos_proveedor: resReg?.reservaciones ?? [],
                    }),
                ]
            );
        }

        // ── Hotel ─────────────────────────────────────────────────
        if ((tipo === 'hotel' || tipo === 'paquete') && hotel) {
            if (!hotel.id_proveedor)  throw new Error('Falta id_proveedor en el hotel');
            if (!hotel.id_habitacion) throw new Error('Falta id_habitacion en el hotel');

            const prov      = await proveedorService.buscarConfig(hotel.id_proveedor);
            const respHotel = await proveedorService.reservarHotel(hotel.id_proveedor, {
                id_habitacion:      hotel.id_habitacion,
                fecha_checkin:      hotel.fecha_checkin,
                fecha_checkout:     hotel.fecha_checkout,
                num_huespedes:      hotel.num_huespedes,
                metodo_pago:        'transferencia',
                notas:              `Reserva TravelNow - ${codigoReserva}`,
            });
            const codigoHotelProv = String(respHotel?.idReservacion ?? '');

            const noches = Math.max(1, Math.ceil(
                (new Date(hotel.fecha_checkout) - new Date(hotel.fecha_checkin)) / (1000 * 60 * 60 * 24)
            ));
            const precioNocheAgencia = proveedorService.calcularPrecioConGanancia(
                hotel.precio_noche_proveedor, prov.porcentaje_ganancia
            );
            const montoHotel = noches * parseFloat(precioNocheAgencia);
            totalAgencia += montoHotel;

            await conn.query(
                `INSERT INTO detalle_hotel
                   (id_reservacion, id_proveedor, codigo_reserva_proveedor, nombre_hotel,
                    ciudad, tipo_habitacion, fecha_checkin, fecha_checkout,
                    num_huespedes, precio_por_noche_proveedor, porcentaje_ganancia, precio_total)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    idReservacion, hotel.id_proveedor, codigoHotelProv,
                    hotel.nombre_hotel || '', hotel.ciudad || '',
                    hotel.tipo_habitacion || 'doble',
                    hotel.fecha_checkin, hotel.fecha_checkout, hotel.num_huespedes,
                    hotel.precio_noche_proveedor, prov.porcentaje_ganancia, montoHotel,
                ]
            );
        }

        // ── PAQUETE: aplicar descuento SOLO si es paquete con vuelo + hotel ──
        let descuentoPaquete = 0;
        let totalAntesDescuento = totalAgencia;
        if (tipo === 'paquete' && vuelo && hotel && porcentajesGananciaUsados.length >= 2) {
            // Promedio de los % de ganancia de los proveedores elegidos
            const promedioPct = porcentajesGananciaUsados.reduce((a, b) => a + b, 0) / porcentajesGananciaUsados.length;
            descuentoPaquete = +(totalAgencia * (promedioPct / 100)).toFixed(2);
            totalAgencia = +(totalAgencia - descuentoPaquete).toFixed(2);
            console.log(`[Paquete] Descuento aplicado: ${promedioPct.toFixed(2)}% = $${descuentoPaquete} (de $${totalAntesDescuento} → $${totalAgencia})`);
        }

        // Total incluye IVA
        const totalConIva = +(totalAgencia * (1 + TAX_RATE)).toFixed(2);

        await conn.query(
            'UPDATE reservacion SET total = ?, estado = "confirmada" WHERE id_reservacion = ?',
            [totalConIva, idReservacion]
        );
        await conn.commit();

        // ── Post-commit ───────────────────────────────────────────
        const [rows] = await db.query(
            `SELECT r.*, u.correo, u.nombre, u.apellido, u.numero_pasaporte,
                    u.nacionalidad, u.fecha_nacimiento
               FROM reservacion r
               JOIN usuario u ON u.id_usuario = r.id_usuario
              WHERE r.id_reservacion = ?`,
            [idReservacion]
        );
        const reservacion = rows[0];

        // Generar PDF (no bloquea la respuesta si falla)
        let pdfGenerado = false;
        try {
            const pdfPath = await _generarPDF(reservacion, idReservacion);
            await db.query(
                'UPDATE reservacion SET comprobante_pdf = ? WHERE id_reservacion = ?',
                [pdfPath, idReservacion]
            );
            pdfGenerado = true;
        } catch (pdfErr) {
            console.error('[Reservacion] Error generando PDF:', pdfErr.message);
        }

        // Enviar correo (no bloquea la respuesta si falla)
        let emailEnviado = false;
        let emailError   = null;
        try {
            await _enviarCorreoConfirmacion(reservacion, totalConIva);
            emailEnviado = true;
        } catch (mailErr) {
            emailError = mailErr.message;
            console.error('[Reservacion] Error enviando correo:', mailErr.message);
        }

        return ok(
            res,
            {
                message: 'Reservacion creada exitosamente',
                reservacion: {
                    id_reservacion: idReservacion,
                    codigo_reserva: codigoReserva,
                    total:          totalConIva.toFixed(2),
                    estado:         'confirmada',
                },
                email_enviado: emailEnviado,
                email_error:   emailError ?? undefined,
                pdf_disponible: pdfGenerado,
            },
            201
        );
    } catch (e) {
        await conn.rollback();

    // Log detallado para diagnóstico
    console.error('[Reservacion] Error al crear la reservacion:', e.message);
    if (e.response) {
        // Es un error de axios → tenemos status, body y URL
        console.error(`[Reservacion]   → URL:    ${e.config?.method?.toUpperCase()} ${e.config?.baseURL || ''}${e.config?.url || ''}`);
        console.error(`[Reservacion]   → Status: ${e.response.status} ${e.response.statusText || ''}`);
        console.error(`[Reservacion]   → Body:   ${JSON.stringify(e.response.data).slice(0, 500)}`);
    } else if (e.code) {
        // Error de red puro
        console.error(`[Reservacion]   → Código de red: ${e.code}`);
    }
    if (e.stack) {
        console.error(`[Reservacion]   → Stack: ${e.stack.split('\n').slice(0, 4).join('\n')}`);
    }

    return err(res, `Error al crear la reservacion: ${e.message}`);
    } finally {
        conn.release();
    }
};

/* ──────────────────────────────────────────────────────────────────────
 * OBTENER RESERVACIÓN (GET /:id)
 * ────────────────────────────────────────────────────────────────────── */
const obtener = async (req, res) => {
    const { id }  = req.params;
    const usuario = req.user;
    try {
        const [rows] = await db.query(
            `SELECT r.*, u.nombre, u.apellido, u.correo, u.numero_pasaporte,
                    u.nacionalidad
               FROM reservacion r
               JOIN usuario u ON u.id_usuario = r.id_usuario
              WHERE r.id_reservacion = ?`,
            [id]
        );
        if (!rows.length) return err(res, 'Reservacion no encontrada', 404);

        const reservacion = rows[0];
        if (reservacion.id_usuario !== usuario.id_usuario && usuario.rol !== 'administrador')
            return err(res, 'Acceso denegado', 403);

        const [vuelos]  = await db.query('SELECT * FROM detalle_vuelo WHERE id_reservacion = ?', [id]);
        const [hoteles] = await db.query('SELECT * FROM detalle_hotel  WHERE id_reservacion = ?', [id]);

        // Parsear datos_cobro y datos_pasajeros que están como JSON string
        let datosCobro = {};
        try { datosCobro = typeof reservacion.datos_cobro === 'string'
            ? JSON.parse(reservacion.datos_cobro) : (reservacion.datos_cobro || {}); }
        catch { datosCobro = {}; }

        vuelos.forEach(v => {
            try {
                v.pasajeros = typeof v.datos_pasajeros === 'string'
                    ? JSON.parse(v.datos_pasajeros) : (v.datos_pasajeros || []);
            } catch { v.pasajeros = []; }
        });

        // Calcular subtotal (total / (1+IVA))
        const total    = parseFloat(reservacion.total) || 0;
        const subtotal = +(total / (1 + TAX_RATE)).toFixed(2);
        const iva      = +(total - subtotal).toFixed(2);

        return ok(res, {
            data: {
                ...reservacion,
                datos_cobro: datosCobro,
                subtotal,
                iva,
                vuelos,
                hoteles,
            },
        });
    } catch (e) {
        return err(res, e.message);
    }
};

/* ──────────────────────────────────────────────────────────────────────
 * HISTORIAL DEL USUARIO (GET /usuario/historial)
 * ────────────────────────────────────────────────────────────────────── */
const historialUsuario = async (req, res) => {
    const usuario = req.user;
    const page    = parseInt(req.query.page)  || 1;
    const limit   = parseInt(req.query.limit) || 20;
    const offset  = (page - 1) * limit;

    try {
        const [rows] = await db.query(
            `SELECT r.id_reservacion, r.codigo_reserva, r.tipo, r.total, r.moneda,
                    r.estado, r.fecha_reserva, r.comprobante_pdf
               FROM reservacion r
              WHERE r.id_usuario = ?
              ORDER BY r.fecha_reserva DESC
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

/* ──────────────────────────────────────────────────────────────────────
 * DESCARGAR PDF (GET /:id/pdf)
 * ────────────────────────────────────────────────────────────────────── */
const descargarPDF = async (req, res) => {
    const { id }  = req.params;
    const usuario = req.user;
    try {
        const [rows] = await db.query(
            `SELECT r.*, u.correo, u.nombre, u.apellido, u.numero_pasaporte, u.nacionalidad
               FROM reservacion r
               JOIN usuario u ON u.id_usuario = r.id_usuario
              WHERE r.id_reservacion = ?`,
            [id]
        );
        if (!rows.length) return err(res, 'Reservacion no encontrada', 404);

        const reservacion = rows[0];
        if (reservacion.id_usuario !== usuario.id_usuario && usuario.rol !== 'administrador')
            return err(res, 'Acceso denegado', 403);

        const pdfDir  = process.env.PDF_OUTPUT_DIR
            || path.join(__dirname, '../../public/comprobantes');
        const pdfFile = path.join(pdfDir, `reserva-${reservacion.codigo_reserva}.pdf`);

        // Regenerar PDF si no existe o está corrupto/vacio
        if (!fs.existsSync(pdfFile) || fs.statSync(pdfFile).size === 0) {
            try { await _generarPDF(reservacion, id); }
            catch (genErr) {
                console.error('[PDF] Error regenerando PDF:', genErr.message);
                return err(res, 'No se pudo generar el comprobante PDF.', 500);
            }
        }
        if (!fs.existsSync(pdfFile)) {
            return err(res, 'El comprobante PDF no está disponible aún.', 404);
        }

        const stat = fs.statSync(pdfFile);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Length', stat.size);
        res.setHeader('Content-Disposition',
            `attachment; filename="TravelNow-${reservacion.codigo_reserva}.pdf"`);
        res.setHeader('Cache-Control', 'no-store');

        const stream = fs.createReadStream(pdfFile);
        stream.on('error', (streamErr) => {
            console.error('[PDF] Error en stream:', streamErr.message);
            if (!res.headersSent) return err(res, 'Error al leer el archivo PDF.', 500);
        });
        stream.pipe(res);
    } catch (e) {
        return err(res, e.message);
    }
};

/* ──────────────────────────────────────────────────────────────────────
 * REENVIAR CORREO DE CONFIRMACIÓN (POST /:id/reenviar-correo)
 * ────────────────────────────────────────────────────────────────────── */
const reenviarCorreo = async (req, res) => {
    const { id }  = req.params;
    const usuario = req.user;
    try {
        const [rows] = await db.query(
            `SELECT r.*, u.correo, u.nombre, u.apellido
               FROM reservacion r
               JOIN usuario u ON u.id_usuario = r.id_usuario
              WHERE r.id_reservacion = ?`,
            [id]
        );
        if (!rows.length) return err(res, 'Reservacion no encontrada', 404);

        const reservacion = rows[0];
        if (reservacion.id_usuario !== usuario.id_usuario && usuario.rol !== 'administrador')
            return err(res, 'Acceso denegado', 403);

        await _enviarCorreoConfirmacion(reservacion, parseFloat(reservacion.total));
        return ok(res, { message: 'Correo reenviado correctamente a ' + reservacion.correo });
    } catch (e) {
        return err(res, `No se pudo reenviar el correo: ${e.message}`);
    }
};

/* ──────────────────────────────────────────────────────────────────────
 * CANCELAR RESERVACIÓN
 * ────────────────────────────────────────────────────────────────────── */
const cancelar = async (req, res) => {
    const { id }    = req.params;
    const usuario   = req.user;
    const { motivo } = req.body || {};

    try {
        // 1. Buscar reservación
        const [rows] = await db.query(
            `SELECT r.*, u.correo, u.nombre, u.apellido
               FROM reservacion r
               JOIN usuario u ON u.id_usuario = r.id_usuario
              WHERE r.id_reservacion = ?`,
            [id]
        );
        if (!rows.length) return err(res, 'Reservacion no encontrada', 404);

        const reservacion = rows[0];

        // 2. Validar permisos: admin O dueño de la reserva
        const esAdmin   = usuario.rol === 'administrador';
        const esDueno   = reservacion.id_usuario === usuario.id_usuario;
        if (!esAdmin && !esDueno) {
            return err(res, 'No tienes permiso para cancelar esta reservacion', 403);
        }

        // 3. Validar estado
        if (reservacion.estado === 'cancelada') {
            return err(res, 'La reservacion ya esta cancelada', 400);
        }

        // 4. Obtener detalles
        const [vuelos]  = await db.query('SELECT * FROM detalle_vuelo WHERE id_reservacion = ?', [id]);
        const [hoteles] = await db.query('SELECT * FROM detalle_hotel  WHERE id_reservacion = ?', [id]);

        // 5. Cancelar en proveedores. Llevamos registro de qué se canceló para poder revertir.
        const cancelados = { vuelos: [], hoteles: [] };
        const errores    = [];

        // 5a. Vuelos primero
        for (const v of vuelos) {
            if (!v.codigo_reserva_proveedor) {
                console.warn(`[Cancelar] Vuelo ${v.id_detalle_vuelo} sin codigo_reserva_proveedor, se omite`);
                continue;
            }
            try {
                await proveedorService.cancelarVuelo(v.id_proveedor, v.codigo_reserva_proveedor);
                cancelados.vuelos.push({
                    id_proveedor:  v.id_proveedor,
                    codigo:        v.codigo_reserva_proveedor,
                });
            } catch (e) {
                errores.push({
                    tipo:   'vuelo',
                    codigo: v.codigo_reserva_proveedor,
                    error:  e.message,
                });
                break; // abortar al primer error
            }
        }

        // 5b. Hoteles solo si vuelos OK
        if (!errores.length) {
            for (const h of hoteles) {
                if (!h.codigo_reserva_proveedor) {
                    console.warn(`[Cancelar] Hotel ${h.id_detalle_hotel} sin codigo_reserva_proveedor, se omite`);
                    continue;
                }
                try {
                    await proveedorService.cancelarHotel(h.id_proveedor, h.codigo_reserva_proveedor);
                    cancelados.hoteles.push({
                        id_proveedor: h.id_proveedor,
                        codigo:       h.codigo_reserva_proveedor,
                    });
                } catch (e) {
                    errores.push({
                        tipo:   'hotel',
                        codigo: h.codigo_reserva_proveedor,
                        error:  e.message,
                    });
                    break;
                }
            }
        }

        // 6. Si hubo error → revert best-effort y abortar
        if (errores.length) {
            console.error(`[Cancelar] Error al cancelar reserva ${reservacion.codigo_reserva}:`, errores);
            const reverts = { exitosos: [], fallidos: [] };

            // No podemos "des-cancelar" en el proveedor, pero lo intentamos por si su API soporta re-activar.
            // Si no lo soporta, queda en logs para resolución manual.
            for (const v of cancelados.vuelos) {
                try {
                    // Algunos proveedores tienen /:id/reactivar; si el tuyo no, esto fallará y lo dejamos en logs.
                    // Por seguridad, NO marcamos automáticamente como "ok" — solo intentamos avisar.
                    console.warn(`[Cancelar] No revertimos vuelo ${v.codigo} automáticamente (revisar manualmente)`);
                    reverts.fallidos.push({ tipo: 'vuelo', codigo: v.codigo, motivo: 'revert no implementado' });
                } catch (revertErr) {
                    reverts.fallidos.push({ tipo: 'vuelo', codigo: v.codigo, error: revertErr.message });
                }
            }
            for (const h of cancelados.hoteles) {
                console.warn(`[Cancelar] No revertimos hotel ${h.codigo} automáticamente (revisar manualmente)`);
                reverts.fallidos.push({ tipo: 'hotel', codigo: h.codigo, motivo: 'revert no implementado' });
            }

            return err(
                res,
                `No se pudo cancelar completamente. Detalle: ${errores.map(e => `${e.tipo} ${e.codigo}: ${e.error}`).join(' | ')}` +
                (cancelados.vuelos.length || cancelados.hoteles.length
                    ? `. ATENCIÓN: ${cancelados.vuelos.length} vuelo(s) y ${cancelados.hoteles.length} hotel(es) ya fueron cancelados en sus proveedores y requieren revisión manual.`
                    : ''),
                502
            );
        }

        // 7. Todo OK → actualizar estado en nuestra BD
        await db.query(
            'UPDATE reservacion SET estado = "cancelada" WHERE id_reservacion = ?',
            [id]
        );

        // 8. Enviar correo de confirmación de cancelación al cliente
        try {
            const cliente = `${reservacion.nombre || ''} ${reservacion.apellido || ''}`.trim();
            const motivoTxt = motivo
                ? `<p><strong>Motivo:</strong> ${motivo}</p>`
                : '';
            const ejecutadoPor = esAdmin && !esDueno
                ? `<p style="color:#888;font-size:12px;">Cancelación ejecutada por el equipo de TravelNow.</p>`
                : '';

            await sendMail({
                to: reservacion.correo,
                subject: `TravelNow: Reservación ${reservacion.codigo_reserva} cancelada`,
                html: `
                    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
                      <div style="background:#0A1628;color:#F5E6B3;padding:20px;text-align:center;border-radius:8px 8px 0 0;">
                        <h1 style="margin:0;">TravelNow</h1>
                        <p style="margin:4px 0 0;font-size:13px;opacity:0.8;">Confirmación de cancelación</p>
                      </div>
                      <div style="background:#fff;padding:25px;border:1px solid #ddd;border-top:none;">
                        <h2 style="color:#0A1628;margin-top:0;">Tu reservación fue cancelada</h2>
                        <p>Hola <strong>${cliente || 'cliente'}</strong>,</p>
                        <p>Tu reservación <strong style="color:#D4AF37;">${reservacion.codigo_reserva}</strong>
                           ha sido cancelada exitosamente.</p>
                        ${motivoTxt}
                        <ul style="font-size:14px;color:#444;">
                          <li>Vuelos cancelados: <strong>${cancelados.vuelos.length}</strong></li>
                          <li>Hoteles cancelados: <strong>${cancelados.hoteles.length}</strong></li>
                        </ul>
                        <p style="font-size:13px;color:#666;">
                           Si tu pago ya fue procesado, recibirás el reembolso según los términos
                           de cada proveedor en los siguientes días hábiles.
                        </p>
                        ${ejecutadoPor}
                      </div>
                      <div style="background:#0A1628;color:#8b95a8;padding:15px;text-align:center;border-radius:0 0 8px 8px;font-size:11px;">
                        Este es un correo automático, no responder.<br>
                        &copy; ${new Date().getFullYear()} TravelNow - Guatemala
                      </div>
                    </div>`,
            });
        } catch (mailErr) {
            console.error('[Cancelar] Correo de cancelación falló:', mailErr.message);
            // No abortamos: la cancelación sigue siendo válida aunque el correo falle.
        }

        return ok(res, {
            message:           'Reservacion cancelada correctamente',
            codigo_reserva:    reservacion.codigo_reserva,
            cancelados_proveedor: {
                vuelos:  cancelados.vuelos.length,
                hoteles: cancelados.hoteles.length,
            },
            ejecutado_por: esAdmin && !esDueno ? 'administrador' : 'usuario',
        });
    } catch (e) {
        console.error('[Cancelar] Error inesperado:', e);
        return err(res, e.message);
    }
};

/* ══════════════════════════════════════════════════════════════════════
 * HELPERS PRIVADOS
 * ══════════════════════════════════════════════════════════════════════ */

/**
 * Envía correo de confirmación con el detalle completo de la reservación.
 */
const _enviarCorreoConfirmacion = async (reservacion, totalConIva) => {
    const codigo   = reservacion.codigo_reserva;
    const cliente  = `${reservacion.nombre || ''} ${reservacion.apellido || ''}`.trim();
    const total    = parseFloat(totalConIva).toFixed(2);
    const subtotal = (parseFloat(totalConIva) / (1 + TAX_RATE)).toFixed(2);
    const iva      = (parseFloat(totalConIva) - parseFloat(subtotal)).toFixed(2);

    const html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <div style="background:#0A1628;color:#F5E6B3;padding:20px;text-align:center;border-radius:8px 8px 0 0;">
            <h1 style="margin:0;font-size:28px;">TravelNow</h1>
            <p style="margin:4px 0 0;font-size:13px;opacity:0.8;">Confirmación de reservación</p>
          </div>
          <div style="background:#fff;padding:25px;border:1px solid #ddd;border-top:none;">
            <h2 style="color:#0A1628;margin-top:0;">¡Tu reserva está confirmada!</h2>
            <p>Hola <strong>${cliente || 'cliente'}</strong>,</p>
            <p>Tu reservación <strong style="color:#D4AF37;">${codigo}</strong> fue procesada correctamente.</p>
            <table style="width:100%;border-collapse:collapse;margin:20px 0;">
              <tr style="background:#F5F5F0;">
                <td style="padding:10px;border:1px solid #ddd;"><strong>Tipo</strong></td>
                <td style="padding:10px;border:1px solid #ddd;">${(reservacion.tipo || '').toUpperCase()}</td>
              </tr>
              <tr>
                <td style="padding:10px;border:1px solid #ddd;"><strong>Estado</strong></td>
                <td style="padding:10px;border:1px solid #ddd;color:green;">Confirmada</td>
              </tr>
              <tr style="background:#F5F5F0;">
                <td style="padding:10px;border:1px solid #ddd;"><strong>Subtotal</strong></td>
                <td style="padding:10px;border:1px solid #ddd;">$${subtotal} USD</td>
              </tr>
              <tr>
                <td style="padding:10px;border:1px solid #ddd;"><strong>IVA (12%)</strong></td>
                <td style="padding:10px;border:1px solid #ddd;">$${iva} USD</td>
              </tr>
              <tr style="background:#D4AF37;color:#0A1628;">
                <td style="padding:10px;border:1px solid #ddd;"><strong>Total</strong></td>
                <td style="padding:10px;border:1px solid #ddd;"><strong>$${total} USD</strong></td>
              </tr>
            </table>
            <p style="font-size:13px;color:#666;">
              Puedes descargar tu comprobante en PDF ingresando a tu historial de reservas en TravelNow.
            </p>
          </div>
          <div style="background:#0A1628;color:#8b95a8;padding:15px;text-align:center;border-radius:0 0 8px 8px;font-size:11px;">
            Este es un correo automático, no responder.<br>
            &copy; 2026 TravelNow - Guatemala
          </div>
        </div>`;

    await sendMail({
        to:      reservacion.correo,
        subject: `Confirmación de reserva ${codigo} - TravelNow`,
        html,
    });
};

/**
 * Genera un documento PDF con el comprobante COMPLETO de la reservación.
 */
const _generarPDF = async (reservacion, idReservacion) => {
    const pdfDir = process.env.PDF_OUTPUT_DIR
        || path.join(__dirname, '../../public/comprobantes');
    if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });

    const pdfPath = path.join(pdfDir, `reserva-${reservacion.codigo_reserva}.pdf`);
    const [vuelos]  = await db.query('SELECT * FROM detalle_vuelo WHERE id_reservacion = ?', [idReservacion]);
    const [hoteles] = await db.query('SELECT * FROM detalle_hotel  WHERE id_reservacion = ?', [idReservacion]);

    // Calcular montos
    const total    = parseFloat(reservacion.total) || 0;
    const subtotal = +(total / (1 + TAX_RATE)).toFixed(2);
    const iva      = +(total - subtotal).toFixed(2);

    // Parse datos de cobro
    let datosCobro = {};
    try {
        datosCobro = typeof reservacion.datos_cobro === 'string'
            ? JSON.parse(reservacion.datos_cobro) : (reservacion.datos_cobro || {});
    } catch { datosCobro = {}; }

    await new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
        const ws  = fs.createWriteStream(pdfPath);
        ws.on('error', reject);
        ws.on('finish', resolve);
        doc.pipe(ws);

        const NAVY = '#0A1628';
        const GOLD = '#D4AF37';
        const GRAY = '#666666';

        // ── Encabezado ──────────────────────────────────────────
        doc.rect(0, 0, doc.page.width, 90).fill(NAVY);
        doc.fillColor(GOLD).fontSize(28).font('Helvetica-Bold').text('TravelNow', 50, 30);
        doc.fillColor('white').fontSize(10).font('Helvetica')
           .text('Agencia de Viajes', 50, 62)
           .text('www.travelnow.com  |  soporte@travelnow.com', 50, 75);
        doc.fillColor('white').fontSize(9).font('Helvetica-Bold')
           .text('COMPROBANTE DE RESERVA', doc.page.width - 230, 35, { width: 180, align: 'right' });
        doc.fontSize(8).font('Helvetica')
           .text(`Emitido: ${new Date().toLocaleString('es-GT')}`,
                 doc.page.width - 230, 55, { width: 180, align: 'right' });

        doc.fillColor('black').moveDown(4);
        doc.y = 110;

        // ── Datos de la reserva ─────────────────────────────────
        doc.fontSize(13).font('Helvetica-Bold').fillColor(NAVY).text('Datos de la reservación');
        doc.moveTo(50, doc.y + 3).lineTo(doc.page.width - 50, doc.y + 3).strokeColor(GOLD).lineWidth(1.5).stroke();
        doc.moveDown(0.8);

        doc.fontSize(10).fillColor('black').font('Helvetica');
        const col1 = 50, col2 = 320;
        const yStart = doc.y;
        doc.text('Código:',   col1, yStart).font('Helvetica-Bold').text(reservacion.codigo_reserva, col1 + 80, yStart);
        doc.font('Helvetica').text('Tipo:',   col2, yStart).font('Helvetica-Bold').text((reservacion.tipo || '').toUpperCase(), col2 + 60, yStart);
        doc.font('Helvetica').text('Estado:', col1, yStart + 18).font('Helvetica-Bold').fillColor('green').text(reservacion.estado, col1 + 80, yStart + 18);
        doc.font('Helvetica').fillColor('black').text('Fecha reserva:', col2, yStart + 18).font('Helvetica-Bold')
           .text(new Date(reservacion.fecha_reserva).toLocaleString('es-GT'), col2 + 90, yStart + 18);
        doc.y = yStart + 40;

        // ── Datos del cliente ───────────────────────────────────
        doc.moveDown(0.5);
        doc.fontSize(13).font('Helvetica-Bold').fillColor(NAVY).text('Datos del cliente');
        doc.moveTo(50, doc.y + 3).lineTo(doc.page.width - 50, doc.y + 3).strokeColor(GOLD).lineWidth(1.5).stroke();
        doc.moveDown(0.8);

        doc.fontSize(10).fillColor('black').font('Helvetica');
        const y2 = doc.y;
        doc.text('Nombre:',     col1, y2).font('Helvetica-Bold').text(
            `${reservacion.nombre || ''} ${reservacion.apellido || ''}`.trim() || '—',
            col1 + 80, y2
        );
        doc.font('Helvetica').text('Correo:',   col2, y2).font('Helvetica-Bold').text(reservacion.correo || '—', col2 + 60, y2);
        doc.font('Helvetica').text('Pasaporte:', col1, y2 + 18).font('Helvetica-Bold').text(reservacion.numero_pasaporte || '—', col1 + 80, y2 + 18);
        doc.font('Helvetica').text('Nacionalidad:', col2, y2 + 18).font('Helvetica-Bold').text(String(reservacion.nacionalidad || '—'), col2 + 90, y2 + 18);
        doc.y = y2 + 40;

        // ── Vuelos ──────────────────────────────────────────────
        if (vuelos.length) {
            doc.moveDown(0.5);
            doc.fontSize(13).font('Helvetica-Bold').fillColor(NAVY).text('Detalle de vuelos');
            doc.moveTo(50, doc.y + 3).lineTo(doc.page.width - 50, doc.y + 3).strokeColor(GOLD).lineWidth(1.5).stroke();
            doc.moveDown(0.6);

            vuelos.forEach((v, idx) => {
                if (idx > 0) doc.moveDown(0.3);
                doc.fontSize(10).font('Helvetica-Bold').fillColor(NAVY)
                   .text(`${v.es_regreso ? '✈ REGRESO' : '✈ IDA'}: ${v.origen || '?'} → ${v.destino || '?'}`);
                doc.fontSize(9).font('Helvetica').fillColor('black');
                const fecha = v.fecha_salida ? new Date(v.fecha_salida).toLocaleDateString('es-GT') : '—';
                doc.text(`Fecha: ${fecha}   Código vuelo: ${v.codigo_vuelo || '—'}   Asiento: ${v.tipo_asiento || '—'}   Pasajeros: ${v.num_pasajeros || 1}`);
                doc.text(`Código proveedor: ${v.codigo_reserva_proveedor || '—'}   Precio: $${parseFloat(v.precio_total || 0).toFixed(2)} USD`);

                // Pasajeros
                let pasajeros = [];
                try {
                    pasajeros = typeof v.datos_pasajeros === 'string'
                        ? JSON.parse(v.datos_pasajeros) : (v.datos_pasajeros || []);
                } catch { pasajeros = []; }
                if (pasajeros.length) {
                    doc.fontSize(9).font('Helvetica-Oblique').fillColor(GRAY)
                       .text('Pasajeros: ' + pasajeros.map(p =>
                            `${p.nombres || ''} ${p.apellidos || ''}`.trim()
                       ).join(', '));
                }
            });
            doc.fillColor('black');
        }

        // ── Hoteles ─────────────────────────────────────────────
        if (hoteles.length) {
            doc.moveDown(0.5);
            doc.fontSize(13).font('Helvetica-Bold').fillColor(NAVY).text('Detalle de hospedaje');
            doc.moveTo(50, doc.y + 3).lineTo(doc.page.width - 50, doc.y + 3).strokeColor(GOLD).lineWidth(1.5).stroke();
            doc.moveDown(0.6);

            hoteles.forEach((h) => {
                const ci = h.fecha_checkin  ? new Date(h.fecha_checkin).toLocaleDateString('es-GT')  : '—';
                const co = h.fecha_checkout ? new Date(h.fecha_checkout).toLocaleDateString('es-GT') : '—';
                const noches = (new Date(h.fecha_checkout) - new Date(h.fecha_checkin)) / (1000 * 60 * 60 * 24);

                doc.fontSize(10).font('Helvetica-Bold').fillColor(NAVY)
                   .text(`🏨 ${h.nombre_hotel || 'Hotel'} — ${h.ciudad || ''}`);
                doc.fontSize(9).font('Helvetica').fillColor('black');
                doc.text(`Habitación: ${h.tipo_habitacion || '—'}   Huéspedes: ${h.num_huespedes || 1}   Noches: ${Math.max(1, Math.round(noches))}`);
                doc.text(`Check-in: ${ci}   Check-out: ${co}`);
                doc.text(`Código proveedor: ${h.codigo_reserva_proveedor || '—'}   Precio/noche: $${parseFloat(h.precio_por_noche_proveedor || 0).toFixed(2)}   Total: $${parseFloat(h.precio_total || 0).toFixed(2)} USD`);
            });
        }

        // ── Pago y totales ──────────────────────────────────────
        doc.moveDown(0.8);
        doc.fontSize(13).font('Helvetica-Bold').fillColor(NAVY).text('Información de pago');
        doc.moveTo(50, doc.y + 3).lineTo(doc.page.width - 50, doc.y + 3).strokeColor(GOLD).lineWidth(1.5).stroke();
        doc.moveDown(0.6);

        doc.fontSize(10).fillColor('black').font('Helvetica');
        const y3 = doc.y;
        doc.text('Método de pago:', col1, y3).font('Helvetica-Bold')
           .text(String(reservacion.metodo_pago || '—').replace(/_/g, ' ').toUpperCase(), col1 + 100, y3);
        if (datosCobro.titular) {
            doc.font('Helvetica').text('Titular:', col2, y3).font('Helvetica-Bold')
               .text(datosCobro.titular, col2 + 60, y3);
        }
        doc.y = y3 + 25;

        // Caja de totales
        const boxX = doc.page.width - 250;
        const boxY = doc.y;
        doc.rect(boxX, boxY, 200, 80).strokeColor(GOLD).lineWidth(1).stroke();
        doc.fontSize(10).fillColor('black').font('Helvetica');
        doc.text(`Subtotal:`, boxX + 10, boxY + 10).text(`$${subtotal.toFixed(2)}`, boxX + 120, boxY + 10, { width: 70, align: 'right' });
        doc.text(`IVA (12%):`, boxX + 10, boxY + 28).text(`$${iva.toFixed(2)}`, boxX + 120, boxY + 28, { width: 70, align: 'right' });
        doc.moveTo(boxX + 10, boxY + 48).lineTo(boxX + 190, boxY + 48).stroke();
        doc.fontSize(12).font('Helvetica-Bold').fillColor(NAVY);
        doc.text(`TOTAL:`, boxX + 10, boxY + 55).text(`$${total.toFixed(2)} ${reservacion.moneda || 'USD'}`, boxX + 100, boxY + 55, { width: 90, align: 'right' });

        doc.y = boxY + 95;

        // ── Pie de página ───────────────────────────────────────
        doc.moveDown(1);
        doc.fontSize(8).fillColor(GRAY).font('Helvetica-Oblique')
           .text('Este comprobante es un documento oficial de TravelNow y sirve como constancia de reservación confirmada.',
                 50, doc.page.height - 70, { align: 'center', width: doc.page.width - 100 });
        doc.text(`Reserva ${reservacion.codigo_reserva} · Generado automáticamente el ${new Date().toLocaleString('es-GT')}`,
                 50, doc.page.height - 55, { align: 'center', width: doc.page.width - 100 });

        doc.end();
    });

    return pdfPath;
};

module.exports = {
    crear,
    obtener,
    descargarPDF,
    cancelar,
    historialUsuario,
    reenviarCorreo,
};