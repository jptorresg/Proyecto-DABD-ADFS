using HotelesAPI.DAO;
using HotelesAPI.Models;
using Microsoft.Extensions.Configuration;
using System.Net;
using System.Net.Mail;
using System.Text.Json;

namespace HotelesAPI.Services
{
    /// <summary>
    /// Servicio de notificaciones por correo.
    /// Modo dual: registra en BD (auditoría) + envía SMTP real (Gmail).
    /// Si el SMTP falla, el log queda guardado con enviado=false.
    /// </summary>
    public class EmailService
    {
        private readonly EmailNotificacionDAO _emailDAO;
        private readonly IConfiguration _config;

        public EmailService()
        {
            _emailDAO = new EmailNotificacionDAO();

            // Cargar configuración desde appsettings.json
            _config = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json", optional: false)
                .Build();
        }

        /// <summary>
        /// Envía al usuario el voucher de la reservación recién creada,
        /// adjuntando el PDF cuando está disponible. Sigue el mismo patrón
        /// que NotificarCancelacionAdmin: si SMTP falla, igual queda
        /// registrado en BD con enviado=false para auditoría.
        /// </summary>
        public void EnviarVoucherUsuario(Reservacion reservacion, Usuario usuario, byte[]? pdfVoucher = null)
        {
            if (usuario == null || string.IsNullOrWhiteSpace(usuario.Email)) return;

            string destinatario = usuario.Email;
            string asunto = $"[Bedly] Voucher de tu reservación #{reservacion.IdReservacion}";
            string cuerpoPlano = ConstruirCuerpoVoucherTexto(reservacion, usuario);
            string cuerpoHtml = ConstruirCuerpoVoucherHtml(reservacion, usuario);

            var metadata = new
            {
                idReservacion = reservacion.IdReservacion,
                idUsuario = usuario.IdUsuario,
                monto = reservacion.PrecioTotal,
                fechaEnvio = DateTime.Now
            };

            string? attachmentName = pdfVoucher != null
                ? $"voucher-reserva-{reservacion.IdReservacion}.pdf"
                : null;
            bool enviadoOk = EnviarSmtpReal(destinatario, asunto, cuerpoHtml, pdfVoucher, attachmentName);

            var notificacion = new EmailNotificacion
            {
                Destinatario = destinatario,
                Asunto = asunto,
                Cuerpo = cuerpoPlano,
                TipoEvento = "RESERVA_CREADA",
                Enviado = enviadoOk,
                Metadata = JsonSerializer.Serialize(metadata)
            };

            try { _emailDAO.Registrar(notificacion); }
            catch (Exception ex) { Console.WriteLine($"[EmailService] Error registrando voucher en BD: {ex.Message}"); }

            Console.WriteLine();
            Console.WriteLine($"[EmailService] Voucher → {destinatario} ({(enviadoOk ? "OK" : "FALLO SMTP")})");
        }

        /// <summary>
        /// Notifica al admin sobre la cancelación de una reservación, incluyendo
        /// el detalle del reembolso aplicado segun la politica de horas restantes.
        /// </summary>
        public void NotificarCancelacionAdmin(
            Reservacion reservacion, Usuario usuario,
            decimal montoReembolso, decimal montoPenalizacion, string politica)
        {
            string emailAdmin = _config["Email:EmailAdmin"] ?? "admin@bedly.com";
            string asunto = $"[Bedly] Cancelación de reservación #{reservacion.IdReservacion}";
            string cuerpoPlano = ConstruirCuerpoTexto(reservacion, usuario, montoReembolso, montoPenalizacion, politica);
            string cuerpoHtml = ConstruirCuerpoHtml(reservacion, usuario, montoReembolso, montoPenalizacion, politica);

            var metadata = new
            {
                idReservacion = reservacion.IdReservacion,
                idUsuario = usuario.IdUsuario,
                montoOriginal = reservacion.PrecioTotal,
                montoReembolso,
                montoPenalizacion,
                politica,
                fechaCancelacion = DateTime.Now
            };

            // Intentar envío real
            bool enviadoOk = EnviarSmtpReal(emailAdmin, asunto, cuerpoHtml);

            // Registrar SIEMPRE en BD (incluso si falló SMTP)
            var notificacion = new EmailNotificacion
            {
                Destinatario = emailAdmin,
                Asunto = asunto,
                Cuerpo = cuerpoPlano,
                TipoEvento = "RESERVA_CANCELADA",
                Enviado = enviadoOk,
                Metadata = JsonSerializer.Serialize(metadata)
            };

            try
            {
                _emailDAO.Registrar(notificacion);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[EmailService] Error registrando email en BD: {ex.Message}");
            }

            // Imprimir en consola
            Console.WriteLine();
            Console.WriteLine("┌─────────────────────────────────────────┐");
            Console.WriteLine($"│  {(enviadoOk ? "📧 EMAIL ENVIADO (SMTP real)         " : "⚠️ EMAIL FALLÓ - solo guardado en BD ")} │");
            Console.WriteLine("├─────────────────────────────────────────┤");
            Console.WriteLine($"│ Para: {emailAdmin,-34}│");
            Console.WriteLine($"│ Asunto: Cancelación reserva #{reservacion.IdReservacion,-10}│");
            Console.WriteLine($"│ Pérdida: Q{reservacion.PrecioTotal,-29:F2}│");
            Console.WriteLine("└─────────────────────────────────────────┘");
            Console.WriteLine();
        }

