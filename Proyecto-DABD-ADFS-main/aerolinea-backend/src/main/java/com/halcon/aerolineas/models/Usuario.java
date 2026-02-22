package com.halcon.aerolineas.models;

import java.time.LocalDateTime;

public class Usuario {
    private Long idUsuario;
    private String email;
    private String passwordHash;
    private String nombres;
    private String apellidos;
    private Integer edad;
    private Long idPaisOrigen; // ← CAMBIO: ahora es FK
    private String numPasaporte;
    private String tipoUsuario;
    private LocalDateTime fechaRegistro;
    private boolean activo;
    
    // Para joins - datos relacionados
    private String nombrePais; // ← NUEVO: para mostrar nombre del país
    private String codigoPais; // ← NUEVO: para mostrar código alfa2
    
    public Usuario() {}
    
    // Getters y Setters
    public Long getIdUsuario() { return idUsuario; }
    public void setIdUsuario(Long idUsuario) { this.idUsuario = idUsuario; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    
    public String getNombres() { return nombres; }
    public void setNombres(String nombres) { this.nombres = nombres; }
    
    public String getApellidos() { return apellidos; }
    public void setApellidos(String apellidos) { this.apellidos = apellidos; }
    
    public Integer getEdad() { return edad; }
    public void setEdad(Integer edad) { this.edad = edad; }
    
    public Long getIdPaisOrigen() { return idPaisOrigen; } // ← CAMBIO
    public void setIdPaisOrigen(Long idPaisOrigen) { this.idPaisOrigen = idPaisOrigen; }
    
    public String getNumPasaporte() { return numPasaporte; }
    public void setNumPasaporte(String numPasaporte) { this.numPasaporte = numPasaporte; }
    
    public String getTipoUsuario() { return tipoUsuario; }
    public void setTipoUsuario(String tipoUsuario) { this.tipoUsuario = tipoUsuario; }
    
    public LocalDateTime getFechaRegistro() { return fechaRegistro; }
    public void setFechaRegistro(LocalDateTime fechaRegistro) { this.fechaRegistro = fechaRegistro; }
    
    public boolean isActivo() { return activo; }
    public void setActivo(boolean activo) { this.activo = activo; }
    
    // Nuevos getters para datos de país
    public String getNombrePais() { return nombrePais; }
    public void setNombrePais(String nombrePais) { this.nombrePais = nombrePais; }
    
    public String getCodigoPais() { return codigoPais; }
    public void setCodigoPais(String codigoPais) { this.codigoPais = codigoPais; }
}