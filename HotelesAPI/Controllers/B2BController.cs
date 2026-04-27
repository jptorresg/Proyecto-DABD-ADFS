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

                decimal factorDescuento = 1 - (agencia.PorcentajeDescuento / 100m);
                var habitacionesConDescuento = habitaciones.Select(h => new
                {
                    h.IdHabitacion,
                    h.IdHotel,
                    h.NombreHotel,
                    h.NumHabitacion,
                    h.TipoHabitacion,
                    precioNocheOriginal = h.PrecioNoche,
                    precioNocheConDescuento = Math.Round(h.PrecioNoche * factorDescuento, 2),
                    h.CapacidadMax,
                    h.Estado,
                    h.Ubicacion,
                    h.Estrellas,
                    h.Amenidades,
                    h.Descripcion,
                    h.ImagenUrl
                }).ToList();

                return Ok(JsonResponse.Ok("Disponibilidad obtenida", new
                {
                    agencia           = agencia.Nombre,
                    descuentoAplicado = agencia.PorcentajeDescuento + "%",
                    checkIn,
                    checkOut,
                    capacidad,
                    ciudad            = ciudad ?? "todas",
                    totalDisponibles  = habitacionesConDescuento.Count,
                    habitaciones      = habitacionesConDescuento
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
                decimal precioNocheConDescuento = habitacion.PrecioNoche * (1 - agencia.PorcentajeDescuento / 100m);
                decimal subtotal = Math.Round(precioNocheConDescuento * noches, 2);
                decimal iva      = Math.Round(subtotal * 0.12m, 2);
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
                    idReservacion           = id,
                    agencia                 = agencia.Nombre,
                    descuentoAgencia        = agencia.PorcentajeDescuento + "%",
                    habitacion              = habitacion.TipoHabitacion + " " + habitacion.NumHabitacion,
                    hotel                   = habitacion.NombreHotel,
                    checkIn                 = dto.FechaCheckIn,
                    checkOut                = dto.FechaCheckOut,
                    noches,
                    precioNocheOriginal     = habitacion.PrecioNoche,
                    precioNocheConDescuento = Math.Round(precioNocheConDescuento, 2),
                    subtotal,
                    iva,
                    total,
                    estado                  = "Confirmada",
                    inventarioSincronizado  = true
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