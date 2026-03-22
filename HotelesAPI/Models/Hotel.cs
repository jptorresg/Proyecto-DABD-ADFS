namespace HotelesAPI.Models
{
    public class Hotel
    {
        public int IdHotel { get; set; }
        public string NombreHotel { get; set; } = string.Empty;
        public string? Ubicacion { get; set; }
        public int Estrellas { get; set; }
    }
}