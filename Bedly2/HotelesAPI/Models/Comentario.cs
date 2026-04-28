namespace HotelesAPI.Models
{
    public class Comentario
    {
        public int IdComentario { get; set; }
        public int IdUsuario { get; set; }
        public string NombreUsuario { get; set; } = string.Empty;
        public int IdHabitacion { get; set; }
        public string NombreHabitacion { get; set; } = string.Empty;
        public string NombreHotel { get; set; } = string.Empty;
        public int Rating { get; set; }
        public string Texto { get; set; } = string.Empty;
        public DateTime FechaComentario { get; set; }
        public int? IdComentarioPadre { get; set; }
        public List<Comentario> Respuestas { get; set; } = new();
    }
}