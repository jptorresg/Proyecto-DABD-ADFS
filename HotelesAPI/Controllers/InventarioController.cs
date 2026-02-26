using Microsoft.AspNetCore.Mvc;
using HotelesAPI.DAO;
using HotelesAPI.Models;
using HotelesAPI.Utils;

namespace HotelesAPI.Controllers
{
    [ApiController]
    [Route("api/inventario")]
    public class InventarioController : ControllerBase
    {
        private readonly HabitacionDAO _habitacionDAO;

        public InventarioController()
        {
            _habitacionDAO = new HabitacionDAO();
        }

        // GET api/inventario
        [HttpGet]
        public IActionResult GetAll()
        {
            try
            {
                var habitaciones = _habitacionDAO.GetAllAdmin();
                return Ok(JsonResponse.Ok("Inventario obtenido", habitaciones));
            }
            catch (Exception ex)
            {
                return StatusCode(500, JsonResponse.Error(ex.Message));
            }
        }

        // POST api/inventario
        [HttpPost]
        public IActionResult Create([FromBody] Habitacion habitacion)
        {
            try
            {
                if (string.IsNullOrEmpty(habitacion.NumHabitacion))
                    return BadRequest(JsonResponse.Error("El número de habitación es requerido"));

                if (habitacion.PrecioNoche <= 0)
                    return BadRequest(JsonResponse.Error("El precio debe ser mayor a 0"));

                if (habitacion.CapacidadMax <= 0)
                    return BadRequest(JsonResponse.Error("La capacidad debe ser mayor a 0"));

                int id = _habitacionDAO.Create(habitacion);
                var creada = _habitacionDAO.GetById(id);
                return StatusCode(201, JsonResponse.Ok("Habitación creada exitosamente", creada));
            }
            catch (Exception ex)
            {
                return StatusCode(500, JsonResponse.Error(ex.Message));
            }
        }

        // PUT api/inventario/{id}
        [HttpPut("{id}")]
        public IActionResult Update(int id, [FromBody] Habitacion habitacion)
        {
            try
            {
                var existe = _habitacionDAO.GetById(id);
                if (existe == null)
                    return NotFound(JsonResponse.Error("Habitación no encontrada"));

                habitacion.IdHabitacion = id;
                bool actualizado = _habitacionDAO.Update(habitacion);

                if (!actualizado)
                    return StatusCode(500, JsonResponse.Error("No se pudo actualizar la habitación"));

                var actualizada = _habitacionDAO.GetById(id);
                return Ok(JsonResponse.Ok("Habitación actualizada exitosamente", actualizada));
            }
            catch (Exception ex)
            {
                return StatusCode(500, JsonResponse.Error(ex.Message));
            }
        }

        // DELETE api/inventario/{id}
        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            try
            {
                var existe = _habitacionDAO.GetById(id);
                if (existe == null)
                    return NotFound(JsonResponse.Error("Habitación no encontrada"));

                bool eliminado = _habitacionDAO.Delete(id);

                if (!eliminado)
                    return StatusCode(500, JsonResponse.Error("No se pudo eliminar la habitación"));

                return Ok(JsonResponse.Ok("Habitación desactivada exitosamente", null));
            }
            catch (Exception ex)
            {
                return StatusCode(500, JsonResponse.Error(ex.Message));
            }
        }
    }
}