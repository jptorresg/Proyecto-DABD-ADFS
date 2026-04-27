/**
 * @file adminController.js
 * @brief Controlador para el panel de administración
 * @module adminController
 * @description Maneja todas las operaciones administrativas incluyendo gestión de proveedores,
 * usuarios, reservaciones, métricas del dashboard y auditoría de búsquedas.
 */

const db = require('../config/db');
const { ok, err } = require('../utils/response');
const path = require('path');
const PDFDocument = require('pdfkit');

// ----------------- Dashboard ------------------

const dashboard = async (req, res) => {
  try {
      const [[stats]] = await db.query(`
          SELECT 
              (SELECT COUNT(*) FROM usuario) as total_usuarios,
              (SELECT COUNT(*) FROM reservacion) as total_reservaciones,
              (SELECT COUNT(*) FROM proveedor WHERE estado='activo') as proveedores_activos
      `);
      res.sendFile(path.join(__dirname, '../../views/admin/dashboard.html'));
  } catch (e) {
      return err(res, e.message);
  }
};

/**
 * @brief Devuelve los datos consolidados para las 3 gráficas del dashboard.
 * @route GET /api/admin/dashboard/charts
 *
 * Retorna:
 *   - ingresos_por_tipo:    [{ tipo, cantidad, total_ingresos }]
 *   - busquedas_por_tipo:   [{ tipo, total }]  ← incluye 'paquete' inferido
 *   - registros_por_dia:    [{ dia: 'YYYY-MM-DD', total }]  últimos 30 días
 */
const dashboardCharts = async (req, res) => {
  try {
    // 1. Ingresos por tipo de reserva (solo confirmadas)
    const [ingresos] = await db.query(`
      SELECT tipo,
             COUNT(*)                AS cantidad,
             COALESCE(SUM(total), 0) AS total_ingresos
        FROM reservacion
       WHERE estado = 'confirmada'
       GROUP BY tipo
    `);

    // 2. Búsquedas por tipo
    // El buscador de paquetes registra 2 filas (una vuelo + una hotel) en
    // historial_busqueda. Inferimos los paquetes detectando pares vuelo+hotel
    // del mismo usuario en una ventana de 5 segundos, y los restamos de los
    // conteos individuales para no duplicarlos.
    const [busquedasRaw] = await db.query(`
      SELECT tipo_busqueda AS tipo, COUNT(*) AS total
        FROM historial_busqueda
       GROUP BY tipo_busqueda
    `);

    const [[paquetes]] = await db.query(`
      SELECT COUNT(*) AS total
        FROM historial_busqueda h1
        JOIN historial_busqueda h2
          ON h1.id_usuario      = h2.id_usuario
         AND h1.tipo_busqueda   = 'vuelo'
         AND h2.tipo_busqueda   = 'hotel'
         AND ABS(TIMESTAMPDIFF(SECOND, h1.fecha_busqueda, h2.fecha_busqueda)) <= 5
       WHERE h1.id_usuario IS NOT NULL
    `);

    const mapaBusquedas = { vuelo: 0, hotel: 0, paquete: paquetes.total || 0 };
    busquedasRaw.forEach(b => {
      if (b.tipo === 'vuelo' || b.tipo === 'hotel') {
        mapaBusquedas[b.tipo] = b.total;
      }
    });
    if (mapaBusquedas.paquete > 0) {
      mapaBusquedas.vuelo = Math.max(0, mapaBusquedas.vuelo - mapaBusquedas.paquete);
      mapaBusquedas.hotel = Math.max(0, mapaBusquedas.hotel - mapaBusquedas.paquete);
    }

    const busquedas = [
      { tipo: 'vuelo',   total: mapaBusquedas.vuelo   },
      { tipo: 'hotel',   total: mapaBusquedas.hotel   },
      { tipo: 'paquete', total: mapaBusquedas.paquete },
    ];

    // 3. Usuarios registrados por día (últimos 30 días)
    const [registrosRaw] = await db.query(`
      SELECT DATE(fecha_registro) AS dia,
             COUNT(*)             AS total
        FROM usuario
       WHERE fecha_registro >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
       GROUP BY DATE(fecha_registro)
       ORDER BY dia ASC
    `);

    const mapaRegistros = {};
    registrosRaw.forEach(r => {
      const key = r.dia instanceof Date
        ? r.dia.toISOString().slice(0, 10)
        : String(r.dia).slice(0, 10);
      mapaRegistros[key] = r.total;
    });

    const registros = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      registros.push({ dia: key, total: mapaRegistros[key] || 0 });
    }

    return ok(res, {
      ingresos_por_tipo:  ingresos,
      busquedas_por_tipo: busquedas,
      registros_por_dia:  registros,
    });
  } catch (e) {
    return err(res, e.message);
  }
};

