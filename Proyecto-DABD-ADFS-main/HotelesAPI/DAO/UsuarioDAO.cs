using Microsoft.Data.SqlClient;
using HotelesAPI.Config;
using HotelesAPI.Models;

namespace HotelesAPI.DAO
{
    public class UsuarioDAO
    {
        public Usuario? FindByEmail(string email)
        {
            string sql = "SELECT * FROM Usuario WHERE email = @email";

            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@email", email);
            using var rs = cmd.ExecuteReader();

            if (rs.Read())
                return MapUsuario(rs);

            return null;
        }

        public Usuario? FindById(int id)
        {
            string sql = "SELECT * FROM Usuario WHERE id_usuario = @id";

            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@id", id);
            using var rs = cmd.ExecuteReader();

            if (rs.Read())
                return MapUsuario(rs);

            return null;
        }

        public int Create(Usuario usuario)
        {
            string sql = @"INSERT INTO Usuario 
                          (nombre, email, password_hash, telefono, rol, activo, fecha_registro)
                          VALUES (@nombre, @email, @hash, @telefono, @rol, 1, GETDATE());
                          SELECT SCOPE_IDENTITY();";

            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@nombre", usuario.Nombre);
            cmd.Parameters.AddWithValue("@email", usuario.Email);
            cmd.Parameters.AddWithValue("@hash", usuario.PasswordHash!);
            cmd.Parameters.AddWithValue("@telefono", usuario.Telefono);
            cmd.Parameters.AddWithValue("@rol", usuario.Rol);

            var result = cmd.ExecuteScalar();
            return Convert.ToInt32(result);
        }

        private Usuario MapUsuario(SqlDataReader rs)
        {
            return new Usuario
            {
                IdUsuario = rs.GetInt32(rs.GetOrdinal("id_usuario")),
                Nombre = rs.GetString(rs.GetOrdinal("nombre")),
                Email = rs.GetString(rs.GetOrdinal("email")),
                PasswordHash = rs.IsDBNull(rs.GetOrdinal("password_hash")) ? null : rs.GetString(rs.GetOrdinal("password_hash")),
                Telefono = rs.IsDBNull(rs.GetOrdinal("telefono")) ? "" : rs.GetString(rs.GetOrdinal("telefono")),
                Rol = rs.GetString(rs.GetOrdinal("rol")),
                Activo = rs.GetBoolean(rs.GetOrdinal("activo")),
                FechaRegistro = rs.GetDateTime(rs.GetOrdinal("fecha_registro"))
            };
        }
    }
}