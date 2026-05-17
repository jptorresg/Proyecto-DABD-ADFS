using HotelesAPI.DAO;
using HotelesAPI.DTOs;
using HotelesAPI.Models;

namespace HotelesAPI.Services
{
    /// <summary>
    /// Servicio de lógica de negocio para la gestión de reservaciones en Bedly.
    /// </summary>
    public class ReservacionService
    {
        private readonly ReservacionDAO _reservacionDAO;
        private readonly HabitacionDAO _habitacionDAO;
        private readonly UsuarioDAO _usuarioDAO;
        private readonly EmailService _emailService;
        private readonly HuespedReservaDAO _huespedDAO;
        private readonly PdfService _pdfService;

        public ReservacionService()
        {
            _reservacionDAO = new ReservacionDAO();
            _habitacionDAO = new HabitacionDAO();
            _usuarioDAO = new UsuarioDAO();
            _emailService = new EmailService();
            _huespedDAO = new HuespedReservaDAO();
            _pdfService = new PdfService();
        }

        public Reservacion Crear(ReservacionDto dto)
        {
            if (dto.FechaCheckIn < DateTime.Today)
                throw new ArgumentException("La fecha de check-in no puede ser en el pasado");

            if (dto.FechaCheckIn >= dto.FechaCheckOut)
                throw new ArgumentException("La fecha de check-out debe ser posterior al check-in");

            var habitacion = _habitacionDAO.GetById(dto.IdHabitacion)
                ?? throw new ArgumentException("Habitación no encontrada");

            if (habitacion.Estado != "Disponible")
                throw new ArgumentException("La habitación no está disponible");

            if (dto.NumHuespedes > habitacion.CapacidadMax)
                throw new ArgumentException($"La habitación tiene capacidad máxima de {habitacion.CapacidadMax} huéspedes");

            if (_reservacionDAO.ExisteConflicto(dto.IdHabitacion, dto.FechaCheckIn, dto.FechaCheckOut))
                throw new ArgumentException("La habitación ya está reservada en esas fechas");

            // Validar huéspedes si vienen
            if (dto.Huespedes != null && dto.Huespedes.Count > 0)
            {
                if (dto.Huespedes.Count != dto.NumHuespedes)
                    throw new ArgumentException(
                        $"Se esperaban {dto.NumHuespedes} huéspedes pero se recibieron {dto.Huespedes.Count}");

                foreach (var h in dto.Huespedes)
                {
                    if (string.IsNullOrWhiteSpace(h.Nombre) || string.IsNullOrWhiteSpace(h.Apellidos))
                        throw new ArgumentException("Todos los huéspedes deben tener nombre y apellidos");
                    if (h.Edad < 0 || h.Edad > 120)
                        throw new ArgumentException($"Edad inválida para {h.Nombre}: {h.Edad}");
                    if (string.IsNullOrWhiteSpace(h.Documento))
                        throw new ArgumentException($"El huésped {h.Nombre} debe tener un documento");
                }
            }

            int noches = (dto.FechaCheckOut - dto.FechaCheckIn).Days;
            decimal precioTotal = habitacion.PrecioNoche * noches;

            var reservacion = new Reservacion
            {
                IdUsuario = dto.IdUsuario,
                IdHabitacion = dto.IdHabitacion,
                FechaCheckIn = dto.FechaCheckIn,
                FechaCheckOut = dto.FechaCheckOut,
                PrecioTotal = precioTotal,
                Estado = "Confirmada",
                MetodoPago = dto.MetodoPago,
                NumHuespedes = dto.NumHuespedes,
                NotasEspeciales = dto.NotasEspeciales
            };

            int idCreado = _reservacionDAO.Create(reservacion);

            // Sesión 5: Insertar huéspedes asociados a la reserva
            if (dto.Huespedes != null && dto.Huespedes.Count > 0)
            {
                foreach (var huespedDto in dto.Huespedes)
                {
                    try
                    {
                        var huesped = new HuespedReserva
                        {
                            IdReservacion = idCreado,
                            Nombre = huespedDto.Nombre.Trim(),
                            Apellidos = huespedDto.Apellidos.Trim(),
                            Edad = huespedDto.Edad,
                            TipoDocumento = huespedDto.TipoDocumento,
                            Documento = huespedDto.Documento.Trim(),
                            Nacionalidad = huespedDto.Nacionalidad,
                            EsTitular = huespedDto.EsTitular
                        };
                        _huespedDAO.Crear(huesped);
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[ReservacionService] Error guardando huésped: {ex.Message}");
                    }
                }
            }

            var reservaCompleta = _reservacionDAO.GetById(idCreado)
                ?? throw new Exception("Error al crear la reservación");

            // Notificar al usuario con el voucher en PDF adjunto. Si SMTP o
            // PDF fallan, no abortamos la creación de la reserva: el registro
            // ya está en BD y el usuario puede descargar el voucher manualmente.
            try
            {
                var usuario = _usuarioDAO.FindById(dto.IdUsuario);
                if (usuario != null && !string.IsNullOrWhiteSpace(usuario.Email))
                {
                    var huespedes = _huespedDAO.GetByReservacion(idCreado);
                    byte[]? pdf = null;
                    try { pdf = _pdfService.GenerarVoucher(reservaCompleta, huespedes); }
                    catch (Exception exPdf) { Console.WriteLine($"[ReservacionService] Error generando PDF voucher: {exPdf.Message}"); }

                    _emailService.EnviarVoucherUsuario(reservaCompleta, usuario, pdf);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ReservacionService] Error enviando voucher al usuario: {ex.Message}");
            }

            return reservaCompleta;
        }

