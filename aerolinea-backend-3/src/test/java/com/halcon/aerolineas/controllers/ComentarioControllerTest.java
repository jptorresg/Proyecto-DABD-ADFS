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

import com.halcon.aerolineas.services.ComentarioService;
import com.halcon.aerolineas.services.ComentarioService.ComentarioResponse;
import com.halcon.aerolineas.models.ComentarioRating;

public class ComentarioControllerTest {

    private ComentarioController controller;
    private ComentarioService comentarioService;

    private HttpServletRequest request;
    private HttpServletResponse response;

    private StringWriter responseWriter;

    @BeforeEach
    void setUp() throws Exception {
        controller = new ComentarioController();
        comentarioService = mock(ComentarioService.class);

        request = mock(HttpServletRequest.class);
        response = mock(HttpServletResponse.class);

        responseWriter = new StringWriter();
        PrintWriter writer = new PrintWriter(responseWriter);

        when(response.getWriter()).thenReturn(writer);

        // Inyectar mock
        Field field = ComentarioController.class.getDeclaredField("comentarioService");
        field.setAccessible(true);
        field.set(controller, comentarioService);
    }

    // =========================
    // 🔵 TESTS DO GET
    // =========================

    @Test
    void testDoGetSuccess() throws Exception {
        when(request.getPathInfo()).thenReturn("/1");

        ComentarioResponse mockResponse = new ComentarioResponse(
            java.util.Collections.emptyList(),
            0.0,
            0L
        );
        when(comentarioService.obtenerComentarios(1))
                .thenReturn(mockResponse);

        controller.doGet(request, response);

        String result = responseWriter.toString();

        assertTrue(result.contains("success"));
        verify(comentarioService).obtenerComentarios(1);
    }

    @Test
    void testDoGetConEscalas() throws Exception {
        when(request.getPathInfo()).thenReturn("/1-2");

        when(comentarioService.obtenerComentarios(1))
                .thenReturn(new ComentarioResponse(
                    java.util.Collections.emptyList(),
                    0.0,
                    0L
                )
            );

        controller.doGet(request, response);

        verify(comentarioService).obtenerComentarios(1);
    }

    @Test
    void testDoGetSinId() throws Exception {
        when(request.getPathInfo()).thenReturn(null);

        controller.doGet(request, response);

        String result = responseWriter.toString();

        assertTrue(result.contains("Debe proporcionar el ID del vuelo"));
    }

    @Test
    void testDoGetIdInvalido() throws Exception {
        when(request.getPathInfo()).thenReturn("/abc");

        controller.doGet(request, response);

        String result = responseWriter.toString();

        assertTrue(result.contains("ID de vuelo inválido"));
    }

    @Test
    void testDoGetErrorInterno() throws Exception {
        when(request.getPathInfo()).thenReturn("/1");

        when(comentarioService.obtenerComentarios(anyInt()))
                .thenThrow(new RuntimeException("Error DB"));

        controller.doGet(request, response);

        String result = responseWriter.toString();

        assertTrue(result.contains("Error DB"));
    }

    // =========================
    // 🟢 TESTS DO POST
    // =========================

    @Test
    void testDoPostSuccess() throws Exception {
        String json = "{"
                + "\"idVuelo\":1,"
                + "\"comentario\":\"Buen vuelo\","
                + "\"rating\":5"
                + "}";

        when(request.getReader())
                .thenReturn(new BufferedReader(new StringReader(json)));

        controller.doPost(request, response);

        String result = responseWriter.toString();

        assertTrue(result.contains("Comentario creado"));
        verify(comentarioService).crearComentario(any(ComentarioRating.class));
    }

    @Test
    void testDoPostJsonInvalido() throws Exception {
        String json = "{ invalido json }";

        when(request.getReader())
                .thenReturn(new BufferedReader(new StringReader(json)));

        controller.doPost(request, response);

        String result = responseWriter.toString();

        assertTrue(result.contains("JSON inválido"));
    }

    @Test
    void testDoPostErrorInterno() throws Exception {
        String json = "{"
                + "\"idVuelo\":1,"
                + "\"comentario\":\"Test\","
                + "\"rating\":5"
                + "}";

        when(request.getReader())
                .thenReturn(new BufferedReader(new StringReader(json)));

        doThrow(new RuntimeException("Error al guardar"))
                .when(comentarioService)
                .crearComentario(any(ComentarioRating.class));

        controller.doPost(request, response);

        String result = responseWriter.toString();

        assertTrue(result.contains("Error al guardar"));
    }
}