/**
 * @file adminController.js
 * @brief Controlador para el panel de administración
 * @module adminController
 * @description Maneja todas las operaciones administrativas incluyendo gestión de proveedores,
 * usuarios y reservaciones
 */

const db = require('../config/db');
const { ok, err } = require('../utils/response');
const path = require('path');

// ----------------- Dashboard ------------------

/**
 * @brief Muestra el panel de control principal (dashboard)
 * @async
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 * @returns {Promise<void>} Envía el archivo HTML del dashboard o un error
 * @throws {Error} Captura errores de base de datos y los devuelve al cliente
 */
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

/**
 * @brief Lista todos los proveedores con filtros opcionales
 * @async
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} req.query - Parámetros de consulta
 * @param {string} [req.query.tipo] - Filtro por tipo de proveedor
 * @param {string} [req.query.estado] - Filtro por estado (activo/inactivo)
 * @param {string} [req.query.search] - Búsqueda por nombre o endpoint
 * @param {Object} res - Objeto de respuesta HTTP
 * @returns {Promise<void>} Retorna lista paginada de proveedores
 * @throws {Error} Captura errores de base de datos
 */
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
 
    // Count con los mismos filtros
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

/**
 * @brief Obtiene un proveedor específico por su ID
 * @async
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} req.params - Parámetros de ruta
 * @param {string} req.params.id - ID del proveedor
 * @param {Object} res - Objeto de respuesta HTTP
 * @returns {Promise<void>} Retorna los datos del proveedor
 * @throws {Error} Captura errores de base de datos o retorna 404 si no existe
 */
const obtenerProveedor = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM proveedor WHERE id_proveedor = ?', [id]);
    if (!rows.length) return err(res, 'No se encuentra un proveedor', 404);
    return ok(res, rows[0]);
  } catch (e) { return err(res, e.message); }
};

/**
 * @brief Crea un nuevo proveedor
 * @async
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} req.body - Datos del nuevo proveedor
 * @param {string} req.body.nombre - Nombre del proveedor (requerido)
 * @param {string} req.body.tipo - Tipo de proveedor (requerido)
 * @param {string} req.body.endpoint_api - Endpoint API (requerido)
 * @param {string} [req.body.api_usuario] - Usuario para API
 * @param {string} [req.body.api_password] - Contraseña para API
 * @param {number} [req.body.porcentaje_ganancia=0] - Porcentaje de ganancia
 * @param {string} [req.body.pais] - País del proveedor
 * @param {Object} res - Objeto de respuesta HTTP
 * @returns {Promise<void>} Retorna el ID del proveedor creado
 * @throws {Error} Captura errores de base de datos
 */
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

/**
 * @brief Actualiza un proveedor existente
 * @async
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} req.params - Parámetros de ruta
 * @param {string} req.params.id - ID del proveedor a actualizar
 * @param {Object} req.body - Datos actualizados del proveedor
 * @param {Object} res - Objeto de respuesta HTTP
 * @returns {Promise<void>} Retorna mensaje de éxito
 * @throws {Error} Captura errores de base de datos
 */
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

/**
 * @brief Desactiva un proveedor (soft delete)
 * @async
 * @description Cambia el estado del proveedor a 'inactivo' en lugar de eliminarlo físicamente
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} req.params - Parámetros de ruta
 * @param {string} req.params.id - ID del proveedor a desactivar
 * @param {Object} res - Objeto de respuesta HTTP
 * @returns {Promise<void>} Retorna mensaje de éxito
 * @throws {Error} Retorna 404 si no existe o 400 si ya está inactivo
 */
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

/**
 * @brief Lista todos los usuarios con filtros y paginación
 * @async
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} req.query - Parámetros de consulta
 * @param {string} [req.query.rol] - Filtro por rol (usuario/administrador/webservice)
 * @param {string} [req.query.estado] - Filtro por estado (activo/inactivo)
 * @param {number} [req.query.page=1] - Número de página
 * @param {number} [req.query.limit=25] - Registros por página
 * @param {string} [req.query.search] - Búsqueda por nombre, apellido o correo
 * @param {Object} res - Objeto de respuesta HTTP
 * @returns {Promise<void>} Retorna lista paginada de usuarios
 * @throws {Error} Captura errores de base de datos
 */
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

