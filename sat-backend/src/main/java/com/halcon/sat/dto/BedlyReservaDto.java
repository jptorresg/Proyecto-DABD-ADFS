package com.halcon.sat.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@JsonIgnoreProperties(ignoreUnknown = true)
public class BedlyReservaDto {

    private Integer idReservacion;
    private Integer idUsuario;
    private Integer idHabitacion;
    private String nombreHabitacion;
    private String nombreHotel;
    private String nombreUsuario;
    private LocalDateTime fechaCheckIn;
    private LocalDateTime fechaCheckOut;
    private BigDecimal precioTotal;
    private String estado;
    private String metodoPago;
    private LocalDateTime fechaReservacion;
    private Integer numHuespedes;
    private String notasEspeciales;

    public Integer getIdReservacion() { return idReservacion; }
    public void setIdReservacion(Integer idReservacion) { this.idReservacion = idReservacion; }

    public Integer getIdUsuario() { return idUsuario; }
    public void setIdUsuario(Integer idUsuario) { this.idUsuario = idUsuario; }

    public Integer getIdHabitacion() { return idHabitacion; }
    public void setIdHabitacion(Integer idHabitacion) { this.idHabitacion = idHabitacion; }

    public String getNombreHabitacion() { return nombreHabitacion; }
    public void setNombreHabitacion(String nombreHabitacion) { this.nombreHabitacion = nombreHabitacion; }

    public String getNombreHotel() { return nombreHotel; }
    public void setNombreHotel(String nombreHotel) { this.nombreHotel = nombreHotel; }

    public String getNombreUsuario() { return nombreUsuario; }
    public void setNombreUsuario(String nombreUsuario) { this.nombreUsuario = nombreUsuario; }

    public LocalDateTime getFechaCheckIn() { return fechaCheckIn; }
    public void setFechaCheckIn(LocalDateTime fechaCheckIn) { this.fechaCheckIn = fechaCheckIn; }

    public LocalDateTime getFechaCheckOut() { return fechaCheckOut; }
    public void setFechaCheckOut(LocalDateTime fechaCheckOut) { this.fechaCheckOut = fechaCheckOut; }

    public BigDecimal getPrecioTotal() { return precioTotal; }
    public void setPrecioTotal(BigDecimal precioTotal) { this.precioTotal = precioTotal; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public String getMetodoPago() { return metodoPago; }
    public void setMetodoPago(String metodoPago) { this.metodoPago = metodoPago; }

    public LocalDateTime getFechaReservacion() { return fechaReservacion; }
    public void setFechaReservacion(LocalDateTime fechaReservacion) { this.fechaReservacion = fechaReservacion; }

    public Integer getNumHuespedes() { return numHuespedes; }
    public void setNumHuespedes(Integer numHuespedes) { this.numHuespedes = numHuespedes; }

    public String getNotasEspeciales() { return notasEspeciales; }
    public void setNotasEspeciales(String notasEspeciales) { this.notasEspeciales = notasEspeciales; }
}
