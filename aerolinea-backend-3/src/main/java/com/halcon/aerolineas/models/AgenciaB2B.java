package com.halcon.aerolineas.models;

import java.time.LocalDateTime;

/**
 * Representa una agencia con acceso B2B a la API de aerolínea.
 * <p>
 * Las agencias se identifican mediante un token Bearer que debe enviarse
 * en la cabecera {@code Authorization} de cada petición a los endpoints
 * {@code /api/b2b/*}. El esquema replica el de las agencias B2B de la
 * cadena de hoteles.
 * </p>
 */
public class AgenciaB2B {
    private Long idAgencia;
    private String nombre;
    private String email;
    private String token;
    private boolean activo;
    private LocalDateTime fechaRegistro;

    public Long getIdAgencia()              { return idAgencia; }
    public void setIdAgencia(Long v)        { this.idAgencia = v; }
    public String getNombre()               { return nombre; }
    public void setNombre(String v)         { this.nombre = v; }
    public String getEmail()                { return email; }
    public void setEmail(String v)          { this.email = v; }
    public String getToken()                { return token; }
    public void setToken(String v)          { this.token = v; }
    public boolean isActivo()               { return activo; }
    public void setActivo(boolean v)        { this.activo = v; }
    public LocalDateTime getFechaRegistro() { return fechaRegistro; }
    public void setFechaRegistro(LocalDateTime v) { this.fechaRegistro = v; }
}
