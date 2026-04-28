package com.halcon.aerolineas.services;

import com.halcon.aerolineas.models.Pasajero;
import com.halcon.aerolineas.models.Reservacion;
import com.itextpdf.kernel.colors.Color;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.pdf.*;
import com.itextpdf.layout.*;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.properties.*;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.SolidBorder;

import java.io.ByteArrayOutputStream;
import java.util.List;

public class PdfService {

    public byte[] generarPDF(Reservacion reservacion, List<Pasajero> pasajeros) {

        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();

            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document doc = new Document(pdf);

            // 🎨 Colores (igual que frontend)
            Color primaryBlue = new DeviceRgb(74, 95, 127);
            Color darkGray = new DeviceRgb(73, 80, 87);
            Color lightGray = new DeviceRgb(233, 236, 239);
            Color success = new DeviceRgb(40, 167, 69);

            // =========================
            // HEADER
            // =========================
            Table header = new Table(1).useAllAvailableWidth();
            header.setBackgroundColor(primaryBlue);

            Cell headerCell = new Cell()
                    .add(new Paragraph("AEROLÍNEAS HALCÓN")
                            .setFontSize(16)
                            .setFontColor(ColorConstants.WHITE)
                            .setBold())
                    .setBorder(Border.NO_BORDER)
                    .setPadding(10);

            header.addCell(headerCell);
            doc.add(header);

            doc.add(new Paragraph("\n"));

            // =========================
            // INFO RESERVA
            // =========================
            Paragraph info = new Paragraph()
                    .add("Código: " + reservacion.getCodigoReservacion() + "\n")
                    .setFontSize(11)
                    .setFontColor(darkGray);

            Paragraph estado = new Paragraph("Estado: " + reservacion.getEstado())
                    .setFontColor(success)
                    .setFontSize(11);

            doc.add(info);
            doc.add(estado);

            // Línea separadora
            doc.add(new Paragraph(" ").setBorderBottom(new SolidBorder(lightGray, 1)));

            // =========================
            // VUELO
            // =========================
            doc.add(new Paragraph("DETALLE DEL VUELO")
                    .setFontSize(13)
                    .setFontColor(primaryBlue)
                    .setBold());

            if (reservacion.getVuelo() != null) {
                doc.add(new Paragraph(
                        reservacion.getVuelo().getCodigoVuelo() + " | " +
                        reservacion.getVuelo().getOrigenCodigoIata() + " -> " +
                        reservacion.getVuelo().getDestinoCodigoIata()
                ).setFontColor(darkGray));

                doc.add(new Paragraph("Salida: " + reservacion.getVuelo().getHoraSalida())
                        .setFontColor(darkGray));

                // (si luego agregas horaLlegada, puedes ponerla aquí)
            }

            doc.add(new Paragraph(" ").setBorderBottom(new SolidBorder(lightGray, 1)));

            // =========================
            // PASAJEROS
            // =========================
            doc.add(new Paragraph("PASAJEROS")
                    .setFontSize(13)
                    .setFontColor(primaryBlue)
                    .setBold());

            int i = 1;
            for (Pasajero p : pasajeros) {
                doc.add(new Paragraph(i + ". " + p.getNombres() + " " + p.getApellidos())
                        .setFontColor(darkGray));

                doc.add(new Paragraph("   Pasaporte: " + p.getNumPasaporte())
                        .setFontColor(new DeviceRgb(120, 120, 120)));

                i++;
            }

            doc.add(new Paragraph(" ").setBorderBottom(new SolidBorder(lightGray, 1)));

            // =========================
            // TOTAL
            // =========================
            doc.add(new Paragraph("\nTOTAL PAGADO:")
                    .setFontSize(12)
                    .setFontColor(darkGray));

            doc.add(new Paragraph("Q" + reservacion.getPrecioTotal())
                    .setFontSize(16)
                    .setFontColor(primaryBlue)
                    .setBold());

            // =========================
            // FOOTER
            // =========================
            doc.add(new Paragraph("\n\nGracias por su compra. ¡Buen viaje! ✈")
                    .setFontSize(10)
                    .setFontColor(new DeviceRgb(150, 150, 150)));

            doc.close();

            return baos.toByteArray();

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Error generando PDF", e);
        }
    }
}