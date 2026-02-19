package com.halcon.aerolineas.services;

import com.halcon.aerolineas.dao.*;
import com.halcon.aerolineas.models.*;
import com.halcon.aerolineas.utils.PasswordUtil;

import java.math.BigDecimal;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;

public class ReservacionService {
    private ReservacionDAO reservacionDAO;
    private VueloDAO vueloDAO;
    private PasajeroDAO pasajeroDAO;
    
    public ReservacionService() {
        this.reservacionDAO = new ReservacionDAO();
        this.vueloDAO = new VueloDAO();
        this.pasajeroDAO = new PasajeroDAO();
    }
    
    /**
     * Crear nueva reservación con pasajeros
     */
    public Reservacion crearReservacion(Long idVuelo, Long idUsuario, 
                                       List<Pasajero> pasajeros, String metodoPago) throws SQLException {
        
        // Validar vuelo existe y tiene disponibilidad
        Vuelo vuelo = vueloDAO.findById(idVuelo);
        if (vuelo == null) {
            throw new IllegalArgumentException("Vuelo no encontrado");
        }
        
        if (!vuelo.getEstado().equals("ACTIVO")) {
            throw new IllegalArgumentException("El vuelo no está activo");
        }
        
        int numPasajeros = pasajeros.size();
        if (vuelo.getAsientosDisponibles() < numPasajeros) {
            throw new IllegalArgumentException("No hay suficientes asientos disponibles");
        }
        
        // Calcular precio total
        BigDecimal precioTotal = vuelo.getPrecioBase().multiply(new BigDecimal(numPasajeros));
        
        // Crear reservación
        Reservacion reservacion = new Reservacion();
        reservacion.setCodigoReservacion(PasswordUtil.generarCodigoReservacion());
        reservacion.setIdVuelo(idVuelo);
        reservacion.setIdUsuario(idUsuario);
        reservacion.setNumPasajeros(numPasajeros);
        reservacion.setPrecioTotal(precioTotal);
        reservacion.setMetodoPago(metodoPago);
        
        Long idReservacion = reservacionDAO.create(reservacion);
        
        if (idReservacion == null) {
            throw new SQLException("Error al crear reservación");
        }
        
        // Crear pasajeros asociados
        for (Pasajero pasajero : pasajeros) {
            pasajero.setIdReservacion(idReservacion);
            pasajero.setTipoAsiento(vuelo.getTipoAsiento());
            pasajeroDAO.create(pasajero);
        }
        
        // Retornar reservación completa
        return reservacionDAO.findByCodigo(reservacion.getCodigoReservacion());
    }
    
    /**
     * Obtener reservaciones de un usuario
     */
    public List<Reservacion> obtenerReservacionesUsuario(Long idUsuario) throws SQLException {
        return reservacionDAO.findByUsuario(idUsuario);
    }
    
    /**
     * Buscar reservación por código
     */
    public Reservacion buscarPorCodigo(String codigo) throws SQLException {
        Reservacion reservacion = reservacionDAO.findByCodigo(codigo);
        if (reservacion == null) {
            throw new IllegalArgumentException("Reservación no encontrada");
        }
        return reservacion;
    }
    
    /**
     * Obtener pasajeros de una reservación
     */
    public List<Pasajero> obtenerPasajeros(Long idReservacion) throws SQLException {
        return pasajeroDAO.findByReservacion(idReservacion);
    }
}