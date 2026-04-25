package com.halcon.aerolineas.dao;

import com.halcon.aerolineas.models.Usuario;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.sql.*;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class UsuarioDAOTest {

    private Connection connection;
    private PreparedStatement stmt;
    private Statement stmtSimple;
    private ResultSet rs;

    private UsuarioDAO usuarioDAO;

    @BeforeEach
    void setUp() throws Exception {
        connection = mock(Connection.class);
        stmt = mock(PreparedStatement.class);
        stmtSimple = mock(Statement.class);
        rs = mock(ResultSet.class);

        usuarioDAO = new UsuarioDAO(connection);
    }

    // =========================================================
    // TEST: findByEmail
    // =========================================================
    @Test
    void testFindByEmail_encontrado() throws Exception {
        when(connection.prepareStatement(anyString())).thenReturn(stmt);
        when(stmt.executeQuery()).thenReturn(rs);

        when(rs.next()).thenReturn(true);
        mockUsuario(rs);

        Usuario u = usuarioDAO.findByEmail("test@mail.com");

        assertNotNull(u);
        assertEquals("test@mail.com", u.getEmail());

        verify(stmt).setString(1, "test@mail.com");
    }

    @Test
    void testFindByEmail_noExiste() throws Exception {
        when(connection.prepareStatement(anyString())).thenReturn(stmt);
        when(stmt.executeQuery()).thenReturn(rs);

        when(rs.next()).thenReturn(false);

        Usuario u = usuarioDAO.findByEmail("no@mail.com");

        assertNull(u);
    }

    // =========================================================
    // TEST: findEmailById
    // =========================================================
    @Test
    void testFindEmailById() throws Exception {
        when(connection.prepareStatement(anyString())).thenReturn(stmt);
        when(stmt.executeQuery()).thenReturn(rs);

        when(rs.next()).thenReturn(true);
        when(rs.getString("email")).thenReturn("user@mail.com");

        String email = usuarioDAO.findEmailById(1L);

        assertEquals("user@mail.com", email);
    }

    // =========================================================
    // TEST: findAll
    // =========================================================
    @Test
    void testFindAll() throws Exception {
        when(connection.createStatement()).thenReturn(stmtSimple);
        when(stmtSimple.executeQuery(anyString())).thenReturn(rs);

        when(rs.next()).thenReturn(true, false);
        mockUsuario(rs);

        List<Usuario> lista = usuarioDAO.findAll();

        assertEquals(1, lista.size());
    }

    // =========================================================
    // TEST: create
    // =========================================================
    @Test
    void testCreate() throws Exception {
        when(connection.prepareStatement(anyString(), any(String[].class))).thenReturn(stmt);
        when(stmt.getGeneratedKeys()).thenReturn(rs);

        when(rs.next()).thenReturn(true);
        when(rs.getLong(1)).thenReturn(5L);

        Usuario u = crearUsuario();

        Long id = usuarioDAO.create(u);

        assertEquals(5L, id);
        verify(stmt).executeUpdate();
    }

    // =========================================================
    // TEST: update
    // =========================================================
    @Test
    void testUpdate_exitoso() throws Exception {
        when(connection.prepareStatement(anyString())).thenReturn(stmt);
        when(stmt.executeUpdate()).thenReturn(1);

        Usuario u = crearUsuario();
        u.setIdUsuario(1L);

        boolean res = usuarioDAO.update(u);

        assertTrue(res);
    }

    @Test
    void testUpdate_fallido() throws Exception {
        when(connection.prepareStatement(anyString())).thenReturn(stmt);
        when(stmt.executeUpdate()).thenReturn(0);

        Usuario u = crearUsuario();
        u.setIdUsuario(1L);

        boolean res = usuarioDAO.update(u);

        assertFalse(res);
    }

    // =========================================================
    // TEST: findById
    // =========================================================
    @Test
    void testFindById() throws Exception {
        when(connection.prepareStatement(anyString())).thenReturn(stmt);
        when(stmt.executeQuery()).thenReturn(rs);

        when(rs.next()).thenReturn(true);
        mockUsuario(rs);

        Usuario u = usuarioDAO.findById(1L);

        assertNotNull(u);
    }

    // =========================================================
    // HELPERS
    // =========================================================

    private void mockUsuario(ResultSet rs) throws Exception {
        when(rs.getLong("id_usuario")).thenReturn(1L);
        when(rs.getString("email")).thenReturn("test@mail.com");
        when(rs.getString("password_hash")).thenReturn("hash");
        when(rs.getString("nombres")).thenReturn("Juan");
        when(rs.getString("apellidos")).thenReturn("Perez");
        when(rs.getInt("edad")).thenReturn(25);

        when(rs.getLong("pais_origen")).thenReturn(1L);
        when(rs.wasNull()).thenReturn(false);

        when(rs.getString("nombre_pais")).thenReturn("Guatemala");
        when(rs.getString("codigo_pais")).thenReturn("GT");

        when(rs.getString("num_pasaporte")).thenReturn("12345");
        when(rs.getString("tipo_usuario")).thenReturn("CLIENTE");
        when(rs.getInt("activo")).thenReturn(1);

        when(rs.getTimestamp("fecha_registro"))
                .thenReturn(Timestamp.valueOf(LocalDateTime.now()));
    }

    private Usuario crearUsuario() {
        Usuario u = new Usuario();
        u.setEmail("test@mail.com");
        u.setPasswordHash("hash");
        u.setNombres("Juan");
        u.setApellidos("Perez");
        u.setEdad(25);
        u.setIdPaisOrigen(1L);
        u.setNumPasaporte("12345");
        u.setTipoUsuario("CLIENTE");
        return u;
    }
}