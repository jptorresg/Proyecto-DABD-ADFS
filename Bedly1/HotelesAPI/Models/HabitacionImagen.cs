namespace HotelesAPI.Models
{
    public class HabitacionImagen
    {
        public int IdImagen { get; set; }
        public int IdHabitacion { get; set; }
        public string Url { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public bool EsPrincipal { get; set; }
        public int Orden { get; set; }
        public DateTime FechaRegistro { get; set; }
    }
}