-- =====================================================================
-- SAT Backend - Schema inicial (Oracle 18c XE)
-- Fecha: 2026-05-19
-- Usuario DB esperado: sat_db (PDB: XEPDB1, puerto 1521)
--
-- Uso (PowerShell):
--   cd C:\Users\José Rueda\Desktop\Proyecto_Modulo_Hotel_Final\Proyecto-DABD-ADFS\sat-backend\migrations
--   sqlplus --% sat_db/tu_password_aqui@localhost:1521/XEPDB1 @20260519_sat_db_schema.sql
--
-- IMPORTANTE: este script es la *fuente de verdad* del schema inicial.
-- Si ya ejecutaste partes en DBeaver (CREATE TABLE USUARIOS, sequence,
-- trigger, INSERT admin), las re-ejecuciones van a fallar con
-- "ORA-00955: nombre ya utilizado por un objeto existente". Eso es
-- esperado — el archivo refleja el estado deseado, no es idempotente.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tabla USUARIOS (cuentas del módulo SAT: ADMIN / OPERADOR)
-- ---------------------------------------------------------------------
CREATE TABLE USUARIOS (
    id_usuario      NUMBER(10)     PRIMARY KEY,
    email           VARCHAR2(160)  NOT NULL UNIQUE,
    password_hash   VARCHAR2(255)  NOT NULL,
    nombres         VARCHAR2(120)  NOT NULL,
    apellidos       VARCHAR2(120)  NOT NULL,
    tipo_usuario    VARCHAR2(20)   DEFAULT 'OPERADOR' NOT NULL,
    activo          NUMBER(1)      DEFAULT 1 NOT NULL,
    fecha_registro  TIMESTAMP      DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_tipo_usuario CHECK (tipo_usuario IN ('ADMIN','OPERADOR'))
);

CREATE SEQUENCE SEQ_USUARIOS START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE TRIGGER TRG_USUARIOS_ID
BEFORE INSERT ON USUARIOS
FOR EACH ROW
WHEN (NEW.id_usuario IS NULL)
BEGIN
    SELECT SEQ_USUARIOS.NEXTVAL INTO :NEW.id_usuario FROM DUAL;
END;
/

-- ---------------------------------------------------------------------
-- Seed: usuario administrador
--   email:    admin@sat.local
--   password: admin123     <- cambialo después con un ALTER en frío
--   hash BCrypt cost=10:   $2b$10$TG/0DkwPLaOpoRaTfcf6b.Ju0y7FLyBF/FDUcYJZ60KY2bzJrLBGC
-- ---------------------------------------------------------------------
INSERT INTO USUARIOS (email, password_hash, nombres, apellidos, tipo_usuario)
VALUES (
    'admin@sat.local',
    '$2b$10$TG/0DkwPLaOpoRaTfcf6b.Ju0y7FLyBF/FDUcYJZ60KY2bzJrLBGC',
    'Admin',
    'SAT',
    'ADMIN'
);

COMMIT;

-- ---------------------------------------------------------------------
-- Si ya corriste el script con el hash placeholder
-- ('REEMPLAZAR_CON_HASH_REAL'), aplicá este UPDATE una sola vez:
--
--   UPDATE USUARIOS
--      SET password_hash = '$2b$10$TG/0DkwPLaOpoRaTfcf6b.Ju0y7FLyBF/FDUcYJZ60KY2bzJrLBGC'
--    WHERE email = 'admin@sat.local';
--   COMMIT;
-- ---------------------------------------------------------------------

EXIT;
