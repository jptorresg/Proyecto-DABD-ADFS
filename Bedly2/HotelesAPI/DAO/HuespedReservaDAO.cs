using Microsoft.Data.SqlClient;
using HotelesAPI.Config;
using HotelesAPI.Models;

namespace HotelesAPI.DAO
{
    public class HuespedReservaDAO
    {
        public int Crear(HuespedReserva huesped)
        {
            string sql = @"INSERT INTO HuespedReserva
                          (id_reservacion, nombre, apellidos, edad, tipo_documento, documento, nacionalidad, es_titular)
                          VALUES (@idReservacion, @nombre, @apellidos, @edad, @tipoDocumento, @documento, @nacionalidad, @esTitular);
                          SELECT SCOPE_IDENTITY();";

            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@idReservacion", huesped.IdReservacion);
            cmd.Parameters.AddWithValue("@nombre", huesped.Nombre);
            cmd.Parameters.AddWithValue("@apellidos", huesped.Apellidos);
            cmd.Parameters.AddWithValue("@edad", huesped.Edad);
            cmd.Parameters.AddWithValue("@tipoDocumento", huesped.TipoDocumento);
            cmd.Parameters.AddWithValue("@documento", huesped.Documento);
            cmd.Parameters.AddWithValue("@nacionalidad", huesped.Nacionalidad);
            cmd.Parameters.AddWithValue("@esTitular", huesped.EsTitular);

            return Convert.ToInt32(cmd.ExecuteScalar());
        }

        public List<HuespedReserva> GetByReservacion(int idReservacion)
        {
            var lista = new List<HuespedReserva>();
            string sql = @"SELECT * FROM HuespedReserva
                          WHERE id_reservacion = @idReservacion
                          ORDER BY es_titular DESC, id_huesped ASC";

            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@idReservacion", idReservacion);
            using var rs = cmd.ExecuteReader();
            while (rs.Read())
            {
                lista.Add(new HuespedReserva
                {
                    IdHuesped = rs.GetInt32(rs.GetOrdinal("id_huesped")),
                    IdReservacion = rs.GetInt32(rs.GetOrdinal("id_reservacion")),
                    Nombre = rs.GetString(rs.GetOrdinal("nombre")),
                    Apellidos = rs.GetString(rs.GetOrdinal("apellidos")),
                    Edad = rs.GetInt32(rs.GetOrdinal("edad")),
                    TipoDocumento = rs.GetString(rs.GetOrdinal("tipo_documento")),
                    Documento = rs.GetString(rs.GetOrdinal("documento")),
                    Nacionalidad = rs.GetString(rs.GetOrdinal("nacionalidad")),
                    EsTitular = rs.GetBoolean(rs.GetOrdinal("es_titular")),
                    FechaRegistro = rs.GetDateTime(rs.GetOrdinal("fecha_registro"))
                });
            }
            return lista;
        }

        public bool EliminarPorReservacion(int idReservacion)
        {
            string sql = "DELETE FROM HuespedReserva WHERE id_reservacion = @idReservacion";
            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@idReservacion", idReservacion);
            return cmd.ExecuteNonQuery() >= 0;
        }
    }
}