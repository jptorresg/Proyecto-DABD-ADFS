using Microsoft.Data.SqlClient;
using HotelesAPI.Config;
using HotelesAPI.Models;

namespace HotelesAPI.DAO
{
    public class HabitacionDAO
    {
        public List<Habitacion> GetAll()
        {
            var lista = new List<Habitacion>();
            string sql = @"SELECT h.*, ho.nombre_hotel, ho.ubicacion, ho.estrellas 
                          FROM Habitaciones h
                          INNER JOIN Hoteles ho ON h.id_hotel = ho.id_hotel
                          WHERE h.estado = 'Disponible'";

            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            using var rs = cmd.ExecuteReader();
            while (rs.Read())
                lista.Add(MapHabitacion(rs));

            return lista;
        }

        public List<Habitacion> GetWithFilters(string? tipo, decimal? precioMax,
                                                int? capacidad, string? amenidad)
        {
            var lista = new List<Habitacion>();
            string sql = @"SELECT h.*, ho.nombre_hotel, ho.ubicacion, ho.estrellas 
                          FROM Habitaciones h
                          INNER JOIN Hoteles ho ON h.id_hotel = ho.id_hotel
                          WHERE h.estado = 'Disponible'";

            if (!string.IsNullOrEmpty(tipo))
                sql += " AND h.tipo_habitacion = @tipo";
            if (precioMax.HasValue)
                sql += " AND h.precio_noche <= @precioMax";
            if (capacidad.HasValue)
                sql += " AND h.capacidad_max >= @capacidad";
            if (!string.IsNullOrEmpty(amenidad))
                sql += " AND h.amenidades LIKE @amenidad";

            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);

            if (!string.IsNullOrEmpty(tipo))
                cmd.Parameters.AddWithValue("@tipo", tipo);
            if (precioMax.HasValue)
                cmd.Parameters.AddWithValue("@precioMax", precioMax.Value);
            if (capacidad.HasValue)
                cmd.Parameters.AddWithValue("@capacidad", capacidad.Value);
            if (!string.IsNullOrEmpty(amenidad))
                cmd.Parameters.AddWithValue("@amenidad", $"%{amenidad}%");

            using var rs = cmd.ExecuteReader();
            while (rs.Read())
                lista.Add(MapHabitacion(rs));

            return lista;
        }

        public Habitacion? GetById(int id)
        {
            string sql = @"SELECT h.*, ho.nombre_hotel, ho.ubicacion, ho.estrellas 
                          FROM Habitaciones h
                          INNER JOIN Hoteles ho ON h.id_hotel = ho.id_hotel
                          WHERE h.id_habitacion = @id";

            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@id", id);
            using var rs = cmd.ExecuteReader();

            if (rs.Read())
                return MapHabitacion(rs);

            return null;
        }

        public List<Habitacion> GetDisponibles(DateTime checkIn, DateTime checkOut, int capacidad)
        {
            var lista = new List<Habitacion>();
            string sql = @"SELECT h.*, ho.nombre_hotel, ho.ubicacion, ho.estrellas 
                          FROM Habitaciones h
                          INNER JOIN Hoteles ho ON h.id_hotel = ho.id_hotel
                          WHERE h.estado = 'Disponible'
                          AND h.capacidad_max >= @capacidad
                          AND h.id_habitacion NOT IN (
                              SELECT id_habitacion FROM Reservaciones
                              WHERE estado NOT IN ('Cancelada')
                              AND NOT (@checkOut <= fecha_check_in 
                                   OR @checkIn >= fecha_check_out)
                          )";

            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@checkIn", checkIn);
            cmd.Parameters.AddWithValue("@checkOut", checkOut);
            cmd.Parameters.AddWithValue("@capacidad", capacidad);
            using var rs = cmd.ExecuteReader();
            while (rs.Read())
                lista.Add(MapHabitacion(rs));

            return lista;
        }

