package com.halcon.sat.dto;

public class LoginResponse {

    private Long idUsuario;
    private String email;
    private String nombres;
    private String apellidos;
    private String tipoUsuario;

    public LoginResponse(Long idUsuario, String email, String nombres,
                         String apellidos, String tipoUsuario) {
        this.idUsuario = idUsuario;
        this.email = email;
        this.nombres = nombres;
        this.apellidos = apellidos;
        this.tipoUsuario = tipoUsuario;
    }

    public Long getIdUsuario() { return idUsuario; }
    public String getEmail() { return email; }
    public String getNombres() { return nombres; }
    public String getApellidos() { return apellidos; }
    public String getTipoUsuario() { return tipoUsuario; }
}
