using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using HotelesAPI.Config;
using HotelesAPI.Utils;

namespace HotelesAPI.Controllers
{
    /// <summary>
    /// Controlador público de catálogo. Expone webservices REST informativos
    /// que pueden consumir agencias de viajes y otros sistemas externos.
    /// No requiere autenticación.
    /// </summary>
    [ApiController]
    [Route("api/catalogo")]
    public class CatalogoController : ControllerBase
    {
        /// <summary>
        /// Retorna las ciudades en las que opera la cadena junto con los hoteles disponibles en cada una.
        /// Webservice público requerido por el módulo de integración con agencias de viajes.
        /// </summary>
        [HttpGet("ciudades-hoteles")]
        public IActionResult GetCiudadesHoteles()
        {
            try
            {
                var resultado = new Dictionary<string, List<object>>();

                string sql = @"SELECT id_hotel, nombre_hotel, ubicacion, estrellas
                              FROM Hoteles
                              WHERE ubicacion IS NOT NULL AND ubicacion != ''
                              ORDER BY ubicacion, nombre_hotel";

                using var conn = DatabaseConfig.GetConnection();
                conn.Open();
                using var cmd = new SqlCommand(sql, conn);
                using var rs = cmd.ExecuteReader();

                while (rs.Read())
                {
                    string ciudad = rs.GetString(rs.GetOrdinal("ubicacion"));
                    if (!resultado.ContainsKey(ciudad))
                        resultado[ciudad] = new List<object>();

                    resultado[ciudad].Add(new
                    {
                        idHotel     = rs.GetInt32(rs.GetOrdinal("id_hotel")),
                        nombreHotel = rs.GetString(rs.GetOrdinal("nombre_hotel")),
                        estrellas   = rs.IsDBNull(rs.GetOrdinal("estrellas")) ? 0 : rs.GetInt32(rs.GetOrdinal("estrellas"))
                    });
                }

                var data = resultado.Select(kvp => new
                {
                    ciudad   = kvp.Key,
                    hoteles  = kvp.Value
                }).ToList();

                return Ok(JsonResponse.Ok("Catálogo de ciudades y hoteles obtenido", new
                {
                    totalCiudades = data.Count,
                    totalHoteles  = data.Sum(c => c.hoteles.Count),
                    cadena        = "Bedly Hoteles",
                    catalogo      = data
                }));
            }
            catch (Exception ex)
            {
                return StatusCode(500, JsonResponse.Error(ex.Message));
            }
        }

        /// <summary>
        /// Retorna solo la lista de ciudades en las que opera la cadena.
        /// </summary>
        [HttpGet("ciudades")]
        public IActionResult GetCiudades()
        {
            try
            {
                var ciudades = new List<string>();
                string sql = @"SELECT DISTINCT ubicacion FROM Hoteles
                              WHERE ubicacion IS NOT NULL AND ubicacion != ''
                              ORDER BY ubicacion";

                using var conn = DatabaseConfig.GetConnection();
                conn.Open();
                using var cmd = new SqlCommand(sql, conn);
                using var rs = cmd.ExecuteReader();
                while (rs.Read())
                    ciudades.Add(rs.GetString(0));

                return Ok(JsonResponse.Ok("Ciudades obtenidas", ciudades));
            }
            catch (Exception ex)
            {
                return StatusCode(500, JsonResponse.Error(ex.Message));
            }
        }

        /// <summary>
        /// Retorna el catálogo de nacionalidades aceptadas por el sistema.
        /// Webservice público utilizado en formularios de registro y reservación.
        /// </summary>
        [HttpGet("nacionalidades")]
        public IActionResult GetNacionalidades()
        {
            var nacionalidades = new List<object>
            {
                new { codigo = "GT", nombre = "Guatemala" },
                new { codigo = "MX", nombre = "México" },
                new { codigo = "US", nombre = "Estados Unidos" },
                new { codigo = "CA", nombre = "Canadá" },
                new { codigo = "HN", nombre = "Honduras" },
                new { codigo = "SV", nombre = "El Salvador" },
                new { codigo = "NI", nombre = "Nicaragua" },
                new { codigo = "CR", nombre = "Costa Rica" },
                new { codigo = "PA", nombre = "Panamá" },
                new { codigo = "BZ", nombre = "Belice" },
                new { codigo = "CO", nombre = "Colombia" },
                new { codigo = "VE", nombre = "Venezuela" },
                new { codigo = "EC", nombre = "Ecuador" },
                new { codigo = "PE", nombre = "Perú" },
                new { codigo = "BO", nombre = "Bolivia" },
                new { codigo = "CL", nombre = "Chile" },
                new { codigo = "AR", nombre = "Argentina" },
                new { codigo = "UY", nombre = "Uruguay" },
                new { codigo = "PY", nombre = "Paraguay" },
                new { codigo = "BR", nombre = "Brasil" },
                new { codigo = "ES", nombre = "España" },
                new { codigo = "FR", nombre = "Francia" },
                new { codigo = "DE", nombre = "Alemania" },
                new { codigo = "IT", nombre = "Italia" },
                new { codigo = "GB", nombre = "Reino Unido" },
                new { codigo = "PT", nombre = "Portugal" },
                new { codigo = "NL", nombre = "Países Bajos" },
                new { codigo = "JP", nombre = "Japón" },
                new { codigo = "CN", nombre = "China" },
                new { codigo = "KR", nombre = "Corea del Sur" },
                new { codigo = "IN", nombre = "India" },
                new { codigo = "AU", nombre = "Australia" },
                new { codigo = "OTHER", nombre = "Otro" }
            };

            return Ok(JsonResponse.Ok("Nacionalidades obtenidas", new
            {
                total          = nacionalidades.Count,
                nacionalidades
            }));
        }
    }
}