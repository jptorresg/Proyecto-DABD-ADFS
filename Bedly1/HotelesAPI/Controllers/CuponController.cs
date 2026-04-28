using Microsoft.AspNetCore.Mvc;
using HotelesAPI.DAO;
using HotelesAPI.Models;
using HotelesAPI.Utils;

namespace HotelesAPI.Controllers
{
    [ApiController]
    [Route("api/cupones")]
    public class CuponController : ControllerBase
    {
        private readonly CuponDAO _cuponDAO;

        public CuponController()
        {
            _cuponDAO = new CuponDAO();
        }

        // GET api/cupones/validar/{codigo}
        [HttpGet("validar/{codigo}")]
        public IActionResult Validar(string codigo, [FromQuery] decimal subtotal)
        {
            try
            {
                var cupon = _cuponDAO.ValidarCupon(codigo);
                if (cupon == null)
                    return NotFound(JsonResponse.Error("Cupón inválido, expirado o agotado"));

                decimal descuento = _cuponDAO.CalcularDescuento(cupon, subtotal);

                return Ok(JsonResponse.Ok("Cupón válido", new
                {
                    codigo = cupon.Codigo,
                    descripcion = cupon.Descripcion,
                    tipoDescuento = cupon.TipoDescuento,
                    valorDescuento = cupon.ValorDescuento,
                    descuentoAplicado = descuento,
                    nuevoTotal = Math.Max(0, subtotal - descuento)
                }));
            }
            catch (Exception ex)
            {
                return StatusCode(500, JsonResponse.Error(ex.Message));
            }
        }
    }
}