        public int Create(Habitacion habitacion)
        {
            string sql = @"INSERT INTO Habitaciones 
                          (id_hotel, num_habitacion, tipo_habitacion, precio_noche, 
                           capacidad_max, estado, amenidades)
                          VALUES (@idHotel, @num, @tipo, @precio, @capacidad, @estado, @amenidades);
                          SELECT SCOPE_IDENTITY();";

            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@idHotel", habitacion.IdHotel);
            cmd.Parameters.AddWithValue("@num", habitacion.NumHabitacion);
            cmd.Parameters.AddWithValue("@tipo", habitacion.TipoHabitacion);
            cmd.Parameters.AddWithValue("@precio", habitacion.PrecioNoche);
            cmd.Parameters.AddWithValue("@capacidad", habitacion.CapacidadMax);
            cmd.Parameters.AddWithValue("@estado", habitacion.Estado);
            cmd.Parameters.AddWithValue("@amenidades", habitacion.Amenidades);

            var result = cmd.ExecuteScalar();
            return Convert.ToInt32(result);
        }

        public bool Update(Habitacion habitacion)
        {
            string sql = @"UPDATE Habitaciones SET
                          num_habitacion = @num,
                          tipo_habitacion = @tipo,
                          precio_noche = @precio,
                          capacidad_max = @capacidad,
                          estado = @estado,
                          amenidades = @amenidades
                          WHERE id_habitacion = @id";

            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@num", habitacion.NumHabitacion);
            cmd.Parameters.AddWithValue("@tipo", habitacion.TipoHabitacion);
            cmd.Parameters.AddWithValue("@precio", habitacion.PrecioNoche);
            cmd.Parameters.AddWithValue("@capacidad", habitacion.CapacidadMax);
            cmd.Parameters.AddWithValue("@estado", habitacion.Estado);
            cmd.Parameters.AddWithValue("@amenidades", habitacion.Amenidades);
            cmd.Parameters.AddWithValue("@id", habitacion.IdHabitacion);

            return cmd.ExecuteNonQuery() > 0;
        }

        public bool Delete(int id)
        {
            string sql = "UPDATE Habitaciones SET estado = 'Inactiva' WHERE id_habitacion = @id";

            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@id", id);

            return cmd.ExecuteNonQuery() > 0;
        }

        public List<Habitacion> GetAllAdmin()
        {
            var lista = new List<Habitacion>();
            string sql = @"SELECT h.*, ho.nombre_hotel, ho.ubicacion, ho.estrellas 
                          FROM Habitaciones h
                          INNER JOIN Hoteles ho ON h.id_hotel = ho.id_hotel
                          ORDER BY h.id_hotel, h.num_habitacion";

            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            using var rs = cmd.ExecuteReader();
            while (rs.Read())
                lista.Add(MapHabitacion(rs));

            return lista;
        }

        private Habitacion MapHabitacion(SqlDataReader rs)
        {
            return new Habitacion
            {
                IdHabitacion = rs.GetInt32(rs.GetOrdinal("id_habitacion")),
                IdHotel = rs.GetInt32(rs.GetOrdinal("id_hotel")),
                NombreHotel = rs.GetString(rs.GetOrdinal("nombre_hotel")),
                NumHabitacion = rs.GetString(rs.GetOrdinal("num_habitacion")),
                TipoHabitacion = rs.GetString(rs.GetOrdinal("tipo_habitacion")),
                PrecioNoche = rs.GetDecimal(rs.GetOrdinal("precio_noche")),
                CapacidadMax = rs.GetInt32(rs.GetOrdinal("capacidad_max")),
                Estado = rs.GetString(rs.GetOrdinal("estado")),
                Ubicacion = rs.IsDBNull(rs.GetOrdinal("ubicacion")) ? "" : rs.GetString(rs.GetOrdinal("ubicacion")),
                Estrellas = rs.IsDBNull(rs.GetOrdinal("estrellas")) ? 0 : rs.GetInt32(rs.GetOrdinal("estrellas")),
                Amenidades = rs.IsDBNull(rs.GetOrdinal("amenidades")) ? "" : rs.GetString(rs.GetOrdinal("amenidades"))
            };
        }
    }
}