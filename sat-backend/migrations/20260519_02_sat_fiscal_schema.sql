-- =====================================================================
-- SAT Backend - Schema fiscal (fase 2a)
-- Fecha: 2026-05-19
--
-- Tablas: EMISORES, RECEPTORES, FACTURAS, DETALLE_FACTURA
-- IVA Guatemala: 12%
--
-- Uso (DBeaver, conexión SAT como usuario sat_db):
--   Pegá este archivo entero, ejecutalo con Alt+X (Execute SQL script).
--   Si te tira ORA-00955 en alguna tabla, significa que ya existe — borralá
--   primero con DROP o saltá esa sentencia.
-- =====================================================================

-- ---------------------------------------------------------------------
-- EMISORES: quien emite la factura (hotel, aerolínea, agencia)
-- ---------------------------------------------------------------------
CREATE TABLE EMISORES (
    id_emisor       NUMBER(10)     PRIMARY KEY,
    nit             VARCHAR2(20)   NOT NULL UNIQUE,
    nombre          VARCHAR2(200)  NOT NULL,
    direccion       VARCHAR2(300),
    telefono        VARCHAR2(30),
    email           VARCHAR2(160),
    tipo            VARCHAR2(20)   DEFAULT 'HOTEL' NOT NULL,
    activo          NUMBER(1)      DEFAULT 1 NOT NULL,
    fecha_registro  TIMESTAMP      DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_tipo_emisor CHECK (tipo IN ('HOTEL','AEROLINEA','AGENCIA'))
);

CREATE SEQUENCE SEQ_EMISORES START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE TRIGGER TRG_EMISORES_ID
BEFORE INSERT ON EMISORES
FOR EACH ROW
WHEN (NEW.id_emisor IS NULL)
BEGIN
    SELECT SEQ_EMISORES.NEXTVAL INTO :NEW.id_emisor FROM DUAL;
END;
/

-- ---------------------------------------------------------------------
-- RECEPTORES: cliente que recibe la factura
-- (NIT no es único: puede haber muchos CF "consumidor final")
-- ---------------------------------------------------------------------
CREATE TABLE RECEPTORES (
    id_receptor     NUMBER(10)     PRIMARY KEY,
    nit             VARCHAR2(20)   NOT NULL,
    nombre          VARCHAR2(200)  NOT NULL,
    direccion       VARCHAR2(300),
    email           VARCHAR2(160),
    fecha_registro  TIMESTAMP      DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE SEQUENCE SEQ_RECEPTORES START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE TRIGGER TRG_RECEPTORES_ID
BEFORE INSERT ON RECEPTORES
FOR EACH ROW
WHEN (NEW.id_receptor IS NULL)
BEGIN
    SELECT SEQ_RECEPTORES.NEXTVAL INTO :NEW.id_receptor FROM DUAL;
END;
/

-- ---------------------------------------------------------------------
-- FACTURAS: header (serie + número únicos)
-- ---------------------------------------------------------------------
CREATE TABLE FACTURAS (
    id_factura          NUMBER(10)     PRIMARY KEY,
    serie               VARCHAR2(10)   DEFAULT 'A' NOT NULL,
    numero              NUMBER(10)     NOT NULL,
    id_emisor           NUMBER(10)     NOT NULL REFERENCES EMISORES(id_emisor),
    id_receptor         NUMBER(10)     NOT NULL REFERENCES RECEPTORES(id_receptor),
    fecha_emision       TIMESTAMP      DEFAULT CURRENT_TIMESTAMP NOT NULL,
    subtotal            NUMBER(12,2)   NOT NULL,
    impuesto            NUMBER(12,2)   DEFAULT 0 NOT NULL,
    total               NUMBER(12,2)   NOT NULL,
    estado              VARCHAR2(20)   DEFAULT 'EMITIDA' NOT NULL,
    referencia_externa  VARCHAR2(100),
    CONSTRAINT chk_estado_factura CHECK (estado IN ('EMITIDA','ANULADA','PAGADA')),
    CONSTRAINT uq_factura_serie_numero UNIQUE (serie, numero)
);

CREATE SEQUENCE SEQ_FACTURAS START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE TRIGGER TRG_FACTURAS_ID
BEFORE INSERT ON FACTURAS
FOR EACH ROW
WHEN (NEW.id_factura IS NULL)
BEGIN
    SELECT SEQ_FACTURAS.NEXTVAL INTO :NEW.id_factura FROM DUAL;
END;
/

-- ---------------------------------------------------------------------
-- DETALLE_FACTURA: líneas de la factura
-- ---------------------------------------------------------------------
CREATE TABLE DETALLE_FACTURA (
    id_detalle      NUMBER(10)     PRIMARY KEY,
    id_factura      NUMBER(10)     NOT NULL REFERENCES FACTURAS(id_factura) ON DELETE CASCADE,
    descripcion     VARCHAR2(300)  NOT NULL,
    cantidad        NUMBER(10,2)   NOT NULL,
    precio_unitario NUMBER(12,2)   NOT NULL,
    subtotal        NUMBER(12,2)   NOT NULL,
    CONSTRAINT chk_cantidad_pos CHECK (cantidad > 0),
    CONSTRAINT chk_precio_pos CHECK (precio_unitario >= 0)
);

CREATE SEQUENCE SEQ_DETALLE_FACTURA START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE TRIGGER TRG_DETALLE_FACTURA_ID
BEFORE INSERT ON DETALLE_FACTURA
FOR EACH ROW
WHEN (NEW.id_detalle IS NULL)
BEGIN
    SELECT SEQ_DETALLE_FACTURA.NEXTVAL INTO :NEW.id_detalle FROM DUAL;
END;
/

-- ---------------------------------------------------------------------
-- Seed data
-- ---------------------------------------------------------------------
INSERT INTO EMISORES (nit, nombre, direccion, telefono, email, tipo)
VALUES ('1234567-K', 'Hotel Bedly Central', 'Zona 10, Guatemala', '+502 2222-2222', 'facturas@bedly.local', 'HOTEL');

INSERT INTO EMISORES (nit, nombre, direccion, telefono, email, tipo)
VALUES ('7654321-9', 'Aerolínea Halcón', 'Aeropuerto La Aurora', '+502 2333-3333', 'billing@halcon.local', 'AEROLINEA');

INSERT INTO EMISORES (nit, nombre, direccion, telefono, email, tipo)
VALUES ('9988776-5', 'TravelNow Agencia', 'Zona 14, Guatemala', '+502 2444-4444', 'admin@travelnow.local', 'AGENCIA');

INSERT INTO RECEPTORES (nit, nombre, email)
VALUES ('CF', 'Consumidor Final', NULL);

COMMIT;
