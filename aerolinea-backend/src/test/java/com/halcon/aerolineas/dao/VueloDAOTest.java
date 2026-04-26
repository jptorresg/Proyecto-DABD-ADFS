package com.halcon.aerolineas.dao;

import com.halcon.aerolineas.models.Vuelo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;
import java.sql.*;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class VueloDAOTest {

    private Connection connection;
    private PreparedStatement stmt;
    private ResultSet rs;

    private VueloDAO vueloDAO;

    @BeforeEach
    void setUp() throws Exception {
        connection = mock(Connection.class);
        stmt = mock(PreparedStatement.class);
        rs = mock(ResultSet.class);

        vueloDAO = new VueloDAO(connection);
    }

    // =========================================================
    // TEST: buscarVuelos
    // =========================================================
    @Test
    void testBuscarVuelos_conResultados() throws Exception {
        when(connection.prepareStatement(anyString())).thenReturn(stmt);
        when(stmt.executeQuery()).thenReturn(rs);

        // Simular 1 resultado
        when(rs.next()).thenReturn(true, false);

        mockVueloResultSet(rs);

        List<Vuelo> vuelos = vueloDAO.buscarVuelos(
                "GUA",
                "MEX",
                LocalDate.of(2025, 5, 10),
                "ECONOMICO"
        );

        assertEquals(1, vuelos.size());
        assertEquals("GUA", vuelos.get(0).getOrigenCodigoIata());

        verify(stmt).setObject(eq(1), eq("GUA"));
        verify(stmt).setObject(eq(2), eq("MEX"));
    }

    // =========================================================
    // TEST: findById
    // =========================================================
    @Test
    void testFindById_encontrado() throws Exception {
        when(connection.prepareStatement(anyString())).thenReturn(stmt);
        when(stmt.executeQuery()).thenReturn(rs);

        when(rs.next()).thenReturn(true);
        mockVueloResultSet(rs);

        Vuelo vuelo = vueloDAO.findById(1L);

        assertNotNull(vuelo);
        assertEquals(1L, vuelo.getIdVuelo());

        verify(stmt).setLong(1, 1L);
    }

    @Test
    void testFindById_noExiste() throws Exception {
        when(connection.prepareStatement(anyString())).thenReturn(stmt);
        when(stmt.executeQuery()).thenReturn(rs);

        when(rs.next()).thenReturn(false);

        Vuelo vuelo = vueloDAO.findById(1L);

        assertNull(vuelo);
    }

    // =========================================================
    // TEST: create
    // =========================================================
    @Test
    void testCreate_exitoso() throws Exception {
        when(connection.prepareStatement(anyString(), any(String[].class))).thenReturn(stmt);
        when(stmt.getGeneratedKeys()).thenReturn(rs);

        when(rs.next()).thenReturn(true);
        when(rs.getLong(1)).thenReturn(10L);

        Vuelo vuelo = crearVueloDummy();

        Long id = vueloDAO.create(vuelo, 1L);

        assertEquals(10L, id);

        verify(stmt).executeUpdate();
    }

    // =========================================================
    // TEST: update
    // =========================================================
    @Test
    void testUpdate_exitoso() throws Exception {
        when(connection.prepareStatement(anyString())).thenReturn(stmt);
        when(stmt.executeUpdate()).thenReturn(1);

        Vuelo vuelo = crearVueloDummy();
        vuelo.setIdVuelo(1L);

        boolean resultado = vueloDAO.update(vuelo);

        assertTrue(resultado);
    }

    @Test
    void testUpdate_fallido() throws Exception {
        when(connection.prepareStatement(anyString())).thenReturn(stmt);
        when(stmt.executeUpdate()).thenReturn(0);

        Vuelo vuelo = crearVueloDummy();
        vuelo.setIdVuelo(1L);

        boolean resultado = vueloDAO.update(vuelo);

        assertFalse(resultado);
    }

    // =========================================================
    // TEST: delete
    // =========================================================
    /*@Test
    void testDelete() throws Exception {
        when(connection.prepareStatement(anyString())).thenReturn(stmt);
        when(stmt.executeUpdate()).thenReturn(1);

        boolean resultado = vueloDAO.delete(1L);

        assertTrue(resultado);
        verify(stmt).setLong(1, 1L);
    }*/

    // =========================================================
    // TEST: decrementarAsientos
    // =========================================================
    @Test
    void testDecrementarAsientos_exitoso() throws Exception {
        when(connection.prepareStatement(anyString())).thenReturn(stmt);
        when(stmt.executeUpdate()).thenReturn(1);

        boolean resultado = vueloDAO.decrementarAsientos(1L, 2);

        assertTrue(resultado);
    }

    @Test
    void testDecrementarAsientos_sinEspacio() throws Exception {
        when(connection.prepareStatement(anyString())).thenReturn(stmt);
        when(stmt.executeUpdate()).thenReturn(0);

        boolean resultado = vueloDAO.decrementarAsientos(1L, 10);

        assertFalse(resultado);
    }

    // =========================================================
    // HELPERS
    // =========================================================

    private void mockVueloResultSet(ResultSet rs) throws Exception {
        when(rs.getLong("id_vuelo")).thenReturn(1L);
        when(rs.getString("codigo_vuelo")).thenReturn("FL123");
        when(rs.getString("origen_ciudad")).thenReturn("Guatemala");
        when(rs.getString("origen_codigo_iata")).thenReturn("GUA");
        when(rs.getString("destino_ciudad")).thenReturn("Mexico");
        when(rs.getString("destino_codigo_iata")).thenReturn("MEX");
        when(rs.getDate("fecha_salida")).thenReturn(Date.valueOf(LocalDate.now()));
        when(rs.getString("hora_salida")).thenReturn("10:00");
        when(rs.getDate("fecha_llegada")).thenReturn(Date.valueOf(LocalDate.now()));
        when(rs.getString("hora_llegada")).thenReturn("12:00");
        when(rs.getString("tipo_asiento")).thenReturn("ECONOMICO");
        when(rs.getBigDecimal("precio_base")).thenReturn(BigDecimal.valueOf(100));
        when(rs.getInt("asientos_totales")).thenReturn(100);
        when(rs.getInt("asientos_disponibles")).thenReturn(50);
        when(rs.getString("estado")).thenReturn("ACTIVO");

        when(rs.getLong("creado_por")).thenReturn(1L);
        when(rs.wasNull()).thenReturn(false);

        when(rs.getTimestamp("fecha_creacion")).thenReturn(new Timestamp(System.currentTimeMillis()));
    }

    private Vuelo crearVueloDummy() {
        Vuelo v = new Vuelo();
        v.setCodigoVuelo("FL123");
        v.setOrigenCiudad("Guatemala");
        v.setOrigenCodigoIata("GUA");
        v.setDestinoCiudad("Mexico");
        v.setDestinoCodigoIata("MEX");
        v.setFechaSalida(LocalDate.now());
        v.setHoraSalida("10:00");
        v.setFechaLlegada(LocalDate.now());
        v.setHoraLlegada("12:00");
        v.setTipoAsiento("ECONOMICO");
        v.setPrecioBase(BigDecimal.valueOf(100));
        v.setAsientosTotales(100);
        v.setAsientosDisponibles(50);
        return v;
    }
}