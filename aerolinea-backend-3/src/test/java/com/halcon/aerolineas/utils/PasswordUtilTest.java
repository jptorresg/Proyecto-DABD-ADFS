package com.halcon.aerolineas.utils;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;

public class PasswordUtilTest {

    @Test
    void testHashPasswordGeneratesValidHash() {
        String password = "MiPassword123";
        String hash = PasswordUtil.hashPassword(password);

        assertNotNull(hash, "El hash no debería ser nulo");
        assertNotEquals(password, hash, "El hash no debe ser igual a la contraseña");
        assertTrue(hash.length() > 0, "El hash debe tener contenido");
    }

    @Test
    void testVerifyPasswordCorrect() {
        String password = "MiPassword123";
        String hash = PasswordUtil.hashPassword(password);

        assertTrue(PasswordUtil.verifyPassword(password, hash),
                "La contraseña debería ser válida");
    }

    @Test
    void testVerifyPasswordIncorrect() {
        String password = "MiPassword123";
        String wrongPassword = "OtraPassword";
        String hash = PasswordUtil.hashPassword(password);

        assertFalse(PasswordUtil.verifyPassword(wrongPassword, hash),
                "La verificación debería fallar con una contraseña incorrecta");
    }

    @Test
    void testVerifyPasswordWithInvalidHash() {
        assertFalse(PasswordUtil.verifyPassword("password", "hash_invalido"),
                "Debe retornar false si el hash es inválido");
    }

    @Test
    void testGenerarCodigoReservacionFormato() {
        String codigo = PasswordUtil.generarCodigoReservacion();

        assertNotNull(codigo);
        assertTrue(codigo.matches("^RES-[A-Z0-9]{8}$"),
                "El código debe cumplir con el formato RES-XXXXXXXX");
    }

    @Test
    void testGenerarCodigoReservacionUnicidad() {
        String codigo1 = PasswordUtil.generarCodigoReservacion();
        String codigo2 = PasswordUtil.generarCodigoReservacion();

        assertNotEquals(codigo1, codigo2,
                "Los códigos generados deberían ser diferentes");
    }
}