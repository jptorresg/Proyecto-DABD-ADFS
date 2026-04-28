using Microsoft.Data.SqlClient;
using HotelesAPI.Config;
using HotelesAPI.Models;

namespace HotelesAPI.DAO
{
    public class EmailNotificacionDAO
    {
        public int Registrar(EmailNotificacion email)
        {
            string sql = @"INSERT INTO EmailNotifications
                          (destinatario, asunto, cuerpo, tipo_evento, enviado, fecha_envio, metadata)
                          VALUES (@destinatario, @asunto, @cuerpo, @tipoEvento, @enviado, GETDATE(), @metadata);
                          SELECT SCOPE_IDENTITY();";

            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@destinatario", email.Destinatario);
            cmd.Parameters.AddWithValue("@asunto", email.Asunto);
            cmd.Parameters.AddWithValue("@cuerpo", email.Cuerpo);
            cmd.Parameters.AddWithValue("@tipoEvento", email.TipoEvento);
            cmd.Parameters.AddWithValue("@enviado", email.Enviado);
            cmd.Parameters.AddWithValue("@metadata", (object?)email.Metadata ?? DBNull.Value);
            return Convert.ToInt32(cmd.ExecuteScalar());
        }

        public List<EmailNotificacion> GetAll(int top = 50)
        {
            var lista = new List<EmailNotificacion>();
            string sql = $"SELECT TOP {top} * FROM EmailNotifications ORDER BY fecha_envio DESC";
            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            using var rs = cmd.ExecuteReader();
            while (rs.Read())
            {
                lista.Add(new EmailNotificacion
                {
                    IdEmail = rs.GetInt32(rs.GetOrdinal("id_email")),
                    Destinatario = rs.GetString(rs.GetOrdinal("destinatario")),
                    Asunto = rs.GetString(rs.GetOrdinal("asunto")),
                    Cuerpo = rs.GetString(rs.GetOrdinal("cuerpo")),
                    TipoEvento = rs.GetString(rs.GetOrdinal("tipo_evento")),
                    Enviado = rs.GetBoolean(rs.GetOrdinal("enviado")),
                    FechaEnvio = rs.GetDateTime(rs.GetOrdinal("fecha_envio")),
                    Metadata = rs.IsDBNull(rs.GetOrdinal("metadata")) ? null : rs.GetString(rs.GetOrdinal("metadata"))
                });
            }
            return lista;
        }
    }
}