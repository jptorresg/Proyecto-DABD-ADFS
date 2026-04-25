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

/**
 * Clase de acceso a datos para la entidad {@link Usuario}.
 * <p>
 * Proporciona métodos para crear, buscar, listar y actualizar usuarios en la base de datos,
 * incluyendo información del país de origen mediante un JOIN con la tabla {@code PAISES}.
 * </p>
 */
public class UsuarioDAO {

    private Connection connection;

    // Producción
    public UsuarioDAO() {}

    // Testing
    public UsuarioDAO(Connection connection) {
        this.connection = connection;
    }

    private Connection getConnection() throws SQLException {
        if (connection != null) {
            return connection;
        }
        return DatabaseConfig.getConnection();
    }
    
    /**
     * Busca un usuario por su dirección de correo electrónico.
     * <p>
     * Utilizado principalmente durante el proceso de inicio de sesión. La consulta
     * incluye un JOIN con la tabla {@code PAISES} para obtener el nombre y código
     * ISO del país de origen.
     * </p>
     *
     * @param email Correo electrónico del usuario a buscar.
     * @return Objeto {@link Usuario} correspondiente al email, o {@code null} si no existe.
     * @throws SQLException Si ocurre un error en la consulta a la base de datos.
     */
    public Usuario findByEmail(String email) throws SQLException {
        String sql = "SELECT u.*, p.name as nombre_pais, p.alfa2 as codigo_pais " +
                    "FROM USUARIOS u " +
                    "LEFT JOIN PAISES p ON u.pais_origen = p.id " +
                    "WHERE u.email = ?";
        
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setString(1, email);
            ResultSet rs = stmt.executeQuery();
            
            if (rs.next()) {
                return mapResultSetToUsuario(rs);
            }
        }
        
        return null;
    }

    public String findEmailById(Long idUsuario) throws SQLException {
        String sql = "SELECT email FROM USUARIOS WHERE id_usuario = ?";

        try (Connection conn = getConnection();
            PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setLong(1, idUsuario);
            ResultSet rs = stmt.executeQuery();

            if (rs.next()) {
                return rs.getString("email");
            }
        }

        return null;
    }
    
    /**
     * Obtiene la lista completa de usuarios registrados en el sistema.
     * <p>
     * Los resultados incluyen la información del país de origen y se ordenan
     * por fecha de registro en orden descendente (los más recientes primero).
     * </p>
     *
     * @return Lista de objetos {@link Usuario} con todos los usuarios.
     * @throws SQLException Si ocurre un error en la consulta a la base de datos.
     */
    public List<Usuario> findAll() throws SQLException {
        List<Usuario> usuarios = new ArrayList<>();
        String sql = "SELECT u.*, p.name as nombre_pais, p.alfa2 as codigo_pais " +
                    "FROM USUARIOS u " +
                    "LEFT JOIN PAISES p ON u.pais_origen = p.id " +
                    "ORDER BY u.fecha_registro DESC";
        
        try (Connection conn = getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            
            while (rs.next()) {
                usuarios.add(mapResultSetToUsuario(rs));
            }
        }
        
        return usuarios;
    }
    
    /**
     * Crea un nuevo usuario en la base de datos.
     *
     * @param usuario Objeto {@link Usuario} con los datos del nuevo usuario a insertar.
     * @return El ID generado para el usuario creado, o {@code null} si ocurre un error.
     * @throws SQLException Si ocurre un error durante la inserción.
     */
    public Long create(Usuario usuario) throws SQLException {
        String sql = "INSERT INTO USUARIOS (email, password_hash, nombres, apellidos, edad, " +
                    "pais_origen, num_pasaporte, tipo_usuario) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        
        try (Connection conn = getConnection();
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
     * Actualiza los datos de un usuario existente.
     *
     * @param usuario Objeto {@link Usuario} con los datos actualizados (debe incluir el ID).
     * @return {@code true} si la actualización afectó al menos un registro, {@code false} en caso contrario.
     * @throws SQLException Si ocurre un error durante la actualización.
     */
    public boolean update(Usuario usuario) throws SQLException {
        String sql = "UPDATE USUARIOS SET email = ?, nombres = ?, apellidos = ?, " +
                    "edad = ?, pais_origen = ?, num_pasaporte = ?, tipo_usuario = ?, " +
                    "activo = ? WHERE id_usuario = ?";
        
        try (Connection conn = getConnection();
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
     * Busca un usuario por su identificador único.
     *
     * @param id ID del usuario a buscar.
     * @return Objeto {@link Usuario} correspondiente al ID, o {@code null} si no existe.
     * @throws SQLException Si ocurre un error en la consulta.
     */
    public Usuario findById(Long id) throws SQLException {
        String sql = "SELECT u.*, p.name as nombre_pais, p.alfa2 as codigo_pais " +
                    "FROM USUARIOS u " +
                    "LEFT JOIN PAISES p ON u.pais_origen = p.id " +
                    "WHERE u.id_usuario = ?";
        
        try (Connection conn = getConnection();
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
     * Método auxiliar para mapear un {@link ResultSet} a un objeto {@link Usuario}.
     * <p>
     * Extrae los valores de las columnas y los asigna a las propiedades correspondientes
     * del usuario, incluyendo los datos del país obtenidos mediante JOIN.
     * </p>
     *
     * @param rs El {@code ResultSet} posicionado en la fila a mapear.
     * @return Un objeto {@link Usuario} completamente poblado.
     * @throws SQLException Si ocurre un error al leer los valores del {@code ResultSet}.
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
     * Método principal para probar la funcionalidad del DAO de usuarios.
     * <p>
     * Realiza una prueba de búsqueda por email y lista todos los usuarios,
     * mostrando información básica en la consola.
     * </p>
     *
     * @param args Argumentos de línea de comandos (no utilizados).
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
            throw new RuntimeException("Error en la operación de base de datos", e);
        }
    }
}