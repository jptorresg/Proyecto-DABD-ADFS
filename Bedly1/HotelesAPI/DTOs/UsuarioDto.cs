namespace HotelesAPI.DTOs
{
    public class UsuarioDto
    {
        public string Nombre { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Telefono { get; set; } = string.Empty;
    }

    public class CambiarPasswordDto
    {
        public string PasswordActual { get; set; } = string.Empty;
        public string PasswordNuevo { get; set; } = string.Empty;
    }
}