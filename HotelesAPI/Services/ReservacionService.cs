using HotelesAPI.DAO;
using HotelesAPI.DTOs;
using HotelesAPI.Models;

namespace HotelesAPI.Services
{
    /// <summary>
    /// Servicio de lógica de negocio para la gestión de reservaciones en Bedly.
    /// Contiene las reglas de validación y cálculos para crear y cancelar reservaciones.
    /// </summary>
    public class ReservacionService
    {
        private readonly ReservacionDAO _reservacionDAO;
        private readonly HabitacionDAO _habitacionDAO;

        /// <summary>
        /// Inicializa una nueva instancia del servicio de reservaciones.
        /// </summary>
        public ReservacionService()
        {
            _reservacionDAO = new ReservacionDAO();
            _habitacionDAO = new HabitacionDAO();
        }

        /// <summary>
        /// Crea una nueva reservación aplicando todas las validaciones de negocio.
        /// Verifica fechas, disponibilidad de habitación, capacidad y conflictos de fechas.
        /// Calcula automáticamente el precio total basado en noches y precio por noche.
        /// </summary>
        /// <param name="dto">Datos de la reservación a crear.</param>
        /// <returns>La reservación creada con todos sus datos.</returns>
        /// <exception cref="ArgumentException">
        /// Se lanza cuando:
        /// - La fecha de check-in es en el pasado.
        /// - La fecha de check-out es anterior o igual al check-in.
        /// - La habitación no existe.
        /// - La habitación no está disponible.
        /// - El número de huéspedes supera la capacidad máxima.
        /// - Ya existe una reservación en esas fechas para la misma habitación.
        /// </exception>
        /// <exception cref="Exception">Se lanza si ocurre un error al recuperar la reservación creada.</exception>
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

        /// <summary>
        /// Cancela una reservación existente verificando permisos y estado.
        /// Solo el usuario propietario puede cancelar su reservación.
        /// No se pueden cancelar reservaciones en curso o pasadas.
        /// </summary>
        /// <param name="idReservacion">ID de la reservación a cancelar.</param>
        /// <param name="idUsuario">ID del usuario que solicita la cancelación.</param>
        /// <returns>True si la cancelación fue exitosa.</returns>
        /// <exception cref="ArgumentException">
        /// Se lanza cuando:
        /// - La reservación no existe.
        /// - El usuario no tiene permiso para cancelar la reservación.
        /// - La reservación ya está cancelada.
        /// - La fecha de check-in ya pasó o es hoy.
        /// </exception>
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