package com.halcon.aerolineas.dao;

import com.halcon.aerolineas.config.DatabaseConfig;
import com.halcon.aerolineas.models.Pais;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Clase de acceso a datos para la entidad {@link Pais}.
 * <p>
 * Proporciona operaciones CRUD básicas para la tabla {@code PAISES},
 * utilizada principalmente para llenar listas desplegables y obtener
 * información de países por diferentes criterios.
 * </p>
 */
public class PaisDAO {
    
    /**
     * Obtiene la lista completa de países ordenados alfabéticamente por nombre.
     * <p>
     * Útil para alimentar componentes de selección (dropdowns) en la interfaz
     * de usuario.
     * </p>
     *
     * @return Lista de objetos {@link Pais} con todos los países registrados.
     * @throws SQLException Si ocurre un error al ejecutar la consulta.
     */
    public List<Pais> findAll() throws SQLException {
        List<Pais> paises = new ArrayList<>();
        String sql = "SELECT * FROM PAISES ORDER BY name";
        
        try (Connection conn = DatabaseConfig.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            
            while (rs.next()) {
                Pais p = new Pais();
                p.setId(rs.getLong("id"));
                p.setName(rs.getString("name"));
                p.setIsoName(rs.getString("iso_name"));
                p.setAlfa2(rs.getString("alfa2"));
                p.setAlfa3(rs.getString("alfa3"));
                p.setNumerico(rs.getInt("numerico"));
                paises.add(p);
            }
        }
        
        return paises;
    }
    
    /**
     * Busca un país por su identificador único.
     *
     * @param id Identificador del país en la base de datos.
     * @return Objeto {@link Pais} correspondiente al ID, o {@code null} si no se encuentra.
     * @throws SQLException Si ocurre un error al ejecutar la consulta.
     */
    public Pais findById(Long id) throws SQLException {
        String sql = "SELECT * FROM PAISES WHERE id = ?";
        
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, id);
            ResultSet rs = stmt.executeQuery();
            
            if (rs.next()) {
                Pais p = new Pais();
                p.setId(rs.getLong("id"));
                p.setName(rs.getString("name"));
                p.setIsoName(rs.getString("iso_name"));
                p.setAlfa2(rs.getString("alfa2"));
                p.setAlfa3(rs.getString("alfa3"));
                p.setNumerico(rs.getInt("numerico"));
                return p;
            }
        }
        
        return null;
    }
    
    /**
     * Busca un país por su código ISO alfa-2.
     * <p>
     * Ejemplos de códigos: GT (Guatemala), MX (México), US (Estados Unidos).
     * </p>
     *
     * @param alfa2 Código ISO alfa-2 del país (dos letras).
     * @return Objeto {@link Pais} que coincide con el código, o {@code null} si no existe.
     * @throws SQLException Si ocurre un error al ejecutar la consulta.
     */
    public Pais findByAlfa2(String alfa2) throws SQLException {
        String sql = "SELECT * FROM PAISES WHERE alfa2 = ?";
        
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setString(1, alfa2);
            ResultSet rs = stmt.executeQuery();
            
            if (rs.next()) {
                Pais p = new Pais();
                p.setId(rs.getLong("id"));
                p.setName(rs.getString("name"));
                p.setAlfa2(rs.getString("alfa2"));
                return p;
            }
        }
        
        return null;
    }
}