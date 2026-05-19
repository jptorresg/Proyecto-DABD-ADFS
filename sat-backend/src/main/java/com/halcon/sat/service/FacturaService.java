package com.halcon.sat.service;

import com.halcon.sat.dto.FacturaRequest;
import com.halcon.sat.model.DetalleFactura;
import com.halcon.sat.model.Factura;
import com.halcon.sat.repository.EmisorRepository;
import com.halcon.sat.repository.FacturaRepository;
import com.halcon.sat.repository.ReceptorRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Optional;

@Service
public class FacturaService {

    private static final BigDecimal IVA_RATE = new BigDecimal("0.12");
    private static final String SERIE_DEFAULT = "A";

    private final FacturaRepository facturas;
    private final EmisorRepository emisores;
    private final ReceptorRepository receptores;

    public FacturaService(FacturaRepository facturas, EmisorRepository emisores,
                          ReceptorRepository receptores) {
        this.facturas = facturas;
        this.emisores = emisores;
        this.receptores = receptores;
    }

    public List<Factura> list(String estado, Long idEmisor) {
        return facturas.findAll(estado, idEmisor);
    }

    public Optional<Factura> findById(Long id) {
        return facturas.findById(id);
    }

    @Transactional
    public Factura create(FacturaRequest req) {
        if (emisores.findById(req.getIdEmisor()).isEmpty()) {
            throw new NotFoundException("Emisor no existe: " + req.getIdEmisor());
        }
        if (receptores.findById(req.getIdReceptor()).isEmpty()) {
            throw new NotFoundException("Receptor no existe: " + req.getIdReceptor());
        }

        BigDecimal subtotalAcum = BigDecimal.ZERO;
        for (FacturaRequest.Linea linea : req.getDetalles()) {
            BigDecimal sub = linea.getCantidad().multiply(linea.getPrecioUnitario())
                .setScale(2, RoundingMode.HALF_UP);
            subtotalAcum = subtotalAcum.add(sub);
        }

        BigDecimal impuesto = subtotalAcum.multiply(IVA_RATE).setScale(2, RoundingMode.HALF_UP);
        BigDecimal total = subtotalAcum.add(impuesto).setScale(2, RoundingMode.HALF_UP);

        Factura f = new Factura();
        f.setSerie(req.getSerie() != null && !req.getSerie().isBlank() ? req.getSerie() : SERIE_DEFAULT);
        f.setNumero(facturas.nextNumero(f.getSerie()));
        f.setIdEmisor(req.getIdEmisor());
        f.setIdReceptor(req.getIdReceptor());
        f.setSubtotal(subtotalAcum);
        f.setImpuesto(impuesto);
        f.setTotal(total);
        f.setEstado("EMITIDA");
        f.setReferenciaExterna(req.getReferenciaExterna());

        Long idFactura = facturas.createFactura(f);
        f.setIdFactura(idFactura);

        for (FacturaRequest.Linea linea : req.getDetalles()) {
            DetalleFactura d = new DetalleFactura();
            d.setIdFactura(idFactura);
            d.setDescripcion(linea.getDescripcion());
            d.setCantidad(linea.getCantidad());
            d.setPrecioUnitario(linea.getPrecioUnitario());
            d.setSubtotal(linea.getCantidad().multiply(linea.getPrecioUnitario())
                .setScale(2, RoundingMode.HALF_UP));
            facturas.insertDetalle(d);
            f.getDetalles().add(d);
        }

        return f;
    }

    public static class NotFoundException extends RuntimeException {
        public NotFoundException(String msg) { super(msg); }
    }
}
