package com.halcon.aerolineas.models;

import java.math.BigDecimal;

/**
 * Categoría (clase) de asientos ofrecida en un vuelo.
 * <p>
 * Un vuelo (tabla VUELOS) puede tener 1..N categorías en CATEGORIAS_VUELO,
 * cada una con su propio tipo_asiento, precio y conteo de asientos. Esto
 * reemplaza el modelo viejo donde el vuelo tenía un único tipo_asiento.
 */
public class CategoriaVuelo {

    private Long idCategoria;
    private Long idVuelo;
    private String tipoAsiento;
    private BigDecimal precio;
    private Integer asientosTotales;
    private Integer asientosDisponibles;

    public CategoriaVuelo() {}

    public CategoriaVuelo(Long idVuelo, String tipoAsiento, BigDecimal precio,
                          Integer asientosTotales, Integer asientosDisponibles) {
        this.idVuelo = idVuelo;
        this.tipoAsiento = tipoAsiento;
        this.precio = precio;
        this.asientosTotales = asientosTotales;
        this.asientosDisponibles = asientosDisponibles;
    }

    public Long getIdCategoria() { return idCategoria; }
    public void setIdCategoria(Long idCategoria) { this.idCategoria = idCategoria; }

    public Long getIdVuelo() { return idVuelo; }
    public void setIdVuelo(Long idVuelo) { this.idVuelo = idVuelo; }

    public String getTipoAsiento() { return tipoAsiento; }
    public void setTipoAsiento(String tipoAsiento) { this.tipoAsiento = tipoAsiento; }

    public BigDecimal getPrecio() { return precio; }
    public void setPrecio(BigDecimal precio) { this.precio = precio; }

    public Integer getAsientosTotales() { return asientosTotales; }
    public void setAsientosTotales(Integer asientosTotales) { this.asientosTotales = asientosTotales; }

    public Integer getAsientosDisponibles() { return asientosDisponibles; }
    public void setAsientosDisponibles(Integer asientosDisponibles) { this.asientosDisponibles = asientosDisponibles; }
}
