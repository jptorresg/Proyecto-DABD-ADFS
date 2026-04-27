-- =============================================
-- BEDLY - Sistema de Gestión Hotelera
-- Script de creación de Base de Datos
-- SQL Server
-- Versión: Sesiones 1-4 (descuento B2B, datos completos usuario, logging, emails)
-- =============================================

CREATE DATABASE BedlyHoteles;
GO

USE BedlyHoteles;
GO

-- =============================================
-- TABLA: Usuario
-- (Sesión 3: agregadas columnas apellidos, edad, pais, pasaporte)
-- =============================================
CREATE TABLE Usuario (
    id_usuario      INT IDENTITY(1,1) PRIMARY KEY,
    nombre          NVARCHAR(100) NOT NULL,
    apellidos       NVARCHAR(100) NULL,
    email           NVARCHAR(100) NOT NULL UNIQUE,
    password_hash   NVARCHAR(255) NOT NULL,
    telefono        NVARCHAR(20),
    edad            INT NULL,
    pais            NVARCHAR(50) NULL,
    pasaporte       NVARCHAR(50) NULL,
    rol             NVARCHAR(20) NOT NULL DEFAULT 'cliente',
    activo          BIT NOT NULL DEFAULT 1,
    fecha_registro  DATETIME NOT NULL DEFAULT GETDATE()
);

-- =============================================
-- TABLA: Hoteles
-- =============================================
CREATE TABLE Hoteles (
    id_hotel             INT IDENTITY(1,1) PRIMARY KEY,
    nombre_hotel         NVARCHAR(100) NOT NULL,
    ubicacion            NVARCHAR(200),
    estrellas            INT DEFAULT 3,
    descripcion          NVARCHAR(500),
    url_api_base         NVARCHAR(200),
    porcentaje_descuento DECIMAL(5,2) DEFAULT 0,
    activo               BIT NOT NULL DEFAULT 1,
    api_key_hash         NVARCHAR(255),
    fecha_registro       DATETIME NOT NULL DEFAULT GETDATE()
);

CREATE INDEX IX_Hoteles_Ubicacion ON Hoteles(ubicacion);

-- =============================================
-- TABLA: Habitaciones
-- =============================================
CREATE TABLE Habitaciones (
    id_habitacion   INT IDENTITY(1,1) PRIMARY KEY,
    id_hotel        INT NOT NULL FOREIGN KEY REFERENCES Hoteles(id_hotel),
    num_habitacion  NVARCHAR(10) NOT NULL,
    tipo_habitacion NVARCHAR(50) NOT NULL,
    precio_noche    DECIMAL(10,2) NOT NULL,
    capacidad_max   INT NOT NULL DEFAULT 2,
    estado          NVARCHAR(20) NOT NULL DEFAULT 'Disponible',
    amenidades      NVARCHAR(500),
    descripcion     NVARCHAR(500),
    imagen_url      NVARCHAR(300)
);

-- =============================================
-- TABLA: Reservaciones
-- =============================================
CREATE TABLE Reservaciones (
    id_reservacion     INT IDENTITY(1,1) PRIMARY KEY,
    id_usuario         INT NOT NULL FOREIGN KEY REFERENCES Usuario(id_usuario),
    id_habitacion      INT NOT NULL FOREIGN KEY REFERENCES Habitaciones(id_habitacion),
    fecha_check_in     DATE NOT NULL,
    fecha_check_out    DATE NOT NULL,
    precio_total       DECIMAL(10,2) NOT NULL,
    estado             NVARCHAR(20) NOT NULL DEFAULT 'Pendiente',
    metodo_pago        NVARCHAR(50),
    fecha_reservacion  DATETIME NOT NULL DEFAULT GETDATE(),
    num_huespedes      INT DEFAULT 1,
    notas_especiales   NVARCHAR(500),
    datos_tarjeta_hash NVARCHAR(255)
);

-- =============================================
-- TABLA: Comentarios
-- =============================================
CREATE TABLE Comentarios (
    id_comentario       INT IDENTITY(1,1) PRIMARY KEY,
    id_usuario          INT NOT NULL FOREIGN KEY REFERENCES Usuario(id_usuario),
    id_habitacion       INT NOT NULL FOREIGN KEY REFERENCES Habitaciones(id_habitacion),
    rating              INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    texto               NVARCHAR(1000) NOT NULL,
    fecha_comentario    DATETIME NOT NULL DEFAULT GETDATE(),
    id_comentario_padre INT NULL
        FOREIGN KEY REFERENCES Comentarios(id_comentario)
);

