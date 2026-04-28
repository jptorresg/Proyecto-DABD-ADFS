package com.halcon.aerolineas.services;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.halcon.aerolineas.dao.*;
import com.halcon.aerolineas.models.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.*;

import java.math.BigDecimal;
import java.sql.SQLException;
import java.util.*;

public class ReservacionServiceTest {

    @Mock private ReservacionDAO reservacionDAO;
    @Mock private VueloDAO vueloDAO;
    @Mock private PasajeroDAO pasajeroDAO;
    @Mock private UsuarioDAO usuarioDAO;
    @Mock private PdfService pdfService;
    @Mock private EmailService emailService;

    @InjectMocks
    private ReservacionService reservacionService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    // ========================
    // crearReservacion OK
    // ========================

    @Test
    void testCrearReservacionCorrecta() throws Exception {
        Vuelo vuelo = mock(Vuelo.class);
        when(vuelo.getEstado()).thenReturn("ACTIVO");
        when(vuelo.getAsientosDisponibles()).thenReturn(10);
        when(vuelo.getPrecioBase()).thenReturn(new BigDecimal("100"));
        when(vuelo.getTipoAsiento()).thenReturn("ECONOMY");

        when(vueloDAO.findById(1L)).thenReturn(vuelo);
        when(reservacionDAO.create(any())).thenReturn(5L);

        when(pasajeroDAO.findByReservacion(5L)).thenReturn(new ArrayList<>());

        Usuario usuario = mock(Usuario.class);
        when(usuario.getEmail()).thenReturn("test@mail.com");
        when(usuarioDAO.findById(1L)).thenReturn(usuario);

        when(pdfService.generarPDF(any(), any())).thenReturn(new byte[0]);

        when(reservacionDAO.findByCodigo(any())).thenReturn(new Reservacion());

        List<Pasajero> pasajeros = Arrays.asList(
            new Pasajero(), new Pasajero()
        );

        Reservacion result = reservacionService.crearReservacion(
            1L, 1L, pasajeros, "TARJETA"
        );

        assertNotNull(result);

        verify(reservacionDAO).create(any());
        verify(pasajeroDAO, times(2)).create(any());
        verify(emailService).enviarCorreo(any(), any(), any());
    }

    // ========================
    // vuelo no existe
    // ========================

    @Test
    void testCrearReservacionVueloNoExiste() throws SQLException {
        when(vueloDAO.findById(1L)).thenReturn(null);

        assertThrows(IllegalArgumentException.class, () -> {
            reservacionService.crearReservacion(
                1L, 1L, new ArrayList<>(), "TARJETA"
            );
        });
    }

    // ========================
    // vuelo no activo
    // ========================

    @Test
    void testCrearReservacionVueloNoActivo() throws SQLException {
        Vuelo vuelo = mock(Vuelo.class);
        when(vuelo.getEstado()).thenReturn("CANCELADO");

        when(vueloDAO.findById(1L)).thenReturn(vuelo);

        assertThrows(IllegalArgumentException.class, () -> {
            reservacionService.crearReservacion(
                1L, 1L, new ArrayList<>(), "TARJETA"
            );
        });
    }

    // ========================
    // sin asientos
    // ========================

    @Test
    void testCrearReservacionSinAsientos() throws SQLException {
        Vuelo vuelo = mock(Vuelo.class);
        when(vuelo.getEstado()).thenReturn("ACTIVO");
        when(vuelo.getAsientosDisponibles()).thenReturn(1);

        when(vueloDAO.findById(1L)).thenReturn(vuelo);

        List<Pasajero> pasajeros = Arrays.asList(
            new Pasajero(), new Pasajero()
        );

        assertThrows(IllegalArgumentException.class, () -> {
            reservacionService.crearReservacion(
                1L, 1L, pasajeros, "TARJETA"
            );
        });
    }

    // ========================
    // buscarPorCodigo
    // ========================

    @Test
    void testBuscarPorCodigoOK() throws SQLException {
        Reservacion r = new Reservacion();

        when(reservacionDAO.findByCodigo("ABC")).thenReturn(r);

        Reservacion result = reservacionService.buscarPorCodigo("ABC");

        assertNotNull(result);
    }

    @Test
    void testBuscarPorCodigoNoExiste() throws SQLException {
        when(reservacionDAO.findByCodigo("ABC")).thenReturn(null);

        assertThrows(IllegalArgumentException.class, () -> {
            reservacionService.buscarPorCodigo("ABC");
        });
    }

    // ========================
    // cancelarReservacion
    // ========================

    @Test
    void testCancelarReservacionOK() throws SQLException {
        Reservacion r = mock(Reservacion.class);
        when(r.getEstado()).thenReturn("CONFIRMADA");

        when(reservacionDAO.findById(1L)).thenReturn(r);

        reservacionService.cancelarReservacion(1L);

        verify(reservacionDAO).cancelar(1L);
    }

    @Test
    void testCancelarReservacionNoExiste() throws SQLException {
        when(reservacionDAO.findById(1L)).thenReturn(null);

        assertThrows(IllegalArgumentException.class, () -> {
            reservacionService.cancelarReservacion(1L);
        });
    }

    @Test
    void testCancelarReservacionEstadoInvalido() throws SQLException {
        Reservacion r = mock(Reservacion.class);
        when(r.getEstado()).thenReturn("PENDIENTE");

        when(reservacionDAO.findById(1L)).thenReturn(r);

        assertThrows(IllegalArgumentException.class, () -> {
            reservacionService.cancelarReservacion(1L);
        });
    }
}