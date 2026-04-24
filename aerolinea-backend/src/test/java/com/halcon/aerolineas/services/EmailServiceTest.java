package com.halcon.aerolineas.services;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;

public class EmailServiceTest {

    @Test
    void testEnviarCorreoNoExplota() {
        EmailService service = new EmailService();

        byte[] pdf = "PDF falso".getBytes();

        assertThrows(Exception.class, () -> {
            service.enviarCorreo("test@mail.com", pdf, "ABC123");
        });
    }
}