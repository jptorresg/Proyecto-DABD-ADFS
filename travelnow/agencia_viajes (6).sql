-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 29-04-2026 a las 03:31:34
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `agencia_viajes`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cache_destinos`
--

CREATE TABLE `cache_destinos` (
  `id_cache` int(11) NOT NULL,
  `id_proveedor` int(11) NOT NULL,
  `tipo` enum('origen','destino','ciudad') NOT NULL,
  `valor` varchar(200) NOT NULL,
  `codigo` varchar(10) DEFAULT NULL,
  `pais` varchar(100) DEFAULT NULL,
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `cache_destinos`
--

INSERT INTO `cache_destinos` (`id_cache`, `id_proveedor`, `tipo`, `valor`, `codigo`, `pais`, `fecha_actualizacion`) VALUES
(67, 2, 'ciudad', 'Zona 10, Guatemala City', NULL, NULL, '2026-04-28 16:00:01'),
(68, 2, 'ciudad', 'Antigua Guatemala', NULL, NULL, '2026-04-28 16:00:01'),
(69, 2, 'ciudad', 'Quetzaltenango', NULL, NULL, '2026-04-28 16:00:01'),
(70, 2, 'ciudad', 'México', NULL, NULL, '2026-04-28 16:00:01'),
(71, 2, 'ciudad', 'Flores, Petén', NULL, NULL, '2026-04-28 16:00:01'),
(72, 2, 'ciudad', 'Roma', NULL, NULL, '2026-04-28 16:00:01'),
(73, 2, 'ciudad', 'Paseo de la Reforma 250, CDMX', NULL, NULL, '2026-04-28 16:00:01'),
(74, 2, 'ciudad', 'Polanco, Ciudad de Mexico', NULL, NULL, '2026-04-28 16:00:01'),
(75, 2, 'ciudad', 'Centro Historico CDMX', NULL, NULL, '2026-04-28 16:00:01'),
(76, 2, 'ciudad', 'Ocean Drive, Miami Beach', NULL, NULL, '2026-04-28 16:00:01'),
(77, 2, 'ciudad', 'Brickell Avenue, Miami', NULL, NULL, '2026-04-28 16:00:01'),
(78, 2, 'ciudad', 'Downtown Miami', NULL, NULL, '2026-04-28 16:00:01'),
(79, 2, 'ciudad', 'Av. Larco, Miraflores, Lima', NULL, NULL, '2026-04-28 16:00:01'),
(80, 2, 'ciudad', 'San Isidro, Lima', NULL, NULL, '2026-04-28 16:00:01'),
(81, 2, 'ciudad', 'Barranco, Lima', NULL, NULL, '2026-04-28 16:00:01'),
(82, 2, 'ciudad', 'Zona Rosa, Bogota', NULL, NULL, '2026-04-28 16:00:01'),
(83, 2, 'ciudad', 'Usaquen, Bogota', NULL, NULL, '2026-04-28 16:00:01'),
(84, 2, 'ciudad', 'Centro Bogota', NULL, NULL, '2026-04-28 16:00:01'),
(85, 6, 'ciudad', 'Zona 10, Guatemala City', NULL, NULL, '2026-04-28 16:00:01'),
(86, 6, 'ciudad', 'Antigua Guatemala', NULL, NULL, '2026-04-28 16:00:01'),
(87, 6, 'ciudad', 'Quetzaltenango', NULL, NULL, '2026-04-28 16:00:01'),
(88, 6, 'ciudad', 'Escuintla', NULL, NULL, '2026-04-28 16:00:01'),
(89, 6, 'ciudad', 'Flores, Petén', NULL, NULL, '2026-04-28 16:00:01'),
(90, 6, 'ciudad', 'Paseo de la Reforma 250, CDMX', NULL, NULL, '2026-04-28 16:00:01'),
(91, 6, 'ciudad', 'Polanco, Ciudad de Mexico', NULL, NULL, '2026-04-28 16:00:01'),
(92, 6, 'ciudad', 'Centro Historico CDMX', NULL, NULL, '2026-04-28 16:00:01'),
(93, 6, 'ciudad', 'Ocean Drive, Miami Beach', NULL, NULL, '2026-04-28 16:00:01'),
(94, 6, 'ciudad', 'Brickell Avenue, Miami', NULL, NULL, '2026-04-28 16:00:01'),
(95, 6, 'ciudad', 'Downtown Miami', NULL, NULL, '2026-04-28 16:00:01'),
(96, 6, 'ciudad', 'Av. Larco, Miraflores, Lima', NULL, NULL, '2026-04-28 16:00:01'),
(97, 6, 'ciudad', 'San Isidro, Lima', NULL, NULL, '2026-04-28 16:00:01'),
(98, 6, 'ciudad', 'Barranco, Lima', NULL, NULL, '2026-04-28 16:00:01'),
(99, 6, 'ciudad', 'Zona Rosa, Bogota', NULL, NULL, '2026-04-28 16:00:01'),
(100, 6, 'ciudad', 'Usaquen, Bogota', NULL, NULL, '2026-04-28 16:00:01'),
(101, 6, 'ciudad', 'Centro Bogota', NULL, NULL, '2026-04-28 16:00:01');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cancelacion`
--

