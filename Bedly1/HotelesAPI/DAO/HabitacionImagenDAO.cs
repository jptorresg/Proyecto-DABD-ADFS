using Microsoft.Data.SqlClient;
using HotelesAPI.Config;
using HotelesAPI.Models;

namespace HotelesAPI.DAO
{
    public class HabitacionImagenDAO
    {
        public List<HabitacionImagen> GetByHabitacion(int idHabitacion)
        {
            var lista = new List<HabitacionImagen>();
            string sql = @"SELECT * FROM HabitacionImagen
                          WHERE id_habitacion = @idHabitacion
                          ORDER BY es_principal DESC, orden ASC, id_imagen ASC";

            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@idHabitacion", idHabitacion);
            using var rs = cmd.ExecuteReader();
            while (rs.Read())
            {
                lista.Add(new HabitacionImagen
                {
                    IdImagen = rs.GetInt32(rs.GetOrdinal("id_imagen")),
                    IdHabitacion = rs.GetInt32(rs.GetOrdinal("id_habitacion")),
                    Url = rs.GetString(rs.GetOrdinal("url")),
                    Descripcion = rs.IsDBNull(rs.GetOrdinal("descripcion")) ? null : rs.GetString(rs.GetOrdinal("descripcion")),
                    EsPrincipal = rs.GetBoolean(rs.GetOrdinal("es_principal")),
                    Orden = rs.GetInt32(rs.GetOrdinal("orden")),
                    FechaRegistro = rs.GetDateTime(rs.GetOrdinal("fecha_registro"))
                });
            }
            return lista;
        }

        public int Crear(HabitacionImagen imagen)
        {
            string sql = @"INSERT INTO HabitacionImagen
                          (id_habitacion, url, descripcion, es_principal, orden)
                          VALUES (@idHabitacion, @url, @descripcion, @esPrincipal, @orden);
                          SELECT SCOPE_IDENTITY();";

            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@idHabitacion", imagen.IdHabitacion);
            cmd.Parameters.AddWithValue("@url", imagen.Url);
            cmd.Parameters.AddWithValue("@descripcion", (object?)imagen.Descripcion ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@esPrincipal", imagen.EsPrincipal);
            cmd.Parameters.AddWithValue("@orden", imagen.Orden);
            return Convert.ToInt32(cmd.ExecuteScalar());
        }

        public bool Eliminar(int idImagen)
        {
            string sql = "DELETE FROM HabitacionImagen WHERE id_imagen = @idImagen";
            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@idImagen", idImagen);
            return cmd.ExecuteNonQuery() > 0;
        }

        public bool MarcarComoPrincipal(int idImagen, int idHabitacion)
        {
            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var transaction = conn.BeginTransaction();

            try
            {
                using var cmd1 = new SqlCommand(
                    "UPDATE HabitacionImagen SET es_principal = 0 WHERE id_habitacion = @idHabitacion",
                    conn, transaction);
                cmd1.Parameters.AddWithValue("@idHabitacion", idHabitacion);
                cmd1.ExecuteNonQuery();

                using var cmd2 = new SqlCommand(
                    "UPDATE HabitacionImagen SET es_principal = 1 WHERE id_imagen = @idImagen",
                    conn, transaction);
                cmd2.Parameters.AddWithValue("@idImagen", idImagen);
                cmd2.ExecuteNonQuery();

                transaction.Commit();
                return true;
            }
            catch
            {
                transaction.Rollback();
                return false;
            }
        }
    }
}