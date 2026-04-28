'use strict';

/**
 * Unit Test — cambiarRol
 * Fuente: travelnow/src/controllers/admin.controller.js
 *
 * Para ejecutar:
 *   npm install --save-dev jest
 *   npx jest unit.cambiarRol.test.js
 */

// Mock de la base de datos — evita conexión real
jest.mock('../src/config/db', () => ({ query: jest.fn() }));

const db = require('../src/config/db');

// ── Función bajo prueba (copiada del controlador original) ────────────────────
const { ok, err } = require('../src/utils/response');

const cambiarRol = async (req, res) => {
  const { id }  = req.params;
  const { rol } = req.body;
  const roles   = ['usuario', 'administrador', 'webservice'];

  if (!roles.includes(rol)) return err(res, 'Rol no valido', 400);

  try {
    await db.query('UPDATE usuario SET rol = ? WHERE id_usuario = ?', [rol, id]);
    return ok(res, { message: `Rol actualizado a ${rol}` });
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

beforeEach(() => jest.clearAllMocks());

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('cambiarRol — cambio de rol de usuario', () => {

  test('rol "usuario" → HTTP 200', async () => {
    db.query.mockResolvedValue([{ affectedRows: 1 }]);
    const req = { params: { id: '5' }, body: { rol: 'usuario' } };
    const res = mockRes();

    await cambiarRol(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ ok: true, message: 'Rol actualizado a usuario' });
  });

  test('rol "administrador" → HTTP 200', async () => {
    db.query.mockResolvedValue([{ affectedRows: 1 }]);
    const req = { params: { id: '5' }, body: { rol: 'administrador' } };
    const res = mockRes();

    await cambiarRol(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ ok: true, message: 'Rol actualizado a administrador' });
  });

  test('rol "webservice" → HTTP 200', async () => {
    db.query.mockResolvedValue([{ affectedRows: 1 }]);
    const req = { params: { id: '5' }, body: { rol: 'webservice' } };
    const res = mockRes();

    await cambiarRol(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ ok: true, message: 'Rol actualizado a webservice' });
  });

  test('rol inválido "superadmin" → HTTP 400, no toca BD', async () => {
    const req = { params: { id: '5' }, body: { rol: 'superadmin' } };
    const res = mockRes();

    await cambiarRol(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ ok: false, message: 'Rol no valido' });
    expect(db.query).not.toHaveBeenCalled();
  });

});