package com.halcon.sat.service;

import com.halcon.sat.model.DetalleFactura;
import com.halcon.sat.model.Emisor;
import com.halcon.sat.model.Factura;
import com.halcon.sat.model.Receptor;
import com.halcon.sat.repository.EmisorRepository;
import com.halcon.sat.repository.ReceptorRepository;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;

@Service
public class PdfService {

    private static final DateTimeFormatter FECHA = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final EmisorRepository emisores;
    private final ReceptorRepository receptores;

    public PdfService(EmisorRepository emisores, ReceptorRepository receptores) {
        this.emisores = emisores;
        this.receptores = receptores;
    }

    public byte[] facturaPdf(Factura f) {
        Emisor emisor = emisores.findById(f.getIdEmisor()).orElse(null);
        Receptor receptor = receptores.findById(f.getIdReceptor()).orElse(null);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.LETTER, 40, 40, 40, 40);
        PdfWriter.getInstance(doc, baos);
        doc.open();

        Font h1 = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, new Color(20, 60, 120));
        Font h2 = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Color.DARK_GRAY);
        Font normal = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK);
        Font small = FontFactory.getFont(FontFactory.HELVETICA, 9, Color.GRAY);
        Font totalFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, new Color(20, 60, 120));

        Paragraph title = new Paragraph("FACTURA SAT", h1);
        title.setAlignment(Element.ALIGN_CENTER);
        doc.add(title);

        Paragraph serie = new Paragraph(
            String.format("Serie %s   -   Número %d", f.getSerie(), f.getNumero()), h2);
        serie.setAlignment(Element.ALIGN_CENTER);
        serie.setSpacingAfter(15);
        doc.add(serie);

        // Emisor / Receptor side-by-side
        PdfPTable cab = new PdfPTable(2);
        cab.setWidthPercentage(100);
        cab.addCell(cell("EMISOR", h2, false));
        cab.addCell(cell("RECEPTOR", h2, false));
        cab.addCell(cell(
            (emisor != null ? emisor.getNombre() + "\nNIT: " + emisor.getNit()
                + (emisor.getDireccion() != null ? "\n" + emisor.getDireccion() : "")
                + (emisor.getEmail() != null ? "\n" + emisor.getEmail() : "")
              : "(emisor #" + f.getIdEmisor() + ")"),
            normal, true));
        cab.addCell(cell(
            (receptor != null ? receptor.getNombre() + "\nNIT: " + receptor.getNit()
                + (receptor.getDireccion() != null ? "\n" + receptor.getDireccion() : "")
                + (receptor.getEmail() != null ? "\n" + receptor.getEmail() : "")
              : "(receptor #" + f.getIdReceptor() + ")"),
            normal, true));
        doc.add(cab);

        Paragraph fechaP = new Paragraph(
            "Fecha emisión: " + (f.getFechaEmision() != null ? FECHA.format(f.getFechaEmision()) : "-"),
            normal);
        fechaP.setSpacingBefore(10);
        fechaP.setSpacingAfter(10);
        doc.add(fechaP);

        // Detalle de lineas
        PdfPTable det = new PdfPTable(new float[]{55, 15, 15, 15});
        det.setWidthPercentage(100);
        det.addCell(headerCell("Descripción"));
        det.addCell(headerCell("Cantidad"));
        det.addCell(headerCell("P. Unitario"));
        det.addCell(headerCell("Subtotal"));

        for (DetalleFactura d : f.getDetalles()) {
            det.addCell(cell(d.getDescripcion(), normal, true));
            det.addCell(cellRight(d.getCantidad().toPlainString(), normal));
            det.addCell(cellRight(d.getPrecioUnitario().toPlainString(), normal));
            det.addCell(cellRight(d.getSubtotal().toPlainString(), normal));
        }
        doc.add(det);

        // Totales
        PdfPTable totales = new PdfPTable(new float[]{70, 30});
        totales.setWidthPercentage(60);
        totales.setHorizontalAlignment(Element.ALIGN_RIGHT);
        totales.setSpacingBefore(10);
        totales.addCell(cellRight("Subtotal:", normal));
        totales.addCell(cellRight(money(f.getSubtotal()), normal));
        totales.addCell(cellRight("IVA 12%:", normal));
        totales.addCell(cellRight(money(f.getImpuesto()), normal));
        totales.addCell(cellRight("TOTAL:", totalFont));
        totales.addCell(cellRight(money(f.getTotal()), totalFont));
        doc.add(totales);

        // Footer
        Paragraph footer = new Paragraph();
        footer.setSpacingBefore(30);
        footer.add(new Chunk("Estado: " + f.getEstado(), normal));
        if (f.getReferenciaExterna() != null) {
            footer.add(Chunk.NEWLINE);
            footer.add(new Chunk("Referencia externa: " + f.getReferenciaExterna(), small));
        }
        footer.add(Chunk.NEWLINE);
        footer.add(Chunk.NEWLINE);
        footer.add(new Chunk("Documento generado por SAT Backend - Sistema de Administración Tributaria", small));
        doc.add(footer);

        doc.close();
        return baos.toByteArray();
    }

    private PdfPCell cell(String text, Font font, boolean withBorder) {
        PdfPCell c = new PdfPCell(new Phrase(text, font));
        c.setPadding(6);
        if (!withBorder) c.setBorder(Rectangle.NO_BORDER);
        return c;
    }

    private PdfPCell cellRight(String text, Font font) {
        PdfPCell c = new PdfPCell(new Phrase(text, font));
        c.setPadding(6);
        c.setHorizontalAlignment(Element.ALIGN_RIGHT);
        c.setBorder(Rectangle.NO_BORDER);
        return c;
    }

    private PdfPCell headerCell(String text) {
        Font f = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.WHITE);
        PdfPCell c = new PdfPCell(new Phrase(text, f));
        c.setBackgroundColor(new Color(20, 60, 120));
        c.setPadding(6);
        c.setHorizontalAlignment(Element.ALIGN_CENTER);
        return c;
    }

    private String money(BigDecimal v) {
        return v == null ? "0.00" : "Q " + v.toPlainString();
    }
}
