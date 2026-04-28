namespace HotelesAPI.DTOs
{
    public class RegistroDto
    {
        public string Nombre { get; set; } = string.Empty;
        public string Apellidos { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Telefono { get; set; } = string.Empty;
        public int Edad { get; set; }
        public string Pais { get; set; } = string.Empty;
        public string Pasaporte { get; set; } = string.Empty;
        public string Rol { get; set; } = "cliente";
    }
}