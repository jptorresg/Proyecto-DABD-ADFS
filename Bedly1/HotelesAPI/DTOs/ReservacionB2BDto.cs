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

        // Lista opcional de huéspedes. Si la agencia no la envía,
        // la reserva queda registrada con solo NumHuespedes (comportamiento previo).
        public List<HuespedB2BDto>? Huespedes { get; set; }
    }

    public class HuespedB2BDto
    {
        public string Nombre { get; set; } = string.Empty;
        public string Apellidos { get; set; } = string.Empty;
        public int Edad { get; set; }
        public string TipoDocumento { get; set; } = "DPI";
        public string Documento { get; set; } = string.Empty;
        public string Nacionalidad { get; set; } = string.Empty;
        public bool EsTitular { get; set; }
    }
}
