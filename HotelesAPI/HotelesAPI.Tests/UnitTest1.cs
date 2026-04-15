using Xunit;

// ══════════════════════════════════════════════════════════════════════
// BEDLY — Unit Tests del Backend (C#)
// Herramienta: xUnit
// Proyecto:    HotelesAPI.Tests
// Archivo:     UnitTest1.cs
//
// Estas pruebas validan la lógica de negocio pura sin base de datos,
// equivalente a los tests Jest del frontend pero para el lado C#.
// ══════════════════════════════════════════════════════════════════════

namespace HotelesAPI.Tests
{
    // ══════════════════════════════════════════════════════════════════
    // SUITE 1 — ReservacionValidator
    // Prueba la clase estática de validación de reservaciones
    // ══════════════════════════════════════════════════════════════════
    public class ReservacionValidatorTests
    {
        // ------------------------------------------------------------------
        // TEST 1 — Fechas válidas no lanzan excepción
        // ------------------------------------------------------------------
        [Fact]
        public void ValidarFechas_FechasValidas_NoLanzaExcepcion()
        {
            // Arrange
            DateTime checkIn  = DateTime.Today.AddDays(5);
            DateTime checkOut = DateTime.Today.AddDays(8);

            // Act & Assert
            // Si no lanza excepción, el test pasa
            var excepcion = Record.Exception(() =>
                HotelesAPI.Services.ReservacionValidator.ValidarFechas(checkIn, checkOut));

            Assert.Null(excepcion);
        }

        // ------------------------------------------------------------------
        // TEST 2 — CheckIn en el pasado lanza ArgumentException
        // ------------------------------------------------------------------
        [Fact]
        public void ValidarFechas_CheckInEnPasado_LanzaArgumentException()
        {
            // Arrange
            DateTime checkIn  = DateTime.Today.AddDays(-1); // ayer
            DateTime checkOut = DateTime.Today.AddDays(2);

            // Act & Assert
            var ex = Assert.Throws<ArgumentException>(() =>
                HotelesAPI.Services.ReservacionValidator.ValidarFechas(checkIn, checkOut));

            Assert.Contains("pasado", ex.Message);
        }

        // ------------------------------------------------------------------
        // TEST 3 — CheckOut igual a CheckIn lanza ArgumentException
        // ------------------------------------------------------------------
        [Fact]
        public void ValidarFechas_CheckOutIgualCheckIn_LanzaArgumentException()
        {
            // Arrange
            DateTime checkIn  = DateTime.Today.AddDays(5);
            DateTime checkOut = DateTime.Today.AddDays(5); // misma fecha

            // Act & Assert
            var ex = Assert.Throws<ArgumentException>(() =>
                HotelesAPI.Services.ReservacionValidator.ValidarFechas(checkIn, checkOut));

            Assert.Contains("posterior", ex.Message);
        }

        // ------------------------------------------------------------------
        // TEST 4 — CheckOut anterior a CheckIn lanza ArgumentException
        // ------------------------------------------------------------------
        [Fact]
        public void ValidarFechas_CheckOutAnteriorCheckIn_LanzaArgumentException()
        {
            // Arrange
            DateTime checkIn  = DateTime.Today.AddDays(8);
            DateTime checkOut = DateTime.Today.AddDays(5); // antes del checkIn

            // Act & Assert
            var ex = Assert.Throws<ArgumentException>(() =>
                HotelesAPI.Services.ReservacionValidator.ValidarFechas(checkIn, checkOut));

            Assert.Contains("posterior", ex.Message);
        }

        // ------------------------------------------------------------------
        // TEST 5 — Capacidad válida no lanza excepción
        // ------------------------------------------------------------------
        [Fact]
        public void ValidarCapacidad_HuespedesDentroDelLimite_NoLanzaExcepcion()
        {
            // Arrange
            int numHuespedes = 2;
            int capacidadMax = 4;

            // Act & Assert
            var excepcion = Record.Exception(() =>
                HotelesAPI.Services.ReservacionValidator.ValidarCapacidad(numHuespedes, capacidadMax));

            Assert.Null(excepcion);
        }

        // ------------------------------------------------------------------
        // TEST 6 — Huéspedes exceden capacidad lanza ArgumentException
        // ------------------------------------------------------------------
        [Fact]
        public void ValidarCapacidad_HuespedesExcedenCapacidad_LanzaArgumentException()
        {
            // Arrange
            int numHuespedes = 5;
            int capacidadMax = 2;

            // Act & Assert
            var ex = Assert.Throws<ArgumentException>(() =>
                HotelesAPI.Services.ReservacionValidator.ValidarCapacidad(numHuespedes, capacidadMax));

            Assert.Contains("capacidad", ex.Message);
        }