        /// <summary>
        /// Envía email vía SMTP de Gmail. Devuelve true si fue exitoso.
        /// Si se pasan {attachment, attachmentName}, lo agrega como adjunto.
        /// </summary>
        private bool EnviarSmtpReal(string destinatario, string asunto, string cuerpoHtml, byte[]? attachment = null, string? attachmentName = null)
        {
            // Verificar si está habilitado
            bool habilitado = _config.GetValue<bool>("Email:Habilitado", false);
            if (!habilitado)
            {
                Console.WriteLine("[EmailService] SMTP deshabilitado en appsettings.json");
                return false;
            }

            string? smtpServer = _config["Email:SmtpServer"];
            int smtpPort = _config.GetValue<int>("Email:SmtpPort", 587);
            string? remitente = _config["Email:Remitente"];
            string? password = _config["Email:Password"];

            if (string.IsNullOrEmpty(smtpServer) || string.IsNullOrEmpty(remitente) || string.IsNullOrEmpty(password))
            {
                Console.WriteLine("[EmailService] Configuración SMTP incompleta en appsettings.json");
                return false;
            }

            try
            {
                using var smtp = new SmtpClient(smtpServer, smtpPort)
                {
                    EnableSsl = true,
                    UseDefaultCredentials = false,
                    DeliveryMethod = SmtpDeliveryMethod.Network,
                    Credentials = new NetworkCredential(remitente, password)
                };

                using var mensaje = new MailMessage
                {
                    From = new MailAddress(remitente, "Bedly Hoteles"),
                    Subject = asunto,
                    Body = cuerpoHtml,
                    IsBodyHtml = true
                };
                mensaje.To.Add(destinatario);

                if (attachment != null && attachment.Length > 0 && !string.IsNullOrEmpty(attachmentName))
                {
                    var ms = new MemoryStream(attachment);
                    mensaje.Attachments.Add(new Attachment(ms, attachmentName, "application/pdf"));
                }

                smtp.Send(mensaje);
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[EmailService] Error SMTP: {ex.Message}");
                return false;
            }
        }

        private string ConstruirCuerpoTexto(
            Reservacion reservacion, Usuario usuario,
            decimal montoReembolso, decimal montoPenalizacion, string politica)
        {
            return $@"
=========================================
NOTIFICACIÓN DE CANCELACIÓN DE RESERVA
=========================================

Hola Administrador,

Se ha cancelado una reservación en el sistema.

DETALLES DE LA RESERVACIÓN:
- ID Reservación: #{reservacion.IdReservacion}
- Hotel: {reservacion.NombreHotel ?? "N/A"}
- Habitación: {reservacion.NombreHabitacion ?? "N/A"}
- Check-in: {reservacion.FechaCheckIn:dd/MM/yyyy}
- Check-out: {reservacion.FechaCheckOut:dd/MM/yyyy}
- Monto original: Q{reservacion.PrecioTotal:F2}

REEMBOLSO APLICADO:
- Política: {politica}
- Reembolso al cliente: Q{montoReembolso:F2}
- Penalización (ingreso hotel): Q{montoPenalizacion:F2}

DATOS DEL USUARIO:
- Nombre: {usuario.Nombre} {usuario.Apellidos ?? ""}
- Email: {usuario.Email}
- Teléfono: {usuario.Telefono}
- Documento: {usuario.Pasaporte ?? "N/A"}

FECHA DE CANCELACIÓN: {DateTime.Now:dd/MM/yyyy HH:mm:ss}

=========================================
Sistema Bedly · Notificación automática
=========================================
";
        }

