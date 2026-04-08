package com.halcon.aerolineas.dao;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

import com.halcon.aerolineas.config.DatabaseConfig;
import com.halcon.aerolineas.models.Reservacion;
import com.halcon.aerolineas.models.Vuelo;
import com.halcon.aerolineas.models.VueloConEscala;

public class ReservacionDAO {
    
    /**
     * Crear nueva reservación (con transacción para asientos)
     */
    public Long create(Reservacion reservacion) throws SQLException {
        Connection conn = null;
        PreparedStatement stmt = null;
        
        try {
            conn = DatabaseConfig.getConnection();
            conn.setAutoCommit(false); // Iniciar transacción
            
            // 1. Verificar disponibilidad y decrementar asientos
            String checkSql = "SELECT asientos_disponibles FROM VUELOS WHERE id_vuelo = ? FOR UPDATE";
            stmt = conn.prepareStatement(checkSql);
            stmt.setLong(1, reservacion.getIdVuelo());
            ResultSet rs = stmt.executeQuery();
            
            if (!rs.next() || rs.getInt("asientos_disponibles") < reservacion.getNumPasajeros()) {
                throw new SQLException("No hay suficientes asientos disponibles");
            }
            stmt.close();
            
            // 2. Decrementar asientos
            String updateSql = "UPDATE VUELOS SET asientos_disponibles = asientos_disponibles - ? WHERE id_vuelo = ?";
            stmt = conn.prepareStatement(updateSql);
            stmt.setInt(1, reservacion.getNumPasajeros());
            stmt.setLong(2, reservacion.getIdVuelo());
            stmt.executeUpdate();
            stmt.close();
            
            // 3. Insertar reservación
            String insertSql = "INSERT INTO RESERVACIONES (codigo_reservacion, id_vuelo, id_usuario, " +
                              "num_pasajeros, precio_total, estado, metodo_pago) " +
                              "VALUES (?, ?, ?, ?, ?, ?, ?)";
            
            stmt = conn.prepareStatement(insertSql, new String[]{"id_reservacion"});
            stmt.setString(1, reservacion.getCodigoReservacion());
            stmt.setLong(2, reservacion.getIdVuelo());
            stmt.setLong(3, reservacion.getIdUsuario());
            stmt.setInt(4, reservacion.getNumPasajeros());
            stmt.setBigDecimal(5, reservacion.getPrecioTotal());
            stmt.setString(6, "CONFIRMADA");
            stmt.setString(7, reservacion.getMetodoPago());
            
            stmt.executeUpdate();
            
            rs = stmt.getGeneratedKeys();
            Long idReservacion = null;
            if (rs.next()) {
                idReservacion = rs.getLong(1);
            }
            
            conn.commit(); // Confirmar transacción
            return idReservacion;
            
        } catch (SQLException e) {
            if (conn != null) {
                try {
                    conn.rollback(); // Revertir en caso de error
                } catch (SQLException ex) {
                    throw new RuntimeException("Error en la operación de base de datos", e);
                }
            }
            throw e;
        } finally {
            if (stmt != null) stmt.close();
            if (conn != null) {
                conn.setAutoCommit(true);
                conn.close();
            }
        }
    }

    public Reservacion findById(Long idReservacion) throws SQLException {
        String sql = "SELECT * FROM RESERVACIONES WHERE ID_RESERVACION = ?";
        
        try (Connection conn = DatabaseConfig.getConnection();
            PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, idReservacion);
            ResultSet rs = stmt.executeQuery();
            
            if (rs.next()) {
                Reservacion r = new Reservacion();
                r.setIdReservacion(rs.getLong("ID_RESERVACION"));
                r.setCodigoReservacion(rs.getString("CODIGO_RESERVACION"));
                r.setIdVuelo(rs.getLong("ID_VUELO"));
                r.setIdUsuario(rs.getLong("ID_USUARIO"));
                r.setNumPasajeros(rs.getInt("NUM_PASAJEROS"));
                r.setPrecioTotal(rs.getBigDecimal("PRECIO_TOTAL"));
                r.setEstado(rs.getString("ESTADO"));
                r.setFechaCompra(rs.getTimestamp("FECHA_COMPRA").toLocalDateTime());
                r.setMetodoPago(rs.getString("METODO_PAGO"));
                
                return r;
            }
        }
        
