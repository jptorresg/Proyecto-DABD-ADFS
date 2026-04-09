/**
 * @file db.js
 * @brief Módulo de conexión a la base de datos MySQL/MariaDB
 * @author Tu Nombre
 * @date 2026-04-09
 */

/**
 * @defgroup Database Base de Datos
 * @brief Configuración y gestión de la conexión a MySQL
 * @{
 */

//Conexión con MySQL
const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * @brief Pool de conexiones a la base de datos
 * @details Crea un pool de conexiones reutilizables para optimizar el rendimiento
 * 
 * Configuración del pool:
 * - Host: Variable de entorno DB_HOST o 'localhost'
 * - Puerto: Variable de entorno DB_PORT o 3306
 * - Usuario: Variable de entorno DB_USER o 'root'
 * - Contraseña: Variable de entorno DB_PASSWORD o ''
 * - Base de datos: Variable de entorno DB_NAME o 'agencia_viajes'
 * 
 * @var {Object} pool
 */
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',          /**< Host de la base de datos */
    port: parseInt(process.env.DB_PORT) || 3306,       /**< Puerto de conexión */
    user: process.env.DB_USER || 'root',               /**< Usuario de la BD */
    password: process.env.DB_PASSWORD || '',           /**< Contraseña del usuario */
    database: process.env.DB_NAME || 'agencia_viajes', /**< Nombre de la BD */
    waitForConnections: true,   /**< Esperar por conexiones disponibles */
    connectionLimit: 10,        /**< Límite máximo de conexiones concurrentes */
    queueLimit: 0,              /**< Límite de cola (0 = sin límite) */
    timezone: '+00:00'          /**< Zona horaria UTC */
});

/**
 * @brief Verifica la conexión a la base de datos
 * @details Intenta obtener una conexión del pool para verificar que la BD está accesible
 * 
 * @async
 * @function verificarConexion
 * @throws {Error} Si no se puede establecer conexión con la BD
 */
//Verificar la conexión
pool.getConnection().then(conn => {
    console.log('Conectado a MySQL/MariaDB');
    conn.release();  /**< Libera la conexión de vuelta al pool */
}).catch(err => {
    console.error('Error conectado a la BD:', err.message);
    process.exit(1); /**< Termina la aplicación si no hay conexión */
});

/**
 * @brief Exporta el pool de conexiones
 * @returns {Object} Pool de conexiones configurado
 */
module.exports = pool;

/** @} */ /* Fin del grupo Database */