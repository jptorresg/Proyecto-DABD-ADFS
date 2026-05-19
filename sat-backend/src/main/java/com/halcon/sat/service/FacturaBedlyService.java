package com.halcon.sat.service;

import com.halcon.sat.dto.BedlyReservaDto;
import com.halcon.sat.dto.FacturaRequest;
import com.halcon.sat.model.Factura;
import com.halcon.sat.repository.FacturaRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class FacturaBedlyService {

    private static final BigDecimal IVA_FACTOR = new BigDecimal("1.12");

    private final BedlyClient bedly;
    private final FacturaService facturas;
    private final FacturaRepository facturasRepo;
    private final long defaultEmisorId;
    private final long defaultReceptorId;

    public FacturaBedlyService(BedlyClient bedly,
                               FacturaService facturas,
                               FacturaRepository facturasRepo,
                               @Value("${sat.bedly.default-emisor-id:1}") long defaultEmisorId,
                               @Value("${sat.bedly.default-receptor-id:1}") long defaultReceptorId) {
        this.bedly = bedly;
        this.facturas = facturas;
        this.facturasRepo = facturasRepo;
        this.defaultEmisorId = defaultEmisorId;
        this.defaultReceptorId = defaultReceptorId;
    }

    public Factura facturarReserva(int idReserva) {
        String referencia = "bedly:reserva:" + idReserva;
        return facturasRepo.findByReferenciaExterna(referencia)
            .orElseGet(() -> crearDesdeReserva(idReserva, referencia));
    }

    private Factura crearDesdeReserva(int idReserva, String referencia) {
        BedlyReservaDto r = bedly.getReservacion(idReserva);

        // Bedly guarda precioTotal CON IVA incluido. Hacemos reverse:
        //   subtotalLinea = precioTotal / 1.12
        // El service de Facturas recompone con IVA 12% sobre el subtotal.
        BigDecimal totalConIva = r.getPrecioTotal() != null ? r.getPrecioTotal() : BigDecimal.ZERO;
        BigDecimal subtotalLinea = totalConIva
            .divide(IVA_FACTOR, 4, RoundingMode.HALF_UP)
            .setScale(2, RoundingMode.HALF_UP);

        long noches = 1;
        if (r.getFechaCheckIn() != null && r.getFechaCheckOut() != null) {
            noches = Math.max(1, ChronoUnit.DAYS.between(
                r.getFechaCheckIn().toLocalDate(), r.getFechaCheckOut().toLocalDate()));
        }
        BigDecimal precioUnitario = subtotalLinea
            .divide(BigDecimal.valueOf(noches), 2, RoundingMode.HALF_UP);

        // Sin tildes para evitar mojibake si el NLS_CHARACTERSET de Oracle
        // no es AL32UTF8.
        String descripcion = String.format(
            "Reserva habitacion %s en %s (%d noche%s)",
            nullSafe(r.getNombreHabitacion(), "sin nombre"),
            nullSafe(r.getNombreHotel(), "Bedly"),
            noches, noches == 1 ? "" : "s");

        FacturaRequest req = new FacturaRequest();
        req.setIdEmisor(defaultEmisorId);
        req.setIdReceptor(defaultReceptorId);
        req.setReferenciaExterna(referencia);

        FacturaRequest.Linea linea = new FacturaRequest.Linea();
        linea.setDescripcion(descripcion);
        linea.setCantidad(BigDecimal.valueOf(noches));
        linea.setPrecioUnitario(precioUnitario);
        linea.setTipoItem("HABITACION");
        req.setDetalles(List.of(linea));

        return facturas.create(req);
    }

    private static String nullSafe(String s, String fallback) {
        return (s == null || s.isBlank()) ? fallback : s;
    }
}
