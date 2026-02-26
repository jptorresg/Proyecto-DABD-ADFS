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

        public ReservacionesController()
        {
            _reservacionService = new ReservacionService();
            _reservacionDAO = new ReservacionDAO();
        }

        // POST api/reservaciones
        [HttpPost]
        public IActionResult Crear([FromBody] ReservacionDto dto)
        {
            try
            {
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
    }
}