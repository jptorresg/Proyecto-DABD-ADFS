package com.halcon.aerolineas.dao;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.halcon.aerolineas.config.DatabaseConfig;

public class AdminDAO {

    public int contarVuelosActivosHoy() throws SQLException {

        String sql =
            "SELECT COUNT(*) " +
            "FROM VUELOS " +
            "WHERE estado = 'ACTIVO' ";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            if (rs.next()) {
                return rs.getInt(1);
            }
        } catch (Exception e) {
            e.printStackTrace();   // 👈 LOG IMPORTANTE
        }

        return 0;
    }


    public int contarUsuarios() throws SQLException {

        String sql = "SELECT COUNT(*) FROM USUARIOS";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            if (rs.next()) {
                return rs.getInt(1);
            }
        } catch (Exception e) {
            e.printStackTrace();   // 👈 LOG IMPORTANTE
        }

        return 0;
    }


    public double calcularIngresosMes() throws SQLException {

        String sql =
            "SELECT NVL(SUM(precio_total),0) " +
            "FROM RESERVACIONES " +
            "WHERE EXTRACT(MONTH FROM fecha_compra) = EXTRACT(MONTH FROM SYSDATE)" +
            "AND EXTRACT(YEAR FROM fecha_compra) = EXTRACT(YEAR FROM SYSDATE)";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            if (rs.next()) {
                return rs.getDouble(1);
            }
        } catch (Exception e) {
            e.printStackTrace();   // 👈 LOG IMPORTANTE
        }

        return 0;
    }

    public int contarReservacionesMes() {

        String sql =
            "SELECT COUNT(*) " +
            "FROM RESERVACIONES " +
            "WHERE EXTRACT(MONTH FROM FECHA_COMPRA) = EXTRACT(MONTH FROM SYSDATE) " +
            "AND EXTRACT(YEAR FROM FECHA_COMPRA) = EXTRACT(YEAR FROM SYSDATE)";

        try (Connection conn = DatabaseConfig.getConnection();
            PreparedStatement stmt = conn.prepareStatement(sql);
            ResultSet rs = stmt.executeQuery()) {

            if (rs.next()) {
                return rs.getInt(1);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return 0;
    }

    public List<Map<String, Object>> obtenerUsuarios() {

        List<Map<String, Object>> usuarios = new ArrayList<>();

        String sql =
            "SELECT ID_USUARIO, EMAIL, NOMBRES, APELLIDOS, EDAD, PAIS_ORIGEN, " +
            "NUM_PASAPORTE, TIPO_USUARIO, FECHA_REGISTRO, ACTIVO " +
            "FROM USUARIOS";

        try (Connection conn = DatabaseConfig.getConnection();
            PreparedStatement stmt = conn.prepareStatement(sql);
            ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {

                Map<String, Object> user = new HashMap<>();

                user.put("id", rs.getInt("ID_USUARIO"));
                user.put("email", rs.getString("EMAIL"));
                user.put("nombres", rs.getString("NOMBRES"));
                user.put("apellidos", rs.getString("APELLIDOS"));
                user.put("edad", rs.getInt("EDAD"));
                user.put("pais", rs.getString("PAIS_ORIGEN"));
                user.put("numPasaporte", rs.getString("NUM_PASAPORTE"));
                user.put("tipoUsuario", rs.getString("TIPO_USUARIO"));
                user.put("fechaRegistro", rs.getDate("FECHA_REGISTRO"));
                user.put("activo", rs.getInt("ACTIVO"));

                usuarios.add(user);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return usuarios;
    }

    public boolean actualizarRolUsuario(int userId, String nuevoRol) {

        String sql = 
            "UPDATE USUARIOS " +
            "SET TIPO_USUARIO = ? " +
            "WHERE ID_USUARIO = ?";

        try (Connection conn = DatabaseConfig.getConnection();
            PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, nuevoRol);
            stmt.setInt(2, userId);

            int rows = stmt.executeUpdate();

            return rows > 0;

        } catch (Exception e) {
            e.printStackTrace();
        }

        return false;
    }
}