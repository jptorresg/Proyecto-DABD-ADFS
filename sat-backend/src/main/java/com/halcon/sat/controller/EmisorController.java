package com.halcon.sat.controller;

import com.halcon.sat.model.Emisor;
import com.halcon.sat.repository.EmisorRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/sat/emisores")
public class EmisorController {

    private final EmisorRepository emisores;

    public EmisorController(EmisorRepository emisores) {
        this.emisores = emisores;
    }

    @GetMapping
    public List<Emisor> list() {
        return emisores.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Emisor> findById(@PathVariable Long id) {
        return emisores.findById(id)
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
