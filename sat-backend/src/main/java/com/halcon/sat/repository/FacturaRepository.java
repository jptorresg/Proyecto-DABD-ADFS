package com.halcon.sat.repository;

import com.halcon.sat.model.DetalleFactura;
import com.halcon.sat.model.Factura;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
public class FacturaRepository {

    private final JdbcTemplate jdbc;

    public FacturaRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private static final RowMapper<Factura> FACTURA_MAPPER = (rs, i) -> {
        Factura f = new Factura();
        f.setIdFactura(rs.getLong("id_factura"));
        f.setSerie(rs.getString("serie"));
        f.setNumero(rs.getLong("numero"));
        f.setIdEmisor(rs.getLong("id_emisor"));
        f.setIdReceptor(rs.getLong("id_receptor"));
        Timestamp ts = rs.getTimestamp("fecha_emision");
        if (ts != null) f.setFechaEmision(ts.toLocalDateTime());
        f.setSubtotal(rs.getBigDecimal("subtotal"));
        f.setImpuesto(rs.getBigDecimal("impuesto"));
        f.setTotal(rs.getBigDecimal("total"));
        f.setEstado(rs.getString("estado"));
        f.setReferenciaExterna(rs.getString("referencia_externa"));
        return f;
    };

    private static final RowMapper<DetalleFactura> DETALLE_MAPPER = (rs, i) -> {
        DetalleFactura d = new DetalleFactura();
        d.setIdDetalle(rs.getLong("id_detalle"));
        d.setIdFactura(rs.getLong("id_factura"));
        d.setDescripcion(rs.getString("descripcion"));
        d.setCantidad(rs.getBigDecimal("cantidad"));
        d.setPrecioUnitario(rs.getBigDecimal("precio_unitario"));
        d.setSubtotal(rs.getBigDecimal("subtotal"));
        return d;
    };

    private static final String SELECT_FACTURA =
        "SELECT id_factura, serie, numero, id_emisor, id_receptor, fecha_emision, "
      + "subtotal, impuesto, total, estado, referencia_externa FROM FACTURAS";

    public List<Factura> findAll(String estado, Long idEmisor) {
        StringBuilder sql = new StringBuilder(SELECT_FACTURA).append(" WHERE 1=1");
        List<Object> args = new ArrayList<>();
        if (estado != null && !estado.isBlank()) {
            sql.append(" AND estado = ?");
            args.add(estado);
        }
        if (idEmisor != null) {
            sql.append(" AND id_emisor = ?");
            args.add(idEmisor);
        }
        sql.append(" ORDER BY id_factura DESC");
        return jdbc.query(sql.toString(), FACTURA_MAPPER, args.toArray());
    }

    public Optional<Factura> findById(Long id) {
        Optional<Factura> f = jdbc.query(SELECT_FACTURA + " WHERE id_factura = ?", FACTURA_MAPPER, id)
            .stream().findFirst();
        f.ifPresent(factura -> factura.setDetalles(findDetallesByFactura(factura.getIdFactura())));
        return f;
    }

    public List<DetalleFactura> findDetallesByFactura(Long idFactura) {
        return jdbc.query(
            "SELECT id_detalle, id_factura, descripcion, cantidad, precio_unitario, subtotal "
          + "FROM DETALLE_FACTURA WHERE id_factura = ? ORDER BY id_detalle",
            DETALLE_MAPPER, idFactura);
    }

    public Long nextNumero(String serie) {
        Long max = jdbc.queryForObject(
            "SELECT NVL(MAX(numero), 0) FROM FACTURAS WHERE serie = ?", Long.class, serie);
        return (max == null ? 0L : max) + 1L;
    }

    public Long createFactura(Factura f) {
        KeyHolder kh = new GeneratedKeyHolder();
        jdbc.update(con -> {
            PreparedStatement ps = con.prepareStatement(
                "INSERT INTO FACTURAS (serie, numero, id_emisor, id_receptor, "
              + "subtotal, impuesto, total, estado, referencia_externa) "
              + "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                new String[]{"id_factura"});
            ps.setString(1, f.getSerie());
            ps.setLong(2, f.getNumero());
            ps.setLong(3, f.getIdEmisor());
            ps.setLong(4, f.getIdReceptor());
            ps.setBigDecimal(5, f.getSubtotal());
            ps.setBigDecimal(6, f.getImpuesto());
            ps.setBigDecimal(7, f.getTotal());
            ps.setString(8, f.getEstado());
            ps.setString(9, f.getReferenciaExterna());
            return ps;
        }, kh);
        return ((Number) kh.getKeys().get("id_factura")).longValue();
    }

    public void insertDetalle(DetalleFactura d) {
        jdbc.update(
            "INSERT INTO DETALLE_FACTURA (id_factura, descripcion, cantidad, precio_unitario, subtotal) "
          + "VALUES (?, ?, ?, ?, ?)",
            d.getIdFactura(), d.getDescripcion(), d.getCantidad(),
            d.getPrecioUnitario(), d.getSubtotal());
    }
}
