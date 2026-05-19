package com.halcon.sat.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.util.List;

public class FacturaRequest {

    @NotNull
    private Long idEmisor;

    @NotNull
    private Long idReceptor;

    private String serie;

    private String referenciaExterna;

    @NotEmpty
    @Valid
    private List<Linea> detalles;

    public Long getIdEmisor() { return idEmisor; }
    public void setIdEmisor(Long idEmisor) { this.idEmisor = idEmisor; }

    public Long getIdReceptor() { return idReceptor; }
    public void setIdReceptor(Long idReceptor) { this.idReceptor = idReceptor; }

    public String getSerie() { return serie; }
    public void setSerie(String serie) { this.serie = serie; }

    public String getReferenciaExterna() { return referenciaExterna; }
    public void setReferenciaExterna(String referenciaExterna) { this.referenciaExterna = referenciaExterna; }

    public List<Linea> getDetalles() { return detalles; }
    public void setDetalles(List<Linea> detalles) { this.detalles = detalles; }

    public static class Linea {

        @NotNull
        private String descripcion;

        @NotNull
        @Positive
        private BigDecimal cantidad;

        @NotNull
        private BigDecimal precioUnitario;

        /** HABITACION, ASIENTO, PAQUETE, OTRO. Default OTRO si no se envia. */
        private String tipoItem;

        public String getDescripcion() { return descripcion; }
        public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

        public BigDecimal getCantidad() { return cantidad; }
        public void setCantidad(BigDecimal cantidad) { this.cantidad = cantidad; }

        public BigDecimal getPrecioUnitario() { return precioUnitario; }
        public void setPrecioUnitario(BigDecimal precioUnitario) { this.precioUnitario = precioUnitario; }

        public String getTipoItem() { return tipoItem; }
        public void setTipoItem(String tipoItem) { this.tipoItem = tipoItem; }
    }
}
