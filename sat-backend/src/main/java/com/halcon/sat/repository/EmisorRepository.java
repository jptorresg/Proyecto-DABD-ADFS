package com.halcon.sat.repository;

import com.halcon.sat.model.Emisor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;

@Repository
public class EmisorRepository {

    private final JdbcTemplate jdbc;

    public EmisorRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private static final RowMapper<Emisor> MAPPER = (rs, i) -> {
        Emisor e = new Emisor();
        e.setIdEmisor(rs.getLong("id_emisor"));
        e.setNit(rs.getString("nit"));
        e.setNombre(rs.getString("nombre"));
        e.setDireccion(rs.getString("direccion"));
        e.setTelefono(rs.getString("telefono"));
        e.setEmail(rs.getString("email"));
        e.setTipo(rs.getString("tipo"));
        e.setActivo(rs.getInt("activo") == 1);
        Timestamp ts = rs.getTimestamp("fecha_registro");
        if (ts != null) e.setFechaRegistro(ts.toLocalDateTime());
        return e;
    };

    private static final String SELECT_ALL =
        "SELECT id_emisor, nit, nombre, direccion, telefono, email, tipo, activo, fecha_registro FROM EMISORES";

    public List<Emisor> findAll() {
        return jdbc.query(SELECT_ALL + " ORDER BY id_emisor", MAPPER);
    }

    public Optional<Emisor> findById(Long id) {
        return jdbc.query(SELECT_ALL + " WHERE id_emisor = ?", MAPPER, id).stream().findFirst();
    }
}
