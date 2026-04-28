namespace HotelesAPI.Models
{
    public class LogApi
    {
        public int IdLog { get; set; }
        public string Metodo { get; set; } = string.Empty;
        public string Endpoint { get; set; } = string.Empty;
        public int StatusCode { get; set; }
        public string? RequestBody { get; set; }
        public string? ResponseBody { get; set; }
        public string? IpOrigen { get; set; }
        public string? AgenciaId { get; set; }
        public long TiempoMs { get; set; }
        public DateTime FechaHora { get; set; }
    }
}