        return null;
    }
    
    /**
     * Buscar reservaciones por usuario
     */
    public List<Reservacion> findByUsuario(Long idUsuario) throws SQLException {
        List<Reservacion> reservaciones = new ArrayList<>();
        
        String sql = "SELECT DISTINCT r.*, v.id_vuelo, v.codigo_vuelo, v.origen_ciudad, v.destino_ciudad, v.origen_codigo_iata, v.destino_codigo_iata, v.fecha_salida, v.hora_salida, v.tipo_asiento FROM RESERVACIONES r JOIN VUELOS v ON r.id_vuelo = v.id_vuelo WHERE r.id_usuario = ? ORDER BY r.fecha_compra DESC";
        
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, idUsuario);
            ResultSet rs = stmt.executeQuery();
            
            while (rs.next()) {
                Reservacion r = new Reservacion();

                // datos de reservación
                r.setIdReservacion(rs.getLong("id_reservacion"));
                r.setCodigoReservacion(rs.getString("codigo_reservacion"));
                r.setIdVuelo(rs.getLong("id_vuelo"));
                r.setIdUsuario(rs.getLong("id_usuario"));
                r.setNumPasajeros(rs.getInt("num_pasajeros"));
                r.setPrecioTotal(rs.getBigDecimal("precio_total"));
                r.setEstado(rs.getString("estado"));
                r.setFechaCompra(rs.getTimestamp("fecha_compra").toLocalDateTime());

                // ⭐ CREAR EL VUELO
                Vuelo v = new Vuelo();
                v.setIdVuelo(rs.getLong("id_vuelo"));
                v.setCodigoVuelo(rs.getString("codigo_vuelo"));
                v.setOrigenCiudad(rs.getString("origen_ciudad"));
                v.setDestinoCiudad(rs.getString("destino_ciudad"));

                v.setOrigenCodigoIata(rs.getString("origen_codigo_iata"));
                v.setDestinoCodigoIata(rs.getString("destino_codigo_iata"));
                v.setFechaSalida(rs.getDate("fecha_salida").toLocalDate());
                System.out.println("Fecha cruda BD: " + rs.getDate("fecha_salida"));
                v.setHoraSalida(rs.getString("hora_salida"));
                v.setTipoAsiento(rs.getString("tipo_asiento"));

                // 🔥 CLAVE
                r.setVuelo(v);

                reservaciones.add(r);

                System.out.println("=== FILA DESDE BD ===");
                System.out.println("codigo_vuelo: " + rs.getString("codigo_vuelo"));
                System.out.println("origen: " + rs.getString("origen_ciudad"));
                System.out.println("fecha_salida: " + rs.getDate("fecha_salida"));
                System.out.println("hora_salida: " + rs.getString("hora_salida"));
            }
        }
        
        return reservaciones;
    }
    
    /**
     * Buscar por código de reservación
     */
    public Reservacion findByCodigo(String codigo) throws SQLException {
        String sql = "SELECT * FROM RESERVACIONES WHERE codigo_reservacion = ?";
        
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setString(1, codigo);
            ResultSet rs = stmt.executeQuery();
            
            if (rs.next()) {
                Reservacion r = new Reservacion();
                r.setIdReservacion(rs.getLong("id_reservacion"));
                r.setCodigoReservacion(rs.getString("codigo_reservacion"));
                r.setIdVuelo(rs.getLong("id_vuelo"));
                r.setIdUsuario(rs.getLong("id_usuario"));
                r.setNumPasajeros(rs.getInt("num_pasajeros"));
                r.setPrecioTotal(rs.getBigDecimal("precio_total"));
                r.setEstado(rs.getString("estado"));
                r.setFechaCompra(rs.getTimestamp("fecha_compra").toLocalDateTime());
                r.setMetodoPago(rs.getString("metodo_pago"));
                return r;
            }
        }
        
        return null;
    }

    public void cancelar(Long idReservacion) throws SQLException {
        Connection conn = null;
        PreparedStatement stmt = null;

        try {
            conn = DatabaseConfig.getConnection();
            conn.setAutoCommit(false);

            // 1. Obtener reservación
            String selectSql = "SELECT id_vuelo, num_pasajeros FROM RESERVACIONES WHERE id_reservacion = ?";
            stmt = conn.prepareStatement(selectSql);
            stmt.setLong(1, idReservacion);
            ResultSet rs = stmt.executeQuery();

            if (!rs.next()) {
                throw new SQLException("Reservación no encontrada");
            }

            Long idVuelo = rs.getLong("id_vuelo");
            int numPasajeros = rs.getInt("num_pasajeros");
            stmt.close();

            // 2. Devolver asientos
            String updateVuelo = "UPDATE VUELOS SET asientos_disponibles = asientos_disponibles + ? WHERE id_vuelo = ?";
            stmt = conn.prepareStatement(updateVuelo);
            stmt.setInt(1, numPasajeros);
            stmt.setLong(2, idVuelo);
            stmt.executeUpdate();
            stmt.close();

            // 3. Cancelar reservación
            String updateRes = "UPDATE RESERVACIONES SET estado = 'CANCELADA' WHERE id_reservacion = ?";
            stmt = conn.prepareStatement(updateRes);
            stmt.setLong(1, idReservacion);
            stmt.executeUpdate();

            conn.commit();

        } catch (SQLException e) {
            if (conn != null) conn.rollback();
            throw e;
        } finally {
            if (stmt != null) stmt.close();
            if (conn != null) {
                conn.setAutoCommit(true);
                conn.close();
            }
        }
    }
}