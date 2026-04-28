using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using QRCoder;
using HotelesAPI.Models;

namespace HotelesAPI.Services
{
    public class PdfService
    {
        public byte[] GenerarVoucher(Reservacion reservacion, List<HuespedReserva>? huespedes = null)
        {
            QuestPDF.Settings.License = LicenseType.Community;

            // QR apunta a la página de check-in
            string qrUrl = $"http://localhost:5500/hotel/checkin.html?id={reservacion.IdReservacion}";
            byte[] qrBytes = GenerarQR(qrUrl);

            var pdf = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(40);
                    page.DefaultTextStyle(x => x.FontSize(11));

                    page.Header().Element(header =>
                    {
                        header.Row(row =>
                        {
                            row.RelativeItem().Column(col =>
                            {
                                col.Item().Text("BEDLY")
                                    .FontSize(28).Bold()
                                    .FontColor(Color.FromHex("#003580"));
                                col.Item().Text("Sistema de Gestión Hotelera")
                                    .FontSize(10)
                                    .FontColor(Color.FromHex("#6b7280"));
                            });
                            row.ConstantItem(80).Image(qrBytes);
                        });
                    });

                    page.Content().PaddingTop(20).Column(col =>
                    {
                        col.Item().Background(Color.FromHex("#003580"))
                            .Padding(12).Text("VOUCHER DE RESERVACIÓN")
                            .FontSize(16).Bold()
                            .FontColor(Colors.White)
                            .AlignCenter();

                        col.Item().PaddingTop(20).Row(row =>
                        {
                            row.RelativeItem().Column(left =>
                            {
                                left.Item().Text("DATOS DE LA RESERVACIÓN")
                                    .FontSize(10).Bold()
                                    .FontColor(Color.FromHex("#003580"));
                                left.Item().PaddingTop(8).Table(table =>
                                {
                                    table.ColumnsDefinition(c =>
                                    {
                                        c.RelativeColumn(1);
                                        c.RelativeColumn(2);
                                    });

                                    void Fila(string label, string valor)
                                    {
                                        table.Cell().PaddingBottom(6).Text(label)
                                            .FontSize(9).FontColor(Color.FromHex("#6b7280"));
                                        table.Cell().PaddingBottom(6).Text(valor)
                                            .FontSize(10).Bold();
                                    }

                                    Fila("No. Reservación:", $"#BDL-{reservacion.IdReservacion:D6}");
                                    Fila("Hotel:", reservacion.NombreHotel);
                                    Fila("Habitación:", reservacion.NombreHabitacion);
                                    Fila("Check-in:", reservacion.FechaCheckIn.ToString("dd/MM/yyyy"));
                                    Fila("Check-out:", reservacion.FechaCheckOut.ToString("dd/MM/yyyy"));
                                    Fila("Noches:", $"{(reservacion.FechaCheckOut - reservacion.FechaCheckIn).Days}");
                                    Fila("Huéspedes:", reservacion.NumHuespedes.ToString());
                                    Fila("Estado:", reservacion.Estado);
                                });
                            });

                            row.ConstantItem(20);

                            row.RelativeItem().Column(right =>
                            {
                                right.Item().Text("DETALLE DE PAGO")
                                    .FontSize(10).Bold()
                                    .FontColor(Color.FromHex("#003580"));
                                right.Item().PaddingTop(8).Border(1)
                                    .BorderColor(Color.FromHex("#e5e7eb"))
                                    .Padding(12).Column(pago =>
                                    {
                                        int noches = (reservacion.FechaCheckOut - reservacion.FechaCheckIn).Days;
                                        decimal subtotal = noches > 0 ? reservacion.PrecioTotal / 1.12m : reservacion.PrecioTotal;
                                        decimal iva = reservacion.PrecioTotal - subtotal;

                                        pago.Item().Row(r =>
                                        {
                                            r.RelativeItem().Text("Subtotal:").FontSize(10);
                                            r.ConstantItem(80).Text($"Q {subtotal:F2}").FontSize(10).AlignRight();
                                        });
                                        pago.Item().PaddingTop(4).Row(r =>
                                        {
                                            r.RelativeItem().Text("IVA (12%):").FontSize(10);
                                            r.ConstantItem(80).Text($"Q {iva:F2}").FontSize(10).AlignRight();
                                        });
                                        pago.Item().PaddingTop(8).BorderTop(1)
                                            .BorderColor(Color.FromHex("#003580")).Row(r =>
                                        {
                                            r.RelativeItem().Text("TOTAL:").FontSize(12).Bold()
                                                .FontColor(Color.FromHex("#003580"));
                                            r.ConstantItem(80).Text($"Q {reservacion.PrecioTotal:F2}")
                                                .FontSize(12).Bold()
                                                .FontColor(Color.FromHex("#003580"))
                                                .AlignRight();
                                        });
                                        pago.Item().PaddingTop(8).Text($"Método de pago: {reservacion.MetodoPago}")
                                            .FontSize(9).FontColor(Color.FromHex("#6b7280"));
                                    });
                            });
                        });

                        // Sesión 5: Lista de huéspedes registrados
                        if (huespedes != null && huespedes.Count > 0)
                        {
                            col.Item().PaddingTop(20).Text("HUÉSPEDES REGISTRADOS")
                                .FontSize(10).Bold()
                                .FontColor(Color.FromHex("#003580"));

                            col.Item().PaddingTop(8).Border(1)
                                .BorderColor(Color.FromHex("#e5e7eb"))
                                .Padding(8).Column(hcol =>
                                {
                                    foreach (var h in huespedes)
                                    {
                                        hcol.Item().PaddingVertical(4).Row(r =>
                                        {
                                            r.RelativeItem().Column(c =>
                                            {
                                                c.Item().Text(text =>
                                                {
                                                    text.Span($"{h.Nombre} {h.Apellidos}").FontSize(10).Bold();
                                                    text.Span($"  ({h.Edad} años)").FontSize(9).FontColor(Color.FromHex("#6b7280"));
                                                });
                                                c.Item().Text($"{h.TipoDocumento}: {h.Documento}  ·  {h.Nacionalidad}")
                                                    .FontSize(9).FontColor(Color.FromHex("#6b7280"));
                                            });
                                            if (h.EsTitular)
                                            {
                                                r.ConstantItem(60).Background(Color.FromHex("#003580"))
                                                    .Padding(4).AlignCenter()
                                                    .Text("TITULAR").FontSize(8).Bold().FontColor(Colors.White);
                                            }
                                        });
                                    }
                                });
                        }

                        col.Item().PaddingTop(20).Background(Color.FromHex("#f0f4f8"))
                            .Padding(12).Column(politica =>
                            {
                                politica.Item().Text("POLÍTICA DE CANCELACIÓN")
                                    .FontSize(9).Bold().FontColor(Color.FromHex("#003580"));
                                politica.Item().PaddingTop(4)
                                    .Text("• Cancelación gratuita hasta 48 horas antes del check-in.")
                                    .FontSize(9);
                                politica.Item().Text("• Entre 24-48 horas: reembolso del 50%.")
                                    .FontSize(9);
                                politica.Item().Text("• Menos de 24 horas: sin reembolso.")
                                    .FontSize(9);
                            });

                        col.Item().PaddingTop(16).AlignCenter()
                            .Text($"Escanea el QR para Check-in Express | Reservación #BDL-{reservacion.IdReservacion:D6}")
                            .FontSize(8).FontColor(Color.FromHex("#9ca3af"));
                    });

                    page.Footer().AlignCenter()
                        .Text($"Generado el {DateTime.Now:dd/MM/yyyy HH:mm} | Bedly — Sistema Hotelero UNIS")
                        .FontSize(8).FontColor(Color.FromHex("#9ca3af"));
                });
            });

            return pdf.GeneratePdf();
        }

        private byte[] GenerarQR(string texto)
        {
            using var qrGenerator = new QRCodeGenerator();
            var qrData = qrGenerator.CreateQrCode(texto, QRCodeGenerator.ECCLevel.Q);
            var qrCode = new PngByteQRCode(qrData);
            return qrCode.GetGraphic(5);
        }
    }
}