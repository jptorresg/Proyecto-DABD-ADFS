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

    public Optional<Factura> findByReferenciaExterna(String referencia) {
        Optional<Factura> f = jdbc.query(SELECT_FACTURA + " WHERE referencia_externa = ?",
            FACTURA_MAPPER, referencia).stream().findFirst();
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

    // ---------- Agregados / reportes ----------

    public java.math.BigDecimal sumTotal() {
        java.math.BigDecimal v = jdbc.queryForObject(
            "SELECT NVL(SUM(total), 0) FROM FACTURAS WHERE estado <> 'ANULADA'",
            java.math.BigDecimal.class);
        return v == null ? java.math.BigDecimal.ZERO : v;
    }

    public long countByEstado(String estado) {
        Long c = jdbc.queryForObject(
            "SELECT COUNT(*) FROM FACTURAS WHERE estado = ?", Long.class, estado);
        return c == null ? 0L : c;
    }

    public long count() {
        Long c = jdbc.queryForObject("SELECT COUNT(*) FROM FACTURAS", Long.class);
        return c == null ? 0L : c;
    }

    /** Ingresos por mes (YYYY-MM) en los ultimos N meses, en orden cronologico. */
    public java.util.List<java.util.Map<String, Object>> ingresosPorMes(int meses) {
        return jdbc.query(
            "SELECT TO_CHAR(fecha_emision, 'YYYY-MM') AS mes, "
          + "       NVL(SUM(total), 0) AS total, COUNT(*) AS cantidad "
          + "FROM FACTURAS "
          + "WHERE estado <> 'ANULADA' "
          + "  AND fecha_emision >= ADD_MONTHS(TRUNC(SYSDATE, 'MM'), ?) "
          + "GROUP BY TO_CHAR(fecha_emision, 'YYYY-MM') "
          + "ORDER BY mes",
            (rs, i) -> {
                java.util.Map<String, Object> m = new java.util.LinkedHashMap<>();
                m.put("mes", rs.getString("mes"));
                m.put("total", rs.getBigDecimal("total"));
                m.put("cantidad", rs.getLong("cantidad"));
                return m;
            }, -(meses - 1));
    }

    /** Total facturado por tipo de emisor (HOTEL / AEROLINEA / AGENCIA). */
    public java.util.List<java.util.Map<String, Object>> totalPorTipoEmisor() {
        return jdbc.query(
            "SELECT e.tipo, NVL(SUM(f.total), 0) AS total, COUNT(*) AS cantidad "
          + "FROM FACTURAS f JOIN EMISORES e ON e.id_emisor = f.id_emisor "
          + "WHERE f.estado <> 'ANULADA' "
          + "GROUP BY e.tipo "
          + "ORDER BY total DESC",
            (rs, i) -> {
                java.util.Map<String, Object> m = new java.util.LinkedHashMap<>();
                m.put("tipo", rs.getString("tipo"));
                m.put("total", rs.getBigDecimal("total"));
                m.put("cantidad", rs.getLong("cantidad"));
                return m;
            });
    }

    public java.util.List<java.util.Map<String, Object>> rankingEmisores(int top) {
        return jdbc.query(
            "SELECT * FROM (SELECT e.id_emisor, e.nombre, e.tipo, "
          + "       NVL(SUM(f.total), 0) AS total, COUNT(*) AS cantidad "
          + "FROM FACTURAS f JOIN EMISORES e ON e.id_emisor = f.id_emisor "
          + "WHERE f.estado <> 'ANULADA' "
          + "GROUP BY e.id_emisor, e.nombre, e.tipo "
          + "ORDER BY total DESC) WHERE ROWNUM <= ?",
            (rs, i) -> {
                java.util.Map<String, Object> m = new java.util.LinkedHashMap<>();
                m.put("idEmisor", rs.getLong("id_emisor"));
                m.put("nombre", rs.getString("nombre"));
                m.put("tipo", rs.getString("tipo"));
                m.put("total", rs.getBigDecimal("total"));
                m.put("cantidad", rs.getLong("cantidad"));
                return m;
            }, top);
    }

    public java.util.List<java.util.Map<String, Object>> rankingReceptores(int top) {
        return jdbc.query(
            "SELECT * FROM (SELECT r.id_receptor, r.nit, r.nombre, "
          + "       NVL(SUM(f.total), 0) AS total, COUNT(*) AS cantidad "
          + "FROM FACTURAS f JOIN RECEPTORES r ON r.id_receptor = f.id_receptor "
          + "WHERE f.estado <> 'ANULADA' "
          + "GROUP BY r.id_receptor, r.nit, r.nombre "
          + "ORDER BY total DESC) WHERE ROWNUM <= ?",
            (rs, i) -> {
                java.util.Map<String, Object> m = new java.util.LinkedHashMap<>();
                m.put("idReceptor", rs.getLong("id_receptor"));
                m.put("nit", rs.getString("nit"));
                m.put("nombre", rs.getString("nombre"));
                m.put("total", rs.getBigDecimal("total"));
                m.put("cantidad", rs.getLong("cantidad"));
                return m;
            }, top);
    }

    /** Para exportar a Excel: header + lineas en filas planas. */
    public java.util.List<java.util.Map<String, Object>> findAllFlat() {
        return jdbc.query(
            "SELECT f.id_factura, f.serie, f.numero, f.fecha_emision, "
          + "       e.nombre AS emisor, e.nit AS emisor_nit, e.tipo AS emisor_tipo, "
          + "       r.nombre AS receptor, r.nit AS receptor_nit, "
          + "       f.subtotal, f.impuesto, f.total, f.estado, f.referencia_externa "
          + "FROM FACTURAS f "
          + "JOIN EMISORES e ON e.id_emisor = f.id_emisor "
          + "JOIN RECEPTORES r ON r.id_receptor = f.id_receptor "
          + "ORDER BY f.id_factura",
            (rs, i) -> {
                java.util.Map<String, Object> m = new java.util.LinkedHashMap<>();
                m.put("idFactura", rs.getLong("id_factura"));
                m.put("serie", rs.getString("serie"));
                m.put("numero", rs.getLong("numero"));
                java.sql.Timestamp ts = rs.getTimestamp("fecha_emision");
                m.put("fechaEmision", ts == null ? null : ts.toLocalDateTime());
                m.put("emisor", rs.getString("emisor"));
                m.put("emisorNit", rs.getString("emisor_nit"));
                m.put("emisorTipo", rs.getString("emisor_tipo"));
                m.put("receptor", rs.getString("receptor"));
                m.put("receptorNit", rs.getString("receptor_nit"));
                m.put("subtotal", rs.getBigDecimal("subtotal"));
                m.put("impuesto", rs.getBigDecimal("impuesto"));
                m.put("total", rs.getBigDecimal("total"));
                m.put("estado", rs.getString("estado"));
                m.put("referenciaExterna", rs.getString("referencia_externa"));
                return m;
            });
    }
}
