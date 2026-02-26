namespace HotelesAPI.DTOs
{
    public class ComentarioDto
    {
        public int IdUsuario { get; set; }
        public int IdHabitacion { get; set; }
        public int Rating { get; set; }
        public string Texto { get; set; } = string.Empty;
    }
}