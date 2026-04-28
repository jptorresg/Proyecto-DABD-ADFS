using Microsoft.Data.SqlClient;
using HotelesAPI.Config;
using HotelesAPI.Models;

namespace HotelesAPI.DAO
{
    public class LogApiDAO
    {
        public List<LogApi> GetAll(int top = 50)
        {
            var lista = new List<LogApi>();
            string sql = $@"SELECT TOP {top} * FROM LogsApi
                           ORDER BY fecha_hora DESC";

            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            using var rs = cmd.ExecuteReader();
            while (rs.Read())
                lista.Add(MapLog(rs));

            return lista;
        }

        public List<LogApi> GetByEstado(int statusCode)
        {
            var lista = new List<LogApi>();
            string sql = @"SELECT TOP 50 * FROM LogsApi
                          WHERE status_code = @statusCode
                          ORDER BY fecha_hora DESC";

            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@statusCode", statusCode);
            using var rs = cmd.ExecuteReader();
            while (rs.Read())
                lista.Add(MapLog(rs));

            return lista;
        }

        public List<LogApi> GetErrores()
        {
            var lista = new List<LogApi>();
            string sql = @"SELECT TOP 50 * FROM LogsApi
                          WHERE status_code >= 400
                          ORDER BY fecha_hora DESC";

            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            using var rs = cmd.ExecuteReader();
            while (rs.Read())
                lista.Add(MapLog(rs));

            return lista;
        }

        public void Registrar(LogApi log)
        {
            string sql = @"INSERT INTO LogsApi
                          (metodo, endpoint, status_code, request_body, 
                           response_body, ip_origen, agencia_id, tiempo_ms, fecha_hora)
                          VALUES (@metodo, @endpoint, @statusCode, @requestBody,
                                  @responseBody, @ipOrigen, @agenciaId, @tiempoMs, GETDATE())";

            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@metodo", log.Metodo);
            cmd.Parameters.AddWithValue("@endpoint", log.Endpoint);
            cmd.Parameters.AddWithValue("@statusCode", log.StatusCode);
            cmd.Parameters.AddWithValue("@requestBody", (object?)log.RequestBody ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@responseBody", (object?)log.ResponseBody ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@ipOrigen", (object?)log.IpOrigen ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@agenciaId", (object?)log.AgenciaId ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@tiempoMs", log.TiempoMs);
            cmd.ExecuteNonQuery();
        }

        public object GetResumen()
        {
            string sql = @"SELECT 
                          COUNT(*) as total,
                          SUM(CASE WHEN status_code < 400 THEN 1 ELSE 0 END) as exitosas,
                          SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as errores,
                          AVG(CAST(tiempo_ms AS FLOAT)) as tiempo_promedio
                          FROM LogsApi
                          WHERE fecha_hora >= DATEADD(DAY, -1, GETDATE())";

            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            using var rs = cmd.ExecuteReader();

            if (rs.Read())
            {
                return new
                {
                    Total = rs.GetInt32(rs.GetOrdinal("total")),
                    Exitosas = rs.GetInt32(rs.GetOrdinal("exitosas")),
                    Errores = rs.GetInt32(rs.GetOrdinal("errores")),
                    TiempoPromedio = Math.Round(rs.GetDouble(rs.GetOrdinal("tiempo_promedio")), 0)
                };
            }

            return new { Total = 0, Exitosas = 0, Errores = 0, TiempoPromedio = 0 };
        }

        private LogApi MapLog(SqlDataReader rs)
        {
            return new LogApi
            {
                IdLog = rs.GetInt32(rs.GetOrdinal("id_log")),
                Metodo = rs.GetString(rs.GetOrdinal("metodo")),
                Endpoint = rs.GetString(rs.GetOrdinal("endpoint")),
                StatusCode = rs.GetInt32(rs.GetOrdinal("status_code")),
                RequestBody = rs.IsDBNull(rs.GetOrdinal("request_body")) ? null : rs.GetString(rs.GetOrdinal("request_body")),
                ResponseBody = rs.IsDBNull(rs.GetOrdinal("response_body")) ? null : rs.GetString(rs.GetOrdinal("response_body")),
                IpOrigen = rs.IsDBNull(rs.GetOrdinal("ip_origen")) ? null : rs.GetString(rs.GetOrdinal("ip_origen")),
                AgenciaId = rs.IsDBNull(rs.GetOrdinal("agencia_id")) ? null : rs.GetString(rs.GetOrdinal("agencia_id")),
                TiempoMs = rs.GetInt64(rs.GetOrdinal("tiempo_ms")),
                FechaHora = rs.GetDateTime(rs.GetOrdinal("fecha_hora"))
            };
        }
    }
}