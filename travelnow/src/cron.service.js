//Actualiza el caché de las ciudades de todos los proveedores
//Nota: se ejjecuta cada lunes a las 2 am

const cron = require('node-cron');
const db = require('../config/db');
const proveedoresService = require('./proveedor.service');

