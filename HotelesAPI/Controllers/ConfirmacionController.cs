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

                // Sesión 5: cargar huéspedes asociados
                var huespedDAO = new HuespedReservaDAO();
                var huespedes = huespedDAO.GetByReservacion(id);

                byte[] pdf = _pdfService.GenerarVoucher(reservacion, huespedes);
                return File(pdf, "application/pdf",
                    $"Voucher-Bedly-{reservacion.IdReservacion:D6}.pdf");
            }
            catch (Exception ex)
            {
                return StatusCode(500, JsonResponse.Error(ex.Message));
            }
        }

        // PUT api/confirmacion/{id}/checkin
        [HttpPut("{id}/checkin")]
        public IActionResult HacerCheckin(int id)
        {
            try
            {
                var reservacion = _reservacionDAO.GetById(id);
                if (reservacion == null)
                    return NotFound(JsonResponse.Error("Reservación no encontrada"));

                if (reservacion.Estado == "Cancelada")
                    return BadRequest(JsonResponse.Error("No se puede hacer check-in a una reservación cancelada"));

                if (reservacion.Estado == "Completada")
                    return BadRequest(JsonResponse.Error("Esta reservación ya fue completada"));

                _reservacionDAO.CambiarEstado(id, "Completada");

                return Ok(JsonResponse.Ok("Check-in realizado exitosamente", new
                {
                    idReservacion = id,
                    huesped = reservacion.NombreUsuario,
                    habitacion = reservacion.NombreHabitacion,
                    hotel = reservacion.NombreHotel,
                    checkIn = reservacion.FechaCheckIn,
                    checkOut = reservacion.FechaCheckOut,
                    estado = "Completada"
                }));
            }
            catch (Exception ex)
            {
                return StatusCode(500, JsonResponse.Error(ex.Message));
            }
        }
    }
}