package com.halcon.aerolineas.services;

import jakarta.mail.*;
import jakarta.mail.internet.*;

import java.io.InputStream;
import java.util.Properties;

public class EmailService {

    /**
     * Envía un correo electrónico con un archivo PDF adjunto.
     *
     * @param destino El destinatario del correo electrónico.
     * @param pdf     El contenido del archivo PDF a adjuntar.
     * @param codigo  El código de reserva asociado al correo electrónico.
     */
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

    /**
     * Enviar correo de cancelación de vuelo
     *
     * @param destino
     * @param nombre
     * @param codigoVuelo
     * @param origen
     * @param destinoCiudad
     * @param fecha
     * @param mensaje
     */
    public void enviarCancelacionVuelo(String destino, String nombre,
                                    String codigoVuelo,
                                    String origen, String destinoCiudad,
                                    String fecha, String mensaje) {

        try {
            Properties config = new Properties();

            try (InputStream input = getClass()
                    .getClassLoader()
                    .getResourceAsStream("mail.properties")) {

                config.load(input);
            }

            Properties props = new Properties();
            props.put("mail.smtp.host", config.getProperty("mail.host"));
            props.put("mail.smtp.port", config.getProperty("mail.port"));
            props.put("mail.smtp.auth", config.getProperty("mail.auth"));
            props.put("mail.smtp.starttls.enable", config.getProperty("mail.starttls.enable"));

            Session session = Session.getInstance(props, new Authenticator() {
                protected PasswordAuthentication getPasswordAuthentication() {
                    return new PasswordAuthentication(
                            config.getProperty("mail.user"),
                            config.getProperty("mail.password")
                    );
                }
            });

            Message message = new MimeMessage(session);
            message.setFrom(new InternetAddress(config.getProperty("mail.user")));
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(destino));

            message.setSubject("Cancelación de vuelo " + codigoVuelo);

            String contenido =
                    "Hola " + nombre + ",\n\n" +
                    "Lamentamos informarte que tu vuelo ha sido cancelado.\n\n" +
                    "✈️ Detalles del vuelo:\n" +
                    "Código: " + codigoVuelo + "\n" +
                    "Ruta: " + origen + " → " + destinoCiudad + "\n" +
                    "Fecha: " + fecha + "\n\n" +
                    "📢 Mensaje del administrador:\n" +
                    mensaje + "\n\n" +
                    "Por favor contacta con soporte para más información.\n\n" +
                    "Atentamente,\nAerolíneas Halcón";

            message.setText(contenido);

            Transport.send(message);

        } catch (Exception e) {
            System.err.println("Error enviando correo cancelación: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /** 
     * Enviar correo de actualización de vuelo
     *  
     * @param destino
     * @param nombre
     * @param codigoVuelo
     * @param cambios
     */
    public void enviarActualizacionVuelo(
            String destino,
            String nombre,
            String codigoVuelo,
            String cambios) {

        try {
            Properties config = new Properties();

            try (InputStream input = getClass()
                    .getClassLoader()
                    .getResourceAsStream("mail.properties")) {

                config.load(input);
            }

            Properties props = new Properties();
            props.put("mail.smtp.host", config.getProperty("mail.host"));
            props.put("mail.smtp.port", config.getProperty("mail.port"));
            props.put("mail.smtp.auth", config.getProperty("mail.auth"));
            props.put("mail.smtp.starttls.enable", config.getProperty("mail.starttls.enable"));

            Session session = Session.getInstance(props, new Authenticator() {
                protected PasswordAuthentication getPasswordAuthentication() {
                    return new PasswordAuthentication(
                            config.getProperty("mail.user"),
                            config.getProperty("mail.password")
                    );
                }
            });

            Message message = new MimeMessage(session);
            message.setFrom(new InternetAddress(config.getProperty("mail.user")));
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(destino));

            message.setSubject("Actualización de vuelo " + codigoVuelo);

            String contenido =
                    "Hola " + nombre + ",\n\n" +
                    "Tu vuelo ha sido actualizado.\n\n" +
                    "📢 Cambios realizados:\n" +
                    cambios + "\n\n" +
                    "Por favor revisa los detalles en la plataforma.\n\n" +
                    "Atentamente,\nAerolíneas Halcón";

            message.setText(contenido);

            Transport.send(message);

        } catch (Exception e) {
            System.err.println("Error enviando correo actualización: " + e.getMessage());
            e.printStackTrace();
        }
    }
}