        // ------------------------------------------------------------------
        // TEST 7 — 0 huéspedes lanza ArgumentException
        // ------------------------------------------------------------------
        [Fact]
        public void ValidarCapacidad_CeroHuespedes_LanzaArgumentException()
        {
            // Arrange
            int numHuespedes = 0;
            int capacidadMax = 4;

            // Act & Assert
            var ex = Assert.Throws<ArgumentException>(() =>
                HotelesAPI.Services.ReservacionValidator.ValidarCapacidad(numHuespedes, capacidadMax));

            Assert.Contains("0", ex.Message);
        }

        // ------------------------------------------------------------------
        // TEST 8 — Precio total se calcula correctamente
        // ------------------------------------------------------------------
        [Fact]
        public void CalcularPrecioTotal_DosNochesA1200_Retorna2400()
        {
            // Arrange
            DateTime checkIn    = new DateTime(2026, 7, 1);
            DateTime checkOut   = new DateTime(2026, 7, 3); // 2 noches
            decimal precioNoche = 1200m;

            // Act
            decimal total = HotelesAPI.Services.ReservacionValidator
                            .CalcularPrecioTotal(checkIn, checkOut, precioNoche);

            // Assert
            Assert.Equal(2400m, total);
        }

        // ------------------------------------------------------------------
        // TEST 9 — Precio noche en 0 lanza ArgumentException
        // ------------------------------------------------------------------
        [Fact]
        public void CalcularPrecioTotal_PrecioNocheCero_LanzaArgumentException()
        {
            // Arrange
            DateTime checkIn    = DateTime.Today.AddDays(1);
            DateTime checkOut   = DateTime.Today.AddDays(3);
            decimal precioNoche = 0m;

            // Act & Assert
            var ex = Assert.Throws<ArgumentException>(() =>
                HotelesAPI.Services.ReservacionValidator
                    .CalcularPrecioTotal(checkIn, checkOut, precioNoche));

            Assert.Contains("mayor a 0", ex.Message);
        }
    }

    // ══════════════════════════════════════════════════════════════════
    // SUITE 2 — CuponDAO.CalcularDescuento
    // Prueba el cálculo de descuentos sin necesitar base de datos
    // ══════════════════════════════════════════════════════════════════
    public class CuponCalculoTests
    {
        // Helper — crea un cupón de porcentaje
        private HotelesAPI.Models.Cupon CrearCuponPorcentaje(decimal valor) =>
            new HotelesAPI.Models.Cupon
            {
                Codigo         = "TEST10",
                TipoDescuento  = "porcentaje",
                ValorDescuento = valor,
                Activo         = true,
                FechaInicio    = DateTime.Today.AddDays(-1),
                FechaFin       = DateTime.Today.AddDays(30),
                UsosMaximos    = 100,
                UsosActuales   = 0
            };

        // Helper — crea un cupón de monto fijo
        private HotelesAPI.Models.Cupon CrearCuponFijo(decimal valor) =>
            new HotelesAPI.Models.Cupon
            {
                Codigo         = "FIJO50",
                TipoDescuento  = "fijo",
                ValorDescuento = valor,
                Activo         = true,
                FechaInicio    = DateTime.Today.AddDays(-1),
                FechaFin       = DateTime.Today.AddDays(30),
                UsosMaximos    = 100,
                UsosActuales   = 0
            };

        // ------------------------------------------------------------------
        // TEST 10 — Descuento porcentaje calcula correctamente
        // ------------------------------------------------------------------
        [Fact]
        public void CalcularDescuento_Porcentaje10_SobreQ1000_RetornaQ100()
        {
            // Arrange
            var dao    = new HotelesAPI.DAO.CuponDAO();
            var cupon  = CrearCuponPorcentaje(10m); // 10%
            decimal subtotal = 1000m;

            // Act
            decimal descuento = dao.CalcularDescuento(cupon, subtotal);

            // Assert
            Assert.Equal(100m, descuento); // 10% de 1000 = 100
        }

        // ------------------------------------------------------------------
        // TEST 11 — Descuento fijo no supera el subtotal
        // ------------------------------------------------------------------
        [Fact]
        public void CalcularDescuento_FijoMayorAlSubtotal_RetornaSubtotal()
        {
            // Arrange
            var dao      = new HotelesAPI.DAO.CuponDAO();
            var cupon    = CrearCuponFijo(500m); // descuento de Q500
            decimal subtotal = 200m;             // subtotal menor al descuento

            // Act
            decimal descuento = dao.CalcularDescuento(cupon, subtotal);

            // Assert
            Assert.Equal(200m, descuento); // no puede descontar más de lo que cuesta
        }

        // ------------------------------------------------------------------
        // TEST 12 — Descuento fijo menor al subtotal se aplica completo
        // ------------------------------------------------------------------
        [Fact]
        public void CalcularDescuento_FijoQ50_SobreQ300_RetornaQ50()
        {
            // Arrange
            var dao      = new HotelesAPI.DAO.CuponDAO();
            var cupon    = CrearCuponFijo(50m);
            decimal subtotal = 300m;

            // Act
            decimal descuento = dao.CalcularDescuento(cupon, subtotal);

            // Assert
            Assert.Equal(50m, descuento);
        }
    }
}