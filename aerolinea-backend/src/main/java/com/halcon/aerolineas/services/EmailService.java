package com.halcon.aerolineas.services;

import jakarta.mail.*;
import jakarta.mail.internet.*;

import java.io.InputStream;
import java.util.Properties;

public class EmailService {

    public void enviarCorreo(String destino, byte[] pdf, String codigo) throws Exception {

        // 🔹 Cargar configuración desde mail.properties
        Properties config = new Properties();

        try (InputStream input = getClass()
                .getClassLoader()
                .getResourceAsStream("mail.properties")) {

            if (input == null) {
                throw new RuntimeException("No se encontró mail.properties");
            }

            config.load(input);
        }

        // 🔹 Configurar SMTP
        Properties props = new Properties();
        props.put("mail.smtp.host", config.getProperty("mail.host"));
        props.put("mail.smtp.port", config.getProperty("mail.port"));
        props.put("mail.smtp.auth", config.getProperty("mail.auth"));
        props.put("mail.smtp.starttls.enable", config.getProperty("mail.starttls.enable"));

        // 🔹 Sesión autenticada
        Session session = Session.getInstance(props, new Authenticator() {
            protected PasswordAuthentication getPasswordAuthentication() {
                return new PasswordAuthentication(
                        config.getProperty("mail.user"),
                        config.getProperty("mail.password")
                );
            }
        });

        // 🔹 Crear mensaje
        Message message = new MimeMessage(session);
        message.setFrom(new InternetAddress(config.getProperty("mail.user")));
        message.setRecipients(
                Message.RecipientType.TO,
                InternetAddress.parse(destino)
        );

        message.setSubject("Confirmación de Reservación");

        // 🔹 Texto
        MimeBodyPart textPart = new MimeBodyPart();
        textPart.setText("Adjunto encontrarás tu comprobante de reservación.");

        // 🔹 PDF adjunto
        MimeBodyPart pdfPart = new MimeBodyPart();
        pdfPart.setFileName("Reservacion_" + codigo + ".pdf");
        pdfPart.setContent(pdf, "application/pdf");

        // 🔹 Combinar partes
        Multipart multipart = new MimeMultipart();
        multipart.addBodyPart(textPart);
        multipart.addBodyPart(pdfPart);

        message.setContent(multipart);

        // 🔹 Enviar
        Transport.send(message);
    }
}