// ------------------ Proveedores -------------------

const listarProveedores = async (req, res) => {
  const { tipo, estado, search } = req.query;
  try {
    let query = `SELECT id_proveedor, nombre, tipo, endpoint_api, api_usuario, porcentaje_ganancia, pais, estado, fecha_registro FROM proveedor WHERE 1=1`;
    const params = [];
    if (tipo)   { query += ' AND tipo = ?';   params.push(tipo); }
    if (estado) { query += ' AND estado = ?'; params.push(estado); }
    if (search) {
      query += ' AND (nombre LIKE ? OR endpoint_api LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    query += ' ORDER BY tipo, nombre';
    const [rows] = await db.query(query, params);

    let countQuery = 'SELECT COUNT(*) as total FROM proveedor WHERE 1=1';
    const countParams = [];
    if (tipo)   { countQuery += ' AND tipo = ?';   countParams.push(tipo); }
    if (estado) { countQuery += ' AND estado = ?'; countParams.push(estado); }
    if (search) {
      countQuery += ' AND (nombre LIKE ? OR endpoint_api LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }
    const [[{ total }]] = await db.query(countQuery, countParams);
    return ok(res, { data: rows, total });
  } catch (e) { return err(res, e.message); }
};

const obtenerProveedor = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM proveedor WHERE id_proveedor = ?', [id]);
    if (!rows.length) return err(res, 'No se encuentra un proveedor', 404);
    return ok(res, rows[0]);
  } catch (e) { return err(res, e.message); }
};

const crearProveedor = async (req, res) => {
  const { nombre, tipo, endpoint_api, api_usuario, api_password, porcentaje_ganancia, pais } = req.body;
  if (!nombre || !tipo || !endpoint_api) return err(res, 'Nombre, tipo y endpoint son requeridos', 400);
  try {
    const [result] = await db.query(
      `INSERT INTO proveedor (nombre, tipo, endpoint_api, api_usuario, api_password, porcentaje_ganancia, pais, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'activo')`,
      [nombre, tipo, endpoint_api, api_usuario || null, api_password || null, porcentaje_ganancia || 0, pais]
    );
    return ok(res, { message: 'Proveedor creado', id: result.insertId }, 201);
  } catch (e) { return err(res, e.message); }
};

const actualizarProveedor = async (req, res) => {
  const { id } = req.params;
  const { nombre, tipo, endpoint_api, api_usuario, api_password, porcentaje_ganancia, pais, estado } = req.body;
  try {
    await db.query(
      `UPDATE proveedor SET nombre=?, tipo=?, endpoint_api=?, api_usuario=?, api_password=?,
       porcentaje_ganancia=?, pais=?, estado=? WHERE id_proveedor=?`,
      [nombre, tipo, endpoint_api, api_usuario, api_password, porcentaje_ganancia, pais, estado || 'activo', id]
    );
    return ok(res, { message: 'Proveedor actualizado' });
  } catch (e) { return err(res, e.message); }
};

const eliminarProveedor = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT id_proveedor, nombre, estado FROM proveedor WHERE id_proveedor = ?', [id]);
    if (!rows.length) return err(res, 'Proveedor no encontrado', 404);
    if (rows[0].estado === 'inactivo') return err(res, 'El proveedor ya está inactivo', 400);

    await db.query('UPDATE proveedor SET estado = "inactivo" WHERE id_proveedor = ?', [id]);
    return ok(res, { message: 'Proveedor desactivado correctamente' });
  } catch (e) { return err(res, e.message); }
};

// --------------------- Usuarios ------------------------

