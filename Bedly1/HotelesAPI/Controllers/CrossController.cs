using Microsoft.AspNetCore.Mvc;
using System.Net;
using System.Text;
using HotelesAPI.Utils;

namespace HotelesAPI.Controllers
{
    /// <summary>
    /// Integración cruzada: el hotel consume la API B2B de la aerolínea como
    /// si fuera una agencia más. El frontend público de Bedly llama a estos
    /// endpoints; este controlador reenvía la petición al backend de
    /// aerolínea inyectando el token Bearer guardado en appsettings.json
    /// (Cross:Aerolinea:Token) para que las credenciales nunca lleguen al
    /// navegador.
    /// </summary>
    [ApiController]
    [Route("api/cross")]
    public class CrossController : ControllerBase
    {
        private static readonly HttpClient _http = new HttpClient
        {
            Timeout = TimeSpan.FromSeconds(20)
        };

        private readonly string _endpoint;
        private readonly string _token;

        public CrossController(IConfiguration config)
        {
            _endpoint = (config["Cross:Aerolinea:Endpoint"] ?? "http://localhost:8080/aerolineas").TrimEnd('/');
            _token    = config["Cross:Aerolinea:Token"]    ?? "";
        }

        // GET api/cross/vuelos?origen=GUA&destino=MIA&fechaSalida=2026-03-20&fechaRegreso=2026-03-25
        [HttpGet("vuelos")]
        public async Task<IActionResult> BuscarVuelos()
        {
            var qs = Request.QueryString.HasValue ? Request.QueryString.Value : "";
            return await Forward(HttpMethod.Get, "/api/b2b/vuelos" + qs, body: null);
        }

        // GET api/cross/vuelos/{id}
        [HttpGet("vuelos/{id}")]
        public async Task<IActionResult> DetalleVuelo(string id)
        {
            return await Forward(HttpMethod.Get, $"/api/b2b/vuelos/{id}", body: null);
        }

        // GET api/cross/paises
        [HttpGet("paises")]
        public async Task<IActionResult> Paises()
        {
            return await Forward(HttpMethod.Get, "/api/b2b/paises", body: null);
        }

        // POST api/cross/vuelos/reservar
        [HttpPost("vuelos/reservar")]
        public async Task<IActionResult> ReservarVuelo()
        {
            using var sr = new StreamReader(Request.Body);
            var body = await sr.ReadToEndAsync();
            return await Forward(HttpMethod.Post, "/api/b2b/reservaciones", body);
        }

        // PUT api/cross/vuelos/{id}/cancelar
        [HttpPut("vuelos/{id}/cancelar")]
        public async Task<IActionResult> CancelarVuelo(string id)
        {
            return await Forward(HttpMethod.Put, $"/api/b2b/reservaciones/{id}/cancelar", body: null);
        }

        private async Task<IActionResult> Forward(HttpMethod method, string path, string? body)
        {
            try
            {
                var req = new HttpRequestMessage(method, _endpoint + path);
                req.Headers.Add("Authorization", "Bearer " + _token);
                req.Headers.Add("Accept", "application/json");
                if (body != null)
                {
                    req.Content = new StringContent(body, Encoding.UTF8, "application/json");
                }
                var resp = await _http.SendAsync(req);
                var content = await resp.Content.ReadAsStringAsync();
                return new ContentResult
                {
                    Content     = content,
                    ContentType = "application/json",
                    StatusCode  = (int)resp.StatusCode
                };
            }
            catch (Exception ex)
            {
                return StatusCode((int)HttpStatusCode.BadGateway,
                    JsonResponse.Error("Error consultando partner: " + ex.Message));
            }
        }
    }
}
