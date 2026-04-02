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
        /// Verifica el cierre de ventas antes de procesar la solicitud.
        /// </summary>
        /// <param name="dto">Datos de la reservación a crear.</param>
        /// <returns>
        /// 201 Created con los datos de la reservación creada.
        /// 400 Bad Request si las ventas están cerradas o los datos son inválidos.
        /// 500 Internal Server Error si ocurre un error inesperado.
        /// </returns>
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
            catch (ArgumentException ex)
            {
                return BadRequest(JsonResponse.Error(ex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, JsonResponse.Error(ex.Message));
            }
        }

        /// <summary>
        /// Obtiene todas las reservaciones de un usuario específico.
        /// </summary>
        /// <param name="idUsuario">ID del usuario cuyas reservaciones se desean consultar.</param>
        /// <returns>
        /// 200 OK con la lista de reservaciones del usuario.
        /// 500 Internal Server Error si ocurre un error inesperado.
        /// </returns>
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

        /// <summary>
        /// Obtiene el detalle de una reservación por su ID.
        /// </summary>
        /// <param name="id">ID de la reservación a consultar.</param>
        /// <returns>
        /// 200 OK con los datos de la reservación.
        /// 404 Not Found si la reservación no existe.
        /// 500 Internal Server Error si ocurre un error inesperado.
        /// </returns>
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

        /// <summary>
        /// Obtiene todas las reservaciones del sistema.
        /// </summary>
        /// <returns>
        /// 200 OK con la lista completa de reservaciones.
        /// 500 Internal Server Error si ocurre un error inesperado.
        /// </returns>
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

        /// <summary>
        /// Cancela una reservación existente.
        /// </summary>
        /// <param name="id">ID de la reservación a cancelar.</param>
        /// <param name="idUsuario">ID del usuario que solicita la cancelación.</param>
        /// <returns>
        /// 200 OK si la reservación fue cancelada exitosamente.
        /// 400 Bad Request si los datos son inválidos.
        /// 500 Internal Server Error si no se pudo cancelar o hay un error inesperado.
        /// </returns>
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

        /// <summary>
        /// Confirma una reservación pendiente.
        /// </summary>
        /// <param name="id">ID de la reservación a confirmar.</param>
        /// <returns>
        /// 200 OK si la reservación fue confirmada exitosamente.
        /// 404 Not Found si la reservación no existe.
        /// 500 Internal Server Error si no se pudo confirmar o hay un error inesperado.
        /// </returns>
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

        /// <summary>
        /// Modifica las fechas y datos de una reservación existente.
        /// Valida disponibilidad y que la reservación no esté cancelada o completada.
        /// </summary>
        /// <param name="id">ID de la reservación a modificar.</param>
        /// <param name="dto">Nuevos datos de la reservación.</param>
        /// <returns>
        /// 200 OK con los datos actualizados de la reservación.
        /// 400 Bad Request si los datos son inválidos o el estado no permite modificación.
        /// 404 Not Found si la reservación no existe.
        /// 409 Conflict si la habitación no está disponible en las nuevas fechas.
        /// 500 Internal Server Error si ocurre un error inesperado.
        /// </returns>
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