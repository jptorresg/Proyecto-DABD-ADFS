namespace HotelesAPI.DTOs
{
    public class ReservacionB2BDto
    {
        public int IdHabitacion { get; set; }
        public int IdUsuario { get; set; }
        public DateTime FechaCheckIn { get; set; }
        public DateTime FechaCheckOut { get; set; }
        public int NumHuespedes { get; set; } = 1;
        public string? MetodoPago { get; set; }
        public string? NotasEspeciales { get; set; }
    }
}