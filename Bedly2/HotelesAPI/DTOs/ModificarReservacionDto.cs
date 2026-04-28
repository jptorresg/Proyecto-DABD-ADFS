namespace HotelesAPI.DTOs
{
    public class ModificarReservacionDto
    {
        public DateTime FechaCheckIn { get; set; }
        public DateTime FechaCheckOut { get; set; }
        public int NumHuespedes { get; set; }
        public decimal PrecioTotal { get; set; }
    }
}