        private string ConstruirCuerpoHtml(
            Reservacion reservacion, Usuario usuario,
            decimal montoReembolso, decimal montoPenalizacion, string politica)
        {
            return $@"
<!DOCTYPE html>
<html>
<head>
<style>
    body {{ font-family: Arial, sans-serif; background: #f0f4f8; padding: 20px; }}
    .container {{ max-width: 600px; margin: auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }}
    .header {{ background: linear-gradient(135deg, #003580, #0055b3); color: white; padding: 30px; text-align: center; }}
    .header h1 {{ margin: 0; font-size: 24px; }}
    .header .alert {{ background: #dc2626; color: white; display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-top: 10px; }}
    .content {{ padding: 30px; }}
    .section {{ margin-bottom: 20px; }}
    .section-title {{ color: #003580; font-size: 14px; font-weight: bold; text-transform: uppercase; border-bottom: 2px solid #f5a623; padding-bottom: 6px; margin-bottom: 12px; }}
    .row {{ display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-size: 14px; }}
    .label {{ color: #6b7280; }}
    .value {{ color: #111827; font-weight: 600; }}
    .perdida {{ background: #fee2e2; color: #dc2626; padding: 16px; border-radius: 8px; text-align: center; font-size: 18px; font-weight: bold; margin: 20px 0; }}
    .footer {{ background: #f0f4f8; padding: 16px; text-align: center; color: #6b7280; font-size: 12px; }}
    .brand {{ font-family: Georgia, serif; font-weight: 900; }}
    .brand span {{ color: #f5a623; }}
</style>
</head>
<body>
<div class='container'>
    <div class='header'>
        <h1 class='brand'>Bed<span>ly</span></h1>
        <div class='alert'>⚠️ RESERVA CANCELADA</div>
    </div>
    <div class='content'>
        <p>Hola Administrador,</p>
        <p>Se ha cancelado una reservación en el sistema. A continuación los detalles:</p>

        <div class='section'>
            <div class='section-title'>📅 Reservación</div>
            <div class='row'><span class='label'>ID</span><span class='value'>#{reservacion.IdReservacion}</span></div>
            <div class='row'><span class='label'>Hotel</span><span class='value'>{reservacion.NombreHotel ?? "N/A"}</span></div>
            <div class='row'><span class='label'>Habitación</span><span class='value'>{reservacion.NombreHabitacion ?? "N/A"}</span></div>
            <div class='row'><span class='label'>Check-in</span><span class='value'>{reservacion.FechaCheckIn:dd/MM/yyyy}</span></div>
            <div class='row'><span class='label'>Check-out</span><span class='value'>{reservacion.FechaCheckOut:dd/MM/yyyy}</span></div>
        </div>

        <div class='section'>
            <div class='section-title'>💰 Detalle de Reembolso</div>
            <div class='row'><span class='label'>Monto original</span><span class='value'>Q{reservacion.PrecioTotal:F2}</span></div>
            <div class='row'><span class='label'>Política aplicada</span><span class='value'>{politica}</span></div>
            <div class='row'><span class='label'>Reembolso al cliente</span><span class='value' style='color:#16a34a'>Q{montoReembolso:F2}</span></div>
            <div class='row'><span class='label'>Penalización (ingreso)</span><span class='value' style='color:#dc2626'>Q{montoPenalizacion:F2}</span></div>
        </div>

        <div class='section'>
            <div class='section-title'>👤 Usuario que canceló</div>
            <div class='row'><span class='label'>Nombre</span><span class='value'>{usuario.Nombre} {usuario.Apellidos ?? ""}</span></div>
            <div class='row'><span class='label'>Email</span><span class='value'>{usuario.Email}</span></div>
            <div class='row'><span class='label'>Teléfono</span><span class='value'>{usuario.Telefono}</span></div>
            <div class='row'><span class='label'>Documento</span><span class='value'>{usuario.Pasaporte ?? "N/A"}</span></div>
        </div>

        <p style='color: #6b7280; font-size: 12px; margin-top: 24px;'>
            Cancelación registrada el {DateTime.Now:dd/MM/yyyy} a las {DateTime.Now:HH:mm:ss}.
        </p>
    </div>
    <div class='footer'>
        <p>Sistema Bedly · Notificación automática</p>
        <p>Este correo se generó automáticamente, por favor no respondas a esta dirección.</p>
    </div>
</div>
</body>
</html>
";
        }

        private string ConstruirCuerpoVoucherTexto(Reservacion reservacion, Usuario usuario)
        {
            return $@"
=========================================
VOUCHER DE HOSPEDAJE - Bedly
=========================================

Hola {usuario.Nombre},

Tu reservación #{reservacion.IdReservacion} ha sido confirmada.

DETALLES:
- Hotel: {reservacion.NombreHotel ?? "N/A"}
- Habitación: {reservacion.NombreHabitacion ?? "N/A"}
- Check-in:  {reservacion.FechaCheckIn:dd/MM/yyyy}
- Check-out: {reservacion.FechaCheckOut:dd/MM/yyyy}
- Huéspedes: {reservacion.NumHuespedes}
- Total:     Q{reservacion.PrecioTotal:F2}

Adjunto encontrarás el PDF del voucher para presentar al check-in.

=========================================
Sistema Bedly · Gracias por tu reserva
=========================================
";
        }

        private string ConstruirCuerpoVoucherHtml(Reservacion reservacion, Usuario usuario)
        {
            return $@"
<!DOCTYPE html>
<html><head><style>
body {{ font-family: Arial, sans-serif; background: #f0f4f8; padding: 20px; }}
.container {{ max-width: 600px; margin: auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }}
.header {{ background: linear-gradient(135deg, #003580, #0055b3); color: white; padding: 30px; text-align: center; }}
.header h1 {{ margin: 0; font-size: 24px; font-family: Georgia, serif; font-weight: 900; }}
.header span {{ color: #f5a623; }}
.header .ok {{ background: #16a34a; color: white; display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-top: 10px; }}
.content {{ padding: 30px; }}
.row {{ display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-size: 14px; }}
.label {{ color: #6b7280; }} .value {{ color: #111827; font-weight: 600; }}
.total {{ background: #f0fdf4; color: #16a34a; padding: 16px; border-radius: 8px; text-align: center; font-size: 18px; font-weight: bold; margin: 20px 0; }}
.footer {{ background: #f0f4f8; padding: 16px; text-align: center; color: #6b7280; font-size: 12px; }}
</style></head><body><div class='container'>
    <div class='header'>
        <h1>Bed<span>ly</span></h1>
        <div class='ok'>✅ RESERVA CONFIRMADA</div>
    </div>
    <div class='content'>
        <p>Hola <strong>{usuario.Nombre}</strong>,</p>
        <p>Tu reservación ha sido confirmada. Encontrarás el voucher en PDF adjunto a este correo.</p>
        <div class='row'><span class='label'>Reserva #</span><span class='value'>{reservacion.IdReservacion}</span></div>
        <div class='row'><span class='label'>Hotel</span><span class='value'>{reservacion.NombreHotel ?? "N/A"}</span></div>
        <div class='row'><span class='label'>Habitación</span><span class='value'>{reservacion.NombreHabitacion ?? "N/A"}</span></div>
        <div class='row'><span class='label'>Check-in</span><span class='value'>{reservacion.FechaCheckIn:dd/MM/yyyy}</span></div>
        <div class='row'><span class='label'>Check-out</span><span class='value'>{reservacion.FechaCheckOut:dd/MM/yyyy}</span></div>
        <div class='row'><span class='label'>Huéspedes</span><span class='value'>{reservacion.NumHuespedes}</span></div>
        <div class='total'>💰 Total pagado: Q{reservacion.PrecioTotal:F2}</div>
        <p style='color:#6b7280; font-size:12px;'>Presenta el voucher al momento del check-in en el hotel.</p>
    </div>
    <div class='footer'>Sistema Bedly · Notificación automática</div>
</div></body></html>
";
        }
    }
}