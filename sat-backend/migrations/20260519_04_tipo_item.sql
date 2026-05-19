-- =====================================================================
-- SAT Backend - tipo_item en DETALLE_FACTURA (fase 3a-ext)
-- Fecha: 2026-05-19
--
-- Agrega columna tipo_item para soportar el reporte "Impuestos pagados
-- por tipo de habitacion/asiento/paquete" (requisito catedratico c).
--
-- Valores: HABITACION (Bedly), ASIENTO (aerolinea), PAQUETE (TravelNow),
-- OTRO (manual / no clasificable).
-- =====================================================================

ALTER TABLE DETALLE_FACTURA
   ADD tipo_item VARCHAR2(20) DEFAULT 'OTRO' NOT NULL;

ALTER TABLE DETALLE_FACTURA
   ADD CONSTRAINT chk_tipo_item
   CHECK (tipo_item IN ('HABITACION','ASIENTO','PAQUETE','OTRO'));

-- Backfill: clasifica registros existentes segun descripcion
UPDATE DETALLE_FACTURA
   SET tipo_item = 'HABITACION'
 WHERE LOWER(descripcion) LIKE '%habitacion%'
    OR LOWER(descripcion) LIKE '%habitación%';

UPDATE DETALLE_FACTURA
   SET tipo_item = 'ASIENTO'
 WHERE LOWER(descripcion) LIKE '%asiento%'
    OR LOWER(descripcion) LIKE '%vuelo%';

UPDATE DETALLE_FACTURA
   SET tipo_item = 'PAQUETE'
 WHERE LOWER(descripcion) LIKE '%paquete%';

COMMIT;

-- Verifica:
-- SELECT tipo_item, COUNT(*) FROM DETALLE_FACTURA GROUP BY tipo_item;
