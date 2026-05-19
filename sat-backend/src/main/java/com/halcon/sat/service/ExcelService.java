package com.halcon.sat.service;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Service
public class ExcelService {

    private static final DateTimeFormatter FECHA = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private static final List<String> HEADERS = Arrays.asList(
        "ID", "Serie", "Numero", "Fecha", "Emisor", "Emisor NIT", "Emisor Tipo",
        "Receptor", "Receptor NIT", "Subtotal", "Impuesto (IVA)", "Total",
        "Estado", "Referencia Externa");

    public byte[] facturasXlsx(List<Map<String, Object>> filas) {
        try (Workbook wb = new XSSFWorkbook(); ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet("Facturas SAT");

            CellStyle headerStyle = wb.createCellStyle();
            Font headerFont = wb.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);

            Row header = sheet.createRow(0);
            for (int i = 0; i < HEADERS.size(); i++) {
                Cell c = header.createCell(i);
                c.setCellValue(HEADERS.get(i));
                c.setCellStyle(headerStyle);
            }

            int r = 1;
            for (Map<String, Object> f : filas) {
                Row row = sheet.createRow(r++);
                set(row, 0, f.get("idFactura"));
                set(row, 1, f.get("serie"));
                set(row, 2, f.get("numero"));
                Object fecha = f.get("fechaEmision");
                set(row, 3, fecha instanceof LocalDateTime ? FECHA.format((LocalDateTime) fecha) : (fecha == null ? "" : fecha.toString()));
                set(row, 4, f.get("emisor"));
                set(row, 5, f.get("emisorNit"));
                set(row, 6, f.get("emisorTipo"));
                set(row, 7, f.get("receptor"));
                set(row, 8, f.get("receptorNit"));
                set(row, 9, f.get("subtotal"));
                set(row, 10, f.get("impuesto"));
                set(row, 11, f.get("total"));
                set(row, 12, f.get("estado"));
                set(row, 13, f.get("referenciaExterna"));
            }

            // Auto-size
            for (int i = 0; i < HEADERS.size(); i++) {
                sheet.autoSizeColumn(i);
            }

            // Freeze pane
            sheet.createFreezePane(0, 1);

            wb.write(baos);
            return baos.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Error generando Excel", e);
        }
    }

    private static void set(Row row, int col, Object value) {
        Cell c = row.createCell(col);
        if (value == null) { c.setBlank(); return; }
        if (value instanceof Number) c.setCellValue(((Number) value).doubleValue());
        else if (value instanceof BigDecimal) c.setCellValue(((BigDecimal) value).doubleValue());
        else c.setCellValue(value.toString());
    }
}
