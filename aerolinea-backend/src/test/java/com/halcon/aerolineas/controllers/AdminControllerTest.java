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
import java.util.*;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.halcon.aerolineas.services.AdminService;

public class AdminControllerTest {

    private AdminController controller;
    private AdminService adminService;

    private HttpServletRequest request;
    private HttpServletResponse response;

    private StringWriter responseWriter;

    @BeforeEach
    void setUp() throws Exception {

        controller = new AdminController();
        adminService = mock(AdminService.class);

        request = mock(HttpServletRequest.class);
        response = mock(HttpServletResponse.class);

        responseWriter = new StringWriter();
        PrintWriter writer = new PrintWriter(responseWriter);

        when(response.getWriter()).thenReturn(writer);

        // Inyectar mock con reflection
        Field field = AdminController.class.getDeclaredField("adminService");
        field.setAccessible(true);
        field.set(controller, adminService);
    }

    // =========================
    // 🔵 GET /stats
    // =========================
    @Test
    void testGetStats() throws Exception {

        when(request.getPathInfo()).thenReturn("/stats");

        Map<String, Object> stats = new HashMap<>();
        stats.put("usuarios", 10);
        stats.put("vuelos", 5);

        when(adminService.obtenerEstadisticas()).thenReturn(stats);

        controller.doGet(request, response);

        String result = responseWriter.toString();

        assertTrue(result.contains("success"));
        assertTrue(result.contains("usuarios"));
        assertTrue(result.contains("vuelos"));

        verify(adminService).obtenerEstadisticas();
    }

    // =========================
    // 🔵 GET /usuarios
    // =========================
    @Test
    void testGetUsuarios() throws Exception {

        when(request.getPathInfo()).thenReturn("/usuarios");

        List<Map<String, Object>> usuarios = new ArrayList<>();

        Map<String, Object> u1 = new HashMap<>();
        u1.put("id", 1);
        u1.put("nombre", "Juan");

        usuarios.add(u1);

        when(adminService.obtenerUsuarios()).thenReturn(usuarios);

        controller.doGet(request, response);

        String result = responseWriter.toString();

        assertTrue(result.contains("success"));
        assertTrue(result.contains("Juan"));

        verify(adminService).obtenerUsuarios();
    }

    // =========================
    // 🔵 GET ERROR
    // =========================
    @Test
    void testGetError() throws Exception {

        when(request.getPathInfo()).thenReturn("/stats");

        when(adminService.obtenerEstadisticas())
                .thenThrow(new RuntimeException("Error DB"));

        controller.doGet(request, response);

        String result = responseWriter.toString();

        assertTrue(result.contains("Error DB"));
    }

    // =========================
    // 🟢 PUT /usuarios/{id}/rol OK
    // =========================
    @Test
    void testPutActualizarRolExitoso() throws Exception {

        when(request.getPathInfo()).thenReturn("/usuarios/1/rol");

        String json = "{ \"tipoUsuario\": \"ADMIN\" }";

        when(request.getReader())
                .thenReturn(new BufferedReader(new StringReader(json)));

        when(adminService.actualizarRolUsuario(1, "ADMIN"))
                .thenReturn(true);

        controller.doPut(request, response);

        String result = responseWriter.toString();

        assertTrue(result.contains("Rol actualizado"));

        verify(adminService).actualizarRolUsuario(1, "ADMIN");
    }

    // =========================
    // 🟢 PUT /usuarios/{id}/rol FAIL
    // =========================
    @Test
    void testPutActualizarRolFalla() throws Exception {

        when(request.getPathInfo()).thenReturn("/usuarios/2/rol");

        String json = "{ \"tipoUsuario\": \"USER\" }";

        when(request.getReader())
                .thenReturn(new BufferedReader(new StringReader(json)));

        when(adminService.actualizarRolUsuario(2, "USER"))
                .thenReturn(false);

        controller.doPut(request, response);

        String result = responseWriter.toString();

        assertTrue(result.contains("No se pudo actualizar el rol"));
    }

    // =========================
    // 🟢 PUT ERROR INTERNO
    // =========================
    @Test
    void testPutErrorInterno() throws Exception {

        when(request.getPathInfo()).thenReturn("/usuarios/1/rol");

        String json = "{ \"tipoUsuario\": \"ADMIN\" }";

        when(request.getReader())
                .thenReturn(new BufferedReader(new StringReader(json)));

        when(adminService.actualizarRolUsuario(anyInt(), anyString()))
                .thenThrow(new RuntimeException("Error DB"));

        controller.doPut(request, response);

        String result = responseWriter.toString();

        assertTrue(result.contains("Error DB"));
    }
}