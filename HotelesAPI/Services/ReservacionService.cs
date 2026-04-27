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

        public ReservacionService()
        {
            _reservacionDAO = new ReservacionDAO();
            _habitacionDAO = new HabitacionDAO();
            _usuarioDAO = new UsuarioDAO();
            _emailService = new EmailService();
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

            return _reservacionDAO.GetById(idCreado)
                ?? throw new Exception("Error al crear la reservación");
        }

        public bool Cancelar(int idReservacion, int idUsuario)
        {
            var reservacion = _reservacionDAO.GetById(idReservacion)
                ?? throw new ArgumentException("Reservación no encontrada");

            if (reservacion.IdUsuario != idUsuario)
                throw new ArgumentException("No tienes permiso para cancelar esta reservación");

            if (reservacion.Estado == "Cancelada")
                throw new ArgumentException("La reservación ya está cancelada");

            if (reservacion.FechaCheckIn <= DateTime.Now.AddHours(24))
                throw new ArgumentException("Solo se puede cancelar hasta 24 horas antes del check-in");

            bool cancelado = _reservacionDAO.Cancelar(idReservacion);

            // Notificar al admin si la cancelación fue exitosa
            if (cancelado)
            {
                try
                {
                    var usuario = _usuarioDAO.FindById(idUsuario);
                    if (usuario != null)
                    {
                        _emailService.NotificarCancelacionAdmin(reservacion, usuario);
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[ReservacionService] Error notificando cancelación: {ex.Message}");
                }
            }

            return cancelado;
        }
    }
}