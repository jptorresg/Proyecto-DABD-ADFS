namespace HotelesAPI.DTOs
{
    public class DashboardDto
    {
        public int TotalHabitaciones { get; set; }
        public int HabitacionesDisponibles { get; set; }
        public int HabitacionesOcupadas { get; set; }
        public int ReservacionesHoy { get; set; }
        public int ReservacionesMes { get; set; }
        public decimal IngresosMes { get; set; }
        public decimal IngresosTotales { get; set; }
        public double PorcentajeOcupacion { get; set; }
        public List<EstadisticaMensual> EstadisticasMensuales { get; set; } = new();
        public List<ReservacionReciente> ReservacionesRecientes { get; set; } = new();
    }

    public class EstadisticaMensual
    {
        public string Mes { get; set; } = string.Empty;
        public int Reservaciones { get; set; }
        public decimal Ingresos { get; set; }
    }

    public class ReservacionReciente
    {
        public int IdReservacion { get; set; }
        public string NombreUsuario { get; set; } = string.Empty;
        public string Habitacion { get; set; } = string.Empty;
        public string Hotel { get; set; } = string.Empty;
        public DateTime FechaCheckIn { get; set; }
        public decimal PrecioTotal { get; set; }
        public string Estado { get; set; } = string.Empty;
    }
}