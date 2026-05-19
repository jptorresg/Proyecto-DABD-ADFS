package com.halcon.aerolineas.dao;

import com.halcon.aerolineas.config.DatabaseConfig;
import com.halcon.aerolineas.models.AgenciaB2B;

import java.sql.*;

/**
 * Acceso a datos para la tabla {@code AGENCIAS_B2B}.
 * <p>
 * Provee la validación del token Bearer que envían las agencias en cada
 * petición a {@code /api/b2b/*}. Si el token está activo, devuelve la
 * agencia correspondiente; de lo contrario devuelve {@code null} para
 * que el filtro/controlador responda 401.
 * </p>
 */
public class AgenciaB2BDAO {

    /**
     * Busca una agencia por su token Bearer.
     *
     * @param token cadena exacta del header {@code Authorization: Bearer ...}
     * @return la agencia si el token existe y está activa, o {@code null}.
     * @throws SQLException si ocurre un error de base de datos.
     */
    public AgenciaB2B validarToken(String token) throws SQLException {
        if (token == null || token.isEmpty()) return null;

        String sql = "SELECT id_agencia, nombre, email, token, activo, fecha_registro " +
                     "FROM AGENCIAS_B2B WHERE token = ? AND activo = 1";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, token);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return null;
                AgenciaB2B a = new AgenciaB2B();
                a.setIdAgencia(rs.getLong("id_agencia"));
                a.setNombre(rs.getString("nombre"));
                a.setEmail(rs.getString("email"));
                a.setToken(rs.getString("token"));
                a.setActivo(rs.getInt("activo") == 1);
                Timestamp ts = rs.getTimestamp("fecha_registro");
                if (ts != null) a.setFechaRegistro(ts.toLocalDateTime());
                return a;
            }
        }
    }
}
