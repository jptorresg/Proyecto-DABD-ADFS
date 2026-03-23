const db = require('../config/db');
const { ok, err } = require('../utils/response');

// --------------------------------- Proveedores --------------------------------
const listarProveedores = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT id_proveedor, nombre, tipo, endpoint_api, api_usuario,
              porcentaje_ganancia, pais, estado, fecha_registro
       FROM proveedor ORDER BY tipo, nombre`
        );
        return ok(res, { data: rows });
    } catch (e) { return err(res, e.message); }
};

const crearProveedor = async (req, res) => {
    const { nombre, tipo, endpoint_api, api_usuario, api_password, porcentaje_ganancia, pais } = req.body;
    if (!nombre || !tipo || !endpoint_api) return err(res, 'Nombre, tipo y endpoint son requeridos', 400);
    try {
      const [result] = await db.query(
        `INSERT INTO proveedor (nombre, tipo, endpoint_api, api_usuario, api_password, porcentaje_ganancia, pais)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [nombre, tipo, endpoint_api, api_usuario, api_password, porcentaje_ganancia || 0, pais]
      );
      return ok(res, { message: 'Proveedor creado', id: result.insertId }, 201);
    } catch (e) { return err(res, e.message); }
};

const actualizarProveedor =  async (req, res) => {
    const {id} = req.params;
    const { nombre, tipo, endpoint_api, api_usuario, api_password, porcentaje_ganancia, pais, estado } = req.body;
    try {
        await db.query(
            `UPDATE proveedor SET nombre=?, tipo=?, endpoint_api=?, api_usuario=?,
            api_password=?, porcentaje_ganancia=?, pais=?, estado=?
            WHERE id_proveedor=?`,
            [nombre, tipo, endpoint_api, api_usuario, api_password, porcentaje_ganancia, pais, estado, id]
        );
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

// --------------------------------- Usuarios --------------------------------
const listarUsuarios = async (req, res) => {
    const { rol, estado, page = 1, limit = 25 } = req.query;
    const offset = (page - 1) * limit;
    try {
        let where = 'WHERE 1=1';
    const params = [];
    if (rol)    { where += ' AND rol = ?';    params.push(rol); }
    if (estado) { where += ' AND estado = ?'; params.push(estado); }
 
    const [rows] = await db.query(
      `SELECT id_usuario, nombre, apellido, correo, rol, estado, pais_origen, fecha_registro
       FROM usuario ${where} ORDER BY fecha_registro DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM usuario ${where}`, params);
 
    return ok(res, { data: rows, total, page: parseInt(page) });
    } catch (e) { return err(res, e.message); }
};

const cambiarRol = async (req, res) => {
    const { id } = req.params;
    const { rol } = req.body;
    const roles = ['usuario', 'administrador', 'webservice'];
    if (!roles.includes(rol)) return err(res, 'Rol inválido', 400);
    try {
        await db.query('UPDATE usuario SET rol = ? WHERE id_usuario = ?', [rol, id]);
        return ok(res, { message: 'Rol actualizado a ${rol}' });
    } catch (e) { return err(res, e.message); }
};

// ------------------------- Historial de busqueda --------------------------------
const historialBusqueda = async (req, res) => {
    const { tipo, origen_busqueda, id_usuario, fecha_desde, fecha_hasta, page = 1, limit = 25 } = req.query;
    const offset = (page - 1) * limit;
    try {
        let where = 'WHERE 1=1';
    const params = [];
    if (tipo)            { where += ' AND hb.tipo_busqueda = ?';   params.push(tipo); }
    if (origen_busqueda) { where += ' AND hb.origen_busqueda = ?'; params.push(origen_busqueda); }
    if (id_usuario)      { where += ' AND hb.id_usuario = ?';      params.push(id_usuario); }
    if (fecha_desde)     { where += ' AND hb.fecha_busqueda >= ?'; params.push(fecha_desde); }
    if (fecha_hasta)     { where += ' AND hb.fecha_busqueda <= ?'; params.push(fecha_hasta + ' 23:59:59'); }
 
    const [rows] = await db.query(
      `SELECT hb.*, u.nombre, u.apellido, u.correo
       FROM historial_busqueda hb
       LEFT JOIN usuario u ON u.id_usuario = hb.id_usuario
       ${where} ORDER BY hb.fecha_busqueda DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM historial_busqueda hb ${where}`, params);
 
    return ok(res, { data: rows, total, page: parseInt(page) });
    } catch (e) { return err(res, e.message); }
};

// ------------------------ Todas las reservaciones --------------------------
const todasReservaciones = async (req, res) => {
 const { estado, tipo, page = 1, limit = 25 } = req.query;
 const offset = (page - 1) * limit;
 try {
    let where = 'WHERE 1=1';
    const params = [];
    if (estado) { where += ' AND r.estado = ?'; params.push(estado); }
    if (tipo)   { where += ' AND r.tipo = ?';   params.push(tipo); }
 
    const [rows] = await db.query(
      `SELECT r.id_reservacion, r.codigo_reserva, r.tipo, r.total, r.estado,
              r.fecha_reserva, u.nombre, u.apellido, u.correo
       FROM reservacion r
       JOIN usuario u ON u.id_usuario = r.id_usuario
       ${where} ORDER BY r.fecha_reserva DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM reservacion r ${where}`, params);
 
    return ok(res, { data: rows, total, page: parseInt(page) });
 } catch (e) { return err(res, e.message); }
};

module.exports = {
    listarProveedores, crearProveedor, actualizarProveedor, eliminarProveedor,
    listarUsuarios, cambiarRol,
    historialBusqueda,
    todasReservaciones
};