package com.halcon.sat.controller;

import com.halcon.sat.service.ExcelService;
import com.halcon.sat.service.ReporteService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/sat/reportes")
public class ReporteController {

    private final ReporteService reportes;
    private final ExcelService excel;

    public ReporteController(ReporteService reportes, ExcelService excel) {
        this.reportes = reportes;
        this.excel = excel;
    }

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
        HttpHeaders h = new HttpHeaders();
        h.setContentType(MediaType.parseMediaType(
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        h.setContentDispositionFormData("attachment", "facturas-sat.xlsx");
        return ResponseEntity.ok().headers(h).body(bytes);
    }
}
