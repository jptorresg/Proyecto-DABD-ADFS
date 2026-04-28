package com.halcon.aerolineas.models;

import java.util.List;
import java.util.ArrayList;
import java.math.BigDecimal;
import java.util.stream.Collectors;

/**
 * Representa un vuelo compuesto por múltiples tramos (escalas).
 * <p>
 * Esta clase agrega la información de una lista de vuelos individuales para
 * presentarlos al frontend como una única ruta con escalas. Calcula automáticamente
 * el precio total, la disponibilidad mínima de asientos y los detalles de cada
 * escala intermedia.
 * </p>
 */
public class VueloConEscala {

    /** Lista original de vuelos que componen la ruta. */
    private List<Vuelo> tramos;

    // Campos serializables para el frontend
    
    /** Identificador compuesto de los vuelos, separados por guiones (ej. "81-82-83"). */
    private String idVuelo;
    
    /** Código compuesto de los vuelos, separados por el signo '+' (ej. "HC-501+HC-601"). */
    private String codigoVuelo;
    
    /** Ciudad de origen del primer tramo. */
    private String origenCiudad;
    
    /** Código IATA del aeropuerto de origen del primer tramo. */
    private String origenCodigoIata;
    
    /** Ciudad de destino del último tramo. */
    private String destinoCiudad;
    
    /** Código IATA del aeropuerto de destino del último tramo. */
    private String destinoCodigoIata;
    
    /** Fecha de salida del primer tramo (formato ISO). */
    private String fechaSalida;
    
    /** Hora de salida del primer tramo (formato "HH:mm"). */
    private String horaSalida;
    
    /** Fecha de llegada del último tramo (formato ISO). */
    private String fechaLlegada;
    
    /** Hora de llegada del último tramo (formato "HH:mm"). */
    private String horaLlegada;
    
    /** Tipo de asiento (se toma del primer tramo). */
    private String tipoAsiento;
    
    /** Precio base total (suma de los precios base de todos los tramos). */
    private BigDecimal precioBase;
    
    /** Número de asientos disponibles (mínimo entre todos los tramos). */
    private Integer asientosDisponibles;
    
    /** Estado general del vuelo con escalas (actualmente fijo "ACTIVO"). */
    private String estado;

    /** Indica si el vuelo es de ida y vuelta. */
    private boolean esIdaYVuelta = false;
    
    /** Lista de información de cada escala intermedia. */
    private List<EscalaInfo> escalas;

    /**
     * Construye un objeto {@code VueloConEscala} a partir de una lista de tramos.
     * <p>
     * Realiza las siguientes operaciones:
     * <ul>
     *   <li>Genera un ID compuesto concatenando los IDs de los vuelos con guiones.</li>
     *   <li>Genera un código de vuelo compuesto concatenando los códigos con '+'.</li>
     *   <li>Toma origen y salida del primer tramo, destino y llegada del último.</li>
     *   <li>Calcula el precio total sumando los precios base de todos los tramos.</li>
     *   <li>Determina la disponibilidad de asientos como el mínimo entre todos los tramos.</li>
     *   <li>Construye la lista de escalas intermedias con tiempos de conexión.</li>
     * </ul>
     * 
     *
     * @param tramos Lista ordenada de objetos {@link Vuelo} que componen la ruta.
     */
    public VueloConEscala(List<Vuelo> tramos) {
        this.tramos = tramos;

        Vuelo primero = tramos.get(0);
        Vuelo ultimo  = tramos.get(tramos.size() - 1);

        // ID compuesto: "81-82-83"
        this.idVuelo = tramos.stream()
            .map(v -> String.valueOf(v.getIdVuelo()))
            .collect(Collectors.joining("-"));

        // Código compuesto: "HC-501+HC-601+HC-701"
        this.codigoVuelo = tramos.stream()
            .map(Vuelo::getCodigoVuelo)
            .collect(Collectors.joining("+"));

        this.origenCiudad       = primero.getOrigenCiudad();
        this.origenCodigoIata   = primero.getOrigenCodigoIata();
        this.destinoCiudad      = ultimo.getDestinoCiudad();
        this.destinoCodigoIata  = ultimo.getDestinoCodigoIata();
        this.fechaSalida        = primero.getFechaSalida().toString();
        this.horaSalida         = primero.getHoraSalida();
        this.fechaLlegada       = ultimo.getFechaLlegada().toString();
        this.horaLlegada        = ultimo.getHoraLlegada();
        this.tipoAsiento        = primero.getTipoAsiento();
        this.estado             = "ACTIVO";

        // Precio = suma de todos los tramos
        this.precioBase = tramos.stream()
            .map(Vuelo::getPrecioBase)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Disponibilidad = mínimo entre todos los tramos
        this.asientosDisponibles = tramos.stream()
            .mapToInt(Vuelo::getAsientosDisponibles)
            .min()
            .orElse(0);

        // Escalas = puntos intermedios (entre cada par de tramos consecutivos)
        this.escalas = new ArrayList<>();
        for (int i = 0; i < tramos.size() - 1; i++) {
            Vuelo actual    = tramos.get(i);
            Vuelo siguiente = tramos.get(i + 1);
            this.escalas.add(new EscalaInfo(
                actual.getDestinoCiudad(),
                actual.getDestinoCodigoIata().trim(),
                actual.getHoraLlegada(),
                siguiente.getHoraSalida()
            ));
        }
    }

