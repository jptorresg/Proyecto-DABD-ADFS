package com.halcon.aerolineas.dao;

import com.halcon.aerolineas.config.DatabaseConfig;
import com.halcon.aerolineas.models.Pais;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class PaisDAO {
    
    /**
     * Listar todos los países (para dropdowns)
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
     * Buscar país por ID
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
     * Buscar país por código alfa2 (GT, MX, US, etc)
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