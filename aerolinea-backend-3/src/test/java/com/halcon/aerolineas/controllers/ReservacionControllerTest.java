package com.halcon.aerolineas.controllers;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.lang.reflect.Field;
import java.util.Collections;
import java.util.List;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.halcon.aerolineas.models.Reservacion;
import com.halcon.aerolineas.services.ReservacionService;

public class ReservacionControllerTest {

    private ReservacionController controller = new ReservacionController();
    private ReservacionService reservacionService = mock(ReservacionService.class);
    private HttpServletRequest request = mock(HttpServletRequest.class);
    private HttpServletResponse response = mock(HttpServletResponse.class);

    private StringWriter responseWriter = new StringWriter();

    @BeforeEach
    void setUp() throws Exception {
        PrintWriter writer = new PrintWriter(responseWriter);
        when(response.getWriter()).thenReturn(writer);

        controller = new ReservacionController();

        // 👇 inyectar el mock (importante)
        Field field = ReservacionController.class.getDeclaredField("reservacionService");
        field.setAccessible(true);
        field.set(controller, reservacionService);
    }
    @Test
    void testDoGetReservacionesOK() throws Exception {

        when(request.getHeader("x-usuario-id")).thenReturn("1");

        when(reservacionService.obtenerReservacionesUsuario(1L))
                .thenReturn(Collections.emptyList());

        controller.doGet(request, response);

        String result = responseWriter.toString();

        assertTrue(result.contains("success"));
        verify(reservacionService).obtenerReservacionesUsuario(1L);
    }

    @Test
    void testDoGetHeaderInvalido() throws Exception {

        when(request.getHeader("x-usuario-id")).thenReturn("abc");

        controller.doGet(request, response);

        String result = responseWriter.toString();

        assertTrue(result.contains("inválido"));
    }

    @Test
    void testDoPostCrearReservacion() throws Exception {

        when(request.getHeader("x-usuario-id")).thenReturn("1");

        String json = "{"
            + "\"idVuelo\":\"1\","
            + "\"metodoPago\":\"TARJETA\","
            + "\"pasajeros\":[{"
            + "\"nombres\":\"Juan\","
            + "\"apellidos\":\"Perez\","
            + "\"fechaNacimiento\":\"2000-01-01\","
            + "\"idNacionalidad\":1,"
            + "\"numPasaporte\":\"ABC123\""
            + "}]"
            + "}";

        when(request.getReader()).thenReturn(
            new java.io.BufferedReader(new java.io.StringReader(json))
        );

        when(reservacionService.crearReservacion(anyLong(), anyLong(), anyList(), any()))
                .thenReturn(new Reservacion());

        controller.doPost(request, response);

        String result = responseWriter.toString();

        assertTrue(result.contains("success"));
        verify(reservacionService).crearReservacion(anyLong(), eq(1L), anyList(), any());
    }

    @Test
    void testDoPostMultiplesVuelos() throws Exception {

        when(request.getHeader("x-usuario-id")).thenReturn("1");

        String json = "{"
            + "\"idVuelo\":\"1-2\","
            + "\"metodoPago\":\"TARJETA\","
            + "\"pasajeros\":[{"
            + "\"nombres\":\"Juan\","
            + "\"apellidos\":\"Perez\","
            + "\"fechaNacimiento\":\"2000-01-01\","
            + "\"idNacionalidad\":1,"
            + "\"numPasaporte\":\"ABC123\""
            + "}]"
            + "}";

        when(request.getReader()).thenReturn(
            new java.io.BufferedReader(new java.io.StringReader(json))
        );

        when(reservacionService.crearReservacion(anyLong(), anyLong(), anyList(), any()))
                .thenReturn(new Reservacion());

        controller.doPost(request, response);

        verify(reservacionService, times(2))
                .crearReservacion(anyLong(), eq(1L), anyList(), any());
    }

    @Test
    void testDoPostHeaderInvalido() throws Exception {

        when(request.getHeader("x-usuario-id")).thenReturn("abc");

        controller.doPost(request, response);

        String result = responseWriter.toString();

        assertTrue(result.contains("inválido"));
        verify(reservacionService, never())
                .crearReservacion(anyLong(), anyLong(), anyList(), any());
    }

    @Test
    void testDoPutCancelar() throws Exception {

        when(request.getPathInfo()).thenReturn("/1/cancelar");

        controller.doPut(request, response);

        String result = responseWriter.toString();

        assertTrue(result.contains("Reservación cancelada"));
        verify(reservacionService).cancelarReservacion(1L);
    }

}