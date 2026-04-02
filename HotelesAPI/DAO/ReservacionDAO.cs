using Microsoft.Data.SqlClient;
using HotelesAPI.Config;
using HotelesAPI.Models;

namespace HotelesAPI.DAO
{
    /// <summary>
    /// Objeto de Acceso a Datos (DAO) para la gestión de reservaciones en SQL Server.
    /// Implementa todas las operaciones CRUD sobre la tabla Reservaciones de BedlyHoteles.
    /// </summary>
    public class ReservacionDAO
    {
        /// <summary>
        /// Obtiene todas las reservaciones de un usuario ordenadas por fecha de reservación.
        /// </summary>
        /// <param name="idUsuario">ID del usuario cuyas reservaciones se desean obtener.</param>
        /// <returns>Lista de reservaciones del usuario con datos de habitación y hotel.</returns>
        public List<Reservacion> GetByUsuario(int idUsuario)
        {
            var lista = new List<Reservacion>();
            string sql = @"SELECT r.*, h.tipo_habitacion, h.num_habitacion,
                          ho.nombre_hotel
                          FROM Reservaciones r
                          INNER JOIN Habitaciones h ON r.id_habitacion = h.id_habitacion
                          INNER JOIN Hoteles ho ON h.id_hotel = ho.id_hotel
                          WHERE r.id_usuario = @idUsuario
                          ORDER BY r.fecha_reservacion DESC";

            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@idUsuario", idUsuario);
            using var rs = cmd.ExecuteReader();
            while (rs.Read())
                lista.Add(MapReservacion(rs));

            return lista;
        }

        /// <summary>
        /// Obtiene una reservación específica por su ID incluyendo datos de habitación y hotel.
        /// </summary>
        /// <param name="id">ID de la reservación a buscar.</param>
        /// <returns>La reservación encontrada o null si no existe.</returns>
        public Reservacion? GetById(int id)
        {
            string sql = @"SELECT r.*, h.tipo_habitacion, h.num_habitacion,
                          ho.nombre_hotel
                          FROM Reservaciones r
                          INNER JOIN Habitaciones h ON r.id_habitacion = h.id_habitacion
                          INNER JOIN Hoteles ho ON h.id_hotel = ho.id_hotel
                          WHERE r.id_reservacion = @id";

            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@id", id);
            using var rs = cmd.ExecuteReader();

            if (rs.Read())
                return MapReservacion(rs);

            return null;
        }

        /// <summary>
        /// Verifica si existe un conflicto de fechas para una habitación específica.
        /// Utilizado para prevenir el overbooking en el sistema.
        /// </summary>
        /// <param name="idHabitacion">ID de la habitación a verificar.</param>
        /// <param name="checkIn">Fecha de entrada propuesta.</param>
        /// <param name="checkOut">Fecha de salida propuesta.</param>
        /// <param name="excluirId">ID de reservación a excluir de la verificación (para modificaciones).</param>
        /// <returns>True si existe conflicto de fechas, False si la habitación está disponible.</returns>
        public bool ExisteConflicto(int idHabitacion, DateTime checkIn, DateTime checkOut, int? excluirId = null)
        {
            string sql = @"SELECT COUNT(*) FROM Reservaciones
                          WHERE id_habitacion = @idHabitacion
                          AND estado NOT IN ('Cancelada')
                          AND NOT (@checkOut <= fecha_check_in 
                               OR @checkIn >= fecha_check_out)";

            if (excluirId.HasValue)
                sql += " AND id_reservacion != @excluirId";

            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@idHabitacion", idHabitacion);
            cmd.Parameters.AddWithValue("@checkIn", checkIn);
            cmd.Parameters.AddWithValue("@checkOut", checkOut);

            if (excluirId.HasValue)
                cmd.Parameters.AddWithValue("@excluirId", excluirId.Value);

            return Convert.ToInt32(cmd.ExecuteScalar()) > 0;
        }

