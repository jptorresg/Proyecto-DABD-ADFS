package com.halcon.aerolineas.models;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class Vuelo {
    private Long idVuelo;
    private String codigoVuelo;
    private String origenCiudad;
    private String origenCodigoIata;
    private String destinoCiudad;
    private String destinoCodigoIata;
    private LocalDate fechaSalida;
    private String horaSalida; // formato "HH:mm"
    private LocalDate fechaLlegada;
    private String horaLlegada;
    private String tipoAsiento; // TURISTA, BUSINESS
    private BigDecimal precioBase;
    private Integer asientosTotales;
    private Integer asientosDisponibles;
    private String estado; // ACTIVO, CANCELADO, COMPLETADO
    private Long creadoPor;
    private LocalDateTime fechaCreacion;
    
    // Constructor vacío
    public Vuelo() {}
    
    // Constructor para inserción
    public Vuelo(String codigoVuelo, String origenCiudad, String origenCodigoIata,
                 String destinoCiudad, String destinoCodigoIata, LocalDate fechaSalida,
                 String horaSalida, LocalDate fechaLlegada, String horaLlegada,
                 String tipoAsiento, BigDecimal precioBase, Integer asientosTotales,
                 Integer asientosDisponibles) {
        this.codigoVuelo = codigoVuelo;
        this.origenCiudad = origenCiudad;
        this.origenCodigoIata = origenCodigoIata;
        this.destinoCiudad = destinoCiudad;
        this.destinoCodigoIata = destinoCodigoIata;
        this.fechaSalida = fechaSalida;
        this.horaSalida = horaSalida;
        this.fechaLlegada = fechaLlegada;
        this.horaLlegada = horaLlegada;
        this.tipoAsiento = tipoAsiento;
        this.precioBase = precioBase;
        this.asientosTotales = asientosTotales;
        this.asientosDisponibles = asientosDisponibles;
        this.estado = "ACTIVO";
    }
    
    // Getters y Setters
    public Long getIdVuelo() { return idVuelo; }
    public void setIdVuelo(Long idVuelo) { this.idVuelo = idVuelo; }
    
    public String getCodigoVuelo() { return codigoVuelo; }
    public void setCodigoVuelo(String codigoVuelo) { this.codigoVuelo = codigoVuelo; }
    
    public String getOrigenCiudad() { return origenCiudad; }
    public void setOrigenCiudad(String origenCiudad) { this.origenCiudad = origenCiudad; }
    
    public String getOrigenCodigoIata() { return origenCodigoIata; }
    public void setOrigenCodigoIata(String origenCodigoIata) { this.origenCodigoIata = origenCodigoIata; }
    
    public String getDestinoCiudad() { return destinoCiudad; }
    public void setDestinoCiudad(String destinoCiudad) { this.destinoCiudad = destinoCiudad; }
    
    public String getDestinoCodigoIata() { return destinoCodigoIata; }
    public void setDestinoCodigoIata(String destinoCodigoIata) { this.destinoCodigoIata = destinoCodigoIata; }
    
    public LocalDate getFechaSalida() { return fechaSalida; }
    public void setFechaSalida(LocalDate fechaSalida) { this.fechaSalida = fechaSalida; }
    
    public String getHoraSalida() { return horaSalida; }
    public void setHoraSalida(String horaSalida) { this.horaSalida = horaSalida; }
    
    public LocalDate getFechaLlegada() { return fechaLlegada; }
    public void setFechaLlegada(LocalDate fechaLlegada) { this.fechaLlegada = fechaLlegada; }
    
    public String getHoraLlegada() { return horaLlegada; }
    public void setHoraLlegada(String horaLlegada) { this.horaLlegada = horaLlegada; }
    
    public String getTipoAsiento() { return tipoAsiento; }
    public void setTipoAsiento(String tipoAsiento) { this.tipoAsiento = tipoAsiento; }
    
    public BigDecimal getPrecioBase() { return precioBase; }
    public void setPrecioBase(BigDecimal precioBase) { this.precioBase = precioBase; }
    
    public Integer getAsientosTotales() { return asientosTotales; }
    public void setAsientosTotales(Integer asientosTotales) { this.asientosTotales = asientosTotales; }
    
    public Integer getAsientosDisponibles() { return asientosDisponibles; }
    public void setAsientosDisponibles(Integer asientosDisponibles) { this.asientosDisponibles = asientosDisponibles; }
    
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
    
    public Long getCreadoPor() { return creadoPor; }
    public void setCreadoPor(Long creadoPor) { this.creadoPor = creadoPor; }
    
    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }
}