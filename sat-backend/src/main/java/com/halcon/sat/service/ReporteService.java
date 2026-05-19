package com.halcon.sat.service;

import com.halcon.sat.repository.FacturaRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ReporteService {

    private final FacturaRepository facturas;

    public ReporteService(FacturaRepository facturas) {
        this.facturas = facturas;
    }

    public Map<String, Object> stats() {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("totalFacturado", facturas.sumTotal());
        out.put("cantidadFacturas", facturas.count());
        Map<String, Long> porEstado = new LinkedHashMap<>();
        porEstado.put("EMITIDA", facturas.countByEstado("EMITIDA"));
        porEstado.put("PAGADA", facturas.countByEstado("PAGADA"));
        porEstado.put("ANULADA", facturas.countByEstado("ANULADA"));
        out.put("porEstado", porEstado);
        out.put("ingresosPorMes", facturas.ingresosPorMes(6));
        out.put("totalPorTipoEmisor", facturas.totalPorTipoEmisor());
        return out;
    }

    public Map<String, Object> ranking() {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("topEmisores", facturas.rankingEmisores(10));
        out.put("topReceptores", facturas.rankingReceptores(10));
        return out;
    }

    public List<Map<String, Object>> allFacturasFlat() {
        return facturas.findAllFlat();
    }

    // 5 reportes formales

    public List<Map<String, Object>> porReceptor(String nit, String email) {
        return facturas.reportePorReceptor(nit, email);
    }

    public List<Map<String, Object>> porEmisor(Long idEmisor, String tipo) {
        return facturas.reportePorEmisor(idEmisor, tipo);
    }

    public List<Map<String, Object>> porTipoItem(String tipo) {
        return facturas.reportePorTipoItem(tipo);
    }

    public List<Map<String, Object>> porPeriodo(LocalDate from, LocalDate to) {
        return facturas.reportePorPeriodo(from, to);
    }

    public List<Map<String, Object>> porEstado() {
        return facturas.reportePorEstado();
    }
}