        /// <summary>
        /// Crea una nueva reservación en la base de datos.
        /// </summary>
        /// <param name="reservacion">Objeto con los datos de la reservación a crear.</param>
        /// <returns>ID de la reservación creada en la base de datos.</returns>
        public int Create(Reservacion reservacion)
        {
            string sql = @"INSERT INTO Reservaciones
                          (id_usuario, id_habitacion, fecha_check_in, fecha_check_out,
                           precio_total, estado, metodo_pago, fecha_reservacion,
                           num_huespedes, notas_especiales)
                          VALUES (@idUsuario, @idHabitacion, @checkIn, @checkOut,
                                  @precioTotal, @estado, @metodoPago, GETDATE(),
                                  @numHuespedes, @notas);
                          SELECT SCOPE_IDENTITY();";

            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@idUsuario", reservacion.IdUsuario);
            cmd.Parameters.AddWithValue("@idHabitacion", reservacion.IdHabitacion);
            cmd.Parameters.AddWithValue("@checkIn", reservacion.FechaCheckIn);
            cmd.Parameters.AddWithValue("@checkOut", reservacion.FechaCheckOut);
            cmd.Parameters.AddWithValue("@precioTotal", reservacion.PrecioTotal);
            cmd.Parameters.AddWithValue("@estado", reservacion.Estado);
            cmd.Parameters.AddWithValue("@metodoPago", reservacion.MetodoPago);
            cmd.Parameters.AddWithValue("@numHuespedes", reservacion.NumHuespedes);
            cmd.Parameters.AddWithValue("@notas", (object?)reservacion.NotasEspeciales ?? DBNull.Value);

            var result = cmd.ExecuteScalar();
            return Convert.ToInt32(result);
        }

        /// <summary>
        /// Modifica las fechas, número de huéspedes y precio de una reservación existente.
        /// </summary>
        /// <param name="id">ID de la reservación a modificar.</param>
        /// <param name="checkIn">Nueva fecha de check-in.</param>
        /// <param name="checkOut">Nueva fecha de check-out.</param>
        /// <param name="numHuespedes">Nuevo número de huéspedes.</param>
        /// <param name="precioTotal">Nuevo precio total calculado.</param>
        /// <returns>True si la modificación fue exitosa.</returns>
        public bool Modificar(int id, DateTime checkIn, DateTime checkOut, int numHuespedes, decimal precioTotal)
        {
            string sql = @"UPDATE Reservaciones SET
                          fecha_check_in = @checkIn,
                          fecha_check_out = @checkOut,
                          num_huespedes = @numHuespedes,
                          precio_total = @precioTotal
                          WHERE id_reservacion = @id";

            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@checkIn", checkIn);
            cmd.Parameters.AddWithValue("@checkOut", checkOut);
            cmd.Parameters.AddWithValue("@numHuespedes", numHuespedes);
            cmd.Parameters.AddWithValue("@precioTotal", precioTotal);
            cmd.Parameters.AddWithValue("@id", id);

            return cmd.ExecuteNonQuery() > 0;
        }

        /// <summary>
        /// Cambia el estado de una reservación a "Cancelada".
        /// </summary>
        /// <param name="id">ID de la reservación a cancelar.</param>
        /// <returns>True si la operación fue exitosa.</returns>
        public bool Cancelar(int id)
        {
            string sql = "UPDATE Reservaciones SET estado = 'Cancelada' WHERE id_reservacion = @id";

            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@id", id);

            return cmd.ExecuteNonQuery() > 0;
        }

        /// <summary>
        /// Cambia el estado de una reservación a "Confirmada".
        /// </summary>
        /// <param name="id">ID de la reservación a confirmar.</param>
        /// <returns>True si la operación fue exitosa.</returns>
        public bool Confirmar(int id)
        {
            string sql = "UPDATE Reservaciones SET estado = 'Confirmada' WHERE id_reservacion = @id";

            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@id", id);

            return cmd.ExecuteNonQuery() > 0;
        }

