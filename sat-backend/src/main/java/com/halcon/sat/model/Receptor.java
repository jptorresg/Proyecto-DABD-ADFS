package com.halcon.sat.model;

import java.time.LocalDateTime;

public class Receptor {

    private Long idReceptor;
    private String nit;
    private String nombre;
    private String direccion;
    private String email;
    private LocalDateTime fechaRegistro;

    public Long getIdReceptor() { return idReceptor; }
    public void setIdReceptor(Long idReceptor) { this.idReceptor = idReceptor; }

    public String getNit() { return nit; }
    public void setNit(String nit) { this.nit = nit; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getDireccion() { return direccion; }
    public void setDireccion(String direccion) { this.direccion = direccion; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public LocalDateTime getFechaRegistro() { return fechaRegistro; }
    public void setFechaRegistro(LocalDateTime fechaRegistro) { this.fechaRegistro = fechaRegistro; }
}
