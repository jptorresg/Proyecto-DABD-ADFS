/**
 * @file correo.js
 * @brief Módulo para el envío de correos electrónicos usando Nodemailer.
 * @author Tu Nombre
 * @version 1.0
 * @date 2026-04-09
 */

//Correo
const nodemailer = require('nodemailer');
require('dotenv').config();

/**
 * @brief Configuración del transporter de Nodemailer.
 * @details Crea un transportador utilizando las variables de entorno para la configuración del servidor SMTP.
 * 
 * Variables de entorno usadas:
 * - MAIL_HOST: Servidor SMTP (por defecto 'smtp.gmail.com')
 * - MAIL_PORT: Puerto SMTP (por defecto 587)
 * - MAIL_USER: Usuario de autenticación
 * - MAIL_PASS: Contraseña de autenticación
 */
const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.MAIL_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
});

/**
 * @brief Envía un correo electrónico.
 * @param {Object} params - Parámetros del correo.
 * @param {string} params.to - Dirección de correo del destinatario.
 * @param {string} params.subject - Asunto del correo.
 * @param {string} params.html - Cuerpo del correo en formato HTML.
 * @returns {Promise<Object>} Promesa que resuelve con la información del correo enviado.
 * @throws {Error} Lanza un error si falla el envío del correo.
 * 
 * @note La dirección del remitente se toma de la variable de entorno MAIL_FROM,
 *       con valor por defecto 'TravelNow <noreply@travelnow.com>'.
 * 
 * @example
 * sendMail({
 *     to: 'usuario@ejemplo.com',
 *     subject: 'Bienvenido',
 *     html: '<h1>Hola</h1><p>Bienvenido a nuestra plataforma</p>'
 * }).then(info => console.log('Correo enviado:', info));
 */
const sendMail = async ({ to, subject, html }) => {
    return transporter.sendMail({
        from: process.env.MAIL_FROM || 'TravelNow <noreply@travelnow.com>',
        to,
        subject,
        html,
    });
};

/**
 * @brief Exporta la función sendMail para su uso en otros módulos.
 */
module.exports = {sendMail};