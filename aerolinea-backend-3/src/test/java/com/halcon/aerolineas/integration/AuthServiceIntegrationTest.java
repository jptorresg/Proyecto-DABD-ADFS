/*package com.halcon.aerolineas.integration;

import com.halcon.aerolineas.models.Usuario;
import com.halcon.aerolineas.services.AuthService;
import org.junit.jupiter.api.*;

import java.sql.SQLException;

import static org.junit.jupiter.api.Assertions.*;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public class AuthServiceIntegrationTest {

    private AuthService authService;
    private String testEmail;

    @BeforeAll
    void setup() {
        authService = new AuthService();
        // Generar un email único para evitar conflictos
        testEmail = "testuser_" + System.currentTimeMillis() + "@mail.com";
    }

    @Test
    @DisplayName("Debe registrar y autenticar un usuario correctamente")
    void testRegisterAndLogin() throws SQLException {
        // 1. Registro
        Usuario registrado = authService.registrar(
                testEmail,
                "Password123",
                "Juan",
                "Pérez",
                25,
                "GT",
                "P1234567"
        );

        assertNotNull(registrado);
        assertNotNull(registrado.getIdUsuario());
        assertEquals(testEmail, registrado.getEmail());
        assertNull(registrado.getPasswordHash()); // No debe retornarse el hash

        // 2. Login
        Usuario autenticado = authService.login(
                testEmail,
                "Password123"
        );

        assertNotNull(autenticado);
        assertEquals(testEmail, autenticado.getEmail());
        assertNull(autenticado.getPasswordHash());
    }

    @Test
    @DisplayName("Debe fallar el login con contraseña incorrecta")
    void testLoginWithWrongPassword() throws SQLException {
        Exception exception = assertThrows(IllegalArgumentException.class, () -> {
            authService.login(testEmail, "WrongPassword");
        });

        assertTrue(exception.getMessage().contains("Contraseña incorrecta")
                || exception.getMessage().contains("Usuario no encontrado"));
    }
}
*/