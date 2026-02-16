package com.halcon.aerolineas.dao;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;

import com.halcon.aerolineas.config.DatabaseConfig;
import com.halcon.aerolineas.models.Usuario;

public class UsuarioDAO {
    
    /**
     * Buscar por email (para login) - CON JOIN a PAISES
     */
    public Usuario findByEmail(String email) throws SQLException {
        String sql = "SELECT u.*, p.name as nombre_pais, p.alfa2 as codigo_pais " +
                    "FROM USUARIOS u " +
                    "LEFT JOIN PAISES p ON u.pais_origen = p.id " +
                    "WHERE u.email = ?";
        
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setString(1, email);
            ResultSet rs = stmt.executeQuery();
            
            if (rs.next()) {
                return mapResultSetToUsuario(rs);
            }
        }
        
        return null;
    }
    
    /**
     * Listar todos con información de país
     */
    public List<Usuario> findAll() throws SQLException {
        List<Usuario> usuarios = new ArrayList<>();
        String sql = "SELECT u.*, p.name as nombre_pais, p.alfa2 as codigo_pais " +
                    "FROM USUARIOS u " +
                    "LEFT JOIN PAISES p ON u.pais_origen = p.id " +
                    "ORDER BY u.fecha_registro DESC";
        
        try (Connection conn = DatabaseConfig.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            
            while (rs.next()) {
                usuarios.add(mapResultSetToUsuario(rs));
            }
        }
        
        return usuarios;
    }
    
    /**
     * Crear nuevo usuario - ACTUALIZADO
     */
    public Long create(Usuario usuario) throws SQLException {
        String sql = "INSERT INTO USUARIOS (email, password_hash, nombres, apellidos, edad, " +
                    "pais_origen, num_pasaporte, tipo_usuario) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, new String[]{"id_usuario"})) {
            
            stmt.setString(1, usuario.getEmail());
            stmt.setString(2, usuario.getPasswordHash());
            stmt.setString(3, usuario.getNombres());
            stmt.setString(4, usuario.getApellidos());
            stmt.setInt(5, usuario.getEdad());
            stmt.setLong(6, usuario.getIdPaisOrigen()); // ← CAMBIO: ahora es Long
            stmt.setString(7, usuario.getNumPasaporte());
            stmt.setString(8, usuario.getTipoUsuario());
            
            stmt.executeUpdate();
            
            ResultSet rs = stmt.getGeneratedKeys();
            if (rs.next()) {
                return rs.getLong(1);
            }
        }
        
        return null;
    }
    
    /**
     * Actualizar usuario
     */
    public boolean update(Usuario usuario) throws SQLException {
        String sql = "UPDATE USUARIOS SET email = ?, nombres = ?, apellidos = ?, " +
                    "edad = ?, pais_origen = ?, num_pasaporte = ?, tipo_usuario = ?, " +
                    "activo = ? WHERE id_usuario = ?";
        
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setString(1, usuario.getEmail());
            stmt.setString(2, usuario.getNombres());
            stmt.setString(3, usuario.getApellidos());
            stmt.setInt(4, usuario.getEdad());
            stmt.setLong(5, usuario.getIdPaisOrigen()); // ← CAMBIO
            stmt.setString(6, usuario.getNumPasaporte());
            stmt.setString(7, usuario.getTipoUsuario());
            stmt.setInt(8, usuario.isActivo() ? 1 : 0);
            stmt.setLong(9, usuario.getIdUsuario());
            
            return stmt.executeUpdate() > 0;
        }
    }
    
    /**
     * Buscar por ID
     */
    public Usuario findById(Long id) throws SQLException {
        String sql = "SELECT u.*, p.name as nombre_pais, p.alfa2 as codigo_pais " +
                    "FROM USUARIOS u " +
                    "LEFT JOIN PAISES p ON u.pais_origen = p.id " +
                    "WHERE u.id_usuario = ?";
        
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, id);
            ResultSet rs = stmt.executeQuery();
            
            if (rs.next()) {
                return mapResultSetToUsuario(rs);
            }
        }
        
        return null;
    }
    
    /**
     * Helper: mapear ResultSet a Usuario (CON datos de país)
     */
    private Usuario mapResultSetToUsuario(ResultSet rs) throws SQLException {
        Usuario u = new Usuario();
        u.setIdUsuario(rs.getLong("id_usuario"));
        u.setEmail(rs.getString("email"));
        u.setPasswordHash(rs.getString("password_hash"));
        u.setNombres(rs.getString("nombres"));
        u.setApellidos(rs.getString("apellidos"));
        u.setEdad(rs.getInt("edad"));
        
        Long idPais = rs.getLong("pais_origen");
        if (!rs.wasNull()) {
            u.setIdPaisOrigen(idPais);
            u.setNombrePais(rs.getString("nombre_pais"));
            u.setCodigoPais(rs.getString("codigo_pais"));
        }
        
        u.setNumPasaporte(rs.getString("num_pasaporte"));
        u.setTipoUsuario(rs.getString("tipo_usuario"));
        u.setActivo(rs.getInt("activo") == 1);
        
        Timestamp fechaRegistro = rs.getTimestamp("fecha_registro");
        if (fechaRegistro != null) {
            u.setFechaRegistro(fechaRegistro.toLocalDateTime());
        }
        
        return u;
    }
    
    /**
     * Main de prueba - ACTUALIZADO
     */
    public static void main(String[] args) {
        UsuarioDAO dao = new UsuarioDAO();
        try {
            System.out.println("=== PROBANDO UsuarioDAO (con PAISES) ===\n");
            
            Usuario admin = dao.findByEmail("admin@halcon.com");
            if (admin != null) {
                System.out.println("✅ Usuario encontrado:");
                System.out.println("   Nombre: " + admin.getNombres() + " " + admin.getApellidos());
                System.out.println("   País: " + admin.getNombrePais() + " (" + admin.getCodigoPais() + ")");
                System.out.println("   Tipo: " + admin.getTipoUsuario());
            } else {
                System.out.println("❌ Usuario no encontrado");
            }
            
            List<Usuario> todos = dao.findAll();
            System.out.println("\n📋 Total usuarios: " + todos.size());
            for (Usuario u : todos) {
                System.out.println("   - " + u.getEmail() + " | " + u.getNombrePais());
            }
            
        } catch (SQLException e) {
            System.err.println("❌ Error: " + e.getMessage());
            e.printStackTrace();
        }
    }
}