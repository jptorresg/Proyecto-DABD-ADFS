using Microsoft.AspNetCore.Mvc;
using HotelesAPI.DAO;
using HotelesAPI.DTOs;
using HotelesAPI.Utils;

namespace HotelesAPI.Controllers
{
    [ApiController]
    [Route("api/admin")]
    public class AdminController : ControllerBase
    {
        private readonly DashboardDAO _dashboardDAO;

        public AdminController()
        {
            _dashboardDAO = new DashboardDAO();
        }

        // GET api/admin/dashboard
        [HttpGet("dashboard")]
        public IActionResult GetDashboard()
        {
            try
            {
                var dashboard = _dashboardDAO.GetDashboard();
                return Ok(JsonResponse.Ok("Dashboard obtenido", dashboard));
            }
            catch (Exception ex)
            {
                return StatusCode(500, JsonResponse.Error(ex.Message));
            }
        }

        // GET api/admin/reservaciones
        [HttpGet("reservaciones")]
        public IActionResult GetReservaciones()
        {
            try
            {
                var dao = new ReservacionDAO();
                var reservaciones = dao.GetAll();
                return Ok(JsonResponse.Ok("Reservaciones obtenidas", reservaciones));
            }
            catch (Exception ex)
            {
                return StatusCode(500, JsonResponse.Error(ex.Message));
            }
        }

        // PUT api/admin/reservaciones/{id}/estado
        [HttpPut("reservaciones/{id}/estado")]
        public IActionResult CambiarEstado(int id, [FromBody] CambiarEstadoDto dto)
        {
            try
            {
                var dao = new ReservacionDAO();
                dao.CambiarEstado(id, dto.Estado);
                return Ok(JsonResponse.Ok("Estado actualizado", null));
            }
            catch (Exception ex)
            {
                return StatusCode(500, JsonResponse.Error(ex.Message));
            }
        }

        // GET api/admin/usuarios
        [HttpGet("usuarios")]
        public IActionResult GetUsuarios()
        {
            try
            {
                var dao = new UsuarioDAO();
                var usuarios = dao.GetTodos();
                return Ok(JsonResponse.Ok("Usuarios obtenidos", usuarios));
            }
            catch (Exception ex)
            {
                return StatusCode(500, JsonResponse.Error(ex.Message));
            }
        }
    }
}