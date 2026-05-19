package com.halcon.sat.model;

import java.time.LocalDateTime;

public class Emisor {

    private Long idEmisor;
    private String nit;
    private String nombre;
    private String direccion;
    private String telefono;
    private String email;
    private String tipo;
    private boolean activo;
    private LocalDateTime fechaRegistro;

    public Long getIdEmisor() { return idEmisor; }
    public void setIdEmisor(Long idEmisor) { this.idEmisor = idEmisor; }

    public String getNit() { return nit; }
    public void setNit(String nit) { this.nit = nit; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getDireccion() { return direccion; }
    public void setDireccion(String direccion) { this.direccion = direccion; }

    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }

    public boolean isActivo() { return activo; }
    public void setActivo(boolean activo) { this.activo = activo; }

    public LocalDateTime getFechaRegistro() { return fechaRegistro; }
    public void setFechaRegistro(LocalDateTime fechaRegistro) { this.fechaRegistro = fechaRegistro; }
}
