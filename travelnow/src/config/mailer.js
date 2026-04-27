/**
 * @file correo.js
 * @brief Módulo para el envío de correos electrónicos usando Nodemailer.
 * @author Tu Nombre
 * @version 1.1
 * @date 2026-04-09
 */

const nodemailer = require('nodemailer');
require('dotenv').config();

/**
 * @brief Configuración del transporter de Nodemailer.
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
 * @brief Envía un correo electrónico, opcionalmente con adjuntos.
 * @param {Object}   params
 * @param {string}   params.to            Destinatario.
 * @param {string}   params.subject       Asunto.
 * @param {string}   params.html          Cuerpo HTML.
 * @param {Array}    [params.attachments] Adjuntos en formato Nodemailer.
 *        Cada uno: { filename, path } | { filename, content } | etc.
 * @returns {Promise<Object>}
 *
 * @example  Adjuntar un PDF generado en disco:
 *   sendMail({
 *       to: 'cliente@ejemplo.com',
 *       subject: 'Reserva confirmada',
 *       html: '<h1>...</h1>',
 *       attachments: [{ filename: 'reserva.pdf', path: '/ruta/al/pdf' }],
 *   });
 */
const sendMail = async ({ to, subject, html, attachments }) => {
    const mailOptions = {
        from: process.env.MAIL_FROM || 'TravelNow <noreply@gmail.com>',
        to,
        subject,
        html,
    };
    if (Array.isArray(attachments) && attachments.length) {
        mailOptions.attachments = attachments;
    }
    return transporter.sendMail(mailOptions);
};

module.exports = { sendMail };