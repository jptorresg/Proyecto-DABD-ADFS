package com.halcon.aerolineas.dao;

import com.halcon.aerolineas.config.DatabaseConfig;
import com.halcon.aerolineas.models.Pasajero;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class PasajeroDAO {
    
    /**
     * Crear pasajero - ACTUALIZADO con FK a PAISES
     */
    public Long create(Pasajero pasajero) throws SQLException {
        String sql = "INSERT INTO PASAJEROS (id_reservacion, nombres, apellidos, " +
                    "fecha_nacimiento, id_nacionalidad, num_pasaporte, tipo_asiento) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?)";
        
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, new String[]{"id_pasajero"})) {
            
            stmt.setLong(1, pasajero.getIdReservacion());
            stmt.setString(2, pasajero.getNombres());
            stmt.setString(3, pasajero.getApellidos());
            stmt.setDate(4, Date.valueOf(pasajero.getFechaNacimiento()));
            stmt.setLong(5, pasajero.getIdNacionalidad()); // ← CAMBIO: ahora es Long
            stmt.setString(6, pasajero.getNumPasaporte());
            stmt.setString(7, pasajero.getTipoAsiento());
            
            stmt.executeUpdate();
            
            ResultSet rs = stmt.getGeneratedKeys();
            if (rs.next()) {
                return rs.getLong(1);
            }
        }
        
        return null;
    }
    
    /**
     * Obtener pasajeros de una reservación - CON JOIN a PAISES
     */
    public List<Pasajero> findByReservacion(Long idReservacion) throws SQLException {
        List<Pasajero> pasajeros = new ArrayList<>();
        String sql = "SELECT p.*, pa.name as nombre_nacionalidad, pa.alfa2 as codigo_nacionalidad " +
                    "FROM PASAJEROS p " +
                    "LEFT JOIN PAISES pa ON p.id_nacionalidad = pa.id " +
                    "WHERE p.id_reservacion = ?";
        
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, idReservacion);
            ResultSet rs = stmt.executeQuery();
            
            while (rs.next()) {
                Pasajero p = new Pasajero();
                p.setIdPasajero(rs.getLong("id_pasajero"));
                p.setIdReservacion(rs.getLong("id_reservacion"));
                p.setNombres(rs.getString("nombres"));
                p.setApellidos(rs.getString("apellidos"));
                p.setFechaNacimiento(rs.getDate("fecha_nacimiento").toLocalDate());
                
                Long idNacionalidad = rs.getLong("id_nacionalidad");
                if (!rs.wasNull()) {
                    p.setIdNacionalidad(idNacionalidad);
                    p.setNombreNacionalidad(rs.getString("nombre_nacionalidad"));
                    p.setCodigoNacionalidad(rs.getString("codigo_nacionalidad"));
                }
                
                p.setNumPasaporte(rs.getString("num_pasaporte"));
                p.setTipoAsiento(rs.getString("tipo_asiento"));
                pasajeros.add(p);
            }
        }
        
        return pasajeros;
    }
}