namespace HotelesAPI.Models
{
    public class Hotel
    {
        public int IdHotel { get; set; }
        public string NombreHotel { get; set; } = string.Empty;
        public string? Ubicacion { get; set; }
        public string Ciudad { get; set; } = string.Empty;
        public string Pais { get; set; } = "Guatemala";
        public int Estrellas { get; set; }
    }
}