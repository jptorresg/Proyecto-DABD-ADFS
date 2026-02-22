using Microsoft.Data.SqlClient;

namespace HotelesAPI.Config
{
    public class DatabaseConfig
    {
        private static readonly string ConnectionString;

        static DatabaseConfig()
        {
            var config = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json")
                .Build();

            ConnectionString = config.GetConnectionString("SqlServer")
                ?? throw new Exception("No se encontró la cadena de conexión 'SqlServer' en appsettings.json");
        }

        public static SqlConnection GetConnection()
        {
            return new SqlConnection(ConnectionString);
        }

        public static void TestConnection()
        {
            try
            {
                using var conn = GetConnection();
                conn.Open();
                Console.WriteLine("✅ Conexión exitosa a SQL Server!");
            }
            catch (Exception e)
            {
                Console.WriteLine($"❌ Error de conexión: {e.Message}");
                throw;
            }
        }
    }
}