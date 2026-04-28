using Microsoft.Data.SqlClient;
using HotelesAPI.Config;

namespace HotelesAPI.DAO
{
    public class ConfiguracionDAO
    {
        public string? GetValor(string clave)
        {
            string sql = "SELECT valor FROM Configuracion WHERE clave = @clave";

            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@clave", clave);
            var result = cmd.ExecuteScalar();
            return result?.ToString();
        }

        public bool SetValor(string clave, string valor)
        {
            string sql = "UPDATE Configuracion SET valor = @valor WHERE clave = @clave";

            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@clave", clave);
            cmd.Parameters.AddWithValue("@valor", valor);
            return cmd.ExecuteNonQuery() > 0;
        }

        public bool VentasCerradas()
        {
            var valor = GetValor("fecha_cierre_ventas");
            if (string.IsNullOrEmpty(valor)) return false;
            if (DateTime.TryParse(valor, out DateTime fechaCierre))
                return DateTime.Now > fechaCierre;
            return false;
        }

        public DateTime? GetFechaCierre()
        {
            var valor = GetValor("fecha_cierre_ventas");
            if (string.IsNullOrEmpty(valor)) return null;
            if (DateTime.TryParse(valor, out DateTime fecha)) return fecha;
            return null;
        }
    }
}