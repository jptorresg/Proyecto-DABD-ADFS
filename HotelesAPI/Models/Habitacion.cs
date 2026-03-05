namespace HotelesAPI.Models
{
    public class Habitacion
    {
        public int IdHabitacion { get; set; }
        public int IdHotel { get; set; }
        public string NombreHotel { get; set; } = string.Empty;
        public string NumHabitacion { get; set; } = string.Empty;
        public string TipoHabitacion { get; set; } = string.Empty;
        public decimal PrecioNoche { get; set; }
        public int CapacidadMax { get; set; }
        public string Estado { get; set; } = "Disponible";
        public string Ubicacion { get; set; } = string.Empty;
        public int Estrellas { get; set; }
        public string Amenidades { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public string? ImagenUrl { get; set; }
    }
}