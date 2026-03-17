using Microsoft.Data.SqlClient;
using HotelesAPI.Config;
using HotelesAPI.Models;

namespace HotelesAPI.DAO
{
    public class HotelDAO
    {
        public List<Hotel> GetTodos()
        {
            var lista = new List<Hotel>();
            string sql = "SELECT * FROM Hoteles ORDER BY id_hotel";

            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            using var rs = cmd.ExecuteReader();
            while (rs.Read())
                lista.Add(MapHotel(rs));

            return lista;
        }

        public Hotel? GetById(int id)
        {
            string sql = "SELECT * FROM Hoteles WHERE id_hotel = @id";

            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@id", id);
            using var rs = cmd.ExecuteReader();

            if (rs.Read())
                return MapHotel(rs);

            return null;
        }

        public int Create(Hotel hotel)
        {
            string sql = @"INSERT INTO Hoteles (nombre_hotel, ubicacion, estrellas)
                          VALUES (@nombre, @ubicacion, @estrellas);
                          SELECT SCOPE_IDENTITY();";

            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@nombre", hotel.NombreHotel);
            cmd.Parameters.AddWithValue("@ubicacion", hotel.Ubicacion ?? "");
            cmd.Parameters.AddWithValue("@estrellas", hotel.Estrellas);

            return Convert.ToInt32(cmd.ExecuteScalar());
        }

        public bool Update(Hotel hotel)
        {
            string sql = @"UPDATE Hoteles SET
                          nombre_hotel = @nombre,
                          ubicacion = @ubicacion,
                          estrellas = @estrellas
                          WHERE id_hotel = @id";

            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@nombre", hotel.NombreHotel);
            cmd.Parameters.AddWithValue("@ubicacion", hotel.Ubicacion ?? "");
            cmd.Parameters.AddWithValue("@estrellas", hotel.Estrellas);
            cmd.Parameters.AddWithValue("@id", hotel.IdHotel);

            return cmd.ExecuteNonQuery() > 0;
        }

        public bool Delete(int id)
        {
            string sql = "DELETE FROM Hoteles WHERE id_hotel = @id";

            using var conn = DatabaseConfig.GetConnection();
            conn.Open();
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@id", id);

            return cmd.ExecuteNonQuery() > 0;
        }

        private Hotel MapHotel(SqlDataReader rs)
        {
            return new Hotel
            {
                IdHotel = rs.GetInt32(rs.GetOrdinal("id_hotel")),
                NombreHotel = rs.GetString(rs.GetOrdinal("nombre_hotel")),
                Ubicacion = rs.IsDBNull(rs.GetOrdinal("ubicacion")) ? "" : rs.GetString(rs.GetOrdinal("ubicacion")),
                Estrellas = rs.IsDBNull(rs.GetOrdinal("estrellas")) ? 0 : rs.GetInt32(rs.GetOrdinal("estrellas"))
            };
        }
    }
}