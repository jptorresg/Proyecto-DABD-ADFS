namespace HotelesAPI.Services
{
    public class ReservacionValidator
    {
        public static void ValidarFechas(DateTime checkIn, DateTime checkOut)
        {
            if (checkIn < DateTime.Today)
                throw new ArgumentException("La fecha de check-in no puede ser en el pasado");

            if (checkIn >= checkOut)
                throw new ArgumentException("La fecha de check-out debe ser posterior al check-in");
        }

        public static void ValidarCapacidad(int numHuespedes, int capacidadMax)
        {
            if (numHuespedes <= 0)
                throw new ArgumentException("El número de huéspedes debe ser mayor a 0");

            if (numHuespedes > capacidadMax)
                throw new ArgumentException($"La habitación tiene capacidad máxima de {capacidadMax} huéspedes");
        }

        public static decimal CalcularPrecioTotal(DateTime checkIn, DateTime checkOut, decimal precioNoche)
        {
            if (precioNoche <= 0)
                throw new ArgumentException("El precio por noche debe ser mayor a 0");

            int noches = (checkOut - checkIn).Days;
            return precioNoche * noches;
        }

        public static void ValidarCancelacion(string estado, DateTime fechaCheckIn)
        {
            if (estado == "Cancelada")
                throw new ArgumentException("La reservación ya está cancelada");

            if (fechaCheckIn <= DateTime.Now.AddHours(24))
                throw new ArgumentException("Solo se puede cancelar hasta 24 horas antes del check-in");
        }

        public static void ValidarModificacion(string estado, DateTime checkIn, DateTime checkOut)
        {
            if (estado == "Cancelada" || estado == "Completada")
                throw new ArgumentException("No se puede modificar una reservación cancelada o completada");

            if (checkIn >= checkOut)
                throw new ArgumentException("La fecha de check-in debe ser anterior al check-out");
        }
    }
}