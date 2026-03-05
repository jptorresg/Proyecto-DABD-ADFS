using Microsoft.AspNetCore.Mvc;
using HotelesAPI.DAO;
using HotelesAPI.DTOs;
using HotelesAPI.Services;
using HotelesAPI.Utils;

namespace HotelesAPI.Controllers
{
    [ApiController]
    [Route("api/reservaciones")]
    public class ReservacionesController : ControllerBase
    {
        private readonly ReservacionService _reservacionService;
        private readonly ReservacionDAO _reservacionDAO;
        private readonly ConfiguracionDAO _configuracionDAO;

        public ReservacionesController()
        {
            _reservacionService = new ReservacionService();
            _reservacionDAO = new ReservacionDAO();
            _configuracionDAO = new ConfiguracionDAO();
        }

        // POST api/reservaciones
        [HttpPost]
        public IActionResult Crear([FromBody] ReservacionDto dto)
        {
            try
            {
                // Validar cierre de ventas
                if (_configuracionDAO.VentasCerradas())
                {
                    var fechaCierre = _configuracionDAO.GetFechaCierre();
                    return BadRequest(JsonResponse.Error(
                        $"Las ventas están cerradas desde el {fechaCierre?.ToString("dd/MM/yyyy HH:mm")}. No se pueden crear nuevas reservaciones."));
                }

                var reservacion = _reservacionService.Crear(dto);
                return StatusCode(201, JsonResponse.Ok("Reservación creada exitosamente", reservacion));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(JsonResponse.Error(ex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, JsonResponse.Error(ex.Message));
            }
        }

        // GET api/reservaciones/usuario/{idUsuario}
        [HttpGet("usuario/{idUsuario}")]
        public IActionResult GetByUsuario(int idUsuario)
        {
            try
            {
                var reservaciones = _reservacionDAO.GetByUsuario(idUsuario);
                return Ok(JsonResponse.Ok("Reservaciones obtenidas", reservaciones));
            }
            catch (Exception ex)
            {
                return StatusCode(500, JsonResponse.Error(ex.Message));
            }
        }

        // GET api/reservaciones/{id}
        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            try
            {
                var reservacion = _reservacionDAO.GetById(id);
                if (reservacion == null)
                    return NotFound(JsonResponse.Error("Reservación no encontrada"));

                return Ok(JsonResponse.Ok("Reservación encontrada", reservacion));
            }
            catch (Exception ex)
            {
                return StatusCode(500, JsonResponse.Error(ex.Message));
            }
        }

        // GET api/reservaciones
        [HttpGet]
        public IActionResult GetAll()
        {
            try
            {
                var reservaciones = _reservacionDAO.GetAll();
                return Ok(JsonResponse.Ok("Reservaciones obtenidas", reservaciones));
            }
            catch (Exception ex)
            {
                return StatusCode(500, JsonResponse.Error(ex.Message));
            }
        }

        // PUT api/reservaciones/{id}/cancelar
        [HttpPut("{id}/cancelar")]
        public IActionResult Cancelar(int id, [FromQuery] int idUsuario)
        {
            try
            {
                bool cancelado = _reservacionService.Cancelar(id, idUsuario);
                if (!cancelado)
                    return StatusCode(500, JsonResponse.Error("No se pudo cancelar la reservación"));

                return Ok(JsonResponse.Ok("Reservación cancelada exitosamente", null));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(JsonResponse.Error(ex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, JsonResponse.Error(ex.Message));
            }
        }

        // PUT api/reservaciones/{id}/confirmar
        [HttpPut("{id}/confirmar")]
        public IActionResult Confirmar(int id)
        {
            try
            {
                var reservacion = _reservacionDAO.GetById(id);
                if (reservacion == null)
                    return NotFound(JsonResponse.Error("Reservación no encontrada"));

                bool confirmado = _reservacionDAO.Confirmar(id);
                if (!confirmado)
                    return StatusCode(500, JsonResponse.Error("No se pudo confirmar la reservación"));

                return Ok(JsonResponse.Ok("Reservación confirmada exitosamente", null));
            }
            catch (Exception ex)
            {
                return StatusCode(500, JsonResponse.Error(ex.Message));
            }
        }

        // PUT api/reservaciones/{id}/modificar
        [HttpPut("{id}/modificar")]
        public IActionResult Modificar(int id, [FromBody] ModificarReservacionDto dto)
        {
            try
            {
                var reservacion = _reservacionDAO.GetById(id);
                if (reservacion == null)
                    return NotFound(JsonResponse.Error("Reservación no encontrada"));

                if (reservacion.Estado == "Cancelada" || reservacion.Estado == "Completada")
                    return BadRequest(JsonResponse.Error("No se puede modificar una reservación cancelada o completada"));

                if (dto.FechaCheckIn >= dto.FechaCheckOut)
                    return BadRequest(JsonResponse.Error("La fecha de check-in debe ser anterior al check-out"));

                bool conflicto = _reservacionDAO.ExisteConflicto(
                    reservacion.IdHabitacion,
                    dto.FechaCheckIn,
                    dto.FechaCheckOut,
                    id
                );

                if (conflicto)
                    return Conflict(JsonResponse.Error("La habitación no está disponible en las nuevas fechas"));

                bool modificado = _reservacionDAO.Modificar(
                    id,
                    dto.FechaCheckIn,
                    dto.FechaCheckOut,
                    dto.NumHuespedes,
                    dto.PrecioTotal
                );

                if (!modificado)
                    return StatusCode(500, JsonResponse.Error("No se pudo modificar la reservación"));

                var actualizada = _reservacionDAO.GetById(id);
                return Ok(JsonResponse.Ok("Reservación modificada exitosamente", actualizada));
            }
            catch (Exception ex)
            {
                return StatusCode(500, JsonResponse.Error(ex.Message));
            }
        }
    }
}