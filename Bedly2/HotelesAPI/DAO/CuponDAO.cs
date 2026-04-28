using Microsoft.Data.SqlClient;
using HotelesAPI.Config;
using HotelesAPI.Models;

namespace HotelesAPI.DAO
{
    public class CuponDAO
    {
        public Cupon? ValidarCupon(string codigo)
        {
            string sql = @"SELECT * FROM Cupones 
                          WHERE codigo = @codigo 
                          AND activo = 1 
                          AND fecha_inicio <= GETDATE() 
                          AND fecha_fin >= GETDATE()
                          AND usos_actuales < usos_maximos";

            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@codigo", codigo.ToUpper());
            using var rs = cmd.ExecuteReader();

            if (rs.Read())
                return MapCupon(rs);

            return null;
        }

        public List<Cupon> GetTodos()
        {
            var lista = new List<Cupon>();
            string sql = "SELECT * FROM Cupones ORDER BY fecha_creacion DESC";

            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            using var rs = cmd.ExecuteReader();
            while (rs.Read())
                lista.Add(MapCupon(rs));

            return lista;
        }

        public int Create(Cupon cupon)
        {
            string sql = @"INSERT INTO Cupones 
                          (codigo, descripcion, tipo_descuento, valor_descuento, 
                           fecha_inicio, fecha_fin, usos_maximos, activo)
                          VALUES (@codigo, @descripcion, @tipo, @valor, 
                                  @inicio, @fin, @maximos, 1);
                          SELECT SCOPE_IDENTITY();";

            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@codigo", cupon.Codigo.ToUpper());
            cmd.Parameters.AddWithValue("@descripcion", (object?)cupon.Descripcion ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@tipo", cupon.TipoDescuento);
            cmd.Parameters.AddWithValue("@valor", cupon.ValorDescuento);
            cmd.Parameters.AddWithValue("@inicio", cupon.FechaInicio);
            cmd.Parameters.AddWithValue("@fin", cupon.FechaFin);
            cmd.Parameters.AddWithValue("@maximos", cupon.UsosMaximos);

            return Convert.ToInt32(cmd.ExecuteScalar());
        }

        public bool IncrementarUso(string codigo)
        {
            string sql = "UPDATE Cupones SET usos_actuales = usos_actuales + 1 WHERE codigo = @codigo";

            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@codigo", codigo.ToUpper());

            return cmd.ExecuteNonQuery() > 0;
        }

        public bool ToggleActivo(int id, bool activo)
        {
            string sql = "UPDATE Cupones SET activo = @activo WHERE id_cupon = @id";

            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@activo", activo);
            cmd.Parameters.AddWithValue("@id", id);

            return cmd.ExecuteNonQuery() > 0;
        }

        public decimal CalcularDescuento(Cupon cupon, decimal subtotal)
        {
            if (cupon.TipoDescuento == "porcentaje")
                return Math.Round(subtotal * (cupon.ValorDescuento / 100), 2);
            else
                return Math.Min(cupon.ValorDescuento, subtotal);
        }

        private Cupon MapCupon(SqlDataReader rs)
        {
            return new Cupon
            {
                IdCupon = rs.GetInt32(rs.GetOrdinal("id_cupon")),
                Codigo = rs.GetString(rs.GetOrdinal("codigo")),
                Descripcion = rs.IsDBNull(rs.GetOrdinal("descripcion")) ? null : rs.GetString(rs.GetOrdinal("descripcion")),
                TipoDescuento = rs.GetString(rs.GetOrdinal("tipo_descuento")),
                ValorDescuento = rs.GetDecimal(rs.GetOrdinal("valor_descuento")),
                FechaInicio = rs.GetDateTime(rs.GetOrdinal("fecha_inicio")),
                FechaFin = rs.GetDateTime(rs.GetOrdinal("fecha_fin")),
                UsosMaximos = rs.GetInt32(rs.GetOrdinal("usos_maximos")),
                UsosActuales = rs.GetInt32(rs.GetOrdinal("usos_actuales")),
                Activo = rs.GetBoolean(rs.GetOrdinal("activo")),
                FechaCreacion = rs.GetDateTime(rs.GetOrdinal("fecha_creacion"))
            };
        }
    }
}