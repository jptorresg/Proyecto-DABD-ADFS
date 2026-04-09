using Microsoft.AspNetCore.Mvc;
using HotelesAPI.DAO;
using HotelesAPI.Utils;

namespace HotelesAPI.Controllers
{
    [ApiController]
    [Route("api/habitaciones")]
    public class HabitacionesController : ControllerBase
    {
        private readonly HabitacionDAO _habitacionDAO;

        public HabitacionesController()
        {
            _habitacionDAO = new HabitacionDAO();
        }

        // GET api/habitaciones
        [HttpGet]
        public IActionResult GetAll()
        {
            try
            {
                var habitaciones = _habitacionDAO.GetAll();
                return Ok(JsonResponse.Ok("Habitaciones obtenidas", habitaciones));
            }
            catch (Exception ex)
            {
                return StatusCode(500, JsonResponse.Error(ex.Message));
            }
        }

        // GET api/habitaciones/opciones-filtro
        [HttpGet("opciones-filtro")]
        public IActionResult GetOpcionesFiltro()
        {
            try
            {
                var opciones = _habitacionDAO.GetOpcionesFiltro();
                return Ok(JsonResponse.Ok("Opciones obtenidas", opciones));
            }
            catch (Exception ex)
            {
                return StatusCode(500, JsonResponse.Error(ex.Message));
            }
        }

        // GET api/habitaciones/filtrar
        [HttpGet("filtrar")]
        public IActionResult Filtrar([FromQuery] string? tipo, [FromQuery] decimal? precioMax,
                                     [FromQuery] int? capacidad, [FromQuery] string? amenidad)
        {
            try
            {
                var habitaciones = _habitacionDAO.GetWithFilters(tipo, precioMax, capacidad, amenidad);
                return Ok(JsonResponse.Ok("Filtro aplicado", habitaciones));
            }
            catch (Exception ex)
            {
                return StatusCode(500, JsonResponse.Error(ex.Message));
            }
        }

        // GET api/habitaciones/disponibles
        [HttpGet("disponibles")]
        public IActionResult GetDisponibles([FromQuery] DateTime checkIn,
                                            [FromQuery] DateTime checkOut,
                                            [FromQuery] int capacidad = 1)
        {
            try
            {
                if (checkIn >= checkOut)
                    return BadRequest(JsonResponse.Error("La fecha de check-in debe ser anterior al check-out"));

                var habitaciones = _habitacionDAO.GetDisponibles(checkIn, checkOut, capacidad);
                return Ok(JsonResponse.Ok("Habitaciones disponibles", habitaciones));
            }
            catch (Exception ex)
            {
                return StatusCode(500, JsonResponse.Error(ex.Message));
            }
        }

        // GET api/habitaciones/{id}  ← debe ir AL FINAL
        [HttpGet("{id:int}")]
        public IActionResult GetById(int id)
        {
            try
            {
                var habitacion = _habitacionDAO.GetById(id);
                if (habitacion == null)
                    return NotFound(JsonResponse.Error("Habitación no encontrada"));

                return Ok(JsonResponse.Ok("Habitación encontrada", habitacion));
            }
            catch (Exception ex)
            {
                return StatusCode(500, JsonResponse.Error(ex.Message));
            }
        }
    }
}