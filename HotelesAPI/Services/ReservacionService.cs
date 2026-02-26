using HotelesAPI.DAO;
using HotelesAPI.DTOs;
using HotelesAPI.Models;

namespace HotelesAPI.Services
{
    public class ReservacionService
    {
        private readonly ReservacionDAO _reservacionDAO;
        private readonly HabitacionDAO _habitacionDAO;

        public ReservacionService()
        {
            _reservacionDAO = new ReservacionDAO();
            _habitacionDAO = new HabitacionDAO();
        }

        public Reservacion Crear(ReservacionDto dto)
        {
            // Validaciones de fechas
            if (dto.FechaCheckIn < DateTime.Today)
                throw new ArgumentException("La fecha de check-in no puede ser en el pasado");

            if (dto.FechaCheckIn >= dto.FechaCheckOut)
                throw new ArgumentException("La fecha de check-out debe ser posterior al check-in");

            // Validar que la habitación existe
            var habitacion = _habitacionDAO.GetById(dto.IdHabitacion)
                ?? throw new ArgumentException("Habitación no encontrada");

            if (habitacion.Estado != "Disponible")
                throw new ArgumentException("La habitación no está disponible");

            // Validar capacidad
            if (dto.NumHuespedes > habitacion.CapacidadMax)
                throw new ArgumentException($"La habitación tiene capacidad máxima de {habitacion.CapacidadMax} huéspedes");

            // Validar que no haya conflicto de fechas (evitar overbooking)
            if (_reservacionDAO.ExisteConflicto(dto.IdHabitacion, dto.FechaCheckIn, dto.FechaCheckOut))
                throw new ArgumentException("La habitación ya está reservada en esas fechas");

            // Calcular precio total
            int noches = (dto.FechaCheckOut - dto.FechaCheckIn).Days;
            decimal precioTotal = habitacion.PrecioNoche * noches;

            // Crear reservación
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

            if (reservacion.FechaCheckIn <= DateTime.Today)
                throw new ArgumentException("No se puede cancelar una reservación en curso o pasada");

            return _reservacionDAO.Cancelar(idReservacion);
        }
    }
}