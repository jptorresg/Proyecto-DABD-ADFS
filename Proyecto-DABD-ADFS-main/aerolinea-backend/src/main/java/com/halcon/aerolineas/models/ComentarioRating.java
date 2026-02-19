package com.halcon.aerolineas.models;

import java.time.LocalDateTime;

public class ComentarioRating {
    private Long idComentario;
    private Long idVuelo;
    private Long idUsuario;
    private Long idComentarioPadre; // null si es comentario raíz
    private Integer rating; // 1-5, null si es respuesta
    private String textoComentario;
    private LocalDateTime fechaCreacion;
    
    // Datos relacionados
    private String nombreUsuario;
    private String avatarUsuario;
    
    public ComentarioRating() {}
    
    // Getters y Setters
    public Long getIdComentario() { return idComentario; }
    public void setIdComentario(Long idComentario) { this.idComentario = idComentario; }
    
    public Long getIdVuelo() { return idVuelo; }
    public void setIdVuelo(Long idVuelo) { this.idVuelo = idVuelo; }
    
    public Long getIdUsuario() { return idUsuario; }
    public void setIdUsuario(Long idUsuario) { this.idUsuario = idUsuario; }
    
    public Long getIdComentarioPadre() { return idComentarioPadre; }
    public void setIdComentarioPadre(Long idComentarioPadre) { this.idComentarioPadre = idComentarioPadre; }
    
    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }
    
    public String getTextoComentario() { return textoComentario; }
    public void setTextoComentario(String textoComentario) { this.textoComentario = textoComentario; }
    
    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }
    
    public String getNombreUsuario() { return nombreUsuario; }
    public void setNombreUsuario(String nombreUsuario) { this.nombreUsuario = nombreUsuario; }
    
    public String getAvatarUsuario() { return avatarUsuario; }
    public void setAvatarUsuario(String avatarUsuario) { this.avatarUsuario = avatarUsuario; }
}