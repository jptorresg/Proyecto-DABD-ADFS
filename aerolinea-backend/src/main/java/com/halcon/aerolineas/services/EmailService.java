package com.halcon.aerolineas.services;

import jakarta.mail.*;
import jakarta.mail.internet.*;
import java.util.Properties;

public class EmailService {

    public void enviarCorreo(String destino, byte[] pdf, String codigo) throws Exception {

        Properties props = new Properties();
        props.put("mail.smtp.host", "smtp.gmail.com");
        props.put("mail.smtp.port", "587");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");

        Session session = Session.getInstance(props, new Authenticator() {
            protected PasswordAuthentication getPasswordAuthentication() {
                return new PasswordAuthentication("tuCorreo@gmail.com", "tuPasswordApp");
            }
        });

        Message message = new MimeMessage(session);
        message.setFrom(new InternetAddress("tuCorreo@gmail.com"));
        message.setRecipients(Message.RecipientType.TO,
                InternetAddress.parse(destino));

        message.setSubject("Confirmación de Reservación");

        // Texto
        MimeBodyPart textPart = new MimeBodyPart();
        textPart.setText("Adjunto encontrarás tu comprobante de reservación.");

        // PDF
        MimeBodyPart pdfPart = new MimeBodyPart();
        pdfPart.setFileName("Reservacion_" + codigo + ".pdf");
        pdfPart.setContent(pdf, "application/pdf");

        Multipart multipart = new MimeMultipart();
        multipart.addBodyPart(textPart);
        multipart.addBodyPart(pdfPart);

        message.setContent(multipart);

        Transport.send(message);
    }
}