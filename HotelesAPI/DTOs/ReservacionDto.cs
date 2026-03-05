namespace HotelesAPI.DTOs
{
    public class ReservacionDto
    {
        public int IdUsuario { get; set; }
        public int IdHabitacion { get; set; }
        public DateTime FechaCheckIn { get; set; }
        public DateTime FechaCheckOut { get; set; }
        public string MetodoPago { get; set; } = string.Empty;
        public int NumHuespedes { get; set; }
        public string? NotasEspeciales { get; set; }
        public string? Nit { get; set; }
        public string? CodigoCupon { get; set; }
        public decimal? DescuentoAplicado { get; set; }
    }
}