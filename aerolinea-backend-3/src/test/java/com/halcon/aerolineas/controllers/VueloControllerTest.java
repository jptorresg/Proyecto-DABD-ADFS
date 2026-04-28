/*package com.halcon.aerolineas.controllers;

import com.halcon.aerolineas.models.Vuelo;
import com.halcon.aerolineas.services.VueloService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

public class VueloControllerTest {

    private VueloController controller;
    private VueloService vueloService;

    private HttpServletRequest request;
    private HttpServletResponse response;

    private StringWriter responseWriter;

    @BeforeEach
    void setUp() throws Exception {
        controller = new VueloController();

        vueloService = mock(VueloService.class);
        request = mock(HttpServletRequest.class);
        response = mock(HttpServletResponse.class);

        responseWriter = new StringWriter();

        when(response.getWriter()).thenReturn(new PrintWriter(responseWriter));

        // 🔥 Inyectar mock manualmente (hack porque no usa DI)
        var field = VueloController.class.getDeclaredField("vueloService");
        field.setAccessible(true);
        field.set(controller, vueloService);
    }

    // =========================
    // GET - Buscar vuelos
    // =========================
    @Test
    void testDoGetBuscarVuelos() throws Exception {

        when(request.getPathInfo()).thenReturn(null);
        when(request.getParameter("origen")).thenReturn("GUA");
        when(request.getParameter("destino")).thenReturn("MEX");

        when(vueloService.buscarVuelos(any(), any(), any(), any()))
                .thenReturn(Collections.emptyList());

        controller.doGet(request, response);

        String result = responseWriter.toString();

        assertTrue(result.contains("success"));
        verify(vueloService).buscarVuelos(any(), any(), any(), any());
    }

    // =========================
    // GET - Obtener vuelo por ID
    // =========================
    @Test
    void testDoGetVueloPorId() throws Exception {

        when(request.getPathInfo()).thenReturn("/1");

        Vuelo vuelo = new Vuelo();
        vuelo.setIdVuelo(1L);

        when(vueloService.obtenerVuelo(1L)).thenReturn(vuelo);

        controller.doGet(request, response);

        String result = responseWriter.toString();

        assertTrue(result.contains("success"));
        verify(vueloService).obtenerVuelo(1L);
    }

    // =========================
    // GET - Admin
    // =========================
    @Test
    void testDoGetAdmin() throws Exception {

        when(request.getPathInfo()).thenReturn("/admin");

        when(vueloService.listarVuelos(1, 100))
                .thenReturn(Collections.emptyList());

        controller.doGet(request, response);

        String result = responseWriter.toString();

        assertTrue(result.contains("success"));
        verify(vueloService).listarVuelos(1, 100);
    }

    // =========================
    // POST - Crear vuelo OK
    // =========================
    @Test
    void testDoPostCrearVuelo() throws Exception {

        String json = "{"
            + "\"idUsuarioCreador\": 1,"
            + "\"codigoVuelo\": \"AV123\","
            + "\"origenCiudad\": \"Guatemala\","
            + "\"origenIata\": \"GUA\","
            + "\"destinoCiudad\": \"Mexico\","
            + "\"destinoIata\": \"MEX\","
            + "\"fechaSalida\": \"2026-04-10\","
            + "\"horaSalida\": \"08:00\","
            + "\"fechaLlegada\": \"2026-04-10\","
            + "\"horaLlegada\": \"10:00\","
            + "\"tipoAsiento\": \"ECO\","
            + "\"precioBase\": \"100.00\","
            + "\"asientosTotales\": 100"
            + "}";

        when(request.getReader()).thenReturn(
                new java.io.BufferedReader(new java.io.StringReader(json))
        );

        Vuelo vuelo = new Vuelo();
        vuelo.setIdVuelo(1L);

        when(vueloService.crearVuelo(
                any(), any(), any(), any(), any(),
                any(LocalDate.class), any(), any(LocalDate.class), any(),
                any(), any(BigDecimal.class), anyInt(), anyLong()
        )).thenReturn(vuelo);

        controller.doPost(request, response);

        String result = responseWriter.toString();

        assertTrue(result.contains("success"));
        verify(vueloService).crearVuelo(
                any(), any(), any(), any(), any(),
                any(LocalDate.class), any(), any(LocalDate.class), any(),
                any(), any(BigDecimal.class), anyInt(), anyLong()
        );
    }

    // =========================
    // POST - Error falta idUsuario
    // =========================
    @Test
    void testDoPostErrorSinUsuario() throws Exception {

        String json = "{"
            + "\"codigoVuelo\": \"AV123\""
            + "}";

        when(request.getReader()).thenReturn(
                new java.io.BufferedReader(new java.io.StringReader(json))
        );

        controller.doPost(request, response);

        String result = responseWriter.toString();

        assertTrue(result.contains("success"));
        assertTrue(result.contains("false"));
        verify(vueloService, never()).crearVuelo(any(), any(), any(), any(), any(),
                any(), any(), any(), any(),
                any(), any(), anyInt(), anyLong());
    }

    // =========================
    // DELETE
    // =========================
    @Test
    void testDoDelete() throws Exception {

        when(request.getPathInfo()).thenReturn("/1");

        controller.doDelete(request, response);

        String result = responseWriter.toString();

        assertTrue(result.contains("success"));
        verify(vueloService).eliminarVuelo(1L);
    }
}*/