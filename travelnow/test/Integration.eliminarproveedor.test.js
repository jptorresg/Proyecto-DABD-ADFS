'use strict';

/**
 * Integration Test — eliminarProveedor
 * Fuente: travelnow/src/controllers/admin.controller.js
 *
 * Prueba el flujo completo del controlador con la BD mockeada:
 *   SELECT verificación → UPDATE soft-delete → respuesta HTTP
 *
 * Para ejecutar:
 *   npm install --save-dev jest
 *   npx jest integration.eliminarProveedor.test.js
 */

// Mock de la base de datos — evita conexión real
jest.mock('../src/config/db', () => ({ query: jest.fn() }));

const db = require('../src/config/db');

// ── Función bajo prueba (copiada del controlador original) ────────────────────
const { ok, err } = require('../src/utils/response');

const eliminarProveedor = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(
      'SELECT id_proveedor, nombre, estado FROM proveedor WHERE id_proveedor = ?',
      [id]
    );
    if (!rows.length)              return err(res, 'Proveedor no encontrado', 404);
    if (rows[0].estado === 'inactivo') return err(res, 'El proveedor ya está inactivo', 400);

    await db.query('UPDATE proveedor SET estado = "inactivo" WHERE id_proveedor = ?', [id]);
    return ok(res, { message: 'Proveedor desactivado correctamente' });
  } catch (e) {
    return err(res, e.message);
  }
};

// ── Helper: res simulado ──────────────────────────────────────────────────────
function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
}

// Fixture: proveedor activo en BD
const proveedorActivo   = { id_proveedor: 3, nombre: 'AeroGuatemala', estado: 'activo' };
const proveedorInactivo = { ...proveedorActivo, estado: 'inactivo' };

beforeEach(() => jest.clearAllMocks());

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('eliminarProveedor — eliminación de proveedor', () => {

  test('flujo completo: SELECT activo → UPDATE → HTTP 200', async () => {
    db.query
      .mockResolvedValueOnce([[proveedorActivo]])    // SELECT: proveedor encontrado
      .mockResolvedValueOnce([{ affectedRows: 1 }]); // UPDATE: éxito

    const req = { params: { id: '3' } };
    const res = mockRes();

    await eliminarProveedor(req, res);

    // Verifica que el SELECT se ejecutó con el ID correcto
    expect(db.query).toHaveBeenNthCalledWith(
      1,
      'SELECT id_proveedor, nombre, estado FROM proveedor WHERE id_proveedor = ?',
      ['3']
    );
    // Verifica que el UPDATE hace soft-delete
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      'UPDATE proveedor SET estado = "inactivo" WHERE id_proveedor = ?',
      ['3']
    );
    // Verifica la respuesta HTTP
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ ok: true, message: 'Proveedor desactivado correctamente' });
  });

  test('proveedor ya inactivo → HTTP 400, no ejecuta UPDATE', async () => {
    db.query.mockResolvedValueOnce([[proveedorInactivo]]);

    const req = { params: { id: '3' } };
    const res = mockRes();

    await eliminarProveedor(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ ok: false, message: 'El proveedor ya está inactivo' });
    expect(db.query).toHaveBeenCalledTimes(1); // solo SELECT, no UPDATE
  });

  test('ID no encontrado → HTTP 404', async () => {
    db.query.mockResolvedValueOnce([[]]); // SELECT devuelve vacío

    const req = { params: { id: '99999' } };
    const res = mockRes();

    await eliminarProveedor(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ ok: false, message: 'Proveedor no encontrado' });
    expect(db.query).toHaveBeenCalledTimes(1);
  });

});