-- =============================================
-- TABLA: LogsApi
-- (Sesión 4: usada por LoggingMiddleware)
-- =============================================
CREATE TABLE LogsApi (
    id_log        INT IDENTITY(1,1) PRIMARY KEY,
    metodo        NVARCHAR(10) NOT NULL,
    endpoint      NVARCHAR(200) NOT NULL,
    status_code   INT NOT NULL,
    request_body  NVARCHAR(MAX),
    response_body NVARCHAR(MAX),
    ip_origen     NVARCHAR(50),
    agencia_id    NVARCHAR(100),
    tiempo_ms     BIGINT DEFAULT 0,
    fecha_hora    DATETIME NOT NULL DEFAULT GETDATE()
);

-- =============================================
-- TABLA: EmailNotifications
-- (Sesión 4: notificaciones de cancelación al admin)
-- =============================================
CREATE TABLE EmailNotifications (
    id_email      INT IDENTITY(1,1) PRIMARY KEY,
    destinatario  NVARCHAR(150) NOT NULL,
    asunto        NVARCHAR(200) NOT NULL,
    cuerpo        NVARCHAR(MAX) NOT NULL,
    tipo_evento   NVARCHAR(50) NOT NULL,
    enviado       BIT NOT NULL DEFAULT 1,
    fecha_envio   DATETIME NOT NULL DEFAULT GETDATE(),
    metadata      NVARCHAR(MAX) NULL
);

-- =============================================
-- TABLA: Configuracion
-- =============================================
CREATE TABLE Configuracion (
    id_configuracion INT IDENTITY(1,1) PRIMARY KEY,
    clave            NVARCHAR(100) NOT NULL UNIQUE,
    valor            NVARCHAR(500) NOT NULL
);

-- =============================================
-- TABLA: Agencias
-- (Sesión 1: agregada columna porcentaje_descuento)
-- =============================================
CREATE TABLE Agencias (
    id_agencia           INT IDENTITY(1,1) PRIMARY KEY,
    nombre               NVARCHAR(100) NOT NULL,
    email                NVARCHAR(100) NOT NULL,
    token                NVARCHAR(255) NOT NULL,
    porcentaje_descuento DECIMAL(5,2) NOT NULL DEFAULT 0,
    activo               BIT NOT NULL DEFAULT 1,
    fecha_registro       DATETIME NOT NULL DEFAULT GETDATE()
);

-- =============================================
-- DATOS DE PRUEBA
-- =============================================

INSERT INTO Usuario (nombre, apellidos, email, password_hash, telefono, edad, pais, pasaporte, rol) VALUES
('Admin', 'Bedly', 'admin@bedly.com', '$2a$11$dummy_hash_here', '5012-3456', 35, 'Guatemala', '0000000000000', 'admin'),
('Juan', 'Pérez', 'juan@correo.com', '$2a$11$dummy_hash_here', '5098-7654', 28, 'Guatemala', '1234567890101', 'cliente'),
('María', 'García', 'maria@correo.com', '$2a$11$dummy_hash_here', '5055-5512', 32, 'México', 'AB1234567', 'cliente');

INSERT INTO Hoteles (nombre_hotel, ubicacion, estrellas, descripcion) VALUES
('Hotel Grand UNIS', 'Zona 10, Guatemala City', 5, 'Hotel de lujo en el corazón de la zona viva'),
('UNIS Central Hotel', 'Zona 1, Guatemala City', 4, 'Hotel céntrico con vistas históricas');

INSERT INTO Habitaciones (id_hotel, num_habitacion, tipo_habitacion, precio_noche, capacidad_max, estado, amenidades) VALUES
(1, '101', 'Sencilla',  380.00, 1, 'Disponible', 'WiFi,A/C,TV'),
(1, '201', 'Doble',     650.00, 2, 'Disponible', 'WiFi,A/C,TV,Desayuno'),
(1, '301', 'Suite',    1200.00, 2, 'Disponible', 'WiFi,A/C,TV,Desayuno,Piscina,Spa'),
(1, '401', 'Familiar', 1850.00, 4, 'Disponible', 'WiFi,A/C,TV,Desayuno,Piscina,Parking'),
(2, '101', 'Sencilla',  420.00, 1, 'Disponible', 'WiFi,A/C,TV'),
(2, '201', 'Doble',     700.00, 2, 'Disponible', 'WiFi,A/C,TV,Desayuno'),
(2, '301', 'Suite',    1350.00, 3, 'Disponible', 'WiFi,A/C,TV,Desayuno,Gym');

INSERT INTO Configuracion (clave, valor) VALUES
('fecha_cierre_ventas', '');

-- Agencia TravelNow (token fijo para que tu compañero lo configure en su .env)
INSERT INTO Agencias (nombre, email, token, porcentaje_descuento)
VALUES ('TravelNow', 'admin@travelnow.com', NEWID(), 10.00);

-- IMPORTANTE: Copia este token y úsalo en TravelNow
SELECT nombre, token, porcentaje_descuento
FROM Agencias
WHERE nombre = 'TravelNow';
GO