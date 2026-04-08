package com.halcon.aerolineas.models;

import java.util.List;
import java.util.ArrayList;
import java.math.BigDecimal;
import java.util.stream.Collectors;

public class VueloConEscala {

    // Guardamos los tramos por si el controller los necesita para reconstruir
    private List<Vuelo> tramos;

    // Campos serializables al frontend
    private String idVuelo;
    private String codigoVuelo;
    private String origenCiudad;
    private String origenCodigoIata;
    private String destinoCiudad;
    private String destinoCodigoIata;
    private String fechaSalida;
    private String horaSalida;
    private String fechaLlegada;
    private String horaLlegada;
    private String tipoAsiento;
    private BigDecimal precioBase;
    private Integer asientosDisponibles;
    private String estado;
    private List<EscalaInfo> escalas;

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
    public List<Vuelo> getTramos()         { return tramos; }
    public String getIdVuelo()             { return idVuelo; }
    public String getCodigoVuelo()         { return codigoVuelo; }
    public String getOrigenCiudad()        { return origenCiudad; }
    public String getOrigenCodigoIata()    { return origenCodigoIata; }
    public String getDestinoCiudad()       { return destinoCiudad; }
    public String getDestinoCodigoIata()   { return destinoCodigoIata; }
    public String getFechaSalida()         { return fechaSalida; }
    public String getHoraSalida()          { return horaSalida; }
    public String getFechaLlegada()        { return fechaLlegada; }
    public String getHoraLlegada()         { return horaLlegada; }
    public String getTipoAsiento()         { return tipoAsiento; }
    public BigDecimal getPrecioBase()      { return precioBase; }
    public Integer getAsientosDisponibles(){ return asientosDisponibles; }
    public String getEstado()              { return estado; }
    public List<EscalaInfo> getEscalas()   { return escalas; }

    // Clase interna para cada punto de escala
    public static class EscalaInfo {
        private String ciudad;
        private String codigo;
        private String llegada;
        private String salida;
        private String duracion;

        public EscalaInfo(String ciudad, String codigo, String llegada, String salida) {
            this.ciudad   = ciudad;
            this.codigo   = codigo;
            this.llegada  = llegada;
            this.salida   = salida;
            this.duracion = calcularDuracion(llegada, salida);
        }

        private String calcularDuracion(String llegada, String salida) {
            String[] p1 = llegada.split(":");
            String[] p2 = salida.split(":");
            int min1 = Integer.parseInt(p1[0]) * 60 + Integer.parseInt(p1[1]);
            int min2 = Integer.parseInt(p2[0]) * 60 + Integer.parseInt(p2[1]);
            int diff = min2 - min1;
            if (diff < 0) diff += 24 * 60;
            return (diff / 60) + "h " + (diff % 60) + "m";
        }

        public String getCiudad()   { return ciudad; }
        public String getCodigo()   { return codigo; }
        public String getLlegada()  { return llegada; }
        public String getSalida()   { return salida; }
        public String getDuracion() { return duracion; }
    }
}