using Microsoft.Data.SqlClient;
using HotelesAPI.Config;
using HotelesAPI.Models;

namespace HotelesAPI.DAO
{
    public class AgenciaDAO
    {
        public Agencia? ValidarToken(string token)
        {
            string sql = "SELECT * FROM Agencias WHERE token = @token AND activo = 1";
            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@token", token);
            using var rs = cmd.ExecuteReader();
            if (rs.Read()) return MapAgencia(rs);
            return null;
        }

        public List<Agencia> GetTodas()
        {
            var lista = new List<Agencia>();
            string sql = "SELECT * FROM Agencias ORDER BY fecha_registro DESC";
            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            using var rs = cmd.ExecuteReader();
            while (rs.Read()) lista.Add(MapAgencia(rs));
            return lista;
        }

        public int Create(Agencia agencia)
        {
            string sql = @"INSERT INTO Agencias (nombre, email, token, porcentaje_descuento, activo)
                          VALUES (@nombre, @email, @token, @descuento, 1);
                          SELECT SCOPE_IDENTITY();";
            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@nombre", agencia.Nombre);
            cmd.Parameters.AddWithValue("@email", agencia.Email);
            cmd.Parameters.AddWithValue("@token", Guid.NewGuid().ToString());
            cmd.Parameters.AddWithValue("@descuento", agencia.PorcentajeDescuento);
            return Convert.ToInt32(cmd.ExecuteScalar());
        }

        public bool ActualizarDescuento(int id, decimal porcentaje)
        {
            string sql = "UPDATE Agencias SET porcentaje_descuento = @descuento WHERE id_agencia = @id";
            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@descuento", porcentaje);
            cmd.Parameters.AddWithValue("@id", id);
            return cmd.ExecuteNonQuery() > 0;
        }

        public bool ToggleActivo(int id, bool activo)
        {
            string sql = "UPDATE Agencias SET activo = @activo WHERE id_agencia = @id";
            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@activo", activo);
            cmd.Parameters.AddWithValue("@id", id);
            return cmd.ExecuteNonQuery() > 0;
        }

        public bool Delete(int id)
        {
            string sql = "DELETE FROM Agencias WHERE id_agencia = @id";
            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@id", id);
            return cmd.ExecuteNonQuery() > 0;
        }

        private Agencia MapAgencia(SqlDataReader rs)
        {
            return new Agencia
            {
                IdAgencia = rs.GetInt32(rs.GetOrdinal("id_agencia")),
                Nombre = rs.GetString(rs.GetOrdinal("nombre")),
                Email = rs.GetString(rs.GetOrdinal("email")),
                Token = rs.GetString(rs.GetOrdinal("token")),
                PorcentajeDescuento = rs.GetDecimal(rs.GetOrdinal("porcentaje_descuento")),
                Activo = rs.GetBoolean(rs.GetOrdinal("activo")),
                FechaRegistro = rs.GetDateTime(rs.GetOrdinal("fecha_registro"))
            };
        }
    }
}