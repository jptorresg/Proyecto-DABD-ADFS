using Microsoft.Data.SqlClient;
using HotelesAPI.Config;
using HotelesAPI.Models;

namespace HotelesAPI.DAO
{
    public class ComentarioDAO
    {
        public List<Comentario> GetByHabitacion(int idHabitacion)
        {
            var lista = new List<Comentario>();
            string sql = @"SELECT c.*, u.nombre as nombre_usuario,
                          h.tipo_habitacion + ' ' + h.num_habitacion as nombre_habitacion,
                          ho.nombre_hotel
                          FROM Comentarios c
                          INNER JOIN Usuario u ON c.id_usuario = u.id_usuario
                          INNER JOIN Habitaciones h ON c.id_habitacion = h.id_habitacion
                          INNER JOIN Hoteles ho ON h.id_hotel = ho.id_hotel
                          WHERE c.id_habitacion = @idHabitacion
                          ORDER BY c.fecha_comentario DESC";

            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@idHabitacion", idHabitacion);
            using var rs = cmd.ExecuteReader();
            while (rs.Read())
                lista.Add(MapComentario(rs));

            return lista;
        }

        public List<Comentario> GetByUsuario(int idUsuario)
        {
            var lista = new List<Comentario>();
            string sql = @"SELECT c.*, u.nombre as nombre_usuario,
                          h.tipo_habitacion + ' ' + h.num_habitacion as nombre_habitacion,
                          ho.nombre_hotel
                          FROM Comentarios c
                          INNER JOIN Usuario u ON c.id_usuario = u.id_usuario
                          INNER JOIN Habitaciones h ON c.id_habitacion = h.id_habitacion
                          INNER JOIN Hoteles ho ON h.id_hotel = ho.id_hotel
                          WHERE c.id_usuario = @idUsuario
                          ORDER BY c.fecha_comentario DESC";

            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@idUsuario", idUsuario);
            using var rs = cmd.ExecuteReader();
            while (rs.Read())
                lista.Add(MapComentario(rs));

            return lista;
        }

        public double GetPromedioRating(int idHabitacion)
        {
            string sql = @"SELECT ISNULL(AVG(CAST(rating AS FLOAT)), 0) 
                          FROM Comentarios WHERE id_habitacion = @idHabitacion";

            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@idHabitacion", idHabitacion);

            return Math.Round(Convert.ToDouble(cmd.ExecuteScalar()), 1);
        }

        public int Create(Comentario comentario)
        {
            string sql = @"INSERT INTO Comentarios
                          (id_usuario, id_habitacion, rating, texto, fecha_comentario)
                          VALUES (@idUsuario, @idHabitacion, @rating, @texto, GETDATE());
                          SELECT SCOPE_IDENTITY();";

            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@idUsuario", comentario.IdUsuario);
            cmd.Parameters.AddWithValue("@idHabitacion", comentario.IdHabitacion);
            cmd.Parameters.AddWithValue("@rating", comentario.Rating);
            cmd.Parameters.AddWithValue("@texto", comentario.Texto);

            var result = cmd.ExecuteScalar();
            return Convert.ToInt32(result);
        }

        public bool Delete(int id)
        {
            string sql = "DELETE FROM Comentarios WHERE id_comentario = @id";

            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@id", id);

            return cmd.ExecuteNonQuery() > 0;
        }

        private Comentario MapComentario(SqlDataReader rs)
        {
            return new Comentario
            {
                IdComentario = rs.GetInt32(rs.GetOrdinal("id_comentario")),
                IdUsuario = rs.GetInt32(rs.GetOrdinal("id_usuario")),
                NombreUsuario = rs.GetString(rs.GetOrdinal("nombre_usuario")),
                IdHabitacion = rs.GetInt32(rs.GetOrdinal("id_habitacion")),
                NombreHabitacion = rs.GetString(rs.GetOrdinal("nombre_habitacion")),
                NombreHotel = rs.GetString(rs.GetOrdinal("nombre_hotel")),
                Rating = rs.GetInt32(rs.GetOrdinal("rating")),
                Texto = rs.GetString(rs.GetOrdinal("texto")),
                FechaComentario = rs.GetDateTime(rs.GetOrdinal("fecha_comentario"))
            };
        }
    }
}