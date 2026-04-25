package com.halcon.aerolineas.services;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class AuthServiceTest {

    private final AuthService service = new AuthService();

    // =========================
    // LOGIN (fallos controlados)
    // =========================

    @Test
    void testLoginUsuarioNoExiste() {
        assertThrows(Exception.class, () -> {
            service.login("noexiste@test.com", "12345678");
        });
    }

    // =========================
    // REGISTRO - VALIDACIONES
    // =========================

    @Test
    void testRegistrarEmailInvalido() {
        assertThrows(IllegalArgumentException.class, () -> {
            service.registrar(
                    "correo-invalido",
                    "12345678",
                    "Juan",
                    "Perez",
                    25,
                    "GT",
                    "P123"
            );
        });
    }

    @Test
    void testRegistrarPasswordCorta() {
        assertThrows(IllegalArgumentException.class, () -> {
            service.registrar(
                    "test@mail.com",
                    "123",
                    "Juan",
                    "Perez",
                    25,
                    "GT",
                    "P123"
            );
        });
    }

    @Test
    void testRegistrarEdadInvalida() {
        assertThrows(IllegalArgumentException.class, () -> {
            service.registrar(
                    "test@mail.com",
                    "12345678",
                    "Juan",
                    "Perez",
                    10,
                    "GT",
                    "P123"
            );
        });
    }

    // =========================
    // CAMBIO DE PASSWORD
    // =========================

    @Test
    void testCambiarPasswordUsuarioNoExiste() {
        assertThrows(Exception.class, () -> {
            service.cambiarPassword(999L, "12345678", "nueva1234");
        });
    }

    @Test
    void testCambiarPasswordNuevaCorta() {
        assertThrows(Exception.class, () -> {
            service.cambiarPassword(1L, "12345678", "123");
        });
    }
}