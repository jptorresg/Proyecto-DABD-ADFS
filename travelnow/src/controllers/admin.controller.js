const db = require('../config/db');
const { ok, err } = require('../utils/response');
const path = require('path');

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

// ------------------ Proveedores -------------------
const listarProveedores = async (req, res) => {
  const { tipo, estado, search } = req.query;
  try {
    let query = `SELECT id_proveedor, nombre, tipo, endpoint_api, api_usuario, porcentaje_ganancia, pais, estado, fecha_registro FROM proveedor WHERE 1=1`;
    const params = [];
    if (tipo) { query += ' AND tipo = ?'; params.push(tipo); }
    if (estado) { query += ' AND estado = ?'; params.push(estado); }
    if (search) { query += ' AND (nombre LIKE ? OR endpoint_api LIKE ?)'; params.push(`%${search}%`, `%${search}%`) }
    query += ' ORDER BY tipo, nombre';
    const [rows] = await db.query(query, params);
    const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM proveedor WHERE 1=1' + (tipo ? ' AND tipo = ?' : '') + (estado ? ' AND estado = ?' : '') + (search ? ' AND (nombre LIKE ? OR endpoint_api LIKE ?)' : ''), params); 
    return ok(res, { data: rows, total: total });
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
  try{
    const [result] = await db.query(`INSERT INTO proveedor (nombre, tipo, endpoint_api, api_usuario, api_password, porcentaje_ganancia, pais, estado) VALUES (?, ?, ?, ?, ?, ?, ?, 'activo')`, [nombre, tipo, endpoint_api, api_usuario || null, api_password || null, porcentaje_ganancia || 0, pais]);
    return ok(res, { message: 'Proveedor creado', id: result.insertId }, 201);
  } catch (e) { return err(res, e.message); }
};

const actualizarProveedor = async (req, res) => {
  const { id } = req.params;
  const { nombre, tipo, endpoint_api, api_usuario, api_password, porcentaje_ganancia, pais, estado } = req.body;
  try {
    await db.query(`UPDATE proveedor SET nombre=?, tipo=?, endpoint_api=?, api_usuario=?, api_password=?, porcentaje_ganancia=?, pais=?, estado=? WHERE id_proveedor=?`, [nombre, tipo, endpoint_api, api_usuario, api_password, porcentaje_ganancia, pais, estado || 'activo', id]);
    return ok(res, { message: 'Proveedor actualizado' });
  } catch (e) { return err(res, e.message); }
};

const eliminarProveedor = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('UPDATE proveedor SET estado = "inactivo" WHERE id_proveedor = ?', [id]);
    return ok(res, { message: 'Proveedor desactivado' });
  } catch (e) { return err(res, e.message); }
};

// --------------------- Usuarios ------------------------
const listarUsuarios = async (req, res) => {
  const { rol, estado, page = 1, limit = 25, search } = req.query;
  const offset = (page - 1) * parseInt(limit);
  try {
    let where = 'WHERE 1=1'
    const params =[];
    if(rol) { where += ' AND rol = ?', params.push(rol); }
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

// --------------------- Visuales o Vistas ----------------------------
const usuarios = async (req, res) => {
  res.sendFile(path.join(__dirname, '../../views/admin/usuarios.html'));
};

const reservaciones = async (req, res) => {
  res.sendFile(path.join(__dirname, '../../views/admin/reservaciones.html'));
};

const proveedores = async (req, res) => {
  res.sendFile(path.join(__dirname, '../../views/admin/proveedores.html'));
};

module.exports = { dashboard, usuarios, reservaciones, proveedores, listarProveedores, obtenerProveedor, crearProveedor, actualizarProveedor, eliminarProveedor, listarUsuarios, cambiarRol, todasReservaciones };
