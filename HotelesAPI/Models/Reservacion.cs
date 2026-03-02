namespace HotelesAPI.Models
{
    public class Reservacion
    {
        public int IdReservacion { get; set; }
        public int IdUsuario { get; set; }
        public int IdHabitacion { get; set; }
        public string NombreHabitacion { get; set; } = string.Empty;
        public string NombreHotel { get; set; } = string.Empty;
        public string NombreUsuario { get; set; } = string.Empty;
        public DateTime FechaCheckIn { get; set; }
        public DateTime FechaCheckOut { get; set; }
        public decimal PrecioTotal { get; set; }
        public string Estado { get; set; } = "Pendiente";
        public string MetodoPago { get; set; } = string.Empty;
        public DateTime FechaReservacion { get; set; }
        public int NumHuespedes { get; set; }
        public string? NotasEspeciales { get; set; }
    }
}