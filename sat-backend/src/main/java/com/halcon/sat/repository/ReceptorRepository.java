package com.halcon.sat.repository;

import com.halcon.sat.model.Receptor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;

@Repository
public class ReceptorRepository {

    private final JdbcTemplate jdbc;

    public ReceptorRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private static final RowMapper<Receptor> MAPPER = (rs, i) -> {
        Receptor r = new Receptor();
        r.setIdReceptor(rs.getLong("id_receptor"));
        r.setNit(rs.getString("nit"));
        r.setNombre(rs.getString("nombre"));
        r.setDireccion(rs.getString("direccion"));
        r.setEmail(rs.getString("email"));
        Timestamp ts = rs.getTimestamp("fecha_registro");
        if (ts != null) r.setFechaRegistro(ts.toLocalDateTime());
        return r;
    };

    private static final String SELECT_ALL =
        "SELECT id_receptor, nit, nombre, direccion, email, fecha_registro FROM RECEPTORES";

    public List<Receptor> findAll() {
        return jdbc.query(SELECT_ALL + " ORDER BY id_receptor", MAPPER);
    }

    public Optional<Receptor> findById(Long id) {
        return jdbc.query(SELECT_ALL + " WHERE id_receptor = ?", MAPPER, id).stream().findFirst();
    }

    public Long create(Receptor r) {
        KeyHolder kh = new GeneratedKeyHolder();
        jdbc.update(con -> {
            PreparedStatement ps = con.prepareStatement(
                "INSERT INTO RECEPTORES (nit, nombre, direccion, email) VALUES (?, ?, ?, ?)",
                new String[]{"id_receptor"});
            ps.setString(1, r.getNit());
            ps.setString(2, r.getNombre());
            ps.setString(3, r.getDireccion());
            ps.setString(4, r.getEmail());
            return ps;
        }, kh);
        return ((Number) kh.getKeys().get("id_receptor")).longValue();
    }
}
