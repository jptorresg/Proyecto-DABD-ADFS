//Conexión con MySQL
const mysql = require('mysql/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'agencia_viajes',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: '+00:00'
});

//Verificar la conexión
pool.getConnection().then(conn => {
    console.log('Conectado a MySQL/MariaDB');
    conn.release();
}).catch(err => {
    console.error('Error conectado a la BD:', err.message);
    process.exit(1);
});

module.exports = pool;