using Microsoft.AspNetCore.Mvc;
using HotelesAPI.DAO;
using HotelesAPI.Services;
using HotelesAPI.Utils;

namespace HotelesAPI.Controllers
{
    [ApiController]
    [Route("api/confirmacion")]
    public class ConfirmacionController : ControllerBase
    {
        private readonly ReservacionDAO _reservacionDAO;
        private readonly PdfService _pdfService;

        public ConfirmacionController()
        {
            _reservacionDAO = new ReservacionDAO();
            _pdfService = new PdfService();
        }

        // GET api/confirmacion/{id}
        [HttpGet("{id}")]
        public IActionResult GetConfirmacion(int id)
        {
            try
            {
                var reservacion = _reservacionDAO.GetById(id);
                if (reservacion == null)
                    return NotFound(JsonResponse.Error("Reservación no encontrada"));

                return Ok(JsonResponse.Ok("Confirmación obtenida", reservacion));
            }
            catch (Exception ex)
            {
                return StatusCode(500, JsonResponse.Error(ex.Message));
            }
        }

        // GET api/confirmacion/{id}/pdf
        [HttpGet("{id}/pdf")]
        public IActionResult DescargarPdf(int id)
        {
            try
            {
                var reservacion = _reservacionDAO.GetById(id);
                if (reservacion == null)
                    return NotFound(JsonResponse.Error("Reservación no encontrada"));

                byte[] pdf = _pdfService.GenerarVoucher(reservacion);

                return File(pdf, "application/pdf",
                    $"Voucher-Bedly-{reservacion.IdReservacion:D6}.pdf");
            }
            catch (Exception ex)
            {
                return StatusCode(500, JsonResponse.Error(ex.Message));
            }
        }
    }
}