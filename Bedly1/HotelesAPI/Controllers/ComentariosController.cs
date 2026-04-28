using Microsoft.AspNetCore.Mvc;
using HotelesAPI.DAO;
using HotelesAPI.DTOs;
using HotelesAPI.Models;
using HotelesAPI.Utils;

namespace HotelesAPI.Controllers
{
    [ApiController]
    [Route("api/comentarios")]
    public class ComentariosController : ControllerBase
    {
        private readonly ComentarioDAO _comentarioDAO;

        public ComentariosController()
        {
            _comentarioDAO = new ComentarioDAO();
        }

        // GET api/comentarios/habitacion/{idHabitacion}
        [HttpGet("habitacion/{idHabitacion}")]
        public IActionResult GetByHabitacion(int idHabitacion)
        {
            try
            {
                var comentarios = _comentarioDAO.GetByHabitacion(idHabitacion);
                double promedio = _comentarioDAO.GetPromedioRating(idHabitacion);

                return Ok(JsonResponse.Ok("Comentarios obtenidos", new
                {
                    promedioRating = promedio,
                    total = comentarios.Count,
                    comentarios
                }));
            }
            catch (Exception ex)
            {
                return StatusCode(500, JsonResponse.Error(ex.Message));
            }
        }

        // GET api/comentarios/usuario/{idUsuario}
        [HttpGet("usuario/{idUsuario}")]
        public IActionResult GetByUsuario(int idUsuario)
        {
            try
            {
                var comentarios = _comentarioDAO.GetByUsuario(idUsuario);
                return Ok(JsonResponse.Ok("Comentarios obtenidos", comentarios));
            }
            catch (Exception ex)
            {
                return StatusCode(500, JsonResponse.Error(ex.Message));
            }
        }

        // POST api/comentarios
        [HttpPost]
        public IActionResult Create([FromBody] ComentarioDto dto)
        {
            try
            {
                // Si es respuesta, rating es 0 (no aplica)
                if (dto.IdComentarioPadre == null && (dto.Rating < 1 || dto.Rating > 5))
                    return BadRequest(JsonResponse.Error("El rating debe estar entre 1 y 5"));

                if (string.IsNullOrEmpty(dto.Texto))
                    return BadRequest(JsonResponse.Error("El comentario no puede estar vacío"));

                var comentario = new Comentario
                {
                    IdUsuario = dto.IdUsuario,
                    IdHabitacion = dto.IdHabitacion,
                    Rating = dto.IdComentarioPadre != null ? 0 : dto.Rating,
                    Texto = dto.Texto,
                    IdComentarioPadre = dto.IdComentarioPadre
                };

                int id = _comentarioDAO.Create(comentario);
                return StatusCode(201, JsonResponse.Ok("Comentario publicado exitosamente", new { idComentario = id }));
            }
            catch (Exception ex)
            {
                return StatusCode(500, JsonResponse.Error(ex.Message));
            }
        }

        // DELETE api/comentarios/{id}
        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            try
            {
                bool eliminado = _comentarioDAO.Delete(id);
                if (!eliminado)
                    return NotFound(JsonResponse.Error("Comentario no encontrado"));

                return Ok(JsonResponse.Ok("Comentario eliminado exitosamente", null));
            }
            catch (Exception ex)
            {
                return StatusCode(500, JsonResponse.Error(ex.Message));
            }
        }
    }
}