/**
 * @brief Cambia el rol de un usuario
 * @async
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} req.params - Parámetros de ruta
 * @param {string} req.params.id - ID del usuario
 * @param {Object} req.body - Datos de actualización
 * @param {string} req.body.rol - Nuevo rol (usuario/administrador/webservice)
 * @param {Object} res - Objeto de respuesta HTTP
 * @returns {Promise<void>} Retorna mensaje de éxito
 * @throws {Error} Retorna 400 si el rol no es válido
 */
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

/**
 * @brief Cambia el estado de un usuario (activo/inactivo)
 * @async
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} req.params - Parámetros de ruta
 * @param {string} req.params.id - ID del usuario
 * @param {Object} req.body - Datos de actualización
 * @param {string} req.body.estado - Nuevo estado ('activo' o 'inactivo')
 * @param {Object} res - Objeto de respuesta HTTP
 * @returns {Promise<void>} Retorna mensaje de éxito
 * @throws {Error} Retorna 400 si el estado no es válido o 404 si el usuario no existe
 */
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
 
/**
 * @brief Elimina permanentemente un usuario (hard delete)
 * @async
 * @description Solo permite eliminar si el usuario no tiene reservaciones asociadas
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} req.params - Parámetros de ruta
 * @param {string} req.params.id - ID del usuario a eliminar
 * @param {Object} res - Objeto de respuesta HTTP
 * @returns {Promise<void>} Retorna mensaje de éxito
 * @throws {Error} Retorna 404 si no existe o 409 si tiene reservaciones activas
 */
const eliminarUsuario = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT id_usuario, nombre, correo FROM usuario WHERE id_usuario = ?', [id]);
    if (!rows.length) return err(res, 'Usuario no encontrado', 404);
 
    // Verificar si tiene reservaciones asociadas
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

/**
 * @brief Obtiene todas las reservaciones con filtros y estadísticas
 * @async
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} req.query - Parámetros de consulta
 * @param {string} [req.query.estado] - Filtro por estado (confirmada/pendiente)
 * @param {string} [req.query.tipo] - Filtro por tipo de reservación
 * @param {number} [req.query.page=1] - Número de página
 * @param {number} [req.query.limit=25] - Registros por página
 * @param {string} [req.query.search] - Búsqueda por código, nombre o correo
 * @param {Object} res - Objeto de respuesta HTTP
 * @returns {Promise<void>} Retorna lista paginada de reservaciones con estadísticas
 * @throws {Error} Captura errores de base de datos
 */
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

/**
 * @brief Renderiza la vista de gestión de usuarios
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 * @returns {void} Envía el archivo HTML de usuarios
 */
const usuarios = async (req, res) => res.sendFile(path.join(__dirname, '../../views/admin/usuarios.html'));

/**
 * @brief Renderiza la vista de gestión de reservaciones
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 * @returns {void} Envía el archivo HTML de reservaciones
 */
const reservaciones = async (req, res) => res.sendFile(path.join(__dirname, '../../views/admin/reservaciones.html'));

/**
 * @brief Renderiza la vista de gestión de proveedores
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 * @returns {void} Envía el archivo HTML de proveedores
 */
const proveedores = async (req, res) => res.sendFile(path.join(__dirname, '../../views/admin/proveedores.html'));
 
/**
 * @exports adminController
 * @description Exporta todas las funciones del controlador administrativo
 */
module.exports = {
  dashboard,
  usuarios, reservaciones, proveedores,
  listarProveedores, obtenerProveedor, crearProveedor, actualizarProveedor, eliminarProveedor,
  listarUsuarios, cambiarRol, cambiarEstadoUsuario, eliminarUsuario,
  todasReservaciones,
};