package com.halcon.aerolineas.services;

import static org.junit.jupiter.api.Assertions.*;

import com.halcon.aerolineas.models.*;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.*;

public class PdfServiceTest {

    private PdfService pdfService = new PdfService();

    @Test
    void testGenerarPDFCorrecto() {
        Reservacion reservacion = new Reservacion();
        reservacion.setCodigoReservacion("ABC123");
        reservacion.setEstado("CONFIRMADA");
        reservacion.setPrecioTotal(new BigDecimal("200"));

        Vuelo vuelo = new Vuelo();
        vuelo.setCodigoVuelo("HA123");
        vuelo.setOrigenCodigoIata("GUA");
        vuelo.setDestinoCodigoIata("MEX");
        vuelo.setHoraSalida("10:00");

        reservacion.setVuelo(vuelo);

        Pasajero p1 = new Pasajero();
        p1.setNombres("Juan");
        p1.setApellidos("Perez");
        p1.setNumPasaporte("123456");

        Pasajero p2 = new Pasajero();
        p2.setNombres("Ana");
        p2.setApellidos("Lopez");
        p2.setNumPasaporte("789012");

        List<Pasajero> pasajeros = Arrays.asList(p1, p2);

        byte[] pdf = pdfService.generarPDF(reservacion, pasajeros);

        assertNotNull(pdf);
        assertTrue(pdf.length > 0);
    }

    @Test
    void testGenerarPDFConListaVacia() {
        Reservacion reservacion = new Reservacion();
        reservacion.setCodigoReservacion("EMPTY");
        reservacion.setEstado("CONFIRMADA");
        reservacion.setPrecioTotal(new BigDecimal("0"));

        byte[] pdf = pdfService.generarPDF(reservacion, new ArrayList<>());

        assertNotNull(pdf);
        assertTrue(pdf.length > 0);
    }
}