using Microsoft.AspNetCore.Mvc;
using HotelesAPI.DAO;
using HotelesAPI.Utils;

namespace HotelesAPI.Controllers
{
    [ApiController]
    [Route("api/monitor")]
    public class ApiMonitorController : ControllerBase
    {
        private readonly LogApiDAO _logApiDAO;

        public ApiMonitorController()
        {
            _logApiDAO = new LogApiDAO();
        }

        // GET api/monitor/logs
        [HttpGet("logs")]
        public IActionResult GetLogs([FromQuery] int top = 50)
        {
            try
            {
                var logs = _logApiDAO.GetAll(top);
                return Ok(JsonResponse.Ok("Logs obtenidos", logs));
            }
            catch (Exception ex)
            {
                return StatusCode(500, JsonResponse.Error(ex.Message));
            }
        }

        // GET api/monitor/errores
        [HttpGet("errores")]
        public IActionResult GetErrores()
        {
            try
            {
                var errores = _logApiDAO.GetErrores();
                return Ok(JsonResponse.Ok("Errores obtenidos", errores));
            }
            catch (Exception ex)
            {
                return StatusCode(500, JsonResponse.Error(ex.Message));
            }
        }

        // GET api/monitor/resumen
        [HttpGet("resumen")]
        public IActionResult GetResumen()
        {
            try
            {
                var resumen = _logApiDAO.GetResumen();
                return Ok(JsonResponse.Ok("Resumen obtenido", resumen));
            }
            catch (Exception ex)
            {
                return StatusCode(500, JsonResponse.Error(ex.Message));
            }
        }
    }
}