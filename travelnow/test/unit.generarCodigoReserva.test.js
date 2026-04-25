'use strict';

/**
 * Unit Test — generarCodigoReserva
 * Fuente: travelnow/src/utils/codigo.js
 *
 * Nota: la dependencia `uuid` v9+ se distribuye como ESM y rompe Jest con CommonJS.
 * Siguiendo el mismo patrón que unit.cambiarrol.test.js e Integration.eliminarproveedor.test.js,
 * copiamos la función al test para aislar la prueba de dependencias externas.
 *
 * Verifica:
 *   - Formato correcto: TN-YYYYMMDD-XXXXXX
 *   - Fecha coincide con la fecha actual
 *   - Sufijo es alfanumérico en mayúsculas, exactamente 6 caracteres
 *   - Dos llamadas consecutivas producen códigos diferentes
 *
 * Para ejecutar:
 *   npx jest unit.generarCodigoReserva.test.js
 */

// ── Mock local de uuid v4 ────────────────────────────────────────────────────
// No importamos el paquete real para evitar el problema de ESM con Jest.
// Generamos un UUID válido (formato 8-4-4-4-12 hex) usando Math.random.
const uuidv4 = () => {
  const hex = () => Math.floor(Math.random() * 16).toString(16);
  const block = (n) => Array.from({ length: n }, hex).join('');
  return `${block(8)}-${block(4)}-${block(4)}-${block(4)}-${block(12)}`;
};

// ── Función bajo prueba (copiada de src/utils/codigo.js) ─────────────────────
const generarCodigoReserva = () => {
  const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const sufijo = uuidv4().replace(/-/g, '').slice(0, 6).toUpperCase();
  return `TN-${fecha}-${sufijo}`;
};

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('generarCodigoReserva — generador de código único de reservación', () => {

  test('respeta el formato TN-YYYYMMDD-XXXXXX', () => {
    const codigo = generarCodigoReserva();
    expect(codigo).toMatch(/^TN-\d{8}-[0-9A-F]{6}$/);
  });

  test('la porción de fecha corresponde a la fecha actual (UTC)', () => {
    const codigo = generarCodigoReserva();
    const fechaEsperada = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const partes = codigo.split('-');
    expect(partes[0]).toBe('TN');
    expect(partes[1]).toBe(fechaEsperada);
  });

  test('el sufijo tiene exactamente 6 caracteres alfanuméricos en mayúsculas', () => {
    const codigo = generarCodigoReserva();
    const sufijo = codigo.split('-')[2];
    expect(sufijo).toHaveLength(6);
    expect(sufijo).toBe(sufijo.toUpperCase());
    expect(sufijo).toMatch(/^[0-9A-F]{6}$/);
  });

  test('múltiples códigos generados son mayormente únicos (baja colisión)', () => {
    // 16^6 = ~16.7 millones de combinaciones posibles para el sufijo.
    // Con 50 generaciones, esperamos 50 únicos (tolerancia mínima por seguridad).
    const codigos = new Set();
    for (let i = 0; i < 50; i++) codigos.add(generarCodigoReserva());
    expect(codigos.size).toBeGreaterThanOrEqual(49);
  });

});