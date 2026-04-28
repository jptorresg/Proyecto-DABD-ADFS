package com.halcon.aerolineas.dao;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Date;
import java.time.LocalDate;

import com.halcon.aerolineas.config.DatabaseConfig;

public class BusquedaLogDAO {

    public void guardarLog(
        String tipoBusqueda,
        String origen,
        String destino,
        LocalDate fechaSalida,
        LocalDate fechaRegreso,
        String tipoAsiento,
        Long usuarioId,
        boolean esAgencia,
        String tipoOrigen
    ) throws SQLException {

        String sql = "INSERT INTO LOG_BUSQUEDAS " +
                     "(tipo_busqueda, origen, destino, fecha_salida, fecha_regreso, tipo_asiento, usuario_id, es_agencia, tipo_origen) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, tipoBusqueda);
            stmt.setString(2, origen);
            stmt.setString(3, destino);
            stmt.setDate(4, fechaSalida != null ? Date.valueOf(fechaSalida) : null);
            stmt.setDate(5, fechaRegreso != null ? Date.valueOf(fechaRegreso) : null);
            stmt.setString(6, tipoAsiento);
            stmt.setObject(7, usuarioId);
            stmt.setInt(8, esAgencia ? 1 : 0);
            stmt.setString(9, tipoOrigen);

            stmt.executeUpdate();
        }
    }
}