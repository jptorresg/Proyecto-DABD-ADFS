package com.halcon.sat.controller;

import com.halcon.sat.model.Receptor;
import com.halcon.sat.repository.ReceptorRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/sat/receptores")
public class ReceptorController {

    private final ReceptorRepository receptores;

    public ReceptorController(ReceptorRepository receptores) {
        this.receptores = receptores;
    }

    @GetMapping
    public List<Receptor> list() {
        return receptores.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Receptor> findById(@PathVariable Long id) {
        return receptores.findById(id)
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Receptor> create(@Valid @RequestBody ReceptorCreate body) {
        Receptor r = new Receptor();
        r.setNit(body.nit);
        r.setNombre(body.nombre);
        r.setDireccion(body.direccion);
        r.setEmail(body.email);
        Long id = receptores.create(r);
        return ResponseEntity.ok(receptores.findById(id).orElseThrow());
    }

    public static class ReceptorCreate {
        @NotBlank
        public String nit;
        @NotBlank
        public String nombre;
        public String direccion;
        public String email;
    }
}
