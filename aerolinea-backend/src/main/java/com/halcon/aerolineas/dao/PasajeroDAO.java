package com.halcon.aerolineas.dao;

import com.halcon.aerolineas.config.DatabaseConfig;
import com.halcon.aerolineas.models.Pasajero;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Clase de acceso a datos para la entidad {@link Pasajero}.
 * <p>
 * Proporciona métodos para crear pasajeros y obtener los pasajeros asociados
 * a una reservación, incluyendo información de nacionalidad mediante un JOIN
 * con la tabla {@code PAISES}.
 * </p>
 */
public class PasajeroDAO {
    
    /**
     * Crea un nuevo pasajero en la base de datos.
     * <p>
     * Inserta un registro en la tabla {@code PASAJEROS} con los datos del pasajero,
     * utilizando la clave foránea {@code id_reservacion} para vincularlo a una reservación
     * existente y {@code nacionalidad} como referencia a la tabla {@code PAISES}.
     * </p>
     *
     * @param pasajero Objeto {@link Pasajero} con los datos a insertar.
     * @return El ID generado para el nuevo pasajero, o {@code null} si ocurre un error.
     * @throws SQLException Si ocurre un error al ejecutar la inserción.
     */
    public Long create(Pasajero pasajero) throws SQLException {
        String sql = "INSERT INTO PASAJEROS (id_reservacion, nombres, apellidos, " +
                    "fecha_nacimiento, nacionalidad, num_pasaporte, tipo_asiento) " +
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
     * Obtiene la lista de pasajeros asociados a una reservación específica.
     * <p>
     * Realiza un JOIN con la tabla {@code PAISES} para incluir el nombre y código
     * ISO del país de nacionalidad de cada pasajero.
     * </p>
     *
     * @param idReservacion Identificador de la reservación de la cual se obtienen los pasajeros.
     * @return Lista de objetos {@link Pasajero} pertenecientes a la reservación.
     * @throws SQLException Si ocurre un error al ejecutar la consulta.
     */
    public List<Pasajero> findByReservacion(Long idReservacion) throws SQLException {
        List<Pasajero> pasajeros = new ArrayList<>();
        String sql = "SELECT p.*, pa.name as nombre_nacionalidad, pa.alfa2 as codigo_nacionalidad " +
                    "FROM PASAJEROS p " +
                    "LEFT JOIN PAISES pa ON p.nacionalidad = pa.id " +
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
                
                Long idNacionalidad = rs.getLong("nacionalidad");
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