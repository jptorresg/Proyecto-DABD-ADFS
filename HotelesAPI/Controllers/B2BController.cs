using Microsoft.AspNetCore.Mvc;
using HotelesAPI.DAO;
using HotelesAPI.DTOs;
using HotelesAPI.Models;
using HotelesAPI.Utils;

namespace HotelesAPI.Controllers
{
    [ApiController]
    [Route("api/b2b")]
    public class B2BController : ControllerBase
    {
        private readonly AgenciaDAO _agenciaDAO;
        private readonly HabitacionDAO _habitacionDAO;
        private readonly ReservacionDAO _reservacionDAO;

        public B2BController()
        {
            _agenciaDAO    = new AgenciaDAO();
            _habitacionDAO = new HabitacionDAO();
            _reservacionDAO = new ReservacionDAO();
        }

        private Agencia? ValidarToken()
        {
            var authHeader = Request.Headers["Authorization"].FirstOrDefault();
            if (authHeader == null || !authHeader.StartsWith("Bearer "))
                return null;
            var token = authHeader.Substring("Bearer ".Length).Trim();
            return _agenciaDAO.ValidarToken(token);
        }

        // GET api/b2b/disponibilidad?checkIn=2026-03-01&checkOut=2026-03-05&capacidad=2&ciudad=Guatemala
        [HttpGet("disponibilidad")]
        public IActionResult GetDisponibilidad([FromQuery] DateTime checkIn,
                                               [FromQuery] DateTime checkOut,
                                               [FromQuery] int capacidad = 1,
                                               [FromQuery] string? ciudad = null)
        {
            var agencia = ValidarToken();
            if (agencia == null)
                return Unauthorized(JsonResponse.Error("Token invalido o agencia no autorizada"));

            try
            {
                if (checkIn >= checkOut)
                    return BadRequest(JsonResponse.Error("Fechas invalidas"));

                var habitaciones = _habitacionDAO.GetDisponibles(checkIn, checkOut, capacidad, ciudad);
                return Ok(JsonResponse.Ok("Disponibilidad obtenida", new
                {
                    agencia          = agencia.Nombre,
                    checkIn,
                    checkOut,
                    capacidad,
                    ciudad           = ciudad ?? "todas",
                    totalDisponibles = habitaciones.Count,
                    habitaciones
                }));
            }
            catch (Exception ex)
            {
                return StatusCode(500, JsonResponse.Error(ex.Message));
            }
        }

        // POST api/b2b/reservar
        [HttpPost("reservar")]
        public IActionResult Reservar([FromBody] ReservacionB2BDto dto)
        {
            var agencia = ValidarToken();
            if (agencia == null)
                return Unauthorized(JsonResponse.Error("Token invalido o agencia no autorizada"));

            try
            {
                if (dto.FechaCheckIn >= dto.FechaCheckOut)
                    return BadRequest(JsonResponse.Error("Fechas invalidas"));

                bool conflicto = _reservacionDAO.ExisteConflicto(
                    dto.IdHabitacion, dto.FechaCheckIn, dto.FechaCheckOut);
                if (conflicto)
                    return Conflict(JsonResponse.Error("La habitacion no esta disponible en esas fechas"));

                var habitacion = _habitacionDAO.GetById(dto.IdHabitacion);
                if (habitacion == null)
                    return NotFound(JsonResponse.Error("Habitacion no encontrada"));

                if (habitacion.Estado != "Disponible")
                    return Conflict(JsonResponse.Error("La habitacion no esta disponible"));

                int noches      = (int)(dto.FechaCheckOut - dto.FechaCheckIn).TotalDays;
                decimal subtotal = habitacion.PrecioNoche * noches;
                decimal iva      = subtotal * 0.12m;
                decimal total    = subtotal + iva;

                var reservacion = new Reservacion
                {
                    IdUsuario        = dto.IdUsuario,
                    IdHabitacion     = dto.IdHabitacion,
                    FechaCheckIn     = dto.FechaCheckIn,
                    FechaCheckOut    = dto.FechaCheckOut,
                    NumHuespedes     = dto.NumHuespedes,
                    MetodoPago       = dto.MetodoPago ?? "transferencia",
                    NotasEspeciales  = $"[B2B - {agencia.Nombre}] {dto.NotasEspeciales}",
                    PrecioTotal      = total,
                    Estado           = "Confirmada"
                };

                int id = _reservacionDAO.Create(reservacion);

                _habitacionDAO.CambiarEstado(dto.IdHabitacion, "Ocupada");

                return StatusCode(201, JsonResponse.Ok("Reservacion B2B creada exitosamente", new
                {
                    idReservacion          = id,
                    agencia                = agencia.Nombre,
                    habitacion             = habitacion.TipoHabitacion + " " + habitacion.NumHabitacion,
                    hotel                  = habitacion.NombreHotel,
                    checkIn                = dto.FechaCheckIn,
                    checkOut               = dto.FechaCheckOut,
                    noches,
                    subtotal,
                    iva,
                    total,
                    estado                 = "Confirmada",
                    inventarioSincronizado = true
                }));
            }
            catch (Exception ex)
            {
                return StatusCode(500, JsonResponse.Error(ex.Message));
            }
        }

        // GET api/b2b/reservas
        [HttpGet("reservas")]
        public IActionResult GetReservas()
        {
            var agencia = ValidarToken();
            if (agencia == null)
                return Unauthorized(JsonResponse.Error("Token invalido o agencia no autorizada"));

            try
            {
                var reservas = _reservacionDAO.GetAll()
                    .Where(r => r.NotasEspeciales != null &&
                                r.NotasEspeciales.Contains($"[B2B - {agencia.Nombre}]"))
                    .ToList();

                return Ok(JsonResponse.Ok("Reservas de agencia obtenidas", new
                {
                    agencia = agencia.Nombre,
                    total   = reservas.Count,
                    reservas
                }));
            }
            catch (Exception ex)
            {
                return StatusCode(500, JsonResponse.Error(ex.Message));
            }
        }

        // PUT api/b2b/reservas/{id}/cancelar
        [HttpPut("reservas/{id}/cancelar")]
        public IActionResult CancelarReserva(int id)
        {
            var agencia = ValidarToken();
            if (agencia == null)
                return Unauthorized(JsonResponse.Error("Token invalido o agencia no autorizada"));

            try
            {
                var reserva = _reservacionDAO.GetById(id);
                if (reserva == null)
                    return NotFound(JsonResponse.Error("Reservacion no encontrada"));

                if (reserva.NotasEspeciales == null ||
                    !reserva.NotasEspeciales.Contains($"[B2B - {agencia.Nombre}]"))
                    return Unauthorized(JsonResponse.Error("Esta reserva no pertenece a tu agencia"));

                if (reserva.Estado == "Cancelada")
                    return BadRequest(JsonResponse.Error("La reserva ya esta cancelada"));

                _reservacionDAO.Cancelar(id);

                _habitacionDAO.CambiarEstado(reserva.IdHabitacion, "Disponible");

                return Ok(JsonResponse.Ok("Reservacion B2B cancelada y habitacion liberada", null));
            }
            catch (Exception ex)
            {
                return StatusCode(500, JsonResponse.Error(ex.Message));
            }
        }
    }
}