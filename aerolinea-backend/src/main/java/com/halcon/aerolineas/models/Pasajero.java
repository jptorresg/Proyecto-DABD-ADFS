package com.halcon.aerolineas.models;

import java.time.LocalDate;

/**
 * Representa un pasajero asociado a una reservación de vuelo.
 * <p>
 * Contiene los datos personales del pasajero, incluyendo la nacionalidad
 * referenciada mediante una clave foránea a la tabla de países.
 * </p>
 */
public class Pasajero {
    
    /** Identificador único del pasajero. */
    private Long idPasajero;
    
    /** Identificador de la reservación a la que pertenece el pasajero. */
    private Long idReservacion;
    
    /** Nombres del pasajero. */
    private String nombres;
    
    /** Apellidos del pasajero. */
    private String apellidos;
    
    /** Fecha de nacimiento del pasajero. */
    private LocalDate fechaNacimiento;
    
    /** 
     * Identificador del país de nacionalidad (FK a PAISES). 
     * // ← CAMBIO: ahora es FK
     */
    private Long idNacionalidad;
    
    /** Número de pasaporte del pasajero. */
    private String numPasaporte;
    
    /** Tipo de asiento seleccionado para el pasajero (ej. "Económico", "Ejecutivo"). */
    private String tipoAsiento;
    
    // Campos obtenidos mediante JOIN con la tabla PAISES
    
    /** Nombre del país de nacionalidad (obtenido mediante JOIN). */
    private String nombreNacionalidad; // ← NUEVO
    
    /** Código ISO alfa-2 del país de nacionalidad (obtenido mediante JOIN). */
    private String codigoNacionalidad; // ← NUEVO
    
    /**
     * Constructor por defecto.
     */
    public Pasajero() {}
    
    // Getters y Setters
    
    /**
     * @return el identificador único del pasajero.
     */
    public Long getIdPasajero() { return idPasajero; }
    
    /**
     * @param idPasajero el identificador único del pasajero.
     */
    public void setIdPasajero(Long idPasajero) { this.idPasajero = idPasajero; }
    
    /**
     * @return el identificador de la reservación asociada.
     */
    public Long getIdReservacion() { return idReservacion; }
    
    /**
     * @param idReservacion el identificador de la reservación asociada.
     */
    public void setIdReservacion(Long idReservacion) { this.idReservacion = idReservacion; }
    
    /**
     * @return los nombres del pasajero.
     */
    public String getNombres() { return nombres; }
    
    /**
     * @param nombres los nombres del pasajero.
     */
    public void setNombres(String nombres) { this.nombres = nombres; }
    
    /**
     * @return los apellidos del pasajero.
     */
    public String getApellidos() { return apellidos; }
    
    /**
     * @param apellidos los apellidos del pasajero.
     */
    public void setApellidos(String apellidos) { this.apellidos = apellidos; }
    
    /**
     * @return la fecha de nacimiento del pasajero.
     */
    public LocalDate getFechaNacimiento() { return fechaNacimiento; }
    
    /**
     * @param fechaNacimiento la fecha de nacimiento del pasajero.
     */
    public void setFechaNacimiento(LocalDate fechaNacimiento) { this.fechaNacimiento = fechaNacimiento; }
    
    /**
     * @return el identificador del país de nacionalidad (FK).
     */
    public Long getIdNacionalidad() { return idNacionalidad; } // ← CAMBIO
    
    /**
     * @param idNacionalidad el identificador del país de nacionalidad.
     */
    public void setIdNacionalidad(Long idNacionalidad) { this.idNacionalidad = idNacionalidad; }
    
    /**
     * @return el número de pasaporte.
     */
    public String getNumPasaporte() { return numPasaporte; }
    
    /**
     * @param numPasaporte el número de pasaporte.
     */
    public void setNumPasaporte(String numPasaporte) { this.numPasaporte = numPasaporte; }
    
    /**
     * @return el tipo de asiento seleccionado.
     */
    public String getTipoAsiento() { return tipoAsiento; }
    
    /**
     * @param tipoAsiento el tipo de asiento seleccionado.
     */
    public void setTipoAsiento(String tipoAsiento) { this.tipoAsiento = tipoAsiento; }
    
    // Getters y setters para campos obtenidos por JOIN
    
    /**
     * @return el nombre del país de nacionalidad.
     */
    public String getNombreNacionalidad() { return nombreNacionalidad; }
    
    /**
     * @param nombreNacionalidad el nombre del país de nacionalidad.
     */
    public void setNombreNacionalidad(String nombreNacionalidad) { this.nombreNacionalidad = nombreNacionalidad; }
    
    /**
     * @return el código ISO alfa-2 del país de nacionalidad.
     */
    public String getCodigoNacionalidad() { return codigoNacionalidad; }
    
    /**
     * @param codigoNacionalidad el código ISO alfa-2 del país de nacionalidad.
     */
    public void setCodigoNacionalidad(String codigoNacionalidad) { this.codigoNacionalidad = codigoNacionalidad; }
}