package com.halcon.aerolineas.models;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Representa un vuelo disponible en el sistema.
 * <p>
 * Contiene la información completa del vuelo: códigos IATA de origen y destino,
 * fechas y horas de salida y llegada, tipo de asiento, precio base y disponibilidad.
 * </p>
 */
public class Vuelo {
    
    /** Identificador único del vuelo. */
    private Long idVuelo;
    
    /** Código alfanumérico del vuelo (ej. "AV123"). */
    private String codigoVuelo;
    
    /** Nombre de la ciudad de origen. */
    private String origenCiudad;
    
    /** Código IATA del aeropuerto de origen (ej. "MEX"). */
    private String origenCodigoIata;
    
    /** Nombre de la ciudad de destino. */
    private String destinoCiudad;
    
    /** Código IATA del aeropuerto de destino (ej. "CUN"). */
    private String destinoCodigoIata;
    
    /** Fecha programada de salida. */
    private LocalDate fechaSalida;
    
    /** Hora programada de salida en formato "HH:mm". */
    private String horaSalida;
    
    /** Fecha programada de llegada. */
    private LocalDate fechaLlegada;
    
    /** Hora programada de llegada en formato "HH:mm". */
    private String horaLlegada;
    
    /** 
     * Tipo de asiento ofrecido en el vuelo. 
     * Valores típicos: {@code TURISTA}, {@code BUSINESS}.
     */
    private String tipoAsiento;
    
    /** Precio base por asiento. */
    private BigDecimal precioBase;
    
    /** Número total de asientos en el vuelo. */
    private Integer asientosTotales;
    
    /** Número de asientos disponibles para reservar. */
    private Integer asientosDisponibles;
    
    /** 
     * Estado actual del vuelo. 
     * Valores posibles: {@code ACTIVO}, {@code CANCELADO}, {@code COMPLETADO}.
     */
    private String estado;
    
    /** Identificador del usuario que creó el registro del vuelo. */
    private Long creadoPor;
    
    /** Fecha y hora en que se creó el registro del vuelo. */
    private LocalDateTime fechaCreacion;
    
    /**
     * Constructor por defecto.
     */
    public Vuelo() {}
    
    /**
     * Constructor para la inserción de un nuevo vuelo.
     * Establece automáticamente el estado inicial como {@code ACTIVO}.
     *
     * @param codigoVuelo        Código alfanumérico del vuelo.
     * @param origenCiudad       Ciudad de origen.
     * @param origenCodigoIata   Código IATA del aeropuerto de origen.
     * @param destinoCiudad      Ciudad de destino.
     * @param destinoCodigoIata  Código IATA del aeropuerto de destino.
     * @param fechaSalida        Fecha de salida.
     * @param horaSalida         Hora de salida (formato "HH:mm").
     * @param fechaLlegada       Fecha de llegada.
     * @param horaLlegada        Hora de llegada (formato "HH:mm").
     * @param tipoAsiento        Tipo de asiento ofrecido.
     * @param precioBase         Precio base por asiento.
     * @param asientosTotales    Número total de asientos.
     * @param asientosDisponibles Número inicial de asientos disponibles.
     */
    public Vuelo(String codigoVuelo, String origenCiudad, String origenCodigoIata,
                 String destinoCiudad, String destinoCodigoIata, LocalDate fechaSalida,
                 String horaSalida, LocalDate fechaLlegada, String horaLlegada,
                 String tipoAsiento, BigDecimal precioBase, Integer asientosTotales,
                 Integer asientosDisponibles) {
        this.codigoVuelo = codigoVuelo;
        this.origenCiudad = origenCiudad;
        this.origenCodigoIata = origenCodigoIata;
        this.destinoCiudad = destinoCiudad;
        this.destinoCodigoIata = destinoCodigoIata;
        this.fechaSalida = fechaSalida;
        this.horaSalida = horaSalida;
        this.fechaLlegada = fechaLlegada;
        this.horaLlegada = horaLlegada;
        this.tipoAsiento = tipoAsiento;
        this.precioBase = precioBase;
        this.asientosTotales = asientosTotales;
        this.asientosDisponibles = asientosDisponibles;
        this.estado = "ACTIVO";
    }
    
    // Getters y Setters
    
    /**
     * @return el identificador único del vuelo.
     */
    public Long getIdVuelo() { return idVuelo; }
    
    /**
     * @param idVuelo el identificador único del vuelo.
     */
    public void setIdVuelo(Long idVuelo) { this.idVuelo = idVuelo; }
    
    /**
     * @return el código del vuelo.
     */
    public String getCodigoVuelo() { return codigoVuelo; }
    
