package com.halcon.sat.controller;

import com.halcon.sat.dto.FacturaRequest;
import com.halcon.sat.model.Factura;
import com.halcon.sat.service.BedlyClient.BedlyNotFoundException;
import com.halcon.sat.service.FacturaBedlyService;
import com.halcon.sat.service.FacturaService;
import com.halcon.sat.service.FacturaService.NotFoundException;
import org.springframework.web.client.ResourceAccessException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sat/facturas")
public class FacturaController {

    private final FacturaService facturas;
    private final FacturaBedlyService desdeBedly;

    public FacturaController(FacturaService facturas, FacturaBedlyService desdeBedly) {
        this.facturas = facturas;
        this.desdeBedly = desdeBedly;
    }

    @GetMapping
    public List<Factura> list(@RequestParam(required = false) String estado,
                              @RequestParam(required = false) Long idEmisor) {
        return facturas.list(estado, idEmisor);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Factura> findById(@PathVariable Long id) {
        return facturas.findById(id)
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Factura> create(@Valid @RequestBody FacturaRequest req) {
        Factura f = facturas.create(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(f);
    }

    @PostMapping("/desde-bedly/{idReserva}")
    public ResponseEntity<Factura> facturarDesdeBedly(@PathVariable int idReserva) {
        Factura f = desdeBedly.facturarReserva(idReserva);
        return ResponseEntity.status(HttpStatus.CREATED).body(f);
    }

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(NotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(BedlyNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleBedlyNotFound(BedlyNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(ResourceAccessException.class)
    public ResponseEntity<Map<String, String>> handleBedlyDown(ResourceAccessException ex) {
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
            .body(Map.of("error", "No se pudo contactar a Bedly: " + ex.getMessage()));
    }
}
