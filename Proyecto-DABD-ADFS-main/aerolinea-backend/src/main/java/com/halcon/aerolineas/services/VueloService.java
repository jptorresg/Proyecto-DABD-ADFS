package com.halcon.aerolineas.services;

import com.halcon.aerolineas.dao.VueloDAO;
import com.halcon.aerolineas.models.Vuelo;

import java.math.BigDecimal;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;

public class VueloService {
    private VueloDAO vueloDAO;
    
    public VueloService() {
        this.vueloDAO = new VueloDAO();
    }
    
    /**
     * Buscar vuelos disponibles
     */
    public List<Vuelo> buscarVuelos(String origen, String destino, LocalDate fechaSalida, 
                                     String tipoAsiento) throws SQLException {
        return vueloDAO.buscarVuelos(origen, destino, fechaSalida, tipoAsiento);
    }
    
    /**
     * Obtener vuelo por ID
     */
    public Vuelo obtenerVuelo(Long id) throws SQLException {
        Vuelo vuelo = vueloDAO.findById(id);
        if (vuelo == null) {
            throw new IllegalArgumentException("Vuelo no encontrado");
        }
        return vuelo;
    }
    
    /**
     * Crear nuevo vuelo (solo admin)
     */
    public Vuelo crearVuelo(String codigoVuelo, String origenCiudad, String origenIata,
                           String destinoCiudad, String destinoIata, LocalDate fechaSalida,
                           String horaSalida, LocalDate fechaLlegada, String horaLlegada,
                           String tipoAsiento, BigDecimal precioBase, Integer asientosTotales,
                           Long idUsuarioCreador) throws SQLException {
        
        // Validaciones
        if (vueloDAO.findByCodigo(codigoVuelo) != null) {
            throw new IllegalArgumentException("El código de vuelo ya existe");
        }
        
        if (fechaSalida.isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("La fecha de salida no puede ser en el pasado");
        }
        
        if (fechaLlegada.isBefore(fechaSalida)) {
            throw new IllegalArgumentException("La fecha de llegada debe ser posterior a la salida");
        }
        
        if (precioBase.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("El precio debe ser mayor a 0");
        }
        
        if (asientosTotales <= 0) {
            throw new IllegalArgumentException("La cantidad de asientos debe ser mayor a 0");
        }
        
        // Crear vuelo
        Vuelo nuevoVuelo = new Vuelo(
            codigoVuelo, origenCiudad, origenIata, destinoCiudad, destinoIata,
            fechaSalida, horaSalida, fechaLlegada, horaLlegada, tipoAsiento,
            precioBase, asientosTotales, asientosTotales
        );
        
        Long idVuelo = vueloDAO.create(nuevoVuelo, idUsuarioCreador);
        
        if (idVuelo == null) {
            throw new SQLException("Error al crear vuelo");
        }
        
        return vueloDAO.findById(idVuelo);
    }
    
    /**
     * Actualizar vuelo existente (solo admin)
     */
    public boolean actualizarVuelo(Vuelo vuelo) throws SQLException {
        Vuelo existente = vueloDAO.findById(vuelo.getIdVuelo());
        if (existente == null) {
            throw new IllegalArgumentException("Vuelo no encontrado");
        }
        
        return vueloDAO.update(vuelo);
    }
    
    /**
     * Eliminar vuelo (soft delete - solo admin)
     */
    public boolean eliminarVuelo(Long idVuelo) throws SQLException {
        return vueloDAO.delete(idVuelo);
    }
    
    /**
     * Listar todos los vuelos (con paginación)
     */
    public List<Vuelo> listarVuelos(int pagina, int porPagina) throws SQLException {
        int offset = (pagina - 1) * porPagina;
        return vueloDAO.findAll(porPagina, offset);
    }
}