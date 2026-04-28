namespace HotelesAPI.Models
{
    public class Cupon
    {
        public int IdCupon { get; set; }
        public string Codigo { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public string TipoDescuento { get; set; } = string.Empty;
        public decimal ValorDescuento { get; set; }
        public DateTime FechaInicio { get; set; }
        public DateTime FechaFin { get; set; }
        public int UsosMaximos { get; set; }
        public int UsosActuales { get; set; }
        public bool Activo { get; set; }
        public DateTime FechaCreacion { get; set; }
    }
}