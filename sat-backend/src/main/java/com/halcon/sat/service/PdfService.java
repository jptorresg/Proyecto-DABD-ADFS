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
            det.addCell(bodyCell(d.getDescripcion(), normal, Element.ALIGN_LEFT));
            det.addCell(bodyCell(d.getCantidad().toPlainString(), normal, Element.ALIGN_RIGHT));
            det.addCell(bodyCell(d.getPrecioUnitario().toPlainString(), normal, Element.ALIGN_RIGHT));
            det.addCell(bodyCell(d.getSubtotal().toPlainString(), normal, Element.ALIGN_RIGHT));
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

    /** Celda del cuerpo de tabla con bordes finos en todos los lados. */
    private PdfPCell bodyCell(String text, Font font, int alignment) {
        PdfPCell c = new PdfPCell(new Phrase(text, font));
        c.setPadding(6);
        c.setHorizontalAlignment(alignment);
        c.setBorderColor(new Color(200, 200, 200));
        c.setBorderWidth(0.5f);
        return c;
    }

    private String money(BigDecimal v) {
        return v == null ? "0.00" : "Q " + v.toPlainString();
    }

    // ---------- Reportes formales (tabular generico) ----------

    /**
     * PDF tabular generico para reportes. Renderiza header + filtros + tabla con
     * columnas dinamicas + fila TOTAL al final si hay columnas numericas.
     *
     * @param titulo            Titulo grande del reporte
     * @param subtitulo         Subtitulo / filtros aplicados
     * @param columnLabels      Headers de la tabla
     * @param columnKeys        Keys en cada Map de filas
     * @param columnsRightAlign Indices de columnas que se alinean a la derecha (numericas)
     * @param sumColumnIndices  Indices de columnas a sumar en la fila TOTAL
     * @param rows              Filas
     * @return bytes del PDF
     */
    public byte[] reporteTabular(String titulo,
                                 String subtitulo,
                                 java.util.List<String> columnLabels,
                                 java.util.List<String> columnKeys,
                                 java.util.Set<Integer> columnsRightAlign,
                                 java.util.Set<Integer> sumColumnIndices,
                                 java.util.List<java.util.Map<String, Object>> rows) {

        java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
        Document doc = new Document(PageSize.LETTER.rotate(), 30, 30, 30, 30);
        PdfWriter.getInstance(doc, baos);
        doc.open();

        Font h1 = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, new java.awt.Color(20, 60, 120));
        Font sub = FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 10, java.awt.Color.DARK_GRAY);
        Font normal = FontFactory.getFont(FontFactory.HELVETICA, 9, java.awt.Color.BLACK);
        Font totalF = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, new java.awt.Color(20, 60, 120));
        Font small = FontFactory.getFont(FontFactory.HELVETICA, 8, java.awt.Color.GRAY);

        Paragraph p1 = new Paragraph(titulo, h1);
        p1.setAlignment(Element.ALIGN_CENTER);
        doc.add(p1);

        if (subtitulo != null && !subtitulo.isBlank()) {
            Paragraph p2 = new Paragraph(subtitulo, sub);
            p2.setAlignment(Element.ALIGN_CENTER);
            p2.setSpacingAfter(8);
            doc.add(p2);
        }

        Paragraph fecha = new Paragraph(
            "Generado: " + java.time.LocalDateTime.now()
                .format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")),
            small);
        fecha.setAlignment(Element.ALIGN_RIGHT);
        fecha.setSpacingAfter(8);
        doc.add(fecha);

        PdfPTable table = new PdfPTable(columnLabels.size());
        table.setWidthPercentage(100);

        for (int i = 0; i < columnLabels.size(); i++) {
            table.addCell(headerCell(columnLabels.get(i)));
        }

        java.math.BigDecimal[] totales = new java.math.BigDecimal[columnLabels.size()];
        for (java.util.Map<String, Object> row : rows) {
            for (int i = 0; i < columnKeys.size(); i++) {
                Object v = row.get(columnKeys.get(i));
                String text = v == null ? "" : v.toString();
                PdfPCell c = new PdfPCell(new Phrase(text, normal));
                c.setPadding(5);
                if (columnsRightAlign.contains(i)) {
                    c.setHorizontalAlignment(Element.ALIGN_RIGHT);
                }
                table.addCell(c);

                if (sumColumnIndices.contains(i) && v instanceof java.math.BigDecimal) {
                    if (totales[i] == null) totales[i] = java.math.BigDecimal.ZERO;
                    totales[i] = totales[i].add((java.math.BigDecimal) v);
                }
            }
        }

        // Fila TOTAL
        if (!sumColumnIndices.isEmpty()) {
            for (int i = 0; i < columnLabels.size(); i++) {
                String text;
                if (i == 0) {
                    text = "TOTAL";
                } else if (totales[i] != null) {
                    text = "Q " + totales[i].toPlainString();
                } else {
                    text = "";
                }
                PdfPCell c = new PdfPCell(new Phrase(text, totalF));
                c.setPadding(6);
                c.setBackgroundColor(new java.awt.Color(235, 240, 250));
                if (columnsRightAlign.contains(i)) {
                    c.setHorizontalAlignment(Element.ALIGN_RIGHT);
                }
                table.addCell(c);
            }
        }
        doc.add(table);

        if (rows.isEmpty()) {
            Paragraph empty = new Paragraph("(Sin datos para los filtros aplicados.)", sub);
            empty.setAlignment(Element.ALIGN_CENTER);
            empty.setSpacingBefore(15);
            doc.add(empty);
        }

        Paragraph foot = new Paragraph("Documento generado por SAT Backend - Sistema de Administracion Tributaria", small);
        foot.setSpacingBefore(15);
        foot.setAlignment(Element.ALIGN_CENTER);
        doc.add(foot);

        doc.close();
        return baos.toByteArray();
    }
}
