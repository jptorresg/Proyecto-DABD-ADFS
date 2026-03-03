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
            cmd.Parameters.Add(new SqlParameter("@email", email));
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
            cmd.Parameters.Add(new SqlParameter("@id", id));
            using var rs = cmd.ExecuteReader();

            if (rs.Read())
                return MapUsuario(rs);

            return null;
        }

        public List<Usuario> GetTodos()
        {
            var lista = new List<Usuario>();
            string sql = "SELECT * FROM Usuario ORDER BY fecha_registro DESC";

            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            using var rs = cmd.ExecuteReader();
            while (rs.Read())
                lista.Add(MapUsuario(rs));

            return lista;
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
            cmd.Parameters.Add(new SqlParameter("@nombre", usuario.Nombre));
            cmd.Parameters.Add(new SqlParameter("@email", usuario.Email));
            cmd.Parameters.Add(new SqlParameter("@hash", usuario.PasswordHash!));
            cmd.Parameters.Add(new SqlParameter("@telefono", usuario.Telefono));
            cmd.Parameters.Add(new SqlParameter("@rol", usuario.Rol));

            var result = cmd.ExecuteScalar();
            return Convert.ToInt32(result);
        }

        public bool Update(Usuario usuario)
        {
            string sql = @"UPDATE Usuario SET
                          nombre = @nombre,
                          email = @email,
                          telefono = @telefono,
                          password_hash = @hash,
                          activo = @activo
                          WHERE id_usuario = @id";

            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.Add(new SqlParameter("@nombre", usuario.Nombre));
            cmd.Parameters.Add(new SqlParameter("@email", usuario.Email));
            cmd.Parameters.Add(new SqlParameter("@telefono", usuario.Telefono));
            cmd.Parameters.Add(new SqlParameter("@hash", (object?)usuario.PasswordHash ?? DBNull.Value));
            cmd.Parameters.Add(new SqlParameter("@activo", usuario.Activo));
            cmd.Parameters.Add(new SqlParameter("@id", usuario.IdUsuario));

            return cmd.ExecuteNonQuery() > 0;
        }

        public bool ToggleActivo(int id, bool activo)
        {
            string sql = "UPDATE Usuario SET activo = @activo WHERE id_usuario = @id";

            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.Add(new SqlParameter("@activo", activo));
            cmd.Parameters.Add(new SqlParameter("@id", id));

            return cmd.ExecuteNonQuery() > 0;
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