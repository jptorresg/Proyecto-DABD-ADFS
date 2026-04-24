package com.halcon.aerolineas.services;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.halcon.aerolineas.dao.VueloDAO;
import com.halcon.aerolineas.models.Vuelo;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.*;

import java.math.BigDecimal;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.*;

public class VueloServiceTest {

    @Mock
    private VueloDAO vueloDAO;

    @InjectMocks
    private VueloService vueloService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    // ========================
    // obtenerVuelo
    // ========================

    @Test
    void testObtenerVueloCorrecto() throws SQLException {
        Vuelo vuelo = mock(Vuelo.class);

        when(vueloDAO.findById(1L)).thenReturn(vuelo);

        Vuelo result = vueloService.obtenerVuelo(1L);

        assertNotNull(result);
        verify(vueloDAO).findById(1L);
    }

    @Test
    void testObtenerVueloNoExiste() throws SQLException {
        when(vueloDAO.findById(1L)).thenReturn(null);

        assertThrows(IllegalArgumentException.class, () -> {
            vueloService.obtenerVuelo(1L);
        });
    }

    // ========================
    // crearVuelo
    // ========================

    @Test
    void testCrearVueloCorrecto() throws SQLException {
        when(vueloDAO.findByCodigo("ABC123")).thenReturn(null);

        when(vueloDAO.create(any(), eq(1L))).thenReturn(10L);

        Vuelo vueloMock = mock(Vuelo.class);
        when(vueloDAO.findById(10L)).thenReturn(vueloMock);

        Vuelo result = vueloService.crearVuelo(
                "ABC123",
                "CiudadA", "AAA",
                "CiudadB", "BBB",
                LocalDate.now().plusDays(1),
                "10:00",
                LocalDate.now().plusDays(1),
                "12:00",
                "ECONOMY",
                new BigDecimal("100"),
                50,
                1L
        );

        assertNotNull(result);
        verify(vueloDAO).create(any(), eq(1L));
    }

    @Test
    void testCrearVueloCodigoDuplicado() throws SQLException {
        when(vueloDAO.findByCodigo("ABC123")).thenReturn(mock(Vuelo.class));

        assertThrows(IllegalArgumentException.class, () -> {
            vueloService.crearVuelo(
                    "ABC123",
                    "A", "A",
                    "B", "B",
                    LocalDate.now().plusDays(1),
                    "10:00",
                    LocalDate.now().plusDays(1),
                    "12:00",
                    "ECONOMY",
                    new BigDecimal("100"),
                    50,
                    1L
            );
        });
    }

    @Test
    void testCrearVueloFechaPasada() throws SQLException {
        assertThrows(IllegalArgumentException.class, () -> {
            vueloService.crearVuelo(
                    "ABC123",
                    "A", "A",
                    "B", "B",
                    LocalDate.now().minusDays(1),
                    "10:00",
                    LocalDate.now(),
                    "12:00",
                    "ECONOMY",
                    new BigDecimal("100"),
                    50,
                    1L
            );
        });
    }

    @Test
    void testCrearVueloPrecioInvalido() throws SQLException {
        assertThrows(IllegalArgumentException.class, () -> {
            vueloService.crearVuelo(
                    "ABC123",
                    "A", "A",
                    "B", "B",
                    LocalDate.now().plusDays(1),
                    "10:00",
                    LocalDate.now().plusDays(1),
                    "12:00",
                    "ECONOMY",
                    BigDecimal.ZERO,
                    50,
                    1L
            );
        });
    }

    // ========================
    // actualizarVuelo
    // ========================

    @Test
    void testActualizarVueloCorrecto() throws SQLException {
        Vuelo vuelo = mock(Vuelo.class);
        when(vuelo.getIdVuelo()).thenReturn(1L);

        when(vueloDAO.findById(1L)).thenReturn(vuelo);
        when(vueloDAO.update(vuelo)).thenReturn(true);

        boolean result = vueloService.actualizarVuelo(vuelo);

        assertTrue(result);
    }

    @Test
    void testActualizarVueloNoExiste() throws SQLException {
        Vuelo vuelo = mock(Vuelo.class);
        when(vuelo.getIdVuelo()).thenReturn(1L);

        when(vueloDAO.findById(1L)).thenReturn(null);

        assertThrows(IllegalArgumentException.class, () -> {
            vueloService.actualizarVuelo(vuelo);
        });
    }

    // ========================
    // eliminarVuelo
    // ========================

    @Test
    void testEliminarVuelo() throws SQLException {
        when(vueloDAO.delete(1L)).thenReturn(true);

        boolean result = vueloService.eliminarVuelo(1L);

        assertTrue(result);
    }

    // ========================
    // listarVuelos
    // ========================

    @Test
    void testListarVuelos() throws SQLException {
        List<Vuelo> lista = new ArrayList<>();

        when(vueloDAO.findAll(10, 0)).thenReturn(lista);

        List<Vuelo> result = vueloService.listarVuelos(1, 10);

        assertNotNull(result);
        verify(vueloDAO).findAll(10, 0);
    }
}