package com.halcon.aerolineas.services;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

public class AdminServiceTest {

    private final AdminService service = new AdminService();

    // =========================
    // obtenerEstadisticas
    // =========================

    @Test
    void testObtenerEstadisticasEstructura() throws Exception {
        Map<String, Object> stats = service.obtenerEstadisticas();

        assertNotNull(stats);

        // Validar llaves esperadas
        assertTrue(stats.containsKey("vuelosActivos"));
        assertTrue(stats.containsKey("reservacionesMes"));
        assertTrue(stats.containsKey("usuariosRegistrados"));
        assertTrue(stats.containsKey("ingresosEstimados"));
    }

    // =========================
    // obtenerUsuarios
    // =========================

    @Test
    void testObtenerUsuariosNoNull() throws Exception {
        List<Map<String, Object>> usuarios = service.obtenerUsuarios();

        assertNotNull(usuarios);
    }

    // =========================
    // actualizarRolUsuario
    // =========================

    @Test
    void testActualizarRolUsuarioRetornaBoolean() throws Exception {
        boolean resultado = service.actualizarRolUsuario(1, "ADMIN");

        // No sabemos si será true o false (depende BD)
        // pero al menos validamos que no explote
        assertNotNull(resultado);
    }
}