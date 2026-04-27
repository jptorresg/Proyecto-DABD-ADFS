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

        // Sesión 5: Lista opcional de huéspedes (para reservas de cliente final)
        public List<HuespedDto>? Huespedes { get; set; }
    }

    public class HuespedDto
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