package com.halcon.aerolineas.services;

import com.halcon.aerolineas.models.ComentarioRating;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class ComentarioServiceTest {

    private final ComentarioService service = new ComentarioService();

    // =========================
    // obtenerComentarios OK
    // =========================

    @Test
    void testObtenerComentariosOK() {
        ComentarioService.ComentarioResponse response =
                service.obtenerComentarios(1);

        assertNotNull(response);
        assertNotNull(response.getComentarios());

        // Promedio puede ser 0 si no hay datos
        assertTrue(response.getPromedio() >= 0);
        assertTrue(response.getTotalRatings() >= 0);
    }

    // =========================
    // crearComentario OK
    // =========================

    @Test
    void testCrearComentarioOK() {
        ComentarioRating comentario = new ComentarioRating();

        comentario.setIdVuelo(1L);
        comentario.setIdUsuario(System.currentTimeMillis());
        comentario.setTextoComentario("Buen vuelo");
        comentario.setRating(5);

        assertDoesNotThrow(() -> {
            service.crearComentario(comentario);
        });
    }
}