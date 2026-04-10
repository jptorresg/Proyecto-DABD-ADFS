package com.halcon.aerolineas.models;

import java.time.LocalDateTime;

/**
 * Representa un usuario registrado en el sistema.
 * <p>
 * Contiene los datos personales del usuario, credenciales de acceso, rol
 * y país de origen referenciado mediante una clave foránea a la tabla de países.
 * </p>
 */
public class Usuario {
    
    /** Identificador único del usuario. */
    private Long idUsuario;
    
    /** Correo electrónico del usuario (utilizado como nombre de usuario para login). */
    private String email;
    
    /** Hash de la contraseña para autenticación. */
    private String passwordHash;
    
    /** Nombres del usuario. */
    private String nombres;
    
    /** Apellidos del usuario. */
    private String apellidos;
    
    /** Edad del usuario. */
    private Integer edad;
    
    /** 
     * Identificador del país de origen (FK a PAISES). 
     * // ← CAMBIO: ahora es FK
     */
    private Long idPaisOrigen;
    
    /** Número de pasaporte del usuario. */
    private String numPasaporte;
    
    /** 
     * Rol del usuario en el sistema. 
     * Valores típicos: {@code ADMIN}, {@code CLIENTE}.
     */
    private String tipoUsuario;
    
    /** Fecha y hora en que se registró el usuario. */
    private LocalDateTime fechaRegistro;
    
    /** Indica si el usuario está activo en el sistema. */
    private boolean activo;
    
    // Campos obtenidos mediante JOIN con la tabla PAISES
    
    /** Nombre del país de origen (obtenido mediante JOIN). */
    private String nombrePais; // ← NUEVO: para mostrar nombre del país
    
    /** Código ISO alfa-2 del país de origen (obtenido mediante JOIN). */
    private String codigoPais; // ← NUEVO: para mostrar código alfa2
    
    /**
     * Constructor por defecto.
     */
    public Usuario() {}
    
    // Getters y Setters
    
    /**
     * @return el identificador único del usuario.
     */
    public Long getIdUsuario() { return idUsuario; }
    
    /**
     * @param idUsuario el identificador único del usuario.
     */
    public void setIdUsuario(Long idUsuario) { this.idUsuario = idUsuario; }
    
    /**
     * @return el correo electrónico del usuario.
     */
    public String getEmail() { return email; }
    
    /**
     * @param email el correo electrónico del usuario.
     */
    public void setEmail(String email) { this.email = email; }
    
    /**
     * @return el hash de la contraseña.
     */
    public String getPasswordHash() { return passwordHash; }
    
    /**
     * @param passwordHash el hash de la contraseña.
     */
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    
    /**
     * @return los nombres del usuario.
     */
    public String getNombres() { return nombres; }
    
    /**
     * @param nombres los nombres del usuario.
     */
    public void setNombres(String nombres) { this.nombres = nombres; }
    
    /**
     * @return los apellidos del usuario.
     */
    public String getApellidos() { return apellidos; }
    
    /**
     * @param apellidos los apellidos del usuario.
     */
    public void setApellidos(String apellidos) { this.apellidos = apellidos; }
    
    /**
     * @return la edad del usuario.
     */
    public Integer getEdad() { return edad; }
    
    /**
     * @param edad la edad del usuario.
     */
    public void setEdad(Integer edad) { this.edad = edad; }
    
    /**
     * @return el identificador del país de origen.
     */
    public Long getIdPaisOrigen() { return idPaisOrigen; } // ← CAMBIO
    
    /**
     * @param idPaisOrigen el identificador del país de origen.
     */
    public void setIdPaisOrigen(Long idPaisOrigen) { this.idPaisOrigen = idPaisOrigen; }
    
    /**
     * @return el número de pasaporte.
     */
    public String getNumPasaporte() { return numPasaporte; }
    
    /**
     * @param numPasaporte el número de pasaporte.
     */
    public void setNumPasaporte(String numPasaporte) { this.numPasaporte = numPasaporte; }
    
    /**
     * @return el tipo de usuario (rol).
     */
    public String getTipoUsuario() { return tipoUsuario; }
    
    /**
     * @param tipoUsuario el tipo de usuario (rol).
     */
    public void setTipoUsuario(String tipoUsuario) { this.tipoUsuario = tipoUsuario; }
    
    /**
     * @return la fecha y hora de registro.
     */
    public LocalDateTime getFechaRegistro() { return fechaRegistro; }
    
    /**
     * @param fechaRegistro la fecha y hora de registro.
     */
    public void setFechaRegistro(LocalDateTime fechaRegistro) { this.fechaRegistro = fechaRegistro; }
    
    /**
     * @return {@code true} si el usuario está activo, {@code false} en caso contrario.
     */
    public boolean isActivo() { return activo; }
    
    /**
     * @param activo el estado de actividad del usuario.
     */
    public void setActivo(boolean activo) { this.activo = activo; }
    
    // Getters y setters para campos obtenidos por JOIN
    
    /**
     * @return el nombre del país de origen.
     */
    public String getNombrePais() { return nombrePais; }
    
    /**
     * @param nombrePais el nombre del país de origen.
     */
    public void setNombrePais(String nombrePais) { this.nombrePais = nombrePais; }
    
    /**
     * @return el código ISO alfa-2 del país de origen.
     */
    public String getCodigoPais() { return codigoPais; }
    
    /**
     * @param codigoPais el código ISO alfa-2 del país de origen.
     */
    public void setCodigoPais(String codigoPais) { this.codigoPais = codigoPais; }
}