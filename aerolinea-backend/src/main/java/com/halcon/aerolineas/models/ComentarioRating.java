package com.halcon.aerolineas.models;

import java.time.LocalDateTime;

/**
 * Representa un comentario o valoración (rating) asociado a un vuelo.
 * <p>
 * Puede ser un comentario raíz (con rating) o una respuesta a otro comentario
 * ({@code idComentarioPadre} no nulo, sin rating).
 * </p>
 */
public class ComentarioRating {
    
    /** Identificador único del comentario. */
    private Long idComentario;
    
    /** Identificador del vuelo al que pertenece el comentario. */
    private Long idVuelo;
    
    /** Identificador del usuario que realizó el comentario. */
    private Long idUsuario;
    
    /** 
     * Identificador del comentario padre si es una respuesta.
     * {@code null} si es un comentario raíz.
     */
    private Long idComentarioPadre;
    
    /** 
     * Valoración numérica del vuelo (1-5). 
     * {@code null} si es una respuesta a otro comentario.
     */
    private Integer rating;
    
    /** Contenido textual del comentario. */
    private String textoComentario;
    
    /** Fecha y hora en que se creó el comentario. */
    private LocalDateTime fechaCreacion;
    
    // Datos relacionados (no persistentes directamente en esta tabla)
    
    /** Nombre del usuario que realizó el comentario (obtenido mediante JOIN). */
    private String nombreUsuario;
    
    /** Avatar del usuario (opcional, obtenido mediante JOIN). */
    private String avatarUsuario;
    
    /**
     * Constructor por defecto.
     */
    public ComentarioRating() {}
    
    // Getters y Setters
    
    /**
     * @return el identificador único del comentario.
     */
    public Long getIdComentario() { return idComentario; }
    
    /**
     * @param idComentario el identificador único del comentario.
     */
    public void setIdComentario(Long idComentario) { this.idComentario = idComentario; }
    
    /**
     * @return el identificador del vuelo asociado.
     */
    public Long getIdVuelo() { return idVuelo; }
    
    /**
     * @param idVuelo el identificador del vuelo asociado.
     */
    public void setIdVuelo(Long idVuelo) { this.idVuelo = idVuelo; }
    
    /**
     * @return el identificador del usuario autor.
     */
    public Long getIdUsuario() { return idUsuario; }
    
    /**
     * @param idUsuario el identificador del usuario autor.
     */
    public void setIdUsuario(Long idUsuario) { this.idUsuario = idUsuario; }
    
    /**
     * @return el identificador del comentario padre, o {@code null} si es raíz.
     */
    public Long getIdComentarioPadre() { return idComentarioPadre; }
    
    /**
     * @param idComentarioPadre el identificador del comentario padre.
     */
    public void setIdComentarioPadre(Long idComentarioPadre) { this.idComentarioPadre = idComentarioPadre; }
    
    /**
     * @return la valoración numérica (1-5), o {@code null} si es una respuesta.
     */
    public Integer getRating() { return rating; }
    
    /**
     * @param rating la valoración numérica.
     */
    public void setRating(Integer rating) { this.rating = rating; }
    
    /**
     * @return el texto del comentario.
     */
    public String getTextoComentario() { return textoComentario; }
    
    /**
     * @param textoComentario el texto del comentario.
     */
    public void setTextoComentario(String textoComentario) { this.textoComentario = textoComentario; }
    
    /**
     * @return la fecha y hora de creación.
     */
    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    
    /**
     * @param fechaCreacion la fecha y hora de creación.
     */
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }
    
    /**
     * @return el nombre del usuario autor.
     */
    public String getNombreUsuario() { return nombreUsuario; }
    
    /**
     * @param nombreUsuario el nombre del usuario autor.
     */
    public void setNombreUsuario(String nombreUsuario) { this.nombreUsuario = nombreUsuario; }
    
    /**
     * @return el avatar del usuario autor.
     */
    public String getAvatarUsuario() { return avatarUsuario; }
    
    /**
     * @param avatarUsuario el avatar del usuario autor.
     */
    public void setAvatarUsuario(String avatarUsuario) { this.avatarUsuario = avatarUsuario; }
}