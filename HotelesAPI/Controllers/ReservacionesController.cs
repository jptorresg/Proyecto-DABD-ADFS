using Microsoft.AspNetCore.Mvc;
using HotelesAPI.DAO;
using HotelesAPI.DTOs;
using HotelesAPI.Services;
using HotelesAPI.Utils;

namespace HotelesAPI.Controllers
{
    /// <summary>
    /// Controlador principal para la gestión de reservaciones del sistema Bedly.
    /// Expone endpoints REST para crear, consultar, modificar y cancelar reservaciones.
    /// </summary>
    [ApiController]
    [Route("api/reservaciones")]
    public class ReservacionesController : ControllerBase
    {
        private readonly ReservacionService _reservacionService;
        private readonly ReservacionDAO _reservacionDAO;
        private readonly ConfiguracionDAO _configuracionDAO;

        /// <summary>
        /// Inicializa una nueva instancia del controlador de reservaciones.
        /// </summary>
        public ReservacionesController()
        {
            _reservacionService = new ReservacionService();
            _reservacionDAO = new ReservacionDAO();
            _configuracionDAO = new ConfiguracionDAO();
        }

        /// <summary>
        /// Crea una nueva reservación en el sistema.
        /// </summary>
        [HttpPost]
        public IActionResult Crear([FromBody] ReservacionDto dto)
        {
            try
            {
                if (_configuracionDAO.VentasCerradas())
                {
                    var fechaCierre = _configuracionDAO.GetFechaCierre();
                    return BadRequest(JsonResponse.Error(
                        $"Las ventas están cerradas desde el {fechaCierre?.ToString("dd/MM/yyyy HH:mm")}. No se pueden crear nuevas reservaciones."));
                }
                var reservacion = _reservacionService.Crear(dto);
                return StatusCode(201, JsonResponse.Ok("Reservación creada exitosamente", reservacion));
            }
            catch (ArgumentException ex) { return BadRequest(JsonResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, JsonResponse.Error(ex.Message)); }
        }

        /// <summary>
        /// Obtiene todas las reservaciones de un usuario específico.
        /// </summary>
        [HttpGet("usuario/{idUsuario}")]
        public IActionResult GetByUsuario(int idUsuario)
        {
            try
            {
                var reservaciones = _reservacionDAO.GetByUsuario(idUsuario);
                return Ok(JsonResponse.Ok("Reservaciones obtenidas", reservaciones));
            }
            catch (Exception ex) { return StatusCode(500, JsonResponse.Error(ex.Message)); }
        }

        /// <summary>
        /// Obtiene las fechas ocupadas de una habitación específica para bloquear el calendario.
        /// Devuelve rangos de fechas donde la habitación no está disponible.
        /// </summary>
        [HttpGet("habitacion/{idHabitacion}/fechas-ocupadas")]
        public IActionResult GetFechasOcupadas(int idHabitacion)
        {
            try
            {
                var fechas = _reservacionDAO.GetFechasOcupadas(idHabitacion);
                return Ok(JsonResponse.Ok("Fechas ocupadas obtenidas", fechas));
            }
            catch (Exception ex) { return StatusCode(500, JsonResponse.Error(ex.Message)); }
        }

        /// <summary>
        /// Obtiene el detalle de una reservación por su ID.
        /// </summary>
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
            catch (Exception ex) { return StatusCode(500, JsonResponse.Error(ex.Message)); }
        }

        /// <summary>
        /// Obtiene todas las reservaciones del sistema.
        /// </summary>
        [HttpGet]
        public IActionResult GetAll()
        {
            try
            {
                var reservaciones = _reservacionDAO.GetAll();
                return Ok(JsonResponse.Ok("Reservaciones obtenidas", reservaciones));
            }
            catch (Exception ex) { return StatusCode(500, JsonResponse.Error(ex.Message)); }
        }

        /// <summary>
        /// Cancela una reservación existente.
        /// </summary>
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
            catch (ArgumentException ex) { return BadRequest(JsonResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, JsonResponse.Error(ex.Message)); }
        }

        /// <summary>
        /// Confirma una reservación pendiente.
        /// </summary>
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
            catch (Exception ex) { return StatusCode(500, JsonResponse.Error(ex.Message)); }
        }

        /// <summary>
        /// Modifica las fechas y datos de una reservación existente.
        /// </summary>
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
                    reservacion.IdHabitacion, dto.FechaCheckIn, dto.FechaCheckOut, id);
                if (conflicto)
                    return Conflict(JsonResponse.Error("La habitación no está disponible en las nuevas fechas"));

                bool modificado = _reservacionDAO.Modificar(
                    id, dto.FechaCheckIn, dto.FechaCheckOut, dto.NumHuespedes, dto.PrecioTotal);
                if (!modificado)
                    return StatusCode(500, JsonResponse.Error("No se pudo modificar la reservación"));

                var actualizada = _reservacionDAO.GetById(id);
                return Ok(JsonResponse.Ok("Reservación modificada exitosamente", actualizada));
            }
            catch (Exception ex) { return StatusCode(500, JsonResponse.Error(ex.Message)); }
        }
    }
}