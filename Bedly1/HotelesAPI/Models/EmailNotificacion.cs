namespace HotelesAPI.Models
{
    public class EmailNotificacion
    {
        public int IdEmail { get; set; }
        public string Destinatario { get; set; } = string.Empty;
        public string Asunto { get; set; } = string.Empty;
        public string Cuerpo { get; set; } = string.Empty;
        public string TipoEvento { get; set; } = string.Empty;
        public bool Enviado { get; set; } = true;
        public DateTime FechaEnvio { get; set; }
        public string? Metadata { get; set; }
    }
}