using Microsoft.AspNetCore.Mvc;
using HotelesAPI.DAO;
using HotelesAPI.DTOs;
using HotelesAPI.Models;
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

        // PUT api/admin/usuarios/{id}/toggle
        [HttpPut("usuarios/{id}/toggle")]
        public IActionResult ToggleUsuario(int id, [FromBody] ToggleUsuarioDto dto)
        {
            try
            {
                var dao = new UsuarioDAO();
                dao.ToggleActivo(id, dto.Activo);
                return Ok(JsonResponse.Ok("Usuario actualizado", null));
            }
            catch (Exception ex)
            {
                return StatusCode(500, JsonResponse.Error(ex.Message));
            }
        }

        // GET api/admin/agencias
        [HttpGet("agencias")]
        public IActionResult GetAgencias()
        {
            try
            {
                var dao = new AgenciaDAO();
                var agencias = dao.GetTodas();
                return Ok(JsonResponse.Ok("Agencias obtenidas", agencias));
            }
            catch (Exception ex)
            {
                return StatusCode(500, JsonResponse.Error(ex.Message));
            }
        }

        // POST api/admin/agencias
        [HttpPost("agencias")]
        public IActionResult CrearAgencia([FromBody] Agencia agencia)
        {
            try
            {
                var dao = new AgenciaDAO();
                int id = dao.Create(agencia);
                return Ok(JsonResponse.Ok("Agencia creada exitosamente", new { idAgencia = id }));
            }
            catch (Exception ex)
            {
                return StatusCode(500, JsonResponse.Error(ex.Message));
            }
        }

        // PUT api/admin/agencias/{id}/toggle
        [HttpPut("agencias/{id}/toggle")]
        public IActionResult ToggleAgencia(int id, [FromBody] ToggleUsuarioDto dto)
        {
            try
            {
                var dao = new AgenciaDAO();
                dao.ToggleActivo(id, dto.Activo);
                return Ok(JsonResponse.Ok("Agencia actualizada", null));
            }
            catch (Exception ex)
            {
                return StatusCode(500, JsonResponse.Error(ex.Message));
            }
        }

        // GET api/admin/cupones
        [HttpGet("cupones")]
        public IActionResult GetCupones()
        {
            try
            {
                var dao = new CuponDAO();
                var cupones = dao.GetTodos();
                return Ok(JsonResponse.Ok("Cupones obtenidos", cupones));
            }
            catch (Exception ex)
            {
                return StatusCode(500, JsonResponse.Error(ex.Message));
            }
        }

        // POST api/admin/cupones
        [HttpPost("cupones")]
        public IActionResult CrearCupon([FromBody] Cupon cupon)
        {
            try
            {
                var dao = new CuponDAO();
                int id = dao.Create(cupon);
                return Ok(JsonResponse.Ok("Cupón creado exitosamente", new { idCupon = id }));
            }
            catch (Exception ex)
            {
                return StatusCode(500, JsonResponse.Error(ex.Message));
            }
        }

        // PUT api/admin/cupones/{id}/toggle
        [HttpPut("cupones/{id}/toggle")]
        public IActionResult ToggleCupon(int id, [FromBody] ToggleUsuarioDto dto)
        {
            try
            {
                var dao = new CuponDAO();
                dao.ToggleActivo(id, dto.Activo);
                return Ok(JsonResponse.Ok("Cupón actualizado", null));
            }
            catch (Exception ex)
            {
                return StatusCode(500, JsonResponse.Error(ex.Message));
            }
        }

        // GET api/admin/configuracion/cierre-ventas
        [HttpGet("configuracion/cierre-ventas")]
        public IActionResult GetCierreVentas()
        {
            try
            {
                var dao = new ConfiguracionDAO();
                var fecha = dao.GetFechaCierre();
                var cerrado = dao.VentasCerradas();
                return Ok(JsonResponse.Ok("Configuración obtenida", new
                {
                    fechaCierre = fecha?.ToString("yyyy-MM-ddTHH:mm"),
                    ventasCerradas = cerrado
                }));
            }
            catch (Exception ex)
            {
                return StatusCode(500, JsonResponse.Error(ex.Message));
            }
        }

        // PUT api/admin/configuracion/cierre-ventas
        [HttpPut("configuracion/cierre-ventas")]
        public IActionResult SetCierreVentas([FromBody] CierreVentasDto dto)
        {
            try
            {
                var dao = new ConfiguracionDAO();
                dao.SetValor("fecha_cierre_ventas", dto.FechaCierre ?? "");
                string mensaje = string.IsNullOrEmpty(dto.FechaCierre)
                    ? "Cierre de ventas eliminado. El sistema acepta reservas nuevamente."
                    : $"Cierre de ventas configurado para {dto.FechaCierre}";
                return Ok(JsonResponse.Ok(mensaje, null));
            }
            catch (Exception ex)
            {
                return StatusCode(500, JsonResponse.Error(ex.Message));
            }
        }
    }
}