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
        /// Notifica al admin sobre la cancelación de una reservación.
        /// </summary>
        public void NotificarCancelacionAdmin(Reservacion reservacion, Usuario usuario)
        {
            string emailAdmin = _config["Email:EmailAdmin"] ?? "admin@bedly.com";
            string asunto = $"[Bedly] Cancelación de reservación #{reservacion.IdReservacion}";
            string cuerpoPlano = ConstruirCuerpoTexto(reservacion, usuario);
            string cuerpoHtml = ConstruirCuerpoHtml(reservacion, usuario);

            var metadata = new
            {
                idReservacion = reservacion.IdReservacion,
                idUsuario = usuario.IdUsuario,
                montoPerdido = reservacion.PrecioTotal,
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
        /// </summary>
        private bool EnviarSmtpReal(string destinatario, string asunto, string cuerpoHtml)
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

                smtp.Send(mensaje);
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[EmailService] Error SMTP: {ex.Message}");
                return false;
            }
        }

        private string ConstruirCuerpoTexto(Reservacion reservacion, Usuario usuario)
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
- Pérdida estimada: Q{reservacion.PrecioTotal:F2}

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

        private string ConstruirCuerpoHtml(Reservacion reservacion, Usuario usuario)
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

        <div class='perdida'>
            💸 Pérdida estimada: Q{reservacion.PrecioTotal:F2}
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
    }
}