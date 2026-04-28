using Microsoft.AspNetCore.Mvc;
using HotelesAPI.DAO;
using HotelesAPI.DTOs;
using HotelesAPI.Services;
using HotelesAPI.Utils;

namespace HotelesAPI.Controllers
{
    [ApiController]
    [Route("api/usuarios")]
    public class UsuariosController : ControllerBase
    {
        private readonly UsuarioService _usuarioService;
        private readonly ReservacionDAO _reservacionDAO;

        public UsuariosController()
        {
            _usuarioService = new UsuarioService();
            _reservacionDAO = new ReservacionDAO();
        }

        // GET api/usuarios/{id}
        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            try
            {
                var usuario = _usuarioService.GetById(id);
                return Ok(JsonResponse.Ok("Usuario obtenido", usuario));
            }
            catch (ArgumentException ex)
            {
                return NotFound(JsonResponse.Error(ex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, JsonResponse.Error(ex.Message));
            }
        }

        // PUT api/usuarios/{id}
        [HttpPut("{id}")]
        public IActionResult Actualizar(int id, [FromBody] UsuarioDto dto)
        {
            try
            {
                var usuario = _usuarioService.Actualizar(id, dto);
                return Ok(JsonResponse.Ok("Usuario actualizado exitosamente", usuario));
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

        // PUT api/usuarios/{id}/password
        [HttpPut("{id}/password")]
        public IActionResult CambiarPassword(int id, [FromBody] CambiarPasswordDto dto)
        {
            try
            {
                bool cambiado = _usuarioService.CambiarPassword(id, dto);
                if (!cambiado)
                    return StatusCode(500, JsonResponse.Error("No se pudo cambiar la contraseña"));

                return Ok(JsonResponse.Ok("Contraseña actualizada exitosamente", null));
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

        // GET api/usuarios/{id}/reservaciones
        [HttpGet("{id}/reservaciones")]
        public IActionResult GetReservaciones(int id)
        {
            try
            {
                var reservaciones = _reservacionDAO.GetByUsuario(id);
                return Ok(JsonResponse.Ok("Reservaciones obtenidas", reservaciones));
            }
            catch (Exception ex)
            {
                return StatusCode(500, JsonResponse.Error(ex.Message));
            }
        }
    }
}