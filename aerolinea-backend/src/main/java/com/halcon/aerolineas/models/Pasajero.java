package com.halcon.aerolineas.models;

import java.time.LocalDate;

public class Pasajero {
    private Long idPasajero;
    private Long idReservacion;
    private String nombres;
    private String apellidos;
    private LocalDate fechaNacimiento;
    private Long idNacionalidad; // ← CAMBIO: ahora es FK
    private String numPasaporte;
    private String tipoAsiento;
    
    // Para joins
    private String nombreNacionalidad; // ← NUEVO
    private String codigoNacionalidad; // ← NUEVO
    
    public Pasajero() {}
    
    // Getters y Setters
    public Long getIdPasajero() { return idPasajero; }
    public void setIdPasajero(Long idPasajero) { this.idPasajero = idPasajero; }
    
    public Long getIdReservacion() { return idReservacion; }
    public void setIdReservacion(Long idReservacion) { this.idReservacion = idReservacion; }
    
    public String getNombres() { return nombres; }
    public void setNombres(String nombres) { this.nombres = nombres; }
    
    public String getApellidos() { return apellidos; }
    public void setApellidos(String apellidos) { this.apellidos = apellidos; }
    
    public LocalDate getFechaNacimiento() { return fechaNacimiento; }
    public void setFechaNacimiento(LocalDate fechaNacimiento) { this.fechaNacimiento = fechaNacimiento; }
    
    public Long getIdNacionalidad() { return idNacionalidad; } // ← CAMBIO
    public void setIdNacionalidad(Long idNacionalidad) { this.idNacionalidad = idNacionalidad; }
    
    public String getNumPasaporte() { return numPasaporte; }
    public void setNumPasaporte(String numPasaporte) { this.numPasaporte = numPasaporte; }
    
    public String getTipoAsiento() { return tipoAsiento; }
    public void setTipoAsiento(String tipoAsiento) { this.tipoAsiento = tipoAsiento; }
    
    // Nuevos getters para datos de país
    public String getNombreNacionalidad() { return nombreNacionalidad; }
    public void setNombreNacionalidad(String nombreNacionalidad) { this.nombreNacionalidad = nombreNacionalidad; }
    
    public String getCodigoNacionalidad() { return codigoNacionalidad; }
    public void setCodigoNacionalidad(String codigoNacionalidad) { this.codigoNacionalidad = codigoNacionalidad; }
}