    /**
     * @param codigoVuelo el código del vuelo.
     */
    public void setCodigoVuelo(String codigoVuelo) { this.codigoVuelo = codigoVuelo; }
    
    /**
     * @return la ciudad de origen.
     */
    public String getOrigenCiudad() { return origenCiudad; }
    
    /**
     * @param origenCiudad la ciudad de origen.
     */
    public void setOrigenCiudad(String origenCiudad) { this.origenCiudad = origenCiudad; }
    
    /**
     * @return el código IATA del aeropuerto de origen.
     */
    public String getOrigenCodigoIata() { return origenCodigoIata; }
    
    /**
     * @param origenCodigoIata el código IATA del aeropuerto de origen.
     */
    public void setOrigenCodigoIata(String origenCodigoIata) { this.origenCodigoIata = origenCodigoIata; }
    
    /**
     * @return la ciudad de destino.
     */
    public String getDestinoCiudad() { return destinoCiudad; }
    
    /**
     * @param destinoCiudad la ciudad de destino.
     */
    public void setDestinoCiudad(String destinoCiudad) { this.destinoCiudad = destinoCiudad; }
    
    /**
     * @return el código IATA del aeropuerto de destino.
     */
    public String getDestinoCodigoIata() { return destinoCodigoIata; }
    
    /**
     * @param destinoCodigoIata el código IATA del aeropuerto de destino.
     */
    public void setDestinoCodigoIata(String destinoCodigoIata) { this.destinoCodigoIata = destinoCodigoIata; }
    
    /**
     * @return la fecha de salida.
     */
    public LocalDate getFechaSalida() { return fechaSalida; }
    
    /**
     * @param fechaSalida la fecha de salida.
     */
    public void setFechaSalida(LocalDate fechaSalida) { this.fechaSalida = fechaSalida; }
    
    /**
     * @return la hora de salida (formato "HH:mm").
     */
    public String getHoraSalida() { return horaSalida; }
    
    /**
     * @param horaSalida la hora de salida (formato "HH:mm").
     */
    public void setHoraSalida(String horaSalida) { this.horaSalida = horaSalida; }
    
    /**
     * @return la fecha de llegada.
     */
    public LocalDate getFechaLlegada() { return fechaLlegada; }
    
    /**
     * @param fechaLlegada la fecha de llegada.
     */
    public void setFechaLlegada(LocalDate fechaLlegada) { this.fechaLlegada = fechaLlegada; }
    
    /**
     * @return la hora de llegada (formato "HH:mm").
     */
    public String getHoraLlegada() { return horaLlegada; }
    
    /**
     * @param horaLlegada la hora de llegada (formato "HH:mm").
     */
    public void setHoraLlegada(String horaLlegada) { this.horaLlegada = horaLlegada; }
    
    /**
     * @return el tipo de asiento ofrecido.
     */
    public String getTipoAsiento() { return tipoAsiento; }
    
    /**
     * @param tipoAsiento el tipo de asiento ofrecido.
     */
    public void setTipoAsiento(String tipoAsiento) { this.tipoAsiento = tipoAsiento; }
    
    /**
     * @return el precio base por asiento.
     */
    public BigDecimal getPrecioBase() { return precioBase; }
    
    /**
     * @param precioBase el precio base por asiento.
     */
    public void setPrecioBase(BigDecimal precioBase) { this.precioBase = precioBase; }
    
    /**
     * @return el número total de asientos.
     */
    public Integer getAsientosTotales() { return asientosTotales; }
    
    /**
     * @param asientosTotales el número total de asientos.
     */
    public void setAsientosTotales(Integer asientosTotales) { this.asientosTotales = asientosTotales; }
    
    /**
     * @return el número de asientos disponibles.
     */
    public Integer getAsientosDisponibles() { return asientosDisponibles; }
    
    /**
     * @param asientosDisponibles el número de asientos disponibles.
     */
    public void setAsientosDisponibles(Integer asientosDisponibles) { this.asientosDisponibles = asientosDisponibles; }
    
    /**
     * @return el estado actual del vuelo.
     */
    public String getEstado() { return estado; }
    
    /**
     * @param estado el estado actual del vuelo.
     */
    public void setEstado(String estado) { this.estado = estado; }
    
    /**
     * @return el identificador del usuario creador.
     */
    public Long getCreadoPor() { return creadoPor; }
    
    /**
     * @param creadoPor el identificador del usuario creador.
     */
    public void setCreadoPor(Long creadoPor) { this.creadoPor = creadoPor; }
    
    /**
     * @return la fecha y hora de creación del registro.
     */
    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    
    /**
     * @param fechaCreacion la fecha y hora de creación del registro.
     */
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }
}