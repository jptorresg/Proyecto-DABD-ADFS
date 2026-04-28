package com.halcon.aerolineas.controllers;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

import java.io.BufferedReader;
import java.io.PrintWriter;
import java.io.StringReader;
import java.io.StringWriter;
import java.lang.reflect.Field;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import com.halcon.aerolineas.models.Usuario;
import com.halcon.aerolineas.services.AuthService;

public class AuthControllerTest {

    private AuthController controller;
    private AuthService authService;

    private HttpServletRequest request;
    private HttpServletResponse response;
    private HttpSession session;

    private StringWriter responseWriter;

    @BeforeEach
    void setUp() throws Exception {
        controller = new AuthController();
        authService = mock(AuthService.class);

        request = mock(HttpServletRequest.class);
        response = mock(HttpServletResponse.class);
        session = mock(HttpSession.class);

        responseWriter = new StringWriter();
        PrintWriter writer = new PrintWriter(responseWriter);

        when(response.getWriter()).thenReturn(writer);
        when(request.getSession(anyBoolean())).thenReturn(session);

        // Inyectar mock del service
        Field field = AuthController.class.getDeclaredField("authService");
        field.setAccessible(true);
        field.set(controller, authService);
    }

    @Test
    void testLoginSuccess() throws Exception {
        when(request.getPathInfo()).thenReturn("/login");

        String json = "{ \"email\":\"test@mail.com\", \"password\":\"1234\" }";

        when(request.getReader())
                .thenReturn(new BufferedReader(new StringReader(json)));

        Usuario usuario = new Usuario();
        usuario.setIdUsuario(1L);
        usuario.setEmail("test@mail.com");
        usuario.setTipoUsuario("CLIENTE");

        when(authService.login("test@mail.com", "1234"))
                .thenReturn(usuario);

        controller.doPost(request, response);

        String result = responseWriter.toString();

        assertTrue(result.contains("Login exitoso"));
        verify(session).setAttribute("usuarioId", 1L);
        verify(authService).login("test@mail.com", "1234");
    }

    @Test
    void testLoginError() throws Exception {
        when(request.getPathInfo()).thenReturn("/login");

        String json = "{ \"email\":\"test@mail.com\", \"password\":\"wrong\" }";

        when(request.getReader())
                .thenReturn(new BufferedReader(new StringReader(json)));

        when(authService.login(anyString(), anyString()))
                .thenThrow(new RuntimeException("Credenciales inválidas"));

        controller.doPost(request, response);

        String result = responseWriter.toString();

        assertTrue(result.contains("Credenciales inválidas"));
    }

    @Test
    void testRegisterSuccess() throws Exception {
        when(request.getPathInfo()).thenReturn("/register");

        String json = "{"
                + "\"email\":\"test@mail.com\","
                + "\"password\":\"1234\","
                + "\"nombres\":\"Juan\","
                + "\"apellidos\":\"Perez\","
                + "\"edad\":20,"
                + "\"codigoPais\":\"GT\","
                + "\"numPasaporte\":\"ABC123\""
                + "}";

        when(request.getReader())
                .thenReturn(new BufferedReader(new StringReader(json)));

        when(authService.registrar(any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(new Usuario());

        controller.doPost(request, response);

        String result = responseWriter.toString();

        assertTrue(result.contains("Usuario registrado exitosamente"));
        verify(authService).registrar(any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void testRegisterError() throws Exception {
        when(request.getPathInfo()).thenReturn("/register");

        String json = "{"
                + "\"email\":\"test@mail.com\","
                + "\"password\":\"1234\","
                + "\"nombres\":\"Juan\","
                + "\"apellidos\":\"Perez\","
                + "\"edad\":20,"
                + "\"codigoPais\":\"GT\","
                + "\"numPasaporte\":\"ABC123\""
                + "}";

        when(request.getReader())
                .thenReturn(new BufferedReader(new StringReader(json)));

        when(authService.registrar(any(), any(), any(), any(), any(), any(), any()))
                .thenThrow(new RuntimeException("Error en registro"));

        controller.doPost(request, response);

        String result = responseWriter.toString();

        assertTrue(result.contains("Error en registro")); // ✅ ahora sí pasa
    }

    @Test
    void testLogout() throws Exception {
        when(request.getPathInfo()).thenReturn("/logout");
        when(request.getSession(false)).thenReturn(session);

        controller.doPost(request, response);

        String result = responseWriter.toString();

        assertTrue(result.contains("Logout exitoso"));
        verify(session).invalidate();
    }

    @Test
    void testEndpointNoEncontrado() throws Exception {
        when(request.getPathInfo()).thenReturn("/otro");

        controller.doPost(request, response);

        String result = responseWriter.toString();

        assertTrue(result.contains("Endpoint no encontrado"));
    }
}