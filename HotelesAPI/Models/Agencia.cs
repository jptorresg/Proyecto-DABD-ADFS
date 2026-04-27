namespace HotelesAPI.Models
{
    public class Agencia
    {
        public int IdAgencia { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Token { get; set; } = string.Empty;
        public decimal PorcentajeDescuento { get; set; }
        public bool Activo { get; set; }
        public DateTime FechaRegistro { get; set; }
    }
}