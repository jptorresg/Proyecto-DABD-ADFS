-- =====================================================================
-- SAT Backend - Fix encoding de seeds (mojibake -> UTF-8 correcto)
-- Fecha: 2026-05-19
--
-- Las filas insertadas por 20260519_02_sat_fiscal_schema.sql se grabaron
-- con encoding roto (UTF-8 interpretado como CP1252 en el camino DBeaver
-- -> Oracle). Quedaron como "AerolÃnea HalcÃ³n" en vez de "Aerolínea Halcón".
--
-- Este script las reescribe con el texto correcto. Correlo en DBeaver
-- conectado como sat_db, una sentencia a la vez (Ctrl+Enter).
--
-- NOTA: si después de correr esto los acentos siguen rotos al leerlos,
-- entonces el NLS_CHARACTERSET de tu Oracle XE no es AL32UTF8 (lo más
-- probable es WE8MSWIN1252) y la solución de fondo es recrear la PDB
-- con AL32UTF8. Para fines académicos, dejá los nombres sin acento.
-- =====================================================================

UPDATE EMISORES SET nombre = 'Aerolinea Halcon'
 WHERE id_emisor IN (SELECT id_emisor FROM EMISORES WHERE nombre LIKE 'Aerol%nea Halc%n');

UPDATE EMISORES SET direccion = 'Aeropuerto La Aurora'
 WHERE nit = '7654321-9';

COMMIT;

-- Verificá:
-- SELECT id_emisor, nit, nombre FROM EMISORES;
