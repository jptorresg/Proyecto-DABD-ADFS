using Microsoft.Data.SqlClient;

namespace HotelesAPI.Config
{
    public class DatabaseConfig
    {
        public static string ConnectionString { get; set; } = string.Empty;

        public static SqlConnection GetConnection()
        {
            return new SqlConnection(ConnectionString);
        }

        public static void TestConnection()
        {
            using var conn = GetConnection();
            conn.Open();
            Console.WriteLine("✅ Conexión exitosa a SQL Server!");
        }
    }
}