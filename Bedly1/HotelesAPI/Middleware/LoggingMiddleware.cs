using HotelesAPI.DAO;
using HotelesAPI.Models;
using System.Diagnostics;
using System.Text;

namespace HotelesAPI.Middleware
{
    public class LoggingMiddleware
    {
        private readonly RequestDelegate _next;

        public LoggingMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Solo loguea endpoints /api/* (ignora swagger, archivos estáticos, etc.)
            if (!context.Request.Path.StartsWithSegments("/api"))
            {
                await _next(context);
                return;
            }

            var stopwatch = Stopwatch.StartNew();
            string requestBody = "";

            // Leer body del request si existe
            try
            {
                if (context.Request.ContentLength > 0 && context.Request.ContentLength < 10000)
                {
                    context.Request.EnableBuffering();
                    using var reader = new StreamReader(context.Request.Body, Encoding.UTF8, leaveOpen: true);
                    requestBody = await reader.ReadToEndAsync();
                    context.Request.Body.Position = 0;
                }
            }
            catch { /* ignorar errores al leer body */ }

            // Capturar response body
            var originalBodyStream = context.Response.Body;
            using var responseStream = new MemoryStream();
            context.Response.Body = responseStream;

            string responseBody = "";
            int statusCode = 200;

            try
            {
                await _next(context);
                statusCode = context.Response.StatusCode;

                responseStream.Seek(0, SeekOrigin.Begin);
                if (responseStream.Length > 0 && responseStream.Length < 10000)
                {
                    responseBody = await new StreamReader(responseStream).ReadToEndAsync();
                }
                responseStream.Seek(0, SeekOrigin.Begin);
                await responseStream.CopyToAsync(originalBodyStream);
            }
            catch (Exception ex)
            {
                statusCode = 500;
                responseBody = ex.Message;
                throw;
            }
            finally
            {
                stopwatch.Stop();
                context.Response.Body = originalBodyStream;

                // Sanitizar passwords del request body
                if (!string.IsNullOrEmpty(requestBody) && requestBody.Contains("password", StringComparison.OrdinalIgnoreCase))
                {
                    requestBody = System.Text.RegularExpressions.Regex.Replace(
                        requestBody,
                        "\"password\"\\s*:\\s*\"[^\"]*\"",
                        "\"password\":\"***\"",
                        System.Text.RegularExpressions.RegexOptions.IgnoreCase);
                }

                // Truncar bodies si son muy largos
                if (requestBody.Length > 4000) requestBody = requestBody.Substring(0, 4000) + "...[truncado]";
                if (responseBody.Length > 4000) responseBody = responseBody.Substring(0, 4000) + "...[truncado]";

                try
                {
                    var log = new LogApi
                    {
                        Metodo = context.Request.Method,
                        Endpoint = context.Request.Path + context.Request.QueryString,
                        StatusCode = statusCode,
                        RequestBody = string.IsNullOrEmpty(requestBody) ? null : requestBody,
                        ResponseBody = string.IsNullOrEmpty(responseBody) ? null : responseBody,
                        IpOrigen = context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                        AgenciaId = context.Request.Headers["X-Agencia-Id"].FirstOrDefault(),
                        TiempoMs = stopwatch.ElapsedMilliseconds
                    };

                    var logDAO = new LogApiDAO();
                    logDAO.Registrar(log);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[LoggingMiddleware] Error guardando log: {ex.Message}");
                }
            }
        }
    }
}