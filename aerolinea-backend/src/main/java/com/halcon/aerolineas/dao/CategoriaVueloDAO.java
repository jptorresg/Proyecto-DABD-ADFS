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
 * Lectura y escritura. La lectura habilita el shape multi-categoría de los
 * endpoints v2; la escritura habilita el admin para configurar vuelos con
 * varias clases de asiento desde el panel.
 * <p>
 * Las modificaciones a CATEGORIAS_VUELO disparan TR_SYNC_VUELOS_FROM_CATEG
 * que mantiene VUELOS.asientos_disponibles y .asientos_totales coherentes.
 * El package PKG_SYNC_GUARD evita ciclos cuando esos updates a VUELOS hacen
 * reentrar al trigger inverso.
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

    /**
     * Inserta una categoría nueva para el vuelo dado. El id_vuelo y los demás
     * campos del objeto se leen tal cual; id_categoria se ignora (lo genera la
     * identity de la columna) y se vuelve a setear en el objeto a partir del
     * generated key.
     *
     * @param conn      conexión a usar. Si es {@code null} se abre una propia
     *                  con autocommit; en otro caso se usa la transacción del
     *                  caller.
     * @param categoria categoría a insertar.
     */
    public void insert(Connection conn, CategoriaVuelo categoria) throws SQLException {
        boolean ownConn = (conn == null);
        if (ownConn) conn = DatabaseConfig.getConnection();
        String sql = "INSERT INTO CATEGORIAS_VUELO " +
                     "(id_vuelo, tipo_asiento, precio, asientos_totales, asientos_disponibles) " +
                     "VALUES (?, ?, ?, ?, ?)";
        try {
            try (PreparedStatement stmt = conn.prepareStatement(sql, new String[]{"id_categoria"})) {
                stmt.setLong(1, categoria.getIdVuelo());
                stmt.setString(2, categoria.getTipoAsiento());
                stmt.setBigDecimal(3, categoria.getPrecio());
                stmt.setInt(4, categoria.getAsientosTotales());
                Integer disp = categoria.getAsientosDisponibles();
                stmt.setInt(5, disp != null ? disp : categoria.getAsientosTotales());
                stmt.executeUpdate();
                try (ResultSet rs = stmt.getGeneratedKeys()) {
                    if (rs.next()) categoria.setIdCategoria(rs.getLong(1));
                }
            }
        } finally {
            if (ownConn) conn.close();
        }
    }

    /**
     * Actualiza precio y asientos de una categoría existente. NO modifica
     * id_vuelo ni tipo_asiento (esos cambios requieren borrar e insertar otra
     * categoría, porque rompen la unicidad y la semántica de la reserva).
     *
     * @param conn      conexión a usar (puede ser {@code null}).
     * @param categoria categoría con id_categoria seteado.
     */
    public void update(Connection conn, CategoriaVuelo categoria) throws SQLException {
        if (categoria.getIdCategoria() == null) {
            throw new SQLException("update requiere id_categoria");
        }
        boolean ownConn = (conn == null);
        if (ownConn) conn = DatabaseConfig.getConnection();
        String sql = "UPDATE CATEGORIAS_VUELO " +
                     "   SET precio = ?, asientos_totales = ?, asientos_disponibles = ? " +
                     " WHERE id_categoria = ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setBigDecimal(1, categoria.getPrecio());
            stmt.setInt(2, categoria.getAsientosTotales());
            Integer disp = categoria.getAsientosDisponibles();
            stmt.setInt(3, disp != null ? disp : categoria.getAsientosTotales());
            stmt.setLong(4, categoria.getIdCategoria());
            stmt.executeUpdate();
        } finally {
            if (ownConn) conn.close();
        }
    }

    /**
     * Borra todas las categorías de un vuelo. Útil al recrear el set completo
     * desde admin sobre un vuelo recién creado (sin reservas). Si alguna
     * categoría tiene reservas asociadas, la FK
     * {@code FK_RESERVACIONES_CATEGORIA} hará que el DELETE falle.
     */
    public void deleteByVueloId(Connection conn, Long idVuelo) throws SQLException {
        boolean ownConn = (conn == null);
        if (ownConn) conn = DatabaseConfig.getConnection();
        try (PreparedStatement stmt = conn.prepareStatement(
                "DELETE FROM CATEGORIAS_VUELO WHERE id_vuelo = ?")) {
            stmt.setLong(1, idVuelo);
            stmt.executeUpdate();
        } finally {
            if (ownConn) conn.close();
        }
    }

    /**
     * Borra una categoría puntual. Si tiene reservas v2 asociadas, la FK la
     * rechaza con ORA-02292.
     */
    public void deleteById(Connection conn, Long idCategoria) throws SQLException {
        boolean ownConn = (conn == null);
        if (ownConn) conn = DatabaseConfig.getConnection();
        try (PreparedStatement stmt = conn.prepareStatement(
                "DELETE FROM CATEGORIAS_VUELO WHERE id_categoria = ?")) {
            stmt.setLong(1, idCategoria);
            stmt.executeUpdate();
        } finally {
            if (ownConn) conn.close();
        }
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