CREATE TABLE `cancelacion` (
  `id_cancelacion` int(11) NOT NULL,
  `id_reservacion` int(11) NOT NULL,
  `fecha_cancelacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `motivo` text DEFAULT NULL,
  `origen` enum('cliente','administrador','proveedor') DEFAULT 'cliente',
  `procesado_por` int(11) DEFAULT NULL,
  `estado_reembolso` enum('pendiente','procesado','rechazado') DEFAULT 'pendiente',
  `monto_reembolso` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `detalle_hotel`
--

CREATE TABLE `detalle_hotel` (
  `id_detalle` int(11) NOT NULL,
  `id_reservacion` int(11) NOT NULL,
  `id_proveedor` int(11) NOT NULL,
  `codigo_reserva_proveedor` varchar(100) NOT NULL,
  `codigo_hotel` varchar(50) DEFAULT NULL,
  `nombre_hotel` varchar(200) DEFAULT NULL,
  `ciudad` varchar(100) NOT NULL,
  `tipo_habitacion` varchar(100) DEFAULT 'doble',
  `fecha_checkin` date NOT NULL,
  `fecha_checkout` date NOT NULL,
  `num_huespedes` int(11) DEFAULT 1,
  `precio_por_noche_proveedor` decimal(10,2) DEFAULT NULL,
  `porcentaje_ganancia` decimal(5,2) DEFAULT 0.00,
  `precio_total` decimal(10,2) DEFAULT NULL,
  `datos_huesped` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`datos_huesped`)),
  `descuento_alianza` decimal(5,2) DEFAULT 0.00,
  `token_alianza` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `detalle_hotel`
--

INSERT INTO `detalle_hotel` (`id_detalle`, `id_reservacion`, `id_proveedor`, `codigo_reserva_proveedor`, `codigo_hotel`, `nombre_hotel`, `ciudad`, `tipo_habitacion`, `fecha_checkin`, `fecha_checkout`, `num_huespedes`, `precio_por_noche_proveedor`, `porcentaje_ganancia`, `precio_total`, `datos_huesped`, `descuento_alianza`, `token_alianza`) VALUES
(1, 6, 2, '23', NULL, 'Hotel Grand UNIS', 'Guatemala', 'penthouse', '2026-05-01', '2026-05-05', 2, 380.00, 10.00, 1702.40, NULL, 0.00, NULL),
(2, 7, 2, '24', NULL, '', 'Antigua Guatemala', 'doble', '2026-04-19', '2026-04-26', 2, 1649.99, 10.00, 11759.92, NULL, 0.00, NULL),
(3, 10, 2, '1', NULL, '', 'Zona 10, Guatemala City', 'doble', '2026-05-01', '2026-05-05', 1, 418.00, 10.00, 1839.20, NULL, 0.00, NULL),
(4, 11, 2, '2', NULL, '', 'Zona 10, Guatemala City', 'doble', '2030-10-01', '2030-10-15', 1, 715.00, 10.00, 11011.00, NULL, 0.00, NULL),
(5, 12, 2, '3', NULL, '', 'Zona 1, Guatemala City', 'doble', '2035-10-01', '2035-10-31', 1, 462.00, 10.00, 15246.00, NULL, 0.00, NULL),
(6, 13, 2, '4', NULL, '', 'Zona 10, Guatemala City', 'doble', '2026-05-08', '2026-05-09', 2, 1320.00, 10.00, 1452.00, NULL, 0.00, NULL),
(7, 16, 2, '5', NULL, '', 'Zona 1, Guatemala City', 'doble', '2026-05-04', '2026-05-10', 1, 770.00, 10.00, 5082.00, NULL, 0.00, NULL),
(8, 26, 2, '14', NULL, '', 'Zona 1, Guatemala City', 'doble', '2035-01-01', '2035-01-05', 1, 770.00, 10.00, 3388.00, NULL, 0.00, NULL),
(9, 27, 2, '15', NULL, '', 'Zona 10, Guatemala City', 'doble', '2031-01-01', '2031-01-04', 1, 2035.00, 10.00, 6715.50, NULL, 0.00, NULL),
(10, 28, 2, '28', NULL, '', 'Ocean Drive, Miami Beach', 'doble', '2026-05-26', '2026-05-27', 1, 495.00, 10.00, 544.50, NULL, 0.00, NULL),
(11, 30, 6, '28', NULL, '', 'Antigua Guatemala', 'doble', '2026-08-08', '2026-08-14', 1, 490.00, 40.00, 4116.00, NULL, 0.00, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `detalle_vuelo`
--

CREATE TABLE `detalle_vuelo` (
  `id_detalle` int(11) NOT NULL,
  `id_reservacion` int(11) NOT NULL,
  `id_proveedor` int(11) NOT NULL,
  `codigo_reserva_proveedor` varchar(100) NOT NULL,
  `codigo_vuelo` varchar(50) DEFAULT NULL,
  `origen` varchar(100) NOT NULL,
  `destino` varchar(100) NOT NULL,
  `fecha_salida` datetime NOT NULL,
  `fecha_llegada` datetime DEFAULT NULL,
  `tipo_vuelo` enum('directo','escala') DEFAULT 'directo',
  `tipo_asiento` enum('turista','business') DEFAULT 'turista',
  `num_pasajeros` int(11) DEFAULT 1,
  `precio_unitario_proveedor` decimal(10,2) DEFAULT NULL,
  `porcentaje_ganancia` decimal(5,2) DEFAULT 0.00,
  `precio_total` decimal(10,2) DEFAULT NULL,
  `es_regreso` tinyint(1) DEFAULT 0,
  `datos_pasajeros` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`datos_pasajeros`)),
  `datos_escala` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`datos_escala`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `detalle_vuelo`
--

INSERT INTO `detalle_vuelo` (`id_detalle`, `id_reservacion`, `id_proveedor`, `codigo_reserva_proveedor`, `codigo_vuelo`, `origen`, `destino`, `fecha_salida`, `fecha_llegada`, `tipo_vuelo`, `tipo_asiento`, `num_pasajeros`, `precio_unitario_proveedor`, `porcentaje_ganancia`, `precio_total`, `es_regreso`, `datos_pasajeros`, `datos_escala`) VALUES
(1, 14, 1, 'RES-N5GGYF2K', '', 'GUA', 'MEX', '2026-03-15 00:00:00', NULL, 'directo', 'turista', 1, 1375.00, 10.00, 1512.50, 0, '{\"pasajeros\":[{\"nombres\":\"Juan Pablo\",\"apellidos\":\"Torres García\",\"fecha_nacimiento\":\"2026-03-15\",\"id_nacionalidad\":83,\"num_pasaporte\":\"3014638910101\"}],\"tramos_proveedor\":[{\"idReservacion\":1,\"codigoReservacion\":\"RES-N5GGYF2K\",\"idVuelo\":6,\"idUsuario\":6,\"numPasajeros\":1,\"precioTotal\":1250,\"estado\":\"CONFIRMADA\",\"fechaCompra\":\"2026-04-22T19:19:09.676\",\"metodoPago\":\"AGENCIA\"}]}', NULL),
(2, 15, 1, 'RES-VKVUZO2F', '', 'GUA', 'MEX', '2026-03-15 00:00:00', NULL, 'directo', 'turista', 1, 1485.00, 10.00, 1633.50, 0, '{\"pasajeros\":[{\"nombres\":\"Juan Pablo\",\"apellidos\":\"Torres García\",\"fecha_nacimiento\":\"2005-03-15\",\"id_nacionalidad\":83,\"num_pasaporte\":\"3014638910101\"}],\"tramos_proveedor\":[{\"idReservacion\":2,\"codigoReservacion\":\"RES-VKVUZO2F\",\"idVuelo\":7,\"idUsuario\":6,\"numPasajeros\":1,\"precioTotal\":1350,\"estado\":\"CONFIRMADA\",\"fechaCompra\":\"2026-04-22T19:29:50.012\",\"metodoPago\":\"AGENCIA\"}]}', NULL),
(3, 17, 1, 'RES-7YXPTA8M', '', 'GUA', 'MEX', '2026-03-15 00:00:00', NULL, 'directo', 'turista', 1, 1375.00, 10.00, 1512.50, 0, '{\"pasajeros\":[{\"nombres\":\"Javier\",\"apellidos\":\"Hernandez\",\"fecha_nacimiento\":\"2005-10-11\",\"id_nacionalidad\":83,\"num_pasaporte\":\"A12345678\"}],\"tramos_proveedor\":[{\"idReservacion\":21,\"codigoReservacion\":\"RES-7YXPTA8M\",\"idVuelo\":6,\"idUsuario\":2,\"numPasajeros\":1,\"precioTotal\":1250,\"estado\":\"CONFIRMADA\",\"fechaCompra\":\"2026-04-23T20:03:18.896\",\"metodoPago\":\"AGENCIA\"}]}', NULL),
(4, 29, 1, 'RES-2AU8X681', '', 'GUA', 'ROM', '2026-04-29 00:00:00', NULL, 'directo', 'turista', 1, 6600.00, 10.00, 7260.00, 0, '{\"pasajeros\":[{\"nombres\":\"Javier\",\"apellidos\":\"Hernandez\",\"fecha_nacimiento\":\"2005-10-11\",\"id_nacionalidad\":83,\"num_pasaporte\":\"A12345678\"}],\"tramos_proveedor\":[{\"idReservacion\":45,\"codigoReservacion\":\"RES-2AU8X681\",\"idVuelo\":45,\"idUsuario\":1,\"numPasajeros\":1,\"precioTotal\":6000,\"estado\":\"CONFIRMADA\",\"fechaCompra\":\"2026-04-28T09:16:09.954\",\"metodoPago\":\"AGENCIA\"}]}', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `historial_busqueda`
--

CREATE TABLE `historial_busqueda` (
  `id_busqueda` int(11) NOT NULL,
  `id_usuario` int(11) DEFAULT NULL,
  `tipo_busqueda` varchar(20) NOT NULL,
  `origen_busqueda` varchar(20) NOT NULL,
  `origen` varchar(100) DEFAULT NULL,
  `destino` varchar(100) DEFAULT NULL,
  `ciudad` varchar(100) DEFAULT NULL,
  `fecha_inicio` date DEFAULT NULL,
  `fecha_fin` date DEFAULT NULL,
  `num_pasajeros` int(11) DEFAULT NULL,
  `fecha_busqueda` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `historial_busqueda`
--

INSERT INTO `historial_busqueda` (`id_busqueda`, `id_usuario`, `tipo_busqueda`, `origen_busqueda`, `origen`, `destino`, `ciudad`, `fecha_inicio`, `fecha_fin`, `num_pasajeros`, `fecha_busqueda`) VALUES
(1, 4, 'hotel', 'rest', NULL, NULL, 'Guatemala', '2026-05-01', '2026-05-05', 2, '2026-04-09 02:48:50'),
(2, 4, 'hotel', 'rest', NULL, NULL, 'Antigua Guatemala', '2029-01-01', '2029-01-31', 2, '2026-04-09 02:50:17'),
(3, 4, 'hotel', 'rest', NULL, NULL, 'Antigua Guatemala', '2030-01-09', '2030-01-31', 2, '2026-04-09 18:00:37'),
(4, 4, 'hotel', 'rest', NULL, NULL, 'Antigua Guatemala', '2030-01-09', '2030-01-31', 2, '2026-04-09 18:14:57'),
(5, 4, 'hotel', 'rest', NULL, NULL, 'Antigua Guatemala', '2030-01-09', '2030-01-31', 1, '2026-04-09 18:16:37'),
(6, 4, 'hotel', 'web', NULL, NULL, 'Guatemala City', '2026-05-15', '2026-05-18', 2, '2026-04-09 18:25:41'),
(7, 4, 'hotel', 'rest', NULL, NULL, 'Guatemala City', '2026-05-15', '2026-05-18', 2, '2026-04-09 18:27:32'),
(8, NULL, 'hotel', 'rest', NULL, NULL, 'Guatemala', '2026-05-01', '2026-05-05', 2, '2026-04-19 15:11:13'),
(9, 4, 'hotel', 'rest', NULL, NULL, 'Guatemala', '2026-04-19', '2026-04-26', 2, '2026-04-19 15:23:20'),
(10, 4, 'hotel', 'rest', NULL, NULL, 'Antigua Guatemala', '2026-04-19', '2026-04-30', 1, '2026-04-19 15:30:55'),
(11, 4, 'hotel', 'rest', NULL, NULL, 'Antigua Guatemala', '2026-04-19', '2026-04-30', 4, '2026-04-19 15:34:54'),
(12, 4, 'hotel', 'rest', NULL, NULL, 'Antigua Guatemala', '2026-04-19', '2026-04-30', 4, '2026-04-19 15:36:17'),
(13, 4, 'hotel', 'rest', NULL, NULL, 'Antigua Guatemala', '2026-04-19', '2026-04-30', 4, '2026-04-19 15:36:36'),
(14, 4, 'hotel', 'rest', NULL, NULL, 'Antigua Guatemala', '2026-04-19', '2026-04-30', 4, '2026-04-19 15:44:07'),
(15, 2, 'hotel', 'rest', NULL, NULL, 'Guatemala City', '2026-04-29', '2026-05-08', 2, '2026-04-19 16:43:17'),
(16, 2, 'hotel', 'rest', NULL, NULL, 'Guatemala City', '2026-04-29', '2026-05-08', 2, '2026-04-19 16:43:45'),
(17, 2, 'hotel', 'rest', NULL, NULL, 'Guatemala', '2026-04-29', '2026-05-08', 1, '2026-04-19 16:46:28'),
(18, 2, 'hotel', 'rest', NULL, NULL, 'Guatemala', '2026-04-29', '2026-05-08', 1, '2026-04-19 16:46:49'),
(19, 2, 'hotel', 'rest', NULL, NULL, 'Guatemala', '2026-04-29', '2026-05-08', 1, '2026-04-19 16:48:14'),
(20, NULL, 'hotel', 'rest', NULL, NULL, 'Guatemala', '2026-04-28', '2026-04-30', 2, '2026-04-19 17:42:02'),
(21, NULL, 'hotel', 'rest', NULL, NULL, 'Guatemala', '2026-04-28', '2026-04-30', 2, '2026-04-19 17:42:48'),
(22, NULL, 'hotel', 'rest', NULL, NULL, 'Guatemala', '2026-04-28', '2026-04-30', 2, '2026-04-19 17:42:55'),
(23, NULL, 'hotel', 'rest', NULL, NULL, 'Guatemala', '2026-04-28', '2026-04-30', 2, '2026-04-19 17:43:00'),
(24, NULL, 'hotel', 'rest', NULL, NULL, 'Guatemala', '2026-04-28', '2026-04-30', 2, '2026-04-19 17:43:21'),
(25, NULL, 'hotel', 'rest', NULL, NULL, 'Guatemala', '2026-04-28', '2026-04-30', 2, '2026-04-19 17:43:34'),
(26, NULL, 'hotel', 'rest', NULL, NULL, 'Guatemala City', '2026-08-17', '2026-08-28', 2, '2026-04-19 17:59:28'),
(27, NULL, 'hotel', 'rest', NULL, NULL, 'Guatemala City', '2026-08-17', '2026-08-28', 2, '2026-04-19 17:59:35'),
(28, NULL, 'hotel', 'rest', NULL, NULL, 'Guatemala City', '2026-08-17', '2026-08-28', 2, '2026-04-19 18:00:19'),
(29, NULL, 'hotel', 'rest', NULL, NULL, 'Guatemala City', '2026-08-17', '2026-08-28', 2, '2026-04-19 18:00:43'),
(30, NULL, 'hotel', 'rest', NULL, NULL, 'Guatemala City', '2026-08-17', '2026-08-28', 2, '2026-04-19 18:00:57'),
(31, NULL, 'hotel', 'rest', NULL, NULL, 'Zona 1, Guatemala City', '2026-04-30', '2026-05-06', 2, '2026-04-19 19:44:35'),
(32, NULL, 'hotel', 'rest', NULL, NULL, 'Zona 1, Guatemala City', '2026-04-30', '2026-05-06', 2, '2026-04-19 19:45:08'),
(33, NULL, 'hotel', 'rest', NULL, NULL, 'Zona 1, Guatemala City', '2026-04-30', '2026-05-06', 1, '2026-04-19 19:50:57'),
(34, 2, 'hotel', 'rest', NULL, NULL, 'Zona 1, Guatemala City', '2026-04-30', '2026-05-06', 1, '2026-04-19 19:55:35'),
(35, 2, 'hotel', 'rest', NULL, NULL, 'Zona 1, Guatemala City', '2026-04-30', '2026-05-06', 1, '2026-04-19 19:55:47'),
(36, 2, 'hotel', 'rest', NULL, NULL, 'Zona 1, Guatemala City', '2026-04-30', '2026-05-06', 1, '2026-04-19 19:56:03'),
(37, NULL, 'hotel', 'rest', NULL, NULL, 'Zona 1, Guatemala City', '2026-04-30', '2026-05-06', 1, '2026-04-19 21:52:27'),
(38, NULL, 'hotel', 'rest', NULL, NULL, 'Zona 1, Guatemala City', '2026-04-30', '2026-05-06', 1, '2026-04-19 21:52:29'),
(39, 2, 'hotel', 'rest', NULL, NULL, 'Zona 1, Guatemala City', '2026-04-30', '2026-05-06', 1, '2026-04-19 21:52:56'),
(40, NULL, 'hotel', 'rest', NULL, NULL, 'Guatemala', '2026-04-30', '2026-05-04', 1, '2026-04-20 10:31:53'),
(41, NULL, 'hotel', 'rest', NULL, NULL, 'Guatemala', '2026-04-30', '2026-05-02', 1, '2026-04-20 10:54:22'),
(42, NULL, 'hotel', 'rest', NULL, NULL, 'Guatemala', '2026-04-30', '2026-05-05', 1, '2026-04-20 11:04:35'),
(43, NULL, 'hotel', 'rest', NULL, NULL, 'Zona 1', '2026-05-01', '2026-05-05', 1, '2026-04-20 11:09:49'),
(44, NULL, 'hotel', 'rest', NULL, NULL, 'Guatemala', '2026-05-01', '2026-05-05', 1, '2026-04-20 11:13:38'),
(45, NULL, 'hotel', 'rest', NULL, NULL, 'Guatemala', '2026-05-01', '2026-05-05', 1, '2026-04-20 13:06:48'),
(46, NULL, 'hotel', 'rest', NULL, NULL, 'Guatemala', '2026-05-01', '2026-05-05', 1, '2026-04-20 13:38:22'),
(47, NULL, 'hotel', 'rest', NULL, NULL, 'Guatemala', '2026-05-01', '2026-05-05', 1, '2026-04-20 13:40:20'),
(48, NULL, 'hotel', 'rest', NULL, NULL, 'Guatemala', '2026-05-01', '2026-05-05', 1, '2026-04-20 13:41:34'),
(49, 2, 'hotel', 'rest', NULL, NULL, 'Guatemala', '2026-05-01', '2026-05-05', 1, '2026-04-20 17:59:15'),
(50, 2, 'hotel', 'rest', NULL, NULL, 'Guatemala', '2030-10-01', '2030-10-15', 1, '2026-04-21 07:41:41'),
(51, NULL, 'vuelo', 'rest', 'GUATEMALA', 'MIAMI', NULL, '2026-05-08', '2026-05-21', 1, '2026-04-21 11:17:01'),
(52, NULL, 'vuelo', 'rest', 'GUA', 'MEX', NULL, '2026-03-15', NULL, 1, '2026-04-21 17:43:56'),
(53, NULL, 'vuelo', 'rest', 'GUA', 'MEX', NULL, '2026-03-15', NULL, 1, '2026-04-21 18:00:58'),
(54, NULL, 'vuelo', 'rest', 'GUA', 'MEX', NULL, '2026-03-15', NULL, 1, '2026-04-21 18:02:05'),
(55, NULL, 'vuelo', 'rest', 'GUA', 'MEX', NULL, '2026-03-15', NULL, 1, '2026-04-21 18:02:19'),
(56, NULL, 'vuelo', 'rest', 'GUA', 'MEX', NULL, '2026-03-15', NULL, 1, '2026-04-21 18:02:36'),
(57, NULL, 'vuelo', 'rest', 'GUATEMALA', 'MEXICO', NULL, '2026-03-15', NULL, 1, '2026-04-21 18:04:01'),
(58, NULL, 'vuelo', 'rest', 'GUA', 'MEX', NULL, '2026-03-15', NULL, 1, '2026-04-21 18:04:21'),
(59, NULL, 'vuelo', 'rest', 'GUA', 'MEX', NULL, '2026-03-15', NULL, 1, '2026-04-21 18:04:47'),
(60, NULL, 'vuelo', 'rest', 'GUA', 'MEX', NULL, '2026-03-15', NULL, 1, '2026-04-21 18:05:07'),
(61, NULL, 'hotel', 'rest', NULL, NULL, 'Guatemala', '2035-10-01', '2035-10-31', 1, '2026-04-21 18:07:33'),
(62, NULL, 'hotel', 'rest', NULL, NULL, 'Guatemala', '2035-10-01', '2035-10-31', 2, '2026-04-21 18:11:32'),
(63, 2, 'hotel', 'rest', NULL, NULL, 'Guatemala', '2035-10-01', '2035-10-31', 1, '2026-04-21 18:12:38'),
(64, 2, 'vuelo', 'rest', 'GUA', 'MEX', NULL, '2026-03-15', NULL, 1, '2026-04-21 18:18:52'),
(65, 2, 'vuelo', 'rest', 'GUA', 'MEX', NULL, '2026-03-15', NULL, 1, '2026-04-21 18:19:31'),
(66, 2, 'vuelo', 'rest', 'GUA', 'MEX', NULL, '2026-03-15', NULL, 1, '2026-04-21 18:27:25'),
(67, 2, 'vuelo', 'rest', 'GUA', 'MEX', NULL, '2026-03-15', '2026-03-17', 1, '2026-04-21 18:27:57'),
(68, 2, 'vuelo', 'rest', 'GUA', 'MEX', NULL, '2026-03-15', '2026-03-17', 1, '2026-04-21 18:28:01'),
(69, NULL, 'vuelo', 'rest', 'GUA', 'MEX', NULL, '2026-03-15', NULL, 1, '2026-04-21 18:33:30'),
(70, NULL, 'vuelo', 'rest', 'MEX', 'GUA', NULL, '2026-03-22', NULL, 1, '2026-04-21 18:34:21'),
(71, NULL, 'vuelo', 'rest', 'GUA', 'MEX', NULL, '2026-03-15', NULL, 1, '2026-04-21 18:44:58'),
(72, NULL, 'vuelo', 'rest', 'GUA', 'MEX', NULL, '2026-03-15', NULL, 1, '2026-04-21 18:45:52'),
(73, NULL, 'hotel', 'rest', NULL, NULL, 'Guatemala', '2026-05-01', '2026-05-14', 1, '2026-04-21 18:55:55'),
(74, NULL, 'hotel', 'rest', NULL, NULL, 'Guatemala', '2026-05-01', '2026-05-21', 1, '2026-04-21 18:56:55'),
(75, NULL, 'hotel', 'rest', NULL, NULL, 'Guatemala', '2026-05-01', '2026-05-21', 2, '2026-04-21 18:57:10'),
(76, 2, 'hotel', 'rest', NULL, NULL, 'Guatemala', '2026-05-08', '2026-05-09', 2, '2026-04-21 18:58:38'),
(77, 6, 'vuelo', 'rest', 'GUA', 'MEX', NULL, '2026-03-15', NULL, 1, '2026-04-22 19:14:24'),
(78, 6, 'vuelo', 'rest', 'GUA', 'MEX', NULL, '2026-03-15', NULL, 1, '2026-04-22 19:28:35'),
(79, NULL, 'hotel', 'rest', NULL, NULL, 'Guatemala', '2026-05-08', '2026-05-09', 1, '2026-04-23 17:08:14'),
(80, NULL, 'hotel', 'rest', NULL, NULL, 'Guatemala', '2026-05-07', '2026-05-09', 1, '2026-04-23 17:09:46'),
(81, 2, 'hotel', 'rest', NULL, NULL, 'Guatemala', '2026-05-04', '2026-05-10', 1, '2026-04-23 19:56:29'),
(82, 2, 'vuelo', 'rest', 'GUA', 'MEX', NULL, '2026-03-15', NULL, 1, '2026-04-23 20:02:21'),
(83, NULL, 'hotel', 'rest', NULL, NULL, 'Guatemala', '2026-05-12', '2026-05-22', 1, '2026-04-24 06:56:31'),
(84, NULL, 'hotel', 'rest', NULL, NULL, 'Guatemala', '2026-05-12', '2026-05-22', 1, '2026-04-24 06:59:42'),
(85, NULL, 'hotel', 'rest', NULL, NULL, 'Guatemala', '2026-05-19', '2026-05-22', 1, '2026-04-24 07:00:31'),
(86, NULL, 'hotel', 'rest', NULL, NULL, 'Guatemala', '2026-05-25', '2026-05-28', 1, '2026-04-24 07:56:05'),
(87, 6, 'hotel', 'web', NULL, NULL, 'Guatemala', '2026-05-22', '2026-05-30', 1, '2026-04-25 10:25:36'),
(88, 6, 'hotel', 'web', NULL, NULL, 'Guatemala', '2035-11-01', '2035-11-30', 1, '2026-04-25 10:32:31'),
(89, 6, 'hotel', 'web', NULL, NULL, 'Guatemala', '2030-01-01', '2030-01-30', 1, '2026-04-25 10:45:59'),
(90, 6, 'hotel', 'web', NULL, NULL, 'Guatemala', '2030-01-01', '2030-01-05', 1, '2026-04-25 11:08:55'),
(91, 6, 'hotel', 'web', NULL, NULL, 'Guatemala', '2035-01-01', '2035-01-05', 1, '2026-04-25 11:17:54'),
(92, 6, 'hotel', 'web', NULL, NULL, 'Guatemala', '2031-01-01', '2031-01-04', 1, '2026-04-25 11:19:02'),
(93, 2, 'vuelo', 'web', 'MEX', 'GUA', NULL, '2032-05-04', '2032-05-07', 2, '2026-04-27 13:49:34'),
(94, 2, 'hotel', 'web', NULL, NULL, 'GUA', '2032-05-04', '2032-05-07', 2, '2026-04-27 13:49:34'),
(95, 2, 'vuelo', 'web', 'MEX', 'GUA', NULL, '2026-04-29', '2026-05-08', 1, '2026-04-27 13:57:04'),
(96, 2, 'hotel', 'web', NULL, NULL, 'GUA', '2026-04-29', '2026-05-08', 1, '2026-04-27 13:57:04'),
(97, 2, 'vuelo', 'web', 'MÉXICO', 'GUATEMALA', NULL, '2026-04-29', '2026-05-08', 1, '2026-04-27 13:57:48'),
(98, 2, 'hotel', 'web', NULL, NULL, 'Guatemala', '2026-04-29', '2026-05-08', 1, '2026-04-27 13:57:48'),
(99, 2, 'vuelo', 'web', 'MÉXICO', 'GUATEMALA', NULL, '2026-04-29', NULL, 1, '2026-04-27 13:58:32'),
(100, 2, 'vuelo', 'web', 'MÉXICO', 'GUATEMALA', NULL, '2026-04-29', NULL, 1, '2026-04-27 13:58:35'),
(101, 2, 'vuelo', 'web', 'MEX', 'GUA', NULL, '2026-04-29', NULL, 1, '2026-04-27 13:58:45'),
(102, 2, 'hotel', 'web', NULL, NULL, 'GUATEMALA', '2026-12-29', '2027-01-01', 1, '2026-04-27 13:59:13'),
(103, 2, 'hotel', 'web', NULL, NULL, 'Guatemala', '2026-12-29', '2027-01-01', 1, '2026-04-27 13:59:20'),
(104, 2, 'hotel', 'web', NULL, NULL, 'Guatemala', '2026-12-29', '2027-01-01', 1, '2026-04-27 13:59:23'),
(105, NULL, 'hotel', 'web', NULL, NULL, 'Guatemala', '2026-11-25', '2026-11-27', 1, '2026-04-27 18:05:52'),
(106, NULL, 'hotel', 'web', NULL, NULL, 'Guatemala', '2026-11-24', '2026-11-27', 1, '2026-04-27 18:07:05'),
(107, 2, 'hotel', 'web', NULL, NULL, 'Guatemala', '2026-09-13', '2026-09-16', 1, '2026-04-27 18:09:06'),
(108, 2, 'hotel', 'web', NULL, NULL, 'Guatemala', '2034-10-15', '2034-10-18', 1, '2026-04-27 18:09:54'),
(109, 2, 'hotel', 'web', NULL, NULL, 'Guatemala', '2034-10-15', '2034-10-18', 1, '2026-04-27 18:10:50'),
(110, 2, 'hotel', 'web', NULL, NULL, 'Guatemala', '2028-09-15', '2028-09-18', 1, '2026-04-27 18:22:51'),
(111, 2, 'hotel', 'web', NULL, NULL, 'Guatemala', '2029-09-15', '2029-09-19', 1, '2026-04-27 18:24:54'),
(112, 2, 'hotel', 'web', NULL, NULL, 'Guatemala', '2029-09-15', '2029-09-19', 1, '2026-04-27 18:24:56'),
(113, 2, 'hotel', 'web', NULL, NULL, 'Guatemala', '2028-09-15', '2029-09-19', 1, '2026-04-27 18:25:38'),
(114, 2, 'hotel', 'web', NULL, NULL, 'Guatemala', '2031-04-19', '2031-04-24', 1, '2026-04-27 18:29:28'),
(115, 2, 'hotel', 'web', NULL, NULL, 'Guatemala', '2031-04-19', '2031-04-24', 1, '2026-04-27 18:30:04'),
(116, 2, 'hotel', 'web', NULL, NULL, 'Guatemala City', '2034-10-24', '2034-10-28', 1, '2026-04-27 18:37:52'),
(117, 2, 'hotel', 'web', NULL, NULL, 'Guatemala', '2027-10-11', '2027-10-15', 1, '2026-04-27 18:42:05'),
(118, 2, 'hotel', 'web', NULL, NULL, 'Guatemala', '2027-10-11', '2027-10-15', 1, '2026-04-27 18:42:08'),
(119, 2, 'vuelo', 'web', 'MEX', 'GUA', NULL, '2026-04-29', NULL, 1, '2026-04-27 18:44:25'),
(120, 2, 'hotel', 'web', NULL, NULL, 'Guatemala', '2027-10-24', '2027-10-26', 1, '2026-04-27 18:49:08'),
(121, 2, 'hotel', 'web', NULL, NULL, 'Guatemala', '2031-12-05', '2031-12-10', 1, '2026-04-27 18:55:00'),
(122, 2, 'hotel', 'web', NULL, NULL, 'Guatemala', '2031-12-25', '2031-12-31', 1, '2026-04-27 19:07:27'),
(123, 2, 'hotel', 'web', NULL, NULL, 'Guatemala', '2031-12-25', '2031-12-31', 1, '2026-04-27 19:08:10'),
(124, NULL, 'vuelo', 'web', 'MEX', 'GUA', NULL, '2026-04-24', NULL, 1, '2026-04-28 02:35:28'),
(125, NULL, 'vuelo', 'web', 'GUA', 'MEX', NULL, '2026-05-03', NULL, 2, '2026-04-28 02:36:25'),
(126, NULL, 'vuelo', 'web', 'MEXICO', 'GUATEMALA', NULL, '2026-04-29', '2026-04-29', 1, '2026-04-28 02:37:16'),
(127, NULL, 'hotel', 'web', NULL, NULL, 'Guatemala', '2026-04-29', '2026-04-29', 1, '2026-04-28 02:37:16'),
(128, 2, 'vuelo', 'web', 'MEX', 'GUA', NULL, '2026-04-29', '2026-04-29', 1, '2026-04-28 02:40:09'),
(129, 2, 'hotel', 'web', NULL, NULL, 'GUA', '2026-04-29', '2026-04-29', 1, '2026-04-28 02:40:09'),
(130, 2, 'vuelo', 'web', 'MEX', 'GUA', NULL, '2026-04-29', '2026-04-29', 1, '2026-04-28 03:37:16'),
(131, 2, 'hotel', 'web', NULL, NULL, 'GUA', '2026-04-29', '2026-04-29', 1, '2026-04-28 03:37:16'),
(132, 2, 'vuelo', 'web', 'MEX', 'GUA', NULL, '2026-04-29', '2026-04-29', 1, '2026-04-28 03:44:36'),
(133, 2, 'hotel', 'web', NULL, NULL, 'GUA', '2026-04-29', '2026-04-29', 1, '2026-04-28 03:44:36'),
(134, 2, 'hotel', 'web', NULL, NULL, 'Guatemala', '2026-12-10', '2026-12-15', 1, '2026-04-28 04:05:25'),
(135, 2, 'hotel', 'web', NULL, NULL, 'Guatemala', '2026-12-10', '2027-12-15', 1, '2026-04-28 04:06:02'),
(136, 2, 'hotel', 'web', NULL, NULL, 'Antigua Guatemala', '2026-12-10', '2027-12-15', 1, '2026-04-28 04:06:15'),
(137, 2, 'hotel', 'web', NULL, NULL, 'Guatemala', '2034-12-31', '2035-01-05', 1, '2026-04-28 07:15:32'),
(138, 2, 'hotel', 'web', NULL, NULL, 'Guatemala', '2036-12-31', '2037-01-05', 1, '2026-04-28 07:17:02'),
(139, 2, 'hotel', 'web', NULL, NULL, 'Guatemala', '2036-12-31', '2037-01-05', 1, '2026-04-28 07:17:04'),
(140, 2, 'hotel', 'web', NULL, NULL, 'Guatemala', '2036-12-31', '2037-01-05', 1, '2026-04-28 07:17:05'),
(141, 2, 'hotel', 'web', NULL, NULL, 'Guatemala', '2036-12-31', '2037-01-05', 1, '2026-04-28 07:19:36'),
(142, 2, 'hotel', 'web', NULL, NULL, 'Guatemala', '2036-12-31', '2037-01-05', 1, '2026-04-28 07:19:38'),
(143, 2, 'hotel', 'web', NULL, NULL, 'Guatemala', '2036-12-31', '2037-01-05', 1, '2026-04-28 07:19:39'),
(144, 2, 'hotel', 'web', NULL, NULL, 'Guatemala', '2037-01-31', '2037-02-05', 1, '2026-04-28 07:22:20'),
(145, NULL, 'hotel', 'web', NULL, NULL, 'Guatemala', '2026-05-26', '2026-05-27', 1, '2026-04-28 07:24:58'),
(146, 2, 'hotel', 'web', NULL, NULL, 'Miami', '2026-05-26', '2026-05-27', 1, '2026-04-28 07:26:03'),
(147, 2, 'vuelo', 'web', 'GUA', 'ROM', NULL, '2026-04-29', NULL, 1, '2026-04-28 09:09:42'),
(148, 2, 'vuelo', 'web', 'GUA', 'ROM', NULL, '2026-04-29', NULL, 1, '2026-04-28 09:11:57'),
(149, 2, 'vuelo', 'web', 'GUA', 'ROM', NULL, '2026-04-29', '2026-05-11', 1, '2026-04-28 09:14:59'),
(150, 2, 'vuelo', 'web', 'GUA', 'ROM', NULL, '2026-05-31', NULL, 1, '2026-04-28 09:17:47'),
(151, 2, 'vuelo', 'web', 'GUA', 'ROM', NULL, '2026-04-29', NULL, 1, '2026-04-28 09:20:22'),
(152, NULL, 'vuelo', 'web', 'GUA', 'ROM', NULL, '2026-04-29', NULL, 1, '2026-04-28 09:22:41'),
(153, NULL, 'hotel', 'web', NULL, NULL, 'Guatemala', '2026-08-08', '2026-08-10', 1, '2026-04-28 09:35:20'),
(154, 2, 'hotel', 'web', NULL, NULL, 'Guatemala', '2026-08-08', '2026-02-14', 1, '2026-04-28 09:37:10'),
(155, 2, 'hotel', 'web', NULL, NULL, 'Guatemala', '2026-08-08', '2026-02-14', 1, '2026-04-28 09:37:12'),
(156, 2, 'hotel', 'web', NULL, NULL, 'Guatemala', '2026-08-08', '2026-08-14', 1, '2026-04-28 09:37:19');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `notificacion_proveedor`
--

CREATE TABLE `notificacion_proveedor` (
  `id_notificacion` int(11) NOT NULL,
  `id_proveedor` int(11) DEFAULT NULL,
  `codigo_reserva_proveedor` varchar(100) DEFAULT NULL,
  `id_reservacion` int(11) DEFAULT NULL,
  `tipo_cambio` enum('cancelacion','modificacion','otro') NOT NULL,
  `detalle` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`detalle`)),
  `fecha_recibida` timestamp NOT NULL DEFAULT current_timestamp(),
  `procesada` tinyint(1) DEFAULT 0,
  `correo_enviado` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `proveedor`
--

CREATE TABLE `proveedor` (
  `id_proveedor` int(11) NOT NULL,
  `nombre` varchar(200) NOT NULL,
  `tipo` enum('aerolinea','hotel') NOT NULL,
  `endpoint_api` varchar(500) DEFAULT NULL,
  `api_usuario` varchar(100) DEFAULT NULL,
  `api_password` varchar(255) DEFAULT NULL,
  `porcentaje_ganancia` decimal(5,2) DEFAULT 0.00,
  `descripcion` text DEFAULT NULL,
  `pais` varchar(100) DEFAULT NULL,
  `estado` enum('activo','inactivo') DEFAULT 'activo',
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `proveedor`
--

INSERT INTO `proveedor` (`id_proveedor`, `nombre`, `tipo`, `endpoint_api`, `api_usuario`, `api_password`, `porcentaje_ganancia`, `descripcion`, `pais`, `estado`, `fecha_registro`) VALUES
(1, 'Aerolíneas Halcón', 'aerolinea', 'http://localhost:8080/aerolineas', 'admin@halcon.com', '', 10.00, NULL, 'Guatemala', 'activo', '2026-04-06 19:07:35'),
(2, 'BedlyHoteles', 'hotel', 'http://localhost:5043', 'admin@bedly.com', '82A1629B-F583-430C-AC52-661ABC860E4A ', 10.00, NULL, 'Guatemala', 'activo', '2026-04-08 21:59:58'),
(4, 'AERO2', 'aerolinea', 'http://localhost:8081/aerolineas', 'admin@halcon.com', NULL, 5.00, NULL, 'Colombia', 'activo', '2026-04-28 15:02:30'),
(5, 'AERO3', 'aerolinea', 'http://localhost:8082/aerolineas', 'admin@halcon.com', '', 15.00, NULL, 'Costa Rica', 'activo', '2026-04-28 15:03:04'),
(6, 'HOTELITO', 'hotel', 'http://localhost:5044', 'admin@bedly.com', '82A1629B-F583-430C-AC52-661ABC860E4A', 40.00, NULL, 'Japón', 'activo', '2026-04-28 15:04:35');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `reservacion`
--

CREATE TABLE `reservacion` (
  `id_reservacion` int(11) NOT NULL,
  `codigo_reserva` varchar(50) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `tipo` enum('vuelo','hotel','paquete') NOT NULL,
  `fecha_reserva` timestamp NOT NULL DEFAULT current_timestamp(),
  `total` decimal(10,2) NOT NULL,
  `moneda` varchar(10) DEFAULT 'USD',
  `estado` enum('confirmada','pendiente','cancelada','completada') DEFAULT 'confirmada',
  `metodo_pago` varchar(50) DEFAULT NULL,
  `datos_cobro` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`datos_cobro`)),
  `comprobante_pdf` varchar(255) DEFAULT NULL,
  `notas` text DEFAULT NULL,
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `reservacion`
--

INSERT INTO `reservacion` (`id_reservacion`, `codigo_reserva`, `id_usuario`, `tipo`, `fecha_reserva`, `total`, `moneda`, `estado`, `metodo_pago`, `datos_cobro`, `comprobante_pdf`, `notas`, `fecha_actualizacion`) VALUES
(1, 'TN-20260409-DF9B62', 4, 'vuelo', '2026-04-09 07:34:54', 0.00, 'USD', 'confirmada', 'tarjeta_debito', '{\"metodo\":\"tarjeta_debito\",\"titular\":\"Jose Rueda\"}', 'public\\comprobantes\\reserva-TN-20260409-DF9B62.pdf', NULL, '2026-04-09 07:34:54'),
(2, 'TN-20260409-DC4A85', 4, 'vuelo', '2026-04-09 08:08:53', 0.00, 'USD', 'confirmada', 'tarjeta_credito', '{\"metodo\":\"tarjeta_credito\",\"titular\":\"Jose\"}', 'public\\comprobantes\\reserva-TN-20260409-DC4A85.pdf', NULL, '2026-04-09 08:08:53'),
(3, 'TN-20260409-CC871D', 4, 'vuelo', '2026-04-09 08:29:50', 0.00, 'USD', 'confirmada', 'tarjeta_credito', '{\"metodo\":\"tarjeta_credito\",\"titular\":\"Jose\"}', 'public\\comprobantes\\reserva-TN-20260409-CC871D.pdf', NULL, '2026-04-09 08:29:50'),
(4, 'TN-20260409-7FFD50', 4, 'vuelo', '2026-04-09 08:37:20', 0.00, 'USD', 'confirmada', 'tarjeta_credito', '{\"metodo\":\"tarjeta_credito\",\"titular\":\"Jose\"}', 'public\\comprobantes\\reserva-TN-20260409-7FFD50.pdf', NULL, '2026-04-09 08:37:20'),
(5, 'TN-20260409-72FC97', 4, 'vuelo', '2026-04-09 08:53:09', 0.00, 'USD', 'confirmada', 'tarjeta_debito', '{\"metodo\":\"tarjeta_debito\",\"titular\":\"Jose\"}', 'public\\comprobantes\\reserva-TN-20260409-72FC97.pdf', NULL, '2026-04-09 08:53:09'),
(6, 'TN-20260419-68F059', 4, 'hotel', '2026-04-19 21:15:34', 1702.40, 'USD', 'confirmada', 'transferencia', '{\"titular\":\"Jose Rueda\"}', 'public\\comprobantes\\reserva-TN-20260419-68F059.pdf', NULL, '2026-04-19 21:15:34'),
(7, 'TN-20260419-147362', 4, 'hotel', '2026-04-19 21:24:48', 11759.92, 'USD', 'confirmada', 'tarjeta_credito', '{\"metodo\":\"tarjeta_credito\",\"titular\":\"Jose Rueda\"}', 'public\\comprobantes\\reserva-TN-20260419-147362.pdf', NULL, '2026-04-19 21:24:48'),
(8, 'TN-20260419-82F68A', 4, 'vuelo', '2026-04-19 21:33:58', 0.00, 'USD', 'confirmada', 'tarjeta_credito', '{\"metodo\":\"tarjeta_credito\",\"titular\":\"Pablo Gomez\"}', 'public\\comprobantes\\reserva-TN-20260419-82F68A.pdf', NULL, '2026-04-19 21:33:58'),
(9, 'TN-20260419-F67371', 4, 'vuelo', '2026-04-19 21:45:58', 0.00, 'USD', 'confirmada', 'tarjeta_credito', '{\"metodo\":\"tarjeta_credito\",\"titular\":\"Jose Rueda\"}', 'public\\comprobantes\\reserva-TN-20260419-F67371.pdf', NULL, '2026-04-19 21:45:58'),
(10, 'TN-20260421-A6C68E', 2, 'hotel', '2026-04-21 00:01:11', 2059.90, 'USD', 'confirmada', 'tarjeta_credito', '{\"metodo\":\"tarjeta_credito\",\"titular\":\"Javier\"}', 'public\\comprobantes\\reserva-TN-20260421-A6C68E.pdf', NULL, '2026-04-21 00:01:12'),
(11, 'TN-20260421-721B11', 2, 'hotel', '2026-04-21 13:42:58', 12332.32, 'USD', 'confirmada', 'tarjeta_credito', '{\"metodo\":\"tarjeta_credito\",\"titular\":\"Javier\"}', 'public\\comprobantes\\reserva-TN-20260421-721B11.pdf', NULL, '2026-04-21 13:42:59'),
(12, 'TN-20260422-A424BD', 2, 'hotel', '2026-04-22 00:13:41', 17075.52, 'USD', 'confirmada', 'tarjeta_credito', '{\"metodo\":\"tarjeta_credito\",\"titular\":\"Javier\"}', 'public\\comprobantes\\reserva-TN-20260422-A424BD.pdf', NULL, '2026-04-22 00:13:42'),
(13, 'TN-20260422-FEE828', 2, 'hotel', '2026-04-22 01:00:04', 1626.24, 'USD', 'confirmada', 'tarjeta_credito', '{\"metodo\":\"tarjeta_credito\",\"titular\":\"Javier\"}', 'public\\comprobantes\\reserva-TN-20260422-FEE828.pdf', NULL, '2026-04-22 01:00:05'),
(14, 'TN-20260423-02A4E0', 6, 'vuelo', '2026-04-23 01:19:06', 1694.00, 'USD', 'confirmada', 'tarjeta_credito', '{\"metodo\":\"tarjeta_credito\",\"titular\":\"JUAN PABLO TORRES\"}', 'public\\comprobantes\\reserva-TN-20260423-02A4E0.pdf', NULL, '2026-04-23 01:19:10'),
(15, 'TN-20260423-D0826F', 6, 'vuelo', '2026-04-23 01:29:49', 1829.52, 'USD', 'confirmada', 'tarjeta_credito', '{\"metodo\":\"tarjeta_credito\",\"titular\":\"JUAN PABLO TORRES\"}', 'public\\comprobantes\\reserva-TN-20260423-D0826F.pdf', NULL, '2026-04-23 01:29:50'),
(16, 'TN-20260424-E89A24', 2, 'hotel', '2026-04-24 01:58:37', 5691.84, 'USD', 'cancelada', 'tarjeta_credito', '{\"metodo\":\"tarjeta_credito\",\"titular\":\"Javier\"}', 'public\\comprobantes\\reserva-TN-20260424-E89A24.pdf', NULL, '2026-04-25 15:22:22'),
(17, 'TN-20260424-5C5C16', 2, 'vuelo', '2026-04-24 02:03:18', 1694.00, 'USD', 'confirmada', 'tarjeta_credito', '{\"metodo\":\"tarjeta_credito\",\"titular\":\"JUAN PABLO TORRES\"}', 'public\\comprobantes\\reserva-TN-20260424-5C5C16.pdf', NULL, '2026-04-24 02:03:19'),
(26, 'TN-20260425-260485', 6, 'hotel', '2026-04-25 17:18:05', 3794.56, 'USD', 'confirmada', 'tarjeta_credito', '{\"metodo\":\"tarjeta_credito\",\"titular\":\"Juan\"}', 'public\\comprobantes\\reserva-TN-20260425-260485.pdf', NULL, '2026-04-25 17:18:07'),
(27, 'TN-20260425-DAEEC1', 6, 'hotel', '2026-04-25 17:19:15', 7521.36, 'USD', 'confirmada', 'tarjeta_credito', '{\"metodo\":\"tarjeta_credito\",\"titular\":\"Juan\"}', 'public\\comprobantes\\reserva-TN-20260425-DAEEC1.pdf', NULL, '2026-04-25 17:19:15'),
(28, 'TN-20260428-B9FAB5', 2, 'hotel', '2026-04-28 13:27:20', 609.84, 'USD', 'confirmada', 'tarjeta_credito', '{\"metodo\":\"tarjeta_credito\",\"titular\":\"Javier Hernandez\"}', 'public\\comprobantes\\reserva-TN-20260428-B9FAB5.pdf', NULL, '2026-04-28 13:27:20'),
(29, 'TN-20260428-F82411', 2, 'vuelo', '2026-04-28 15:16:09', 8131.20, 'USD', 'cancelada', 'tarjeta_credito', '{\"metodo\":\"tarjeta_credito\",\"titular\":\"Javier\"}', 'public\\comprobantes\\reserva-TN-20260428-F82411.pdf', NULL, '2026-04-28 15:49:02'),
(30, 'TN-20260428-80247F', 2, 'hotel', '2026-04-28 15:38:08', 4609.92, 'USD', 'cancelada', 'tarjeta_credito', '{\"metodo\":\"tarjeta_credito\",\"titular\":\"Javier\"}', 'public\\comprobantes\\reserva-TN-20260428-80247F.pdf', NULL, '2026-04-28 15:45:45');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuario`
--

CREATE TABLE `usuario` (
  `id_usuario` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `correo` varchar(150) NOT NULL,
  `contrasena` varchar(255) NOT NULL,
  `fecha_nacimiento` date NOT NULL,
  `pais_origen` varchar(100) DEFAULT NULL,
  `nacionalidad` varchar(100) DEFAULT NULL,
  `numero_pasaporte` varchar(50) DEFAULT NULL,
  `rol` enum('usuario','administrador','webservice') DEFAULT 'usuario',
  `estado` enum('activo','inactivo','bloqueado') DEFAULT 'activo',
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `usuario`
--

INSERT INTO `usuario` (`id_usuario`, `nombre`, `apellido`, `correo`, `contrasena`, `fecha_nacimiento`, `pais_origen`, `nacionalidad`, `numero_pasaporte`, `rol`, `estado`, `fecha_registro`) VALUES
(1, 'Admin', 'Sistema', 'admin@travelnow.com', 'Admin123!', '1990-01-01', 'Guatemala', NULL, NULL, 'administrador', 'activo', '2026-03-17 14:00:06'),
(2, 'Javier', 'Hernandez', 'javiarhv@gmail.com', 'user1234!', '2005-10-11', 'Guatemala', 'Guatemalteco', 'A87654321', 'usuario', 'activo', '2026-04-04 04:13:10'),
(3, 'pikachu', 'xd', 'pika@gmail.com', 'pika0807!', '2005-06-08', 'Colombia', 'Colombiano', 'A18273654', 'usuario', 'activo', '2026-04-04 05:38:05'),
(4, 'Jose', 'Rueda', 'josearueda22@gmail.com', '95699569', '2002-04-26', 'Guatemala', 'Guatemalteco', '3007951650101', 'usuario', 'activo', '2026-04-08 21:25:28'),
(5, 'TravelNow', 'Agencia', 'agencia@travelnow.com', 'TravelNow2026!', '2000-01-01', 'Guatemala', NULL, NULL, 'webservice', 'activo', '2026-04-19 20:16:04'),
(6, 'Juan Pablo', 'Torres García', 'jptorresg28@gmail.com', 'LLego2005/123', '2005-06-28', 'Guatemala', 'Guatemalteco', '3014638910101', 'usuario', 'activo', '2026-04-23 01:13:11'),
(7, 'Cliente', 'B2B Test', 'b2b@test.com', 'test1234', '2000-01-01', NULL, NULL, NULL, 'webservice', 'activo', '2026-04-25 13:14:25'),
(8, 'Ingris', 'Velasquez', 'ilvr1110@gmail.com', 'totito123', '1976-08-24', 'Guatemala', 'Guatemalteco', 'A192837645', 'usuario', 'activo', '2026-04-25 20:04:34');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `cache_destinos`
--
ALTER TABLE `cache_destinos`
  ADD PRIMARY KEY (`id_cache`),
  ADD KEY `idx_proveedor` (`id_proveedor`),
  ADD KEY `idx_tipo` (`tipo`),
  ADD KEY `idx_valor` (`valor`);

--
-- Indices de la tabla `cancelacion`
--
ALTER TABLE `cancelacion`
  ADD PRIMARY KEY (`id_cancelacion`),
  ADD KEY `idx_reservacion` (`id_reservacion`),
  ADD KEY `idx_fecha` (`fecha_cancelacion`),
  ADD KEY `idx_estado` (`estado_reembolso`),
  ADD KEY `procesado_por` (`procesado_por`);

--
-- Indices de la tabla `detalle_hotel`
--
ALTER TABLE `detalle_hotel`
  ADD PRIMARY KEY (`id_detalle`),
  ADD KEY `idx_reservacion` (`id_reservacion`),
  ADD KEY `idx_proveedor` (`id_proveedor`);

--
-- Indices de la tabla `detalle_vuelo`
--
ALTER TABLE `detalle_vuelo`
  ADD PRIMARY KEY (`id_detalle`),
  ADD KEY `idx_reservacion` (`id_reservacion`),
  ADD KEY `idx_proveedor` (`id_proveedor`);

--
-- Indices de la tabla `historial_busqueda`
--
ALTER TABLE `historial_busqueda`
  ADD PRIMARY KEY (`id_busqueda`);

--
-- Indices de la tabla `notificacion_proveedor`
--
ALTER TABLE `notificacion_proveedor`
  ADD PRIMARY KEY (`id_notificacion`),
  ADD KEY `idx_proveedor` (`id_proveedor`),
  ADD KEY `idx_reservacion` (`id_reservacion`),
  ADD KEY `idx_procesada` (`procesada`),
  ADD KEY `idx_fecha` (`fecha_recibida`);

--
-- Indices de la tabla `proveedor`
--
ALTER TABLE `proveedor`
  ADD PRIMARY KEY (`id_proveedor`),
  ADD KEY `idx_tipo` (`tipo`),
  ADD KEY `idx_estado` (`estado`);

--
-- Indices de la tabla `reservacion`
--
ALTER TABLE `reservacion`
  ADD PRIMARY KEY (`id_reservacion`),
  ADD UNIQUE KEY `uq_codigo_reserva` (`codigo_reserva`),
  ADD KEY `idx_usuario` (`id_usuario`),
  ADD KEY `idx_tipo` (`tipo`),
  ADD KEY `idx_estado` (`estado`),
  ADD KEY `idx_fecha_reserva` (`fecha_reserva`);

--
-- Indices de la tabla `usuario`
--
ALTER TABLE `usuario`
  ADD PRIMARY KEY (`id_usuario`),
  ADD UNIQUE KEY `uq_correo` (`correo`),
  ADD KEY `idx_correo` (`correo`),
  ADD KEY `idx_rol` (`rol`),
  ADD KEY `idx_estado` (`estado`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `cache_destinos`
--
ALTER TABLE `cache_destinos`
  MODIFY `id_cache` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=102;

--
-- AUTO_INCREMENT de la tabla `cancelacion`
--
ALTER TABLE `cancelacion`
  MODIFY `id_cancelacion` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `detalle_hotel`
--
ALTER TABLE `detalle_hotel`
  MODIFY `id_detalle` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT de la tabla `detalle_vuelo`
--
ALTER TABLE `detalle_vuelo`
  MODIFY `id_detalle` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `historial_busqueda`
--
ALTER TABLE `historial_busqueda`
  MODIFY `id_busqueda` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=157;

--
-- AUTO_INCREMENT de la tabla `notificacion_proveedor`
--
ALTER TABLE `notificacion_proveedor`
  MODIFY `id_notificacion` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `proveedor`
--
ALTER TABLE `proveedor`
  MODIFY `id_proveedor` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `reservacion`
--
ALTER TABLE `reservacion`
  MODIFY `id_reservacion` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT de la tabla `usuario`
--
ALTER TABLE `usuario`
  MODIFY `id_usuario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `cache_destinos`
--
ALTER TABLE `cache_destinos`
  ADD CONSTRAINT `cache_destinos_ibfk_1` FOREIGN KEY (`id_proveedor`) REFERENCES `proveedor` (`id_proveedor`) ON DELETE CASCADE;

--
-- Filtros para la tabla `cancelacion`
--
ALTER TABLE `cancelacion`
  ADD CONSTRAINT `cancelacion_ibfk_1` FOREIGN KEY (`id_reservacion`) REFERENCES `reservacion` (`id_reservacion`) ON DELETE CASCADE,
  ADD CONSTRAINT `cancelacion_ibfk_2` FOREIGN KEY (`procesado_por`) REFERENCES `usuario` (`id_usuario`) ON DELETE SET NULL;

--
-- Filtros para la tabla `detalle_hotel`
--
ALTER TABLE `detalle_hotel`
  ADD CONSTRAINT `detalle_hotel_ibfk_1` FOREIGN KEY (`id_reservacion`) REFERENCES `reservacion` (`id_reservacion`) ON DELETE CASCADE,
  ADD CONSTRAINT `detalle_hotel_ibfk_2` FOREIGN KEY (`id_proveedor`) REFERENCES `proveedor` (`id_proveedor`);

--
-- Filtros para la tabla `detalle_vuelo`
--
ALTER TABLE `detalle_vuelo`
  ADD CONSTRAINT `detalle_vuelo_ibfk_1` FOREIGN KEY (`id_reservacion`) REFERENCES `reservacion` (`id_reservacion`) ON DELETE CASCADE,
  ADD CONSTRAINT `detalle_vuelo_ibfk_2` FOREIGN KEY (`id_proveedor`) REFERENCES `proveedor` (`id_proveedor`);

--
-- Filtros para la tabla `notificacion_proveedor`
--
ALTER TABLE `notificacion_proveedor`
  ADD CONSTRAINT `notif_ibfk_1` FOREIGN KEY (`id_proveedor`) REFERENCES `proveedor` (`id_proveedor`) ON DELETE SET NULL,
  ADD CONSTRAINT `notif_ibfk_2` FOREIGN KEY (`id_reservacion`) REFERENCES `reservacion` (`id_reservacion`) ON DELETE SET NULL;

--
-- Filtros para la tabla `reservacion`
--
ALTER TABLE `reservacion`
  ADD CONSTRAINT `reservacion_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
