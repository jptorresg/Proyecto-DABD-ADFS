namespace HotelesAPI.DTOs
{
    public class AuthResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public int IdUsuario { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Rol { get; set; } = string.Empty;
    }
}