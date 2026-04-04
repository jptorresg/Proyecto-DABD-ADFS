const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { ok, err } = require('../utils/response');
require('dotenv').config();

const register = async (req, res) => {
    const { nombre, apellido, correo, contrasena, fecha_nacimiento, pais_origen, nacionalidad, numero_pasaporte } = req.body;
    if (!nombre || !apellido || !correo || !contrasena || !fecha_nacimiento) {
        return err(res, 'Campos obligatorios faltantes', 400);
    }
    try {
        const [exist] = await db.query('SELECT id_usuario FROM usuario WHERE correo = ?', [correo]);
        if (exist.length) return err(res, 'El correo ya está registrado', 409);
        const [result] = await db.query('INSERT INTO usuario (nombre, apellido, correo, contrasena, fecha_nacimiento, pais_origen, nacionalidad, numero_pasaporte) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [nombre, apellido, correo, contrasena, fecha_nacimiento, pais_origen || null, nacionalidad || null, numero_pasaporte || null]);
        return ok(res, { message: 'Usuario registrado', id: result.insertId }, 201);
    } catch (e) { return err(res, e.message); }
};

const login = async (req, res) => {
    const { correo, contrasena } = req.body;
    if (!correo || !contrasena) return err(res, 'Correo y contraseña requeridos', 400);
   
    try {
      const [rows] = await db.query(
        'SELECT * FROM usuario WHERE correo = ? AND estado = "activo"', [correo]
      );
      if (!rows.length) return err(res, 'Credenciales incorrectas', 401);
   
      const usuario = rows[0];
      if (contrasena !== usuario.contrasena) return err(res, 'Credenciales incorrectas', 401);
   
      const payload = {
        id_usuario: usuario.id_usuario,
        nombre:     usuario.nombre,
        correo:     usuario.correo,
        rol:        usuario.rol,
      };
   
      req.session.user = payload;
   
      const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', {
        expiresIn: process.env.JWT_EXPIRES_IN || '8h',
      });
   
      if (req.headers['hx-request']) {
        res.set('HX-Redirect', usuario.rol === 'administrador' ? '/admin' : '/');
        return res.status(200).send();
      }
      return ok(res, { token, usuario: payload });
    } catch (e) {
      return err(res, e.message);
    }
  };
   
  const logout = (req, res) => {
    req.session.destroy();
    if (req.headers['hx-request']) {
      res.set('HX-Redirect', '/login');
      return res.status(200).send();
    }
    res.redirect('/login');
  };
   
  const me = (req, res) => {
    if (req.session?.user) {
      return ok(res, { usuario: req.session.user });
    }
    return err(res, 'No autenticado', 401);
  };
   
  module.exports = { register, login, logout, me };