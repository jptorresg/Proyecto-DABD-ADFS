//Correo
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.MAIL_POR) || 587,
    secure: false,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
});

const sendMail = async ({ to, subject, html }) => {
    return trasnporter.sendMail({
        from: process.env.MAIL_FROM || 'TravelNow <noreply@traelnow.com>',
        to,
        subject,
        html,
    });
};

module.exports = {sendMail};