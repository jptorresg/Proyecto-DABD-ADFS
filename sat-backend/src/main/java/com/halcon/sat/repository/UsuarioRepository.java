package com.halcon.sat.repository;

import com.halcon.sat.model.Usuario;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.util.Optional;

@Repository
public class UsuarioRepository {

    private final JdbcTemplate jdbc;

    public UsuarioRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private static final RowMapper<Usuario> MAPPER = (rs, i) -> {
        Usuario u = new Usuario();
        u.setIdUsuario(rs.getLong("id_usuario"));
        u.setEmail(rs.getString("email"));
        u.setPasswordHash(rs.getString("password_hash"));
        u.setNombres(rs.getString("nombres"));
        u.setApellidos(rs.getString("apellidos"));
        u.setTipoUsuario(rs.getString("tipo_usuario"));
        u.setActivo(rs.getInt("activo") == 1);
        Timestamp ts = rs.getTimestamp("fecha_registro");
        if (ts != null) u.setFechaRegistro(ts.toLocalDateTime());
        return u;
    };

    public Optional<Usuario> findByEmail(String email) {
        String sql = "SELECT id_usuario, email, password_hash, nombres, apellidos, "
                   + "tipo_usuario, activo, fecha_registro "
                   + "FROM USUARIOS WHERE email = ?";
        return jdbc.query(sql, MAPPER, email).stream().findFirst();
    }
}
