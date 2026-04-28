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

        // ============================================================
        // SESIÓN 6: GALERÍA DE IMÁGENES POR HABITACIÓN
        // ============================================================

        /// <summary>
        /// GET api/habitaciones/{id}/imagenes
        /// Devuelve todas las imágenes de la galería de una habitación.
        /// </summary>
        [HttpGet("{id:int}/imagenes")]
        public IActionResult GetImagenes(int id)
        {
            try
            {
                var dao = new HabitacionImagenDAO();
                var imagenes = dao.GetByHabitacion(id);
                return Ok(JsonResponse.Ok("Imágenes obtenidas", imagenes));
            }
            catch (Exception ex)
            {
                return StatusCode(500, JsonResponse.Error(ex.Message));
            }
        }

        /// <summary>
        /// POST api/habitaciones/{id}/imagenes
        /// Agrega una imagen a la galería (admin).
        /// </summary>
        [HttpPost("{id:int}/imagenes")]
        public IActionResult AgregarImagen(int id, [FromBody] HotelesAPI.Models.HabitacionImagen imagen)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(imagen.Url))
                    return BadRequest(JsonResponse.Error("La URL es requerida"));

                imagen.IdHabitacion = id;
                var dao = new HabitacionImagenDAO();
                int idImagen = dao.Crear(imagen);
                return StatusCode(201, JsonResponse.Ok("Imagen agregada", new { idImagen }));
            }
            catch (Exception ex)
            {
                return StatusCode(500, JsonResponse.Error(ex.Message));
            }
        }

        /// <summary>
        /// DELETE api/habitaciones/imagenes/{idImagen}
        /// Elimina una imagen de la galería (admin).
        /// </summary>
        [HttpDelete("imagenes/{idImagen:int}")]
        public IActionResult EliminarImagen(int idImagen)
        {
            try
            {
                var dao = new HabitacionImagenDAO();
                bool ok = dao.Eliminar(idImagen);
                if (!ok)
                    return NotFound(JsonResponse.Error("Imagen no encontrada"));
                return Ok(JsonResponse.Ok("Imagen eliminada", null));
            }
            catch (Exception ex)
            {
                return StatusCode(500, JsonResponse.Error(ex.Message));
            }
        }

        /// <summary>
        /// PUT api/habitaciones/imagenes/{idImagen}/principal
        /// Marca una imagen como la principal de la habitación.
        /// </summary>
        [HttpPut("imagenes/{idImagen:int}/principal")]
        public IActionResult MarcarPrincipal(int idImagen, [FromQuery] int idHabitacion)
        {
            try
            {
                var dao = new HabitacionImagenDAO();
                bool ok = dao.MarcarComoPrincipal(idImagen, idHabitacion);
                if (!ok)
                    return StatusCode(500, JsonResponse.Error("No se pudo actualizar"));
                return Ok(JsonResponse.Ok("Imagen marcada como principal", null));
            }
            catch (Exception ex)
            {
                return StatusCode(500, JsonResponse.Error(ex.Message));
            }
        }

        // ============================================================

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