const listarUsuarios = async (req, res) => {
  const { rol, estado, page = 1, limit = 25, search } = req.query;
  const offset = (page - 1) * parseInt(limit);
  try {
    let where = 'WHERE 1=1'
    const params =[];
    if(rol) { where += ' AND rol = ?'; params.push(rol); }
    if (estado) { where += ' AND estado = ?'; params.push(estado); }
    if (search) { where += ' AND (nombre LIKE ? or apellido LIKE ? OR correo LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`);}
    const [rows] = await db.query(`SELECT id_usuario, nombre, apellido, correo, rol, estado, pais_origen, fecha_registro FROM usuario ${where} ORDER BY fecha_registro DESC LIMIT ? OFFSET ?`, [...params, parseInt(limit), offset]);
    const countQuery = `SELECT COUNT(*) as total FROM usuario ${where}`;
    const [[{ total }]] = await db.query(countQuery, params);
    return ok(res, { data: rows, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (e) { return err(res, e.message); }
};

const cambiarRol = async (req, res) => {
  const { id } = req.params;
  const { rol } = req.body;
  const roles = ['usuario', 'administrador', 'webservice'];
  if(!roles.includes(rol)) return err(res, 'Rol no valido', 400);
  try {
    await db.query('UPDATE usuario SET rol = ? WHERE id_usuario = ?', [rol, id]);
    return ok(res, { message: `Rol actualizado a ${rol}` });
  } catch (e) { return err(res, e.message); }
};

const cambiarEstadoUsuario = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  const estadosValidos = ['activo', 'inactivo'];
  if (!estadosValidos.includes(estado)) return err(res, 'Estado no válido. Use "activo" o "inactivo"', 400);
  try {
    const [rows] = await db.query('SELECT id_usuario, estado FROM usuario WHERE id_usuario = ?', [id]);
    if (!rows.length) return err(res, 'Usuario no encontrado', 404);
    await db.query('UPDATE usuario SET estado = ? WHERE id_usuario = ?', [estado, id]);
    const accion = estado === 'inactivo' ? 'desactivado' : 'activado';
    return ok(res, { message: `Usuario ${accion} correctamente` });
  } catch (e) { return err(res, e.message); }
};

const eliminarUsuario = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT id_usuario, nombre, correo FROM usuario WHERE id_usuario = ?', [id]);
    if (!rows.length) return err(res, 'Usuario no encontrado', 404);

    const [[{ total }]] = await db.query(
      'SELECT COUNT(*) as total FROM reservacion WHERE id_usuario = ?', [id]
    );
    if (total > 0) {
      return err(res,
        `No se puede eliminar: el usuario tiene ${total} reservación(es). Use "desactivar" en su lugar.`,
        409
      );
    }

    await db.query('DELETE FROM usuario WHERE id_usuario = ?', [id]);
    return ok(res, { message: 'Usuario eliminado permanentemente' });
  } catch (e) { return err(res, e.message); }
};

// ----------------- Reservaciones ----------------------

const todasReservaciones = async (req, res) => {
  const { estado, tipo, page = 1, limit = 25, search } = req.query;
  const offset = (page - 1) * parseInt(limit);
  try {
    let where = 'WHERE 1=1';
    const params = [];

    if (estado) { where += ' AND r.estado = ?'; params.push(estado); }
    if (tipo) { where += ' AND r.tipo = ?'; params.push(tipo); }
    if (search) { where += ' AND (r.codigo_reserva LIKE ? OR u.nombre LIKE ? OR u.correo LIKE ?)';
       params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    const [rows] = await db.query(
      `SELECT r.id_reservacion, r.codigo_reserva, r.tipo, r.total, r.estado, r.fecha_reserva, u.nombre, u.apellido, u.correo, u.rol FROM reservacion r JOIN usuario u ON u.id_usuario = r.id_usuario ${where} ORDER BY r.fecha_reserva DESC LIMIT ? OFFSET ?`, [...params, parseInt(limit), offset]
    );
    const [[stats]] = await db.query(`
      SELECT COUNT(*) as total, SUM(CASE WHEN r.estado='confirmada' THEN 1 ELSE 0 END) as confirmadas, SUM(CASE WHEN r.estado='pendiente' THEN 1 ELSE 0 END) as pendientes, SUM(CASE WHEN r.estado='confirmada' THEN r.total ELSE 0 END) as ingresos FROM reservacion r ${where}`, params
    );
    const countQuery = `SELECT COUNT(*) as total FROM reservacion r ${where}`;
    const [[{ total }]] = await db.query(countQuery, params);
    return ok(res, {
      data: rows,
      total,
      page: parseInt(page),
      stats: {
          total: stats.total,
          confirmadas: stats.confirmadas,
          pendientes: stats.pendientes,
          ingresos: stats.ingresos || 0
      }
  });
  } catch (e) { return err(res, e.message); }
};

// ----------------- Auditoría de búsquedas ----------------------

/**
 * @brief Lista las búsquedas registradas con filtros y paginación.
 * @route GET /api/admin/busquedas/data
 */
const listarBusquedas = async (req, res) => {
    const { tipo, origen_busqueda, desde, hasta, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = 'WHERE 1=1';
    const params = [];

    if (tipo)            { where += ' AND h.tipo_busqueda = ?';        params.push(tipo); }
    if (origen_busqueda) { where += ' AND h.origen_busqueda = ?';      params.push(origen_busqueda); }
    if (desde)           { where += ' AND DATE(h.fecha_busqueda) >= ?'; params.push(desde); }
    if (hasta)           { where += ' AND DATE(h.fecha_busqueda) <= ?'; params.push(hasta); }

    try {
        const [rows] = await db.query(
            `SELECT h.id_busqueda, h.tipo_busqueda, h.origen_busqueda,
                    h.origen, h.destino, h.ciudad,
                    h.fecha_inicio, h.fecha_fin, h.num_pasajeros,
                    h.fecha_busqueda,
                    u.id_usuario, u.nombre, u.apellido, u.correo
               FROM historial_busqueda h
          LEFT JOIN usuario u ON u.id_usuario = h.id_usuario
               ${where}
           ORDER BY h.fecha_busqueda DESC
              LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), offset]
        );
        const [[{ total }]] = await db.query(
            `SELECT COUNT(*) AS total FROM historial_busqueda h ${where}`, params
        );
        return ok(res, { data: rows, total, page: parseInt(page), limit: parseInt(limit) });
    } catch (e) {
        return err(res, e.message);
    }
};

/**
 * @brief Genera un PDF de auditoría con todas las búsquedas filtradas.
 * @route GET /api/admin/busquedas/pdf
 *
 * Acepta los mismos query params que `listarBusquedas` (sin page/limit):
 * tipo, origen_busqueda, desde, hasta.
 */
const exportarBusquedasPDF = async (req, res) => {
    const { tipo, origen_busqueda, desde, hasta } = req.query;

    let where = 'WHERE 1=1';
    const params = [];
    if (tipo)            { where += ' AND h.tipo_busqueda = ?';        params.push(tipo); }
    if (origen_busqueda) { where += ' AND h.origen_busqueda = ?';      params.push(origen_busqueda); }
    if (desde)           { where += ' AND DATE(h.fecha_busqueda) >= ?'; params.push(desde); }
    if (hasta)           { where += ' AND DATE(h.fecha_busqueda) <= ?'; params.push(hasta); }

    try {
        const [rows] = await db.query(
            `SELECT h.id_busqueda, h.tipo_busqueda, h.origen_busqueda,
                    h.origen, h.destino, h.ciudad,
                    h.fecha_inicio, h.fecha_fin, h.num_pasajeros,
                    h.fecha_busqueda,
                    u.nombre, u.apellido, u.correo
               FROM historial_busqueda h
          LEFT JOIN usuario u ON u.id_usuario = h.id_usuario
               ${where}
           ORDER BY h.fecha_busqueda DESC`,
            params
        );

        const [[stats]] = await db.query(
            `SELECT COUNT(*) AS total,
                    SUM(CASE WHEN h.tipo_busqueda = 'vuelo' THEN 1 ELSE 0 END) AS vuelos,
                    SUM(CASE WHEN h.tipo_busqueda = 'hotel' THEN 1 ELSE 0 END) AS hoteles,
                    SUM(CASE WHEN h.id_usuario IS NULL THEN 1 ELSE 0 END)      AS anonimas,
                    SUM(CASE WHEN h.origen_busqueda = 'rest' THEN 1 ELSE 0 END) AS por_api,
                    SUM(CASE WHEN h.origen_busqueda = 'web'  THEN 1 ELSE 0 END) AS por_web
               FROM historial_busqueda h
               ${where}`,
            params
        );

        const fechaArchivo = new Date().toISOString().slice(0, 10);
        const filename = `auditoria-busquedas-${fechaArchivo}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Cache-Control', 'no-store');

        const doc = new PDFDocument({
            margin: 40,
            size: 'LETTER',
            layout: 'landscape',
            bufferPages: true,
            info: {
                Title:    'Auditoría de búsquedas — TravelNow',
                Author:   'TravelNow',
                Subject:  'Reporte de auditoría',
                Keywords: 'auditoría, búsquedas, log',
            },
        });
        doc.pipe(res);

        const NAVY  = '#0A1628';
        const GOLD  = '#D4AF37';
        const GRAY  = '#666666';
        const LIGHT = '#F5F0E8';

        // Header
        doc.rect(0, 0, doc.page.width, 70).fill(NAVY);
        doc.fillColor(GOLD).fontSize(22).font('Helvetica-Bold')
           .text('TravelNow', 40, 22);
        doc.fillColor('white').fontSize(10).font('Helvetica')
           .text('Reporte de auditoría · Logs de búsquedas', 40, 47);
        doc.fillColor('white').fontSize(8).font('Helvetica')
           .text(`Generado: ${new Date().toLocaleString('es-GT')}`,
                 doc.page.width - 240, 30, { width: 200, align: 'right' });

        doc.fillColor('black');
        doc.y = 90;

        // Resumen
        doc.fontSize(13).font('Helvetica-Bold').fillColor(NAVY)
           .text('Resumen del reporte', 40, doc.y);
        doc.moveTo(40, doc.y + 3).lineTo(doc.page.width - 40, doc.y + 3)
           .strokeColor(GOLD).lineWidth(1.5).stroke();
        doc.moveDown(0.7);

        doc.fontSize(9).font('Helvetica').fillColor('black');
        const filtrosTexto = [
            tipo            ? `tipo=${tipo}`             : null,
            origen_busqueda ? `canal=${origen_busqueda}` : null,
            desde           ? `desde=${desde}`           : null,
            hasta           ? `hasta=${hasta}`           : null,
        ].filter(Boolean).join(' · ') || 'sin filtros (todos los registros)';

        doc.text(`Filtros aplicados: ${filtrosTexto}`);
        doc.moveDown(0.5);

        // Caja de stats
        const statsY = doc.y;
        const colW   = (doc.page.width - 80) / 6;
        const stat   = (label, value, idx) => {
            const x = 40 + idx * colW;
            doc.rect(x, statsY, colW - 5, 42).fillAndStroke(LIGHT, GOLD);
            doc.fillColor(NAVY).fontSize(14).font('Helvetica-Bold')
               .text(String(value), x, statsY + 6, { width: colW - 5, align: 'center' });
            doc.fillColor(GRAY).fontSize(8).font('Helvetica')
               .text(label, x, statsY + 26, { width: colW - 5, align: 'center' });
        };
        stat('Total',         stats.total    || 0, 0);
        stat('Vuelos',        stats.vuelos   || 0, 1);
        stat('Hoteles',       stats.hoteles  || 0, 2);
        stat('Anónimas',      stats.anonimas || 0, 3);
        stat('Vía Web',       stats.por_web  || 0, 4);
        stat('Vía API (B2B)', stats.por_api  || 0, 5);

        doc.y = statsY + 55;
        doc.fillColor('black');

        // Tabla
        if (!rows.length) {
            doc.moveDown(2);
            doc.fontSize(11).font('Helvetica-Oblique').fillColor(GRAY)
               .text('No se encontraron búsquedas con los filtros aplicados.',
                     { align: 'center' });
            doc.end();
            return;
        }

        doc.fontSize(13).font('Helvetica-Bold').fillColor(NAVY)
           .text(`Detalle (${rows.length} registro${rows.length !== 1 ? 's' : ''})`, 40, doc.y);
        doc.moveTo(40, doc.y + 3).lineTo(doc.page.width - 40, doc.y + 3)
           .strokeColor(GOLD).lineWidth(1.5).stroke();
        doc.moveDown(0.6);

        const cols = [
            { key: 'fecha',   label: 'Fecha',           width: 110 },
            { key: 'tipo',    label: 'Tipo',            width: 50  },
            { key: 'canal',   label: 'Canal',           width: 50  },
            { key: 'usuario', label: 'Usuario',         width: 150 },
            { key: 'ruta',    label: 'Ruta / Ciudad',   width: 150 },
            { key: 'fechas',  label: 'Fechas viaje',    width: 130 },
            { key: 'pax',     label: 'Pax',             width: 35  },
        ];

        const drawHeader = (y) => {
            doc.rect(40, y, doc.page.width - 80, 22).fill(NAVY);
            doc.fillColor(GOLD).fontSize(8).font('Helvetica-Bold');
            let x = 45;
            cols.forEach(c => {
                doc.text(c.label, x, y + 7, { width: c.width - 5 });
                x += c.width;
            });
            doc.fillColor('black');
            return y + 22;
        };

        let y = drawHeader(doc.y);
        let zebra = false;

        const fmtFecha = (v) => v ? new Date(v).toLocaleDateString('es-GT') : '—';
        const fmtFechaHora = (v) => v ? new Date(v).toLocaleString('es-GT', {
            day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit',
        }) : '—';

        for (const r of rows) {
            if (y > doc.page.height - 60) {
                doc.addPage();
                y = 50;
                y = drawHeader(y);
                zebra = false;
            }

            const rowH = 18;
            if (zebra) doc.rect(40, y, doc.page.width - 80, rowH).fill(LIGHT);
            zebra = !zebra;

            doc.fillColor('black').fontSize(7.5).font('Helvetica');

            const usuario = r.nombre
                ? `${r.nombre} ${r.apellido || ''}`.trim() + (r.correo ? `\n${r.correo}` : '')
                : '(anónimo)';
            const ruta = r.tipo_busqueda === 'hotel'
                ? (r.ciudad || '—')
                : `${r.origen || '?'} → ${r.destino || '?'}`;
            const fechas = (r.fecha_inicio || r.fecha_fin)
                ? `${fmtFecha(r.fecha_inicio)} → ${fmtFecha(r.fecha_fin)}`
                : '—';

            const valores = {
                fecha:   fmtFechaHora(r.fecha_busqueda),
                tipo:    (r.tipo_busqueda || '').toUpperCase(),
                canal:   (r.origen_busqueda || '').toUpperCase(),
                usuario: usuario,
                ruta:    ruta,
                fechas:  fechas,
                pax:     r.num_pasajeros != null ? String(r.num_pasajeros) : '—',
            };

            let x = 45;
            cols.forEach(c => {
                doc.text(valores[c.key], x, y + 4, {
                    width: c.width - 5,
                    height: rowH - 2,
                    ellipsis: true,
                });
                x += c.width;
            });

            y += rowH;
        }

        // Pie con paginación
        const pageRange = doc.bufferedPageRange();
        for (let i = 0; i < pageRange.count; i++) {
            doc.switchToPage(pageRange.start + i);
            doc.fontSize(7).fillColor(GRAY).font('Helvetica-Oblique')
               .text(
                   `Documento de auditoría TravelNow · Página ${i + 1} de ${pageRange.count}`,
                   40,
                   doc.page.height - 25,
                   { align: 'center', width: doc.page.width - 80 }
               );
        }

        doc.end();
    } catch (e) {
        if (res.headersSent) {
            console.error('[Auditoría PDF] Error después de empezar el stream:', e.message);
            try { res.end(); } catch {}
            return;
        }
        return err(res, e.message);
    }
};

// --------------------- Vistas ----------------------------

const usuarios       = async (req, res) => res.sendFile(path.join(__dirname, '../../views/admin/usuarios.html'));
const reservaciones  = async (req, res) => res.sendFile(path.join(__dirname, '../../views/admin/reservaciones.html'));
const proveedores    = async (req, res) => res.sendFile(path.join(__dirname, '../../views/admin/proveedores.html'));

module.exports = {
  dashboard,
  dashboardCharts,
  usuarios, reservaciones, proveedores,
  listarProveedores, obtenerProveedor, crearProveedor, actualizarProveedor, eliminarProveedor,
  listarUsuarios, cambiarRol, cambiarEstadoUsuario, eliminarUsuario,
  todasReservaciones,
  listarBusquedas, exportarBusquedasPDF,
};