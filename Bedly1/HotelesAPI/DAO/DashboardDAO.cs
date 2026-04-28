using Microsoft.Data.SqlClient;
using HotelesAPI.Config;
using HotelesAPI.DTOs;

namespace HotelesAPI.DAO
{
    public class DashboardDAO
    {
        public DashboardDto GetDashboard()
        {
            var dashboard = new DashboardDto();

            using var conn = DatabaseConfig.GetConnection();
            conn.Open();

            // Total habitaciones y estados
            using (var cmd = new SqlCommand(@"
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN estado = 'Disponible' THEN 1 ELSE 0 END) as disponibles,
                    SUM(CASE WHEN estado = 'Ocupada' THEN 1 ELSE 0 END) as ocupadas,
                    SUM(CASE WHEN estado = 'Mantenimiento' THEN 1 ELSE 0 END) as mantenimiento,
                    SUM(CASE WHEN estado = 'Inactiva' THEN 1 ELSE 0 END) as inactivas
                FROM Habitaciones", conn))
            {
                using var rs = cmd.ExecuteReader();
                if (rs.Read())
                {
                    dashboard.TotalHabitaciones = rs.GetInt32(rs.GetOrdinal("total"));
                    dashboard.HabitacionesDisponibles = rs.GetInt32(rs.GetOrdinal("disponibles"));
                    dashboard.HabitacionesOcupadas = rs.GetInt32(rs.GetOrdinal("ocupadas"));
                    dashboard.HabitacionesMantenimiento = rs.GetInt32(rs.GetOrdinal("mantenimiento"));
                    dashboard.HabitacionesInactivas = rs.GetInt32(rs.GetOrdinal("inactivas"));
                }
            }

            // Porcentaje de ocupación
            if (dashboard.TotalHabitaciones > 0)
                dashboard.PorcentajeOcupacion = Math.Round(
                    (double)dashboard.HabitacionesOcupadas / dashboard.TotalHabitaciones * 100, 1);

            // Total usuarios
            using (var cmd = new SqlCommand("SELECT COUNT(*) FROM Usuario", conn))
            {
                dashboard.TotalUsuarios = Convert.ToInt32(cmd.ExecuteScalar());
            }

            // Total reservas e ingresos totales
            using (var cmd = new SqlCommand(@"
                SELECT COUNT(*) as total, ISNULL(SUM(precio_total), 0) as ingresos
                FROM Reservaciones WHERE estado != 'Cancelada'", conn))
            {
                using var rs = cmd.ExecuteReader();
                if (rs.Read())
                {
                    dashboard.TotalReservas = rs.GetInt32(rs.GetOrdinal("total"));
                    dashboard.IngresoTotal = rs.GetDecimal(rs.GetOrdinal("ingresos"));
                }
            }

            // Reservaciones hoy
            using (var cmd = new SqlCommand(@"
                SELECT COUNT(*) FROM Reservaciones
                WHERE CAST(fecha_reservacion AS DATE) = CAST(GETDATE() AS DATE)
                AND estado != 'Cancelada'", conn))
            {
                dashboard.ReservacionesHoy = Convert.ToInt32(cmd.ExecuteScalar());
            }

            // Reservaciones e ingresos del mes
            using (var cmd = new SqlCommand(@"
                SELECT COUNT(*) as reservaciones, ISNULL(SUM(precio_total), 0) as ingresos
                FROM Reservaciones
                WHERE MONTH(fecha_reservacion) = MONTH(GETDATE())
                AND YEAR(fecha_reservacion) = YEAR(GETDATE())
                AND estado != 'Cancelada'", conn))
            {
                using var rs = cmd.ExecuteReader();
                if (rs.Read())
                {
                    dashboard.ReservacionesMes = rs.GetInt32(rs.GetOrdinal("reservaciones"));
                    dashboard.IngresosMes = rs.GetDecimal(rs.GetOrdinal("ingresos"));
                }
            }

            // Ingresos totales
            using (var cmd = new SqlCommand(@"
                SELECT ISNULL(SUM(precio_total), 0) FROM Reservaciones
                WHERE estado != 'Cancelada'", conn))
            {
                dashboard.IngresosTotales = Convert.ToDecimal(cmd.ExecuteScalar());
            }

            // Estadísticas últimos 6 meses
            using (var cmd = new SqlCommand(@"
                SELECT 
                    FORMAT(fecha_reservacion, 'MMM yyyy') as mes,
                    COUNT(*) as reservaciones,
                    ISNULL(SUM(precio_total), 0) as ingresos
                FROM Reservaciones
                WHERE fecha_reservacion >= DATEADD(MONTH, -6, GETDATE())
                AND estado != 'Cancelada'
                GROUP BY FORMAT(fecha_reservacion, 'MMM yyyy'), 
                         YEAR(fecha_reservacion), MONTH(fecha_reservacion)
                ORDER BY YEAR(fecha_reservacion), MONTH(fecha_reservacion)", conn))
            {
                using var rs = cmd.ExecuteReader();
                while (rs.Read())
                {
                    dashboard.EstadisticasMensuales.Add(new EstadisticaMensual
                    {
                        Mes = rs.GetString(rs.GetOrdinal("mes")),
                        Reservaciones = rs.GetInt32(rs.GetOrdinal("reservaciones")),
                        Ingresos = rs.GetDecimal(rs.GetOrdinal("ingresos"))
                    });
                }
            }

            // Reservaciones recientes
            using (var cmd = new SqlCommand(@"
                SELECT TOP 5
                    r.id_reservacion,
                    u.nombre as nombre_usuario,
                    h.tipo_habitacion + ' ' + h.num_habitacion as habitacion,
                    ho.nombre_hotel,
                    r.fecha_check_in,
                    r.precio_total,
                    r.estado
                FROM Reservaciones r
                INNER JOIN Usuario u ON r.id_usuario = u.id_usuario
                INNER JOIN Habitaciones h ON r.id_habitacion = h.id_habitacion
                INNER JOIN Hoteles ho ON h.id_hotel = ho.id_hotel
                ORDER BY r.fecha_reservacion DESC", conn))
            {
                using var rs = cmd.ExecuteReader();
                while (rs.Read())
                {
                    dashboard.ReservacionesRecientes.Add(new ReservacionReciente
                    {
                        IdReservacion = rs.GetInt32(rs.GetOrdinal("id_reservacion")),
                        NombreUsuario = rs.GetString(rs.GetOrdinal("nombre_usuario")),
                        Habitacion = rs.GetString(rs.GetOrdinal("habitacion")),
                        Hotel = rs.GetString(rs.GetOrdinal("nombre_hotel")),
                        FechaCheckIn = rs.GetDateTime(rs.GetOrdinal("fecha_check_in")),
                        PrecioTotal = rs.GetDecimal(rs.GetOrdinal("precio_total")),
                        Estado = rs.GetString(rs.GetOrdinal("estado"))
                    });
                }
            }

            return dashboard;
        }
    }
}