package com.halcon.sat.controller;

import com.halcon.sat.service.ExcelService;
import com.halcon.sat.service.PdfService;
import com.halcon.sat.service.ReporteService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/sat/reportes")
public class ReporteController {

    private final ReporteService reportes;
    private final ExcelService excel;
    private final PdfService pdf;

    public ReporteController(ReporteService reportes, ExcelService excel, PdfService pdf) {
        this.reportes = reportes;
        this.excel = excel;
        this.pdf = pdf;
    }

    // ---------- existentes (dashboard) ----------

    @GetMapping("/stats")
    public Map<String, Object> stats() {
        return reportes.stats();
    }

    @GetMapping("/ranking")
    public Map<String, Object> ranking() {
        return reportes.ranking();
    }

    @GetMapping("/excel")
    public ResponseEntity<byte[]> excel() {
        byte[] bytes = excel.facturasXlsx(reportes.allFacturasFlat());
        return xlsxResponse(bytes, "facturas-sat.xlsx");
    }

    // ---------- 5 reportes formales (catedratico) ----------

    @GetMapping("/por-receptor")
    public List<Map<String, Object>> porReceptor(@RequestParam(required = false) String nit,
                                                 @RequestParam(required = false) String email) {
        return reportes.porReceptor(nit, email);
    }

    @GetMapping("/por-receptor/pdf")
    public ResponseEntity<byte[]> porReceptorPdf(@RequestParam(required = false) String nit,
                                                 @RequestParam(required = false) String email) {
        List<Map<String, Object>> rows = reportes.porReceptor(nit, email);
        Map<String, String> filtros = new LinkedHashMap<>();
        filtros.put("NIT", nit);
        filtros.put("Email", email);
        String sub = filtrosTexto(filtros);
        byte[] bytes = pdf.reporteTabular(
            "Reporte de Impuestos por Receptor",
            sub,
            List.of("NIT", "Nombre", "Email", "Facturas", "Subtotal", "IVA", "Total"),
            List.of("nit", "nombre", "email", "facturas", "subtotal", "impuesto", "total"),
            Set.of(3, 4, 5, 6), Set.of(4, 5, 6), rows);
        return pdfResponse(bytes, "reporte-por-receptor.pdf");
    }

    @GetMapping("/por-emisor")
    public List<Map<String, Object>> porEmisor(@RequestParam(required = false) Long idEmisor,
                                               @RequestParam(required = false) String tipo) {
        return reportes.porEmisor(idEmisor, tipo);
    }

    @GetMapping("/por-emisor/pdf")
    public ResponseEntity<byte[]> porEmisorPdf(@RequestParam(required = false) Long idEmisor,
                                               @RequestParam(required = false) String tipo) {
        List<Map<String, Object>> rows = reportes.porEmisor(idEmisor, tipo);
        Map<String, String> filtros = new LinkedHashMap<>();
        filtros.put("Emisor ID", idEmisor == null ? null : idEmisor.toString());
        filtros.put("Tipo", tipo);
        String sub = filtrosTexto(filtros);
        byte[] bytes = pdf.reporteTabular(
            "Reporte de Impuestos por Proveedor (Emisor)",
            sub,
            List.of("NIT", "Nombre", "Tipo", "Facturas", "Subtotal", "IVA cobrado", "Total"),
            List.of("nit", "nombre", "tipo", "facturas", "subtotal", "impuesto", "total"),
            Set.of(3, 4, 5, 6), Set.of(4, 5, 6), rows);
        return pdfResponse(bytes, "reporte-por-emisor.pdf");
    }

    @GetMapping("/por-tipo-item")
    public List<Map<String, Object>> porTipoItem(@RequestParam(required = false) String tipo) {
        return reportes.porTipoItem(tipo);
    }

    @GetMapping("/por-tipo-item/pdf")
    public ResponseEntity<byte[]> porTipoItemPdf(@RequestParam(required = false) String tipo) {
        List<Map<String, Object>> rows = reportes.porTipoItem(tipo);
        Map<String, String> filtros = new LinkedHashMap<>();
        filtros.put("Tipo de item", tipo);
        String sub = filtrosTexto(filtros);
        byte[] bytes = pdf.reporteTabular(
            "Reporte de Impuestos por Tipo de Item",
            "Habitacion, Asiento, Paquete u Otro." + (sub.isBlank() ? "" : " " + sub),
            List.of("Tipo", "Facturas", "Cantidad total", "Subtotal", "IVA", "Total"),
            List.of("tipoItem", "facturas", "cantidadTotal", "subtotal", "impuesto", "total"),
            Set.of(1, 2, 3, 4, 5), Set.of(3, 4, 5), rows);
        return pdfResponse(bytes, "reporte-por-tipo-item.pdf");
    }

    @GetMapping("/por-periodo")
    public List<Map<String, Object>> porPeriodo(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return reportes.porPeriodo(from, to);
    }

    @GetMapping("/por-periodo/pdf")
    public ResponseEntity<byte[]> porPeriodoPdf(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        List<Map<String, Object>> rows = reportes.porPeriodo(from, to);
        Map<String, String> filtros = new LinkedHashMap<>();
        filtros.put("Desde", from == null ? null : from.toString());
        filtros.put("Hasta", to == null ? null : to.toString());
        String sub = filtrosTexto(filtros);
        byte[] bytes = pdf.reporteTabular(
            "Reporte de Impuestos por Periodo",
            sub,
            List.of("Dia", "Facturas", "Subtotal", "IVA", "Total"),
            List.of("dia", "facturas", "subtotal", "impuesto", "total"),
            Set.of(1, 2, 3, 4), Set.of(2, 3, 4), rows);
        return pdfResponse(bytes, "reporte-por-periodo.pdf");
    }

    @GetMapping("/por-estado")
    public List<Map<String, Object>> porEstado() {
        return reportes.porEstado();
    }

    @GetMapping("/por-estado/pdf")
    public ResponseEntity<byte[]> porEstadoPdf() {
        List<Map<String, Object>> rows = reportes.porEstado();
        byte[] bytes = pdf.reporteTabular(
            "Reporte de Impuestos por Estado de Factura",
            "Emitidas, pagadas y anuladas con totales agregados.",
            List.of("Estado", "Facturas", "Subtotal", "IVA", "Total"),
            List.of("estado", "facturas", "subtotal", "impuesto", "total"),
            Set.of(1, 2, 3, 4), Set.of(2, 3, 4), rows);
        return pdfResponse(bytes, "reporte-por-estado.pdf");
    }

    // ---------- helpers ----------

    private static String filtrosTexto(Map<String, String> filtros) {
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, String> e : filtros.entrySet()) {
            if (e.getValue() != null && !e.getValue().isBlank()) {
                if (sb.length() > 0) sb.append("  -  ");
                sb.append(e.getKey()).append(": ").append(e.getValue());
            }
        }
        return sb.toString().isBlank() ? "Sin filtros (todos los registros)" : "Filtros: " + sb;
    }

    private static ResponseEntity<byte[]> pdfResponse(byte[] bytes, String filename) {
        HttpHeaders h = new HttpHeaders();
        h.setContentType(MediaType.APPLICATION_PDF);
        h.setContentDispositionFormData("inline", filename);
        return ResponseEntity.ok().headers(h).body(bytes);
    }

    private static ResponseEntity<byte[]> xlsxResponse(byte[] bytes, String filename) {
        HttpHeaders h = new HttpHeaders();
        h.setContentType(MediaType.parseMediaType(
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        h.setContentDispositionFormData("attachment", filename);
        return ResponseEntity.ok().headers(h).body(bytes);
    }
}
