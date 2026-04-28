namespace HotelesAPI.Models
{
    public class HuespedReserva
    {
        public int IdHuesped { get; set; }
        public int IdReservacion { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Apellidos { get; set; } = string.Empty;
        public int Edad { get; set; }
        public string TipoDocumento { get; set; } = string.Empty;
        public string Documento { get; set; } = string.Empty;
        public string Nacionalidad { get; set; } = string.Empty;
        public bool EsTitular { get; set; }
        public DateTime FechaRegistro { get; set; }
    }
}