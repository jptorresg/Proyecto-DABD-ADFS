/**
 * @file admin.test.js
 * @description Pruebas unitarias Jest para:
 * - Registro de usuario (auth.controller -> register)
 * - Cambio de estado de usuario (admin.controller -> cambiarEstadoUsuario)
 * - Eliminación de usuario (admin.controller -> eliminarUsuario)
 */

// -- Mocks globales ----
jest.mock('../../src/config/db');
jest.mock('dotenv', () => ({ config: jest.fn() }));

const db = requier('../../src/config/db');

// Helper que construye los res.status().json()
const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
}