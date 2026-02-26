using Microsoft.AspNetCore.Mvc;
using HotelesAPI.DAO;
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
    }
}