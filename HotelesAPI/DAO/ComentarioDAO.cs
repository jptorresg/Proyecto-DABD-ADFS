using Microsoft.Data.SqlClient;
using HotelesAPI.Config;
using HotelesAPI.Models;

namespace HotelesAPI.DAO
{
    public class ComentarioDAO
    {
        public List<Comentario> GetByHabitacion(int idHabitacion)
        {
            var todos = new List<Comentario>();
            string sql = @"SELECT c.*, u.nombre as nombre_usuario,
                          h.tipo_habitacion + ' ' + h.num_habitacion as nombre_habitacion,
                          ho.nombre_hotel
                          FROM Comentarios c
                          INNER JOIN Usuario u ON c.id_usuario = u.id_usuario
                          INNER JOIN Habitaciones h ON c.id_habitacion = h.id_habitacion
                          INNER JOIN Hoteles ho ON h.id_hotel = ho.id_hotel
                          WHERE c.id_habitacion = @idHabitacion
                          ORDER BY c.fecha_comentario ASC";

            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@idHabitacion", idHabitacion);
            using var rs = cmd.ExecuteReader();
            while (rs.Read())
                todos.Add(MapComentario(rs));

            // Construir mapa id → comentario
            var mapa = todos.ToDictionary(c => c.IdComentario);

            // Asignar cada comentario a su padre
            var raices = new List<Comentario>();
            foreach (var c in todos)
            {
                if (c.IdComentarioPadre == null)
                {
                    raices.Add(c);
                }
                else if (mapa.TryGetValue(c.IdComentarioPadre.Value, out var padre))
                {
                    // El padre ya está en el mapa (puede ser raíz o respuesta)
                    padre.Respuestas.Add(c);
                }
            }

            return raices;
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
                          AND c.id_comentario_padre IS NULL
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
                          FROM Comentarios 
                          WHERE id_habitacion = @idHabitacion
                          AND id_comentario_padre IS NULL";

            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@idHabitacion", idHabitacion);
            return Math.Round(Convert.ToDouble(cmd.ExecuteScalar()), 1);
        }

        public int Create(Comentario comentario)
        {
            string sql = @"INSERT INTO Comentarios
                          (id_usuario, id_habitacion, rating, texto, fecha_comentario, id_comentario_padre)
                          VALUES (@idUsuario, @idHabitacion, @rating, @texto, GETDATE(), @idPadre);
                          SELECT SCOPE_IDENTITY();";

            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@idUsuario", comentario.IdUsuario);
            cmd.Parameters.AddWithValue("@idHabitacion", comentario.IdHabitacion);
            cmd.Parameters.AddWithValue("@rating", comentario.Rating);
            cmd.Parameters.AddWithValue("@texto", comentario.Texto);
            cmd.Parameters.AddWithValue("@idPadre", (object?)comentario.IdComentarioPadre ?? DBNull.Value);
            return Convert.ToInt32(cmd.ExecuteScalar());
        }

        public bool Delete(int id)
        {
            string sqlRespuestas = "DELETE FROM Comentarios WHERE id_comentario_padre = @id";
            string sqlPadre = "DELETE FROM Comentarios WHERE id_comentario = @id";

            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd1 = new SqlCommand(sqlRespuestas, conn);
            cmd1.Parameters.AddWithValue("@id", id);
            cmd1.ExecuteNonQuery();

            using var cmd2 = new SqlCommand(sqlPadre, conn);
            cmd2.Parameters.AddWithValue("@id", id);
            return cmd2.ExecuteNonQuery() > 0;
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
                FechaComentario = rs.GetDateTime(rs.GetOrdinal("fecha_comentario")),
                IdComentarioPadre = rs.IsDBNull(rs.GetOrdinal("id_comentario_padre"))
                    ? null
                    : rs.GetInt32(rs.GetOrdinal("id_comentario_padre"))
            };
        }
    }
}