        public CancelacionResultado Cancelar(int idReservacion, int idUsuario)
        {
            var reservacion = _reservacionDAO.GetById(idReservacion)
                ?? throw new ArgumentException("Reservación no encontrada");

            if (reservacion.IdUsuario != idUsuario)
                throw new ArgumentException("No tienes permiso para cancelar esta reservación");

            if (reservacion.Estado == "Cancelada")
                throw new ArgumentException("La reservación ya está cancelada");

            // Politica nueva (alineada a Booking/Expedia/Airbnb): se puede
            // cancelar en cualquier momento antes del check-in, pero con
            // reembolso parcial segun cuanto tiempo falte. Una vez iniciado
            // el check-in (o pasado), no se cancela.
            if (DateTime.Now >= reservacion.FechaCheckIn)
                throw new ArgumentException("No se puede cancelar una reservación cuyo check-in ya inició o pasó");

            double horasRestantes = (reservacion.FechaCheckIn - DateTime.Now).TotalHours;
            decimal porcentajeReembolso;
            string politica;
            if (horasRestantes > 72)        { porcentajeReembolso = 100m; politica = "Más de 72h antes: reembolso completo"; }
            else if (horasRestantes > 48)   { porcentajeReembolso = 75m;  politica = "Entre 48h y 72h antes: 75% de reembolso"; }
            else if (horasRestantes > 24)   { porcentajeReembolso = 50m;  politica = "Entre 24h y 48h antes: 50% de reembolso"; }
            else                            { porcentajeReembolso = 25m;  politica = "Menos de 24h antes: 25% de reembolso"; }

            decimal montoReembolso = Math.Round(reservacion.PrecioTotal * porcentajeReembolso / 100m, 2);
            decimal montoPenalizacion = Math.Round(reservacion.PrecioTotal - montoReembolso, 2);

            bool cancelado = _reservacionDAO.Cancelar(idReservacion);
            if (!cancelado)
                throw new Exception("No se pudo cancelar la reservación");

            try
            {
                var usuario = _usuarioDAO.FindById(idUsuario);
                if (usuario != null)
                {
                    _emailService.NotificarCancelacionAdmin(
                        reservacion, usuario, montoReembolso, montoPenalizacion, politica);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ReservacionService] Error notificando cancelación: {ex.Message}");
            }

            return new CancelacionResultado
            {
                Exitosa = true,
                MontoOriginal = reservacion.PrecioTotal,
                PorcentajeReembolso = porcentajeReembolso,
                MontoReembolso = montoReembolso,
                MontoPenalizacion = montoPenalizacion,
                HorasAnticipacion = Math.Round((decimal)horasRestantes, 2),
                Politica = politica
            };
        }
    }

    /// <summary>Resultado de cancelar una reserva. Incluye reembolso parcial
    /// segun la politica vigente (ver ReservacionService.Cancelar).</summary>
    public class CancelacionResultado
    {
        public bool Exitosa { get; set; }
        public decimal MontoOriginal { get; set; }
        public decimal PorcentajeReembolso { get; set; }
        public decimal MontoReembolso { get; set; }
        public decimal MontoPenalizacion { get; set; }
        public decimal HorasAnticipacion { get; set; }
        public string Politica { get; set; } = string.Empty;
    }
}