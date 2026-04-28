package com.halcon.aerolineas.models;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Representa una reservación de vuelo realizada por un usuario.
 * <p>
 * Contiene la información principal de la reserva, como el código único,
 * el vuelo reservado, el usuario que la realizó, el número de pasajeros,
 * el precio total, el estado y el método de pago.
 * </p>
 */
public class Reservacion {
    
    /** Identificador único de la reservación. */
    private Long idReservacion;
    
    /** Código alfanumérico único generado para la reservación. */
    private String codigoReservacion;
    
    /** Identificador del vuelo reservado. */
    private Long idVuelo;
    
    /** Identificador del usuario que realizó la reservación. */
    private Long idUsuario;
    
    /** Número total de pasajeros incluidos en la reservación. */
    private Integer numPasajeros;
    
    /** Precio total de la reservación. */
    private BigDecimal precioTotal;
    
    /** 
     * Estado actual de la reservación.
     * Valores posibles: {@code CONFIRMADA}, {@code CANCELADA}, {@code PENDIENTE}.
     */
    private String estado;
    
    /** Fecha y hora en que se efectuó la compra de la reservación. */
    private LocalDateTime fechaCompra;
    
    /** Método de pago utilizado (ej. "TARJETA", "EFECTIVO"). */
    private String metodoPago;
    
    // Datos relacionados obtenidos mediante JOIN
    
    /** Objeto {@link Vuelo} asociado a la reservación (cargado mediante JOIN). */
    private Vuelo vuelo;
    
    /** Objeto {@link Usuario} que realizó la reservación (cargado mediante JOIN). */
    private Usuario usuario;
    
    /**
     * Constructor por defecto.
     */
    public Reservacion() {}
    
    // Getters y Setters
    
    /**
     * @return el identificador único de la reservación.
     */
    public Long getIdReservacion() { return idReservacion; }
    
    /**
     * @param idReservacion el identificador único de la reservación.
     */
    public void setIdReservacion(Long idReservacion) { this.idReservacion = idReservacion; }
    
    /**
     * @return el código único de la reservación.
     */
    public String getCodigoReservacion() { return codigoReservacion; }
    
    /**
     * @param codigoReservacion el código único de la reservación.
     */
    public void setCodigoReservacion(String codigoReservacion) { this.codigoReservacion = codigoReservacion; }
    
    /**
     * @return el identificador del vuelo reservado.
     */
    public Long getIdVuelo() { return idVuelo; }
    
    /**
     * @param idVuelo el identificador del vuelo reservado.
     */
    public void setIdVuelo(Long idVuelo) { this.idVuelo = idVuelo; }
    
    /**
     * @return el identificador del usuario que realizó la reservación.
     */
    public Long getIdUsuario() { return idUsuario; }
    
    /**
     * @param idUsuario el identificador del usuario que realizó la reservación.
     */
    public void setIdUsuario(Long idUsuario) { this.idUsuario = idUsuario; }
    
    /**
     * @return el número de pasajeros en la reservación.
     */
    public Integer getNumPasajeros() { return numPasajeros; }
    
    /**
     * @param numPasajeros el número de pasajeros en la reservación.
     */
    public void setNumPasajeros(Integer numPasajeros) { this.numPasajeros = numPasajeros; }
    
    /**
     * @return el precio total de la reservación.
     */
    public BigDecimal getPrecioTotal() { return precioTotal; }
    
    /**
     * @param precioTotal el precio total de la reservación.
     */
    public void setPrecioTotal(BigDecimal precioTotal) { this.precioTotal = precioTotal; }
    
    /**
     * @return el estado actual de la reservación.
     */
    public String getEstado() { return estado; }
    
    /**
     * @param estado el estado actual de la reservación.
     */
    public void setEstado(String estado) { this.estado = estado; }
    
    /**
     * @return la fecha y hora de compra.
     */
    public LocalDateTime getFechaCompra() { return fechaCompra; }
    
    /**
     * @param fechaCompra la fecha y hora de compra.
     */
    public void setFechaCompra(LocalDateTime fechaCompra) { this.fechaCompra = fechaCompra; }
    
    /**
     * @return el método de pago utilizado.
     */
    public String getMetodoPago() { return metodoPago; }
    
    /**
     * @param metodoPago el método de pago utilizado.
     */
    public void setMetodoPago(String metodoPago) { this.metodoPago = metodoPago; }
    
    /**
     * @return el objeto {@link Vuelo} asociado.
     */
    public Vuelo getVuelo() { return vuelo; }
    
    /**
     * @param vuelo el objeto {@link Vuelo} asociado.
     */
    public void setVuelo(Vuelo vuelo) { this.vuelo = vuelo; }
    
    /**
     * @return el objeto {@link Usuario} que realizó la reservación.
     */
    public Usuario getUsuario() { return usuario; }
    
    /**
     * @param usuario el objeto {@link Usuario} que realizó la reservación.
     */
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }
}