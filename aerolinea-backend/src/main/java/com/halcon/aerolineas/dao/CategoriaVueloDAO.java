package com.halcon.aerolineas.dao;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.halcon.aerolineas.config.DatabaseConfig;
import com.halcon.aerolineas.models.CategoriaVuelo;

/**
 * DAO de CATEGORIAS_VUELO.
 * <p>
 * Solo lectura por ahora: la migración 20260516_categorias_vuelo crea las
 * filas iniciales (una por cada vuelo existente) y los triggers de Oracle
 * sincronizan los conteos con VUELOS mientras el write-side termine de
 * migrarse. Esto permite exponer el nuevo shape multi-categoría sin tocar
 * el flujo de reservaciones existente.
 */
public class CategoriaVueloDAO {

    private Connection connection;

    public CategoriaVueloDAO() {}

    public CategoriaVueloDAO(Connection connection) {
        this.connection = connection;
    }

    private Connection getConnection() throws SQLException {
        if (connection != null) return connection;
        return DatabaseConfig.getConnection();
    }

    /**
     * Carga todas las categorías de un vuelo.
     */
    public List<CategoriaVuelo> findByVueloId(Long idVuelo) throws SQLException {
        List<CategoriaVuelo> out = new ArrayList<>();
        String sql = "SELECT id_categoria, id_vuelo, tipo_asiento, precio, " +
                     "asientos_totales, asientos_disponibles " +
                     "FROM CATEGORIAS_VUELO WHERE id_vuelo = ? " +
                     "ORDER BY precio";
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, idVuelo);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) out.add(map(rs));
            }
        }
        return out;
    }

    /**
     * Batch lookup para evitar N+1: dada una colección de id_vuelo devuelve
     * un mapa id_vuelo -> categorías. Vuelos sin categorías no aparecen en el
     * mapa (el caller debe interpretar ausencia como lista vacía).
     */
    public Map<Long, List<CategoriaVuelo>> findByVueloIds(Collection<Long> idsVuelo) throws SQLException {
        Map<Long, List<CategoriaVuelo>> result = new HashMap<>();
        if (idsVuelo == null || idsVuelo.isEmpty()) return result;

        StringBuilder placeholders = new StringBuilder();
        for (int i = 0; i < idsVuelo.size(); i++) {
            if (i > 0) placeholders.append(',');
            placeholders.append('?');
        }
        String sql = "SELECT id_categoria, id_vuelo, tipo_asiento, precio, " +
                     "asientos_totales, asientos_disponibles " +
                     "FROM CATEGORIAS_VUELO WHERE id_vuelo IN (" + placeholders + ") " +
                     "ORDER BY id_vuelo, precio";

        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            int i = 1;
            for (Long id : idsVuelo) stmt.setLong(i++, id);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    CategoriaVuelo c = map(rs);
                    result.computeIfAbsent(c.getIdVuelo(), k -> new ArrayList<>()).add(c);
                }
            }
        }
        return result;
    }

    public CategoriaVuelo findById(Long idCategoria) throws SQLException {
        String sql = "SELECT id_categoria, id_vuelo, tipo_asiento, precio, " +
                     "asientos_totales, asientos_disponibles " +
                     "FROM CATEGORIAS_VUELO WHERE id_categoria = ?";
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, idCategoria);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) return map(rs);
            }
        }
        return null;
    }

    private CategoriaVuelo map(ResultSet rs) throws SQLException {
        CategoriaVuelo c = new CategoriaVuelo();
        c.setIdCategoria(rs.getLong("id_categoria"));
        c.setIdVuelo(rs.getLong("id_vuelo"));
        c.setTipoAsiento(rs.getString("tipo_asiento"));
        c.setPrecio(rs.getBigDecimal("precio"));
        c.setAsientosTotales(rs.getInt("asientos_totales"));
        c.setAsientosDisponibles(rs.getInt("asientos_disponibles"));
        return c;
    }
}