        /// <summary>
        /// Cambia el estado de una reservación a cualquier valor permitido.
        /// </summary>
        /// <param name="id">ID de la reservación.</param>
        /// <param name="estado">Nuevo estado de la reservación.</param>
        /// <returns>True si la operación fue exitosa.</returns>
        public bool CambiarEstado(int id, string estado)
        {
            string sql = "UPDATE Reservaciones SET estado = @estado WHERE id_reservacion = @id";

            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@estado", estado);
            cmd.Parameters.AddWithValue("@id", id);

            return cmd.ExecuteNonQuery() > 0;
        }

        /// <summary>
        /// Obtiene todas las reservaciones del sistema incluyendo datos del usuario.
        /// Usado principalmente por el panel de administración.
        /// </summary>
        /// <returns>Lista completa de reservaciones con datos de habitación, hotel y usuario.</returns>
        public List<Reservacion> GetAll()
        {
            var lista = new List<Reservacion>();
            string sql = @"SELECT r.*, h.tipo_habitacion, h.num_habitacion,
                          ho.nombre_hotel, u.nombre as nombre_usuario
                          FROM Reservaciones r
                          INNER JOIN Habitaciones h ON r.id_habitacion = h.id_habitacion
                          INNER JOIN Hoteles ho ON h.id_hotel = ho.id_hotel
                          INNER JOIN Usuario u ON r.id_usuario = u.id_usuario
                          ORDER BY r.fecha_reservacion DESC";

            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            using var rs = cmd.ExecuteReader();
            while (rs.Read())
                lista.Add(MapReservacionAdmin(rs));

            return lista;
        }

        /// <summary>
        /// Mapea un registro de la base de datos a un objeto Reservacion.
        /// </summary>
        /// <param name="rs">SqlDataReader con los datos del registro.</param>
        /// <returns>Objeto Reservacion con los datos mapeados.</returns>
        private Reservacion MapReservacion(SqlDataReader rs)
        {
            return new Reservacion
            {
                IdReservacion = rs.GetInt32(rs.GetOrdinal("id_reservacion")),
                IdUsuario = rs.GetInt32(rs.GetOrdinal("id_usuario")),
                IdHabitacion = rs.GetInt32(rs.GetOrdinal("id_habitacion")),
                NombreHabitacion = rs.GetString(rs.GetOrdinal("tipo_habitacion")) + " " +
                                   rs.GetString(rs.GetOrdinal("num_habitacion")),
                NombreHotel = rs.GetString(rs.GetOrdinal("nombre_hotel")),
                FechaCheckIn = rs.GetDateTime(rs.GetOrdinal("fecha_check_in")),
                FechaCheckOut = rs.GetDateTime(rs.GetOrdinal("fecha_check_out")),
                PrecioTotal = rs.GetDecimal(rs.GetOrdinal("precio_total")),
                Estado = rs.GetString(rs.GetOrdinal("estado")),
                MetodoPago = rs.IsDBNull(rs.GetOrdinal("metodo_pago")) ? "" : rs.GetString(rs.GetOrdinal("metodo_pago")),
                FechaReservacion = rs.GetDateTime(rs.GetOrdinal("fecha_reservacion")),
                NumHuespedes = rs.IsDBNull(rs.GetOrdinal("num_huespedes")) ? 1 : rs.GetInt32(rs.GetOrdinal("num_huespedes")),
                NotasEspeciales = rs.IsDBNull(rs.GetOrdinal("notas_especiales")) ? null : rs.GetString(rs.GetOrdinal("notas_especiales"))
            };
        }

        /// <summary>
        /// Mapea un registro administrativo incluyendo el nombre del usuario.
        /// </summary>
        /// <param name="rs">SqlDataReader con los datos del registro.</param>
        /// <returns>Objeto Reservacion con datos completos incluyendo nombre de usuario.</returns>
        private Reservacion MapReservacionAdmin(SqlDataReader rs)
        {
            var r = MapReservacion(rs);
            r.NombreUsuario = rs.IsDBNull(rs.GetOrdinal("nombre_usuario")) ? "" : rs.GetString(rs.GetOrdinal("nombre_usuario"));
            return r;
        }
    }
}