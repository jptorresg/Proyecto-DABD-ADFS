package com.halcon.aerolineas.dao;

import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import com.halcon.aerolineas.config.DatabaseConfig;
import com.halcon.aerolineas.models.Vuelo;
import com.halcon.aerolineas.models.VueloConEscala;

public class VueloDAO {
    
    /**
     * Buscar vuelos con filtros
     */
    public List<Vuelo> buscarVuelos(String origen, String destino, LocalDate fechaSalida, 
                                     String tipoAsiento) throws SQLException {
        List<Vuelo> vuelos = new ArrayList<>();
        StringBuilder sql = new StringBuilder(
            "SELECT * FROM VUELOS WHERE estado = 'ACTIVO' AND asientos_disponibles > 0"
        );
        
        List<Object> params = new ArrayList<>();
        
        if (origen != null && !origen.isEmpty()) {
            sql.append(" AND origen_codigo_iata = ?");
            params.add(origen);
        }
        if (destino != null && !destino.isEmpty()) {
            sql.append(" AND destino_codigo_iata = ?");
            params.add(destino);
        }
        if (fechaSalida != null) {
            sql.append(" AND fecha_salida = ?");
            params.add(Date.valueOf(fechaSalida));
        }
        if (tipoAsiento != null && !tipoAsiento.isEmpty()) {
            sql.append(" AND tipo_asiento = ?");
            params.add(tipoAsiento);
        }
        
        sql.append(" ORDER BY fecha_salida, hora_salida");
        
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql.toString())) {
            
            for (int i = 0; i < params.size(); i++) {
                stmt.setObject(i + 1, params.get(i));
            }
            
            ResultSet rs = stmt.executeQuery();
            while (rs.next()) {
                vuelos.add(mapResultSetToVuelo(rs));
            }
        }
        
        return vuelos;
    }

    public List<List<Vuelo>> buscarVuelosConEscala(String origen, String destino,
                                                    LocalDate fechaSalida,
                                                    String tipoAsiento) throws SQLException {
        System.out.println("Buscando rutas con escala: " + origen + " -> " + destino);
        
        // Usamos un Set para evitar duplicados por idVuelo compuesto
        java.util.Set<String> idsCadenas = new java.util.HashSet<>();
        List<List<Vuelo>> resultados = new ArrayList<>();

        // Paso 1: cadenas iniciales = vuelos que llegan al destino final
        List<List<Vuelo>> cadenas = new ArrayList<>();
        List<Vuelo> vuelosADestino = buscarVuelosQueLleganA(destino, fechaSalida, tipoAsiento);
        
        for (Vuelo v : vuelosADestino) {
            List<Vuelo> cadena = new ArrayList<>();
            cadena.add(v);
            cadenas.add(cadena);
        }
        System.out.println("Vuelos que llegan a destino (" + destino + "): " + vuelosADestino.size());

        // Paso 2: expandir hacia atrás, máximo 3 niveles (4 tramos = 3 escalas)
        for (int nivel = 0; nivel < 3; nivel++) {
            List<List<Vuelo>> nuevasCadenas = new ArrayList<>();

            for (List<Vuelo> cadena : cadenas) {
                Vuelo primerTramo = cadena.get(0);
                String origenActual = primerTramo.getOrigenCodigoIata().trim();

                if (origenActual.equals(origen.trim())) {
                    // Cadena completa — registrar si tiene más de 1 tramo y no es duplicado
                    if (cadena.size() > 1) {
                        String idCadena = cadena.stream()
                            .map(v -> String.valueOf(v.getIdVuelo()))
                            .collect(java.util.stream.Collectors.joining("-"));
                        
                        if (idsCadenas.add(idCadena)) { // add retorna false si ya existía
                            resultados.add(new ArrayList<>(cadena));
                            System.out.println("✓ Ruta válida encontrada (nivel " + nivel + "): " + idCadena);
                        }
                    }
                    // No expandir más esta cadena — ya llegó al origen
                } else {
                    // Expandir: buscar vuelos que llegan al origen del primer tramo
                    List<Vuelo> tramosAnteriores = buscarVuelosQueConectan(
                        origenActual,
                        primerTramo.getFechaSalida(),
                        primerTramo.getHoraSalida(),
                        tipoAsiento
                    );

                    System.out.println("Expandiendo desde: " + origenActual + 
                                    " | Tramos encontrados: " + tramosAnteriores.size());

                    for (Vuelo anterior : tramosAnteriores) {
                        String origenAnterior = anterior.getOrigenCodigoIata().trim();
                        
                        // Evitar ciclos
                        boolean ciclo = cadena.stream().anyMatch(t ->
                            t.getOrigenCodigoIata().trim().equals(origenAnterior) ||
                            t.getDestinoCodigoIata().trim().equals(origenAnterior)
                        );
                        if (ciclo) continue;

                        List<Vuelo> nuevaCadena = new ArrayList<>();
                        nuevaCadena.add(anterior);
                        nuevaCadena.addAll(cadena);
                        nuevasCadenas.add(nuevaCadena);
                    }
                }
            }

            // CLAVE: reemplazar con solo las cadenas incompletas expandidas
            cadenas = nuevasCadenas;
            System.out.println("Nivel " + nivel + " completado | Cadenas pendientes: " + cadenas.size());

            if (cadenas.isEmpty()) break;
        }

        // Paso 3: última pasada — cadenas que quedaron pendientes después del último nivel
        for (List<Vuelo> cadena : cadenas) {
            if (cadena.get(0).getOrigenCodigoIata().trim().equals(origen.trim())
                    && cadena.size() > 1) {
                String idCadena = cadena.stream()
                    .map(v -> String.valueOf(v.getIdVuelo()))
                    .collect(java.util.stream.Collectors.joining("-"));
                
                if (idsCadenas.add(idCadena)) {
                    resultados.add(cadena);
                    System.out.println("✓ Ruta válida (última pasada): " + idCadena);
                }
            }
        }

        System.out.println("Total rutas con escala encontradas: " + resultados.size());
        return resultados;
    }

    private List<Vuelo> buscarVuelosQueLleganA(String destinoIata, LocalDate fecha,
                                                String tipoAsiento) throws SQLException {
        List<Vuelo> vuelos = new ArrayList<>();
        StringBuilder sql = new StringBuilder(
            "SELECT * FROM VUELOS WHERE estado = 'ACTIVO' " +
            "AND asientos_disponibles > 0 " +
            "AND destino_codigo_iata = ?"
        );
        List<Object> params = new ArrayList<>();
        params.add(destinoIata);
        if (fecha != null) {
            sql.append(
                " AND fecha_salida = ?"
            );
            params.add(Date.valueOf(fecha));
        }

        if (tipoAsiento != null && !tipoAsiento.isEmpty()) {
            sql.append(" AND tipo_asiento = ?");
            params.add(tipoAsiento);
        }

        try (Connection conn = DatabaseConfig.getConnection();
            PreparedStatement stmt = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) stmt.setObject(i + 1, params.get(i));
            ResultSet rs = stmt.executeQuery();
            while (rs.next()) vuelos.add(mapResultSetToVuelo(rs));
        }
        return vuelos;
    }

    private List<Vuelo> buscarVuelosQueConectan(String destinoIata, LocalDate fechaSiguiente,
                                                String horaSalidaSiguiente,
                                                String tipoAsiento) throws SQLException {
        List<Vuelo> vuelos = new ArrayList<>();
        StringBuilder sql = new StringBuilder(
            "SELECT * FROM VUELOS WHERE estado = 'ACTIVO' " +
            "AND asientos_disponibles > 0 " +
            "AND destino_codigo_iata = ? " +
            "AND fecha_salida BETWEEN ? - 1 AND ?"
        );
        List<Object> params = new ArrayList<>();
        params.add(destinoIata);
        params.add(Date.valueOf(fechaSiguiente));
        params.add(Date.valueOf(fechaSiguiente));

        System.out.println("SQL: " + sql);
        System.out.println("Params: " + params.size());

        if (tipoAsiento != null && !tipoAsiento.isEmpty()) {
            sql.append(" AND tipo_asiento = ?");
            params.add(tipoAsiento);
        }

        try (Connection conn = DatabaseConfig.getConnection();
            PreparedStatement stmt = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) stmt.setObject(i + 1, params.get(i));
            ResultSet rs = stmt.executeQuery();
            while (rs.next()) {
                Vuelo v = mapResultSetToVuelo(rs);
                // Validar conexión mínima de 45 minutos
                int llegada  = timeToMinutes(v.getHoraLlegada());
                int salida   = timeToMinutes(horaSalidaSiguiente);
                int conexion = salida - llegada;
                if (v.getFechaLlegada().isBefore(fechaSiguiente)) conexion += 24 * 60;
                if (conexion >= 45) vuelos.add(v);
            }
        }
        return vuelos;
    }

    private int timeToMinutes(String hora) {
        String[] parts = hora.split(":");
        return Integer.parseInt(parts[0]) * 60 + Integer.parseInt(parts[1]);
    }
    
    /**
     * Obtener vuelo por ID
     */
    public Vuelo findById(Long id) throws SQLException {
        String sql = "SELECT * FROM VUELOS WHERE id_vuelo = ?";
        
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, id);
            ResultSet rs = stmt.executeQuery();
            
            if (rs.next()) {
                return mapResultSetToVuelo(rs);
            }
        }
        
        return null;
    }
    
    /**
     * Obtener vuelo por código
     */
    public Vuelo findByCodigo(String codigo) throws SQLException {
        String sql = "SELECT * FROM VUELOS WHERE codigo_vuelo = ?";
        
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setString(1, codigo);
            ResultSet rs = stmt.executeQuery();
            
            if (rs.next()) {
                return mapResultSetToVuelo(rs);
            }
        }
        
        return null;
    }
    
    /**
     * Listar todos los vuelos (con paginación opcional)
     */
    public List<Vuelo> findAll(int limit, int offset) throws SQLException {
        List<Vuelo> vuelos = new ArrayList<>();
        String sql = "SELECT * FROM VUELOS ORDER BY fecha_salida DESC OFFSET ? ROWS FETCH NEXT ? ROWS ONLY";
        
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setInt(1, offset);
            stmt.setInt(2, limit);
            
            ResultSet rs = stmt.executeQuery();
            while (rs.next()) {
                vuelos.add(mapResultSetToVuelo(rs));
            }
        }
        
        return vuelos;
    }
    
    /**
     * Crear nuevo vuelo
     */
    public Long create(Vuelo vuelo, Long idUsuarioCreador) throws SQLException {
        String sql = "INSERT INTO VUELOS (codigo_vuelo, origen_ciudad, origen_codigo_iata, " +
                    "destino_ciudad, destino_codigo_iata, fecha_salida, hora_salida, " +
                    "fecha_llegada, hora_llegada, tipo_asiento, precio_base, " +
                    "asientos_totales, asientos_disponibles, estado, creado_por) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, new String[]{"id_vuelo"})) {
            
            stmt.setString(1, vuelo.getCodigoVuelo());
            stmt.setString(2, vuelo.getOrigenCiudad());
            stmt.setString(3, vuelo.getOrigenCodigoIata());
            stmt.setString(4, vuelo.getDestinoCiudad());
            stmt.setString(5, vuelo.getDestinoCodigoIata());
            stmt.setDate(6, Date.valueOf(vuelo.getFechaSalida()));
            stmt.setString(7, vuelo.getHoraSalida());
            stmt.setDate(8, Date.valueOf(vuelo.getFechaLlegada()));
            stmt.setString(9, vuelo.getHoraLlegada());
            stmt.setString(10, vuelo.getTipoAsiento());
            stmt.setBigDecimal(11, vuelo.getPrecioBase());
            stmt.setInt(12, vuelo.getAsientosTotales());
            stmt.setInt(13, vuelo.getAsientosDisponibles());
            stmt.setString(14, "ACTIVO");
            if (idUsuarioCreador != null) {
                stmt.setLong(15, idUsuarioCreador);
            } else {
                stmt.setNull(15, java.sql.Types.BIGINT);
            }
            
            stmt.executeUpdate();
            
            ResultSet rs = stmt.getGeneratedKeys();
            if (rs.next()) {
                return rs.getLong(1);
            }
        }
        
        return null;
    }
    
    /**
     * Actualizar vuelo existente
     */
    public boolean update(Vuelo vuelo) throws SQLException {
        String sql = "UPDATE VUELOS SET origen_ciudad = ?, origen_codigo_iata = ?, " +
                    "destino_ciudad = ?, destino_codigo_iata = ?, fecha_salida = ?, " +
                    "hora_salida = ?, fecha_llegada = ?, hora_llegada = ?, " +
                    "tipo_asiento = ?, precio_base = ?, asientos_totales = ?, " +
                    "asientos_disponibles = ?, estado = ? WHERE id_vuelo = ?";
        
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setString(1, vuelo.getOrigenCiudad());
            stmt.setString(2, vuelo.getOrigenCodigoIata());
            stmt.setString(3, vuelo.getDestinoCiudad());
            stmt.setString(4, vuelo.getDestinoCodigoIata());
            stmt.setDate(5, Date.valueOf(vuelo.getFechaSalida()));
            stmt.setString(6, vuelo.getHoraSalida());
            stmt.setDate(7, Date.valueOf(vuelo.getFechaLlegada()));
            stmt.setString(8, vuelo.getHoraLlegada());
            stmt.setString(9, vuelo.getTipoAsiento());
            stmt.setBigDecimal(10, vuelo.getPrecioBase());
            stmt.setInt(11, vuelo.getAsientosTotales());
            stmt.setInt(12, vuelo.getAsientosDisponibles());
            stmt.setString(13, vuelo.getEstado());
            stmt.setLong(14, vuelo.getIdVuelo());
            
            return stmt.executeUpdate() > 0;
        }
    }
    
    /**
     * Eliminar vuelo (soft delete - cambiar estado)
     */
    public boolean delete(Long id) throws SQLException {
        String sql = "UPDATE VUELOS SET estado = 'CANCELADO' WHERE id_vuelo = ?";
        
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, id);
            return stmt.executeUpdate() > 0;
        }
    }
    
    /**
     * Decrementar asientos disponibles (para reservaciones)
     */
    public boolean decrementarAsientos(Long idVuelo, int cantidad) throws SQLException {
        String sql = "UPDATE VUELOS SET asientos_disponibles = asientos_disponibles - ? " +
                    "WHERE id_vuelo = ? AND asientos_disponibles >= ?";
        
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setInt(1, cantidad);
            stmt.setLong(2, idVuelo);
            stmt.setInt(3, cantidad);
            
            return stmt.executeUpdate() > 0;
        }
    }
    
    /**
     * Helper: mapear ResultSet a objeto Vuelo
     */
    public Vuelo mapResultSetToVuelo(ResultSet rs) throws SQLException {
        Vuelo v = new Vuelo();
        v.setIdVuelo(rs.getLong("id_vuelo"));
        v.setCodigoVuelo(rs.getString("codigo_vuelo"));
        v.setOrigenCiudad(rs.getString("origen_ciudad"));
        v.setOrigenCodigoIata(rs.getString("origen_codigo_iata"));
        v.setDestinoCiudad(rs.getString("destino_ciudad"));
        v.setDestinoCodigoIata(rs.getString("destino_codigo_iata"));
        v.setFechaSalida(rs.getDate("fecha_salida").toLocalDate());
        v.setHoraSalida(rs.getString("hora_salida"));
        v.setFechaLlegada(rs.getDate("fecha_llegada").toLocalDate());
        v.setHoraLlegada(rs.getString("hora_llegada"));
        v.setTipoAsiento(rs.getString("tipo_asiento"));
        v.setPrecioBase(rs.getBigDecimal("precio_base"));
        v.setAsientosTotales(rs.getInt("asientos_totales"));
        v.setAsientosDisponibles(rs.getInt("asientos_disponibles"));
        v.setEstado(rs.getString("estado"));
        
        Long creadoPor = rs.getLong("creado_por");
        if (!rs.wasNull()) v.setCreadoPor(creadoPor);
        
        Timestamp fechaCreacion = rs.getTimestamp("fecha_creacion");
        if (fechaCreacion != null) {
            v.setFechaCreacion(fechaCreacion.toLocalDateTime());
        }
        
        return v;
    }
}