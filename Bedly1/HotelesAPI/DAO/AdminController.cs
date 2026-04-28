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

        [HttpGet("dashboard")]
        public IActionResult GetDashboard()
        {
            try
            {
                var dashboard = _dashboardDAO.GetDashboard();
                return Ok(JsonResponse.Ok("Dashboard obtenido", dashboard));
            }
            catch (Exception ex) { return StatusCode(500, JsonResponse.Error(ex.Message)); }
        }

        [HttpGet("reservaciones")]
        public IActionResult GetReservaciones()
        {
            try
            {
                var dao = new ReservacionDAO();
                return Ok(JsonResponse.Ok("Reservaciones obtenidas", dao.GetAll()));
            }
            catch (Exception ex) { return StatusCode(500, JsonResponse.Error(ex.Message)); }
        }

        [HttpPut("reservaciones/{id}/estado")]
        public IActionResult CambiarEstado(int id, [FromBody] CambiarEstadoDto dto)
        {
            try
            {
                new ReservacionDAO().CambiarEstado(id, dto.Estado);
                return Ok(JsonResponse.Ok("Estado actualizado", null));
            }
            catch (Exception ex) { return StatusCode(500, JsonResponse.Error(ex.Message)); }
        }

        [HttpGet("usuarios")]
        public IActionResult GetUsuarios()
        {
            try
            {
                return Ok(JsonResponse.Ok("Usuarios obtenidos", new UsuarioDAO().GetTodos()));
            }
            catch (Exception ex) { return StatusCode(500, JsonResponse.Error(ex.Message)); }
        }

        [HttpPut("usuarios/{id}/toggle")]
        public IActionResult ToggleUsuario(int id, [FromBody] ToggleUsuarioDto dto)
        {
            try
            {
                new UsuarioDAO().ToggleActivo(id, dto.Activo);
                return Ok(JsonResponse.Ok("Usuario actualizado", null));
            }
            catch (Exception ex) { return StatusCode(500, JsonResponse.Error(ex.Message)); }
        }

        [HttpPut("usuarios/{id}/rol")]
        public IActionResult CambiarRol(int id, [FromBody] CambiarRolDto dto)
        {
            try
            {
                var dao = new UsuarioDAO();
                var usuario = dao.FindById(id);
                if (usuario == null)
                    return NotFound(JsonResponse.Error("Usuario no encontrado"));

                // No se puede cambiar el rol de un superadmin
                if (usuario.Rol == "superadmin")
                    return BadRequest(JsonResponse.Error("No se puede cambiar el rol de un superadmin"));

                // No se puede asignar el rol superadmin
                if (dto.Rol == "superadmin")
                    return BadRequest(JsonResponse.Error("No se puede asignar el rol superadmin"));

                var rolesValidos = new[] { "admin", "recepcionista", "auditor", "cliente" };
                if (!rolesValidos.Contains(dto.Rol))
                    return BadRequest(JsonResponse.Error("Rol no válido"));

                dao.CambiarRol(id, dto.Rol);
                return Ok(JsonResponse.Ok("Rol actualizado correctamente", null));
            }
            catch (Exception ex) { return StatusCode(500, JsonResponse.Error(ex.Message)); }
        }

        [HttpGet("agencias")]
        public IActionResult GetAgencias()
        {
            try
            {
                return Ok(JsonResponse.Ok("Agencias obtenidas", new AgenciaDAO().GetTodas()));
            }
            catch (Exception ex) { return StatusCode(500, JsonResponse.Error(ex.Message)); }
        }

        [HttpPost("agencias")]
        public IActionResult CrearAgencia([FromBody] Agencia agencia)
        {
            try
            {
                int id = new AgenciaDAO().Create(agencia);
                return Ok(JsonResponse.Ok("Agencia creada exitosamente", new { idAgencia = id }));
            }
            catch (Exception ex) { return StatusCode(500, JsonResponse.Error(ex.Message)); }
        }

        [HttpPut("agencias/{id}/toggle")]
        public IActionResult ToggleAgencia(int id, [FromBody] ToggleUsuarioDto dto)
        {
            try
            {
                new AgenciaDAO().ToggleActivo(id, dto.Activo);
                return Ok(JsonResponse.Ok("Agencia actualizada", null));
            }
            catch (Exception ex) { return StatusCode(500, JsonResponse.Error(ex.Message)); }
        }

        [HttpDelete("agencias/{id}")]
        public IActionResult EliminarAgencia(int id)
        {
            try
            {
                bool eliminado = new AgenciaDAO().Delete(id);
                if (!eliminado) return NotFound(JsonResponse.Error("Agencia no encontrada"));
                return Ok(JsonResponse.Ok("Agencia eliminada exitosamente", null));
            }
            catch (Exception ex) { return StatusCode(500, JsonResponse.Error(ex.Message)); }
        }

        [HttpGet("cupones")]
        public IActionResult GetCupones()
        {
            try
            {
                return Ok(JsonResponse.Ok("Cupones obtenidos", new CuponDAO().GetTodos()));
            }
            catch (Exception ex) { return StatusCode(500, JsonResponse.Error(ex.Message)); }
        }

        [HttpPost("cupones")]
        public IActionResult CrearCupon([FromBody] Cupon cupon)
        {
            try
            {
                int id = new CuponDAO().Create(cupon);
                return Ok(JsonResponse.Ok("Cupón creado exitosamente", new { idCupon = id }));
            }
            catch (Exception ex) { return StatusCode(500, JsonResponse.Error(ex.Message)); }
        }

        [HttpPut("cupones/{id}/toggle")]
        public IActionResult ToggleCupon(int id, [FromBody] ToggleUsuarioDto dto)
        {
            try
            {
                new CuponDAO().ToggleActivo(id, dto.Activo);
                return Ok(JsonResponse.Ok("Cupón actualizado", null));
            }
            catch (Exception ex) { return StatusCode(500, JsonResponse.Error(ex.Message)); }
        }

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
            catch (Exception ex) { return StatusCode(500, JsonResponse.Error(ex.Message)); }
        }

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
            catch (Exception ex) { return StatusCode(500, JsonResponse.Error(ex.Message)); }
        }

        [HttpGet("hoteles")]
        public IActionResult GetHoteles()
        {
            try
            {
                return Ok(JsonResponse.Ok("Hoteles obtenidos", new HotelDAO().GetTodos()));
            }
            catch (Exception ex) { return StatusCode(500, JsonResponse.Error(ex.Message)); }
        }

        [HttpPost("hoteles")]
        public IActionResult CrearHotel([FromBody] Hotel hotel)
        {
            try
            {
                if (string.IsNullOrEmpty(hotel.NombreHotel))
                    return BadRequest(JsonResponse.Error("El nombre del hotel es requerido"));
                var dao = new HotelDAO();
                int id = dao.Create(hotel);
                return StatusCode(201, JsonResponse.Ok("Hotel creado exitosamente", dao.GetById(id)));
            }
            catch (Exception ex) { return StatusCode(500, JsonResponse.Error(ex.Message)); }
        }

        [HttpPut("hoteles/{id}")]
        public IActionResult ActualizarHotel(int id, [FromBody] Hotel hotel)
        {
            try
            {
                var dao = new HotelDAO();
                if (dao.GetById(id) == null)
                    return NotFound(JsonResponse.Error("Hotel no encontrado"));
                hotel.IdHotel = id;
                dao.Update(hotel);
                return Ok(JsonResponse.Ok("Hotel actualizado exitosamente", dao.GetById(id)));
            }
            catch (Exception ex) { return StatusCode(500, JsonResponse.Error(ex.Message)); }
        }

        [HttpDelete("hoteles/{id}")]
        public IActionResult EliminarHotel(int id)
        {
            try
            {
                var dao = new HotelDAO();
                if (dao.GetById(id) == null)
                    return NotFound(JsonResponse.Error("Hotel no encontrado"));
                dao.Delete(id);
                return Ok(JsonResponse.Ok("Hotel eliminado exitosamente", null));
            }
            catch (Exception ex) { return StatusCode(500, JsonResponse.Error(ex.Message)); }
        }
    }
}