    // Getters
    
    /**
     * @return la lista original de tramos (vuelos individuales).
     */
    public List<Vuelo> getTramos()         { return tramos; }
    
    /**
     * @return el identificador compuesto de los vuelos.
     */
    public String getIdVuelo()             { return idVuelo; }
    
    /**
     * @return el código compuesto de los vuelos.
     */
    public String getCodigoVuelo()         { return codigoVuelo; }
    
    /**
     * @return la ciudad de origen.
     */
    public String getOrigenCiudad()        { return origenCiudad; }
    
    /**
     * @return el código IATA del aeropuerto de origen.
     */
    public String getOrigenCodigoIata()    { return origenCodigoIata; }
    
    /**
     * @return la ciudad de destino.
     */
    public String getDestinoCiudad()       { return destinoCiudad; }
    
    /**
     * @return el código IATA del aeropuerto de destino.
     */
    public String getDestinoCodigoIata()   { return destinoCodigoIata; }
    
    /**
     * @return la fecha de salida del primer tramo.
     */
    public String getFechaSalida()         { return fechaSalida; }
    
    /**
     * @return la hora de salida del primer tramo.
     */
    public String getHoraSalida()          { return horaSalida; }
    
    /**
     * @return la fecha de llegada del último tramo.
     */
    public String getFechaLlegada()        { return fechaLlegada; }
    
    /**
     * @return la hora de llegada del último tramo.
     */
    public String getHoraLlegada()         { return horaLlegada; }
    
    /**
     * @return el tipo de asiento.
     */
    public String getTipoAsiento()         { return tipoAsiento; }
    
    /**
     * @return el precio base total de la ruta.
     */
    public BigDecimal getPrecioBase()      { return precioBase; }
    
    /**
     * @return el número de asientos disponibles (mínimo entre tramos).
     */
    public Integer getAsientosDisponibles(){ return asientosDisponibles; }
    
    /**
     * @return el estado general del vuelo.
     */
    public String getEstado()              { return estado; }

    /**
     * @return si el vuelo es de ida y vuelta.
     */
    public boolean isEsIdaYVuelta() { return esIdaYVuelta; }

    /**
     * Establece si el vuelo es de ida y vuelta.
     */
    public void setEsIdaYVuelta(boolean esIdaYVuelta) { this.esIdaYVuelta = esIdaYVuelta; }
    
    /**
     * @return la lista de información de escalas intermedias.
     */
    public List<EscalaInfo> getEscalas()   { return escalas; }

    /**
     * Clase interna que representa la información de una escala entre dos tramos.
     * <p>
     * Contiene la ciudad, código IATA, hora de llegada, hora de salida y la duración
     * calculada de la conexión.
     * </p>
     */
    public static class EscalaInfo {
        /** Ciudad donde se realiza la escala. */
        private String ciudad;
        
        /** Código IATA del aeropuerto de escala. */
        private String codigo;
        
        /** Hora de llegada del vuelo anterior (formato "HH:mm"). */
        private String llegada;
        
        /** Hora de salida del siguiente vuelo (formato "HH:mm"). */
        private String salida;
        
        /** Duración de la conexión (ej. "1h 30m"). */
        private String duracion;

        /**
         * Construye la información de una escala.
         *
         * @param ciudad  Ciudad de la escala.
         * @param codigo  Código IATA del aeropuerto.
         * @param llegada Hora de llegada.
         * @param salida  Hora de salida.
         */
        public EscalaInfo(String ciudad, String codigo, String llegada, String salida) {
            this.ciudad   = ciudad;
            this.codigo   = codigo;
            this.llegada  = llegada;
            this.salida   = salida;
            this.duracion = calcularDuracion(llegada, salida);
        }

        /**
         * Calcula la duración en horas y minutos entre dos horas en formato "HH:mm".
         * <p>
         * Si la hora de salida es menor que la de llegada, se asume que la salida es al día siguiente.
         * </p>
         *
         * @param llegada Hora de llegada.
         * @param salida  Hora de salida.
         * @return Duración en formato "Xh Ym".
         */
        private String calcularDuracion(String llegada, String salida) {
            String[] p1 = llegada.split(":");
            String[] p2 = salida.split(":");
            int min1 = Integer.parseInt(p1[0]) * 60 + Integer.parseInt(p1[1]);
            int min2 = Integer.parseInt(p2[0]) * 60 + Integer.parseInt(p2[1]);
            int diff = min2 - min1;
            if (diff < 0) diff += 24 * 60;
            return (diff / 60) + "h " + (diff % 60) + "m";
        }

        /**
         * @return la ciudad de la escala.
         */
        public String getCiudad()   { return ciudad; }
        
        /**
         * @return el código IATA del aeropuerto.
         */
        public String getCodigo()   { return codigo; }
        
        /**
         * @return la hora de llegada.
         */
        public String getLlegada()  { return llegada; }
        
        /**
         * @return la hora de salida.
         */
        public String getSalida()   { return salida; }
        
        /**
         * @return la duración calculada de la conexión.
         */
        public String getDuracion() { return duracion; }
    }
}