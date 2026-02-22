namespace HotelesAPI.Models
{
    public class Usuario
    {
        public int IdUsuario { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? PasswordHash { get; set; }
        public string Telefono { get; set; } = string.Empty;
        public string Rol { get; set; } = "cliente";
        public bool Activo { get; set; } = true;
        public DateTime FechaRegistro { get; set; }
    }
}