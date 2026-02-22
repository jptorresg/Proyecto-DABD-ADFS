package com.halcon.aerolineas.models;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class Reservacion {
    private Long idReservacion;
    private String codigoReservacion;
    private Long idVuelo;
    private Long idUsuario;
    private Integer numPasajeros;
    private BigDecimal precioTotal;
    private String estado; // CONFIRMADA, CANCELADA, PENDIENTE
    private LocalDateTime fechaCompra;
    private String metodoPago;
    
    // Datos relacionados (joins)
    private Vuelo vuelo;
    private Usuario usuario;
    
    // Constructor vacío
    public Reservacion() {}
    
    // Getters y Setters
    public Long getIdReservacion() { return idReservacion; }
    public void setIdReservacion(Long idReservacion) { this.idReservacion = idReservacion; }
    
    public String getCodigoReservacion() { return codigoReservacion; }
    public void setCodigoReservacion(String codigoReservacion) { this.codigoReservacion = codigoReservacion; }
    
    public Long getIdVuelo() { return idVuelo; }
    public void setIdVuelo(Long idVuelo) { this.idVuelo = idVuelo; }
    
    public Long getIdUsuario() { return idUsuario; }
    public void setIdUsuario(Long idUsuario) { this.idUsuario = idUsuario; }
    
    public Integer getNumPasajeros() { return numPasajeros; }
    public void setNumPasajeros(Integer numPasajeros) { this.numPasajeros = numPasajeros; }
    
    public BigDecimal getPrecioTotal() { return precioTotal; }
    public void setPrecioTotal(BigDecimal precioTotal) { this.precioTotal = precioTotal; }
    
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
    
    public LocalDateTime getFechaCompra() { return fechaCompra; }
    public void setFechaCompra(LocalDateTime fechaCompra) { this.fechaCompra = fechaCompra; }
    
    public String getMetodoPago() { return metodoPago; }
    public void setMetodoPago(String metodoPago) { this.metodoPago = metodoPago; }
    
    public Vuelo getVuelo() { return vuelo; }
    public void setVuelo(Vuelo vuelo) { this.vuelo = vuelo; }
    
    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }
}