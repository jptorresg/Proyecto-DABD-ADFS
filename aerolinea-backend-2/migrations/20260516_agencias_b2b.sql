-- ============================================================
-- Migración: tabla AGENCIAS_B2B para autenticación de partners
-- Fecha: 2026-05-16
-- ============================================================
-- Cada agencia que consume /api/b2b/* envía Authorization: Bearer <token>.
-- El backend valida contra esta tabla; si activo=1 y el token coincide,
-- la petición sigue. De lo contrario, 401.
-- ============================================================

CREATE TABLE AGENCIAS_B2B (
    id_agencia      NUMBER(10)     PRIMARY KEY,
    nombre          VARCHAR2(120)  NOT NULL,
    email           VARCHAR2(160),
    token           VARCHAR2(255)  NOT NULL UNIQUE,
    activo          NUMBER(1)      DEFAULT 1 NOT NULL,
    fecha_registro  TIMESTAMP      DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE SEQUENCE SEQ_AGENCIAS_B2B START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE TRIGGER TRG_AGENCIAS_B2B_ID
BEFORE INSERT ON AGENCIAS_B2B
FOR EACH ROW
WHEN (NEW.id_agencia IS NULL)
BEGIN
    SELECT SEQ_AGENCIAS_B2B.NEXTVAL INTO :NEW.id_agencia FROM DUAL;
END;
/

-- Seed: agencia TravelNow con el mismo token que ya usa para Bedly.
-- Si quieres uno distinto, cámbialo aquí y refleja el cambio en
-- agencia_viajes.proveedor.api_password para el proveedor de aerolínea.
INSERT INTO AGENCIAS_B2B (nombre, email, token, activo)
VALUES (
    'TravelNow',
    'agencia@travelnow.com',
    '82A1629B-F583-430C-AC52-661ABC860E4A',
    1
);

COMMIT;
