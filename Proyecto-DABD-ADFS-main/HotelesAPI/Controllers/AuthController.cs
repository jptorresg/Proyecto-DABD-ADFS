using Microsoft.AspNetCore.Mvc;
using HotelesAPI.DTOs;
using HotelesAPI.Services;
using HotelesAPI.Utils;

namespace HotelesAPI.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _authService;

        public AuthController()
        {
            _authService = new AuthService();
        }

        // POST api/auth/login
        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginDto dto)
        {
            try
            {
                var usuario = _authService.Login(dto.Email, dto.Password);
                return Ok(JsonResponse.Ok("Login exitoso", usuario));
            }
            catch (ArgumentException ex)
            {
                return Unauthorized(JsonResponse.Error(ex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, JsonResponse.Error(ex.Message));
            }
        }

        // POST api/auth/registro
        [HttpPost("registro")]
        public IActionResult Registro([FromBody] RegistroDto dto)
        {
            try
            {
                var usuario = _authService.Registrar(dto);
                return StatusCode(201, JsonResponse.Ok("Usuario registrado exitosamente", usuario));
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
    }
}