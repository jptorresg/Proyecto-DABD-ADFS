package com.halcon.aerolineas.services;

import com.halcon.aerolineas.dao.AdminDAO;
import com.halcon.aerolineas.utils.PasswordUtil;

import java.math.BigDecimal;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

public class AdminService {

    private AdminDAO adminDAO;

    public AdminService() {
        this.adminDAO = new AdminDAO();
    }

    public Map<String, Object> obtenerEstadisticas() throws SQLException {

        Map<String, Object> stats = new HashMap<>();

        stats.put("vuelosActivos", adminDAO.contarVuelosActivosHoy());
        stats.put("reservacionesMes", adminDAO.contarReservacionesMes());
        stats.put("usuariosRegistrados", adminDAO.contarUsuarios());
        stats.put("ingresosEstimados", adminDAO.calcularIngresosMes());

        return stats;
    }

    public List<Map<String, Object>> obtenerUsuarios() throws SQLException {
        return adminDAO.obtenerUsuarios();
    }

    public boolean actualizarRolUsuario(int userId, String nuevoRol) throws SQLException {
        return adminDAO.actualizarRolUsuario(userId, nuevoRol);
    }
}