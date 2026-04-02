using System;
using Xunit;
using HotelesAPI.Services;

namespace HotelesAPI.Tests
{
    public class ReservacionValidatorTests
    {
        [Fact]
        public void ValidarFechas_FechasValidas_NoLanzaExcepcion()
        {
            var checkIn  = DateTime.Today.AddDays(1);
            var checkOut = DateTime.Today.AddDays(3);
            var ex = Record.Exception(() => ReservacionValidator.ValidarFechas(checkIn, checkOut));
            Assert.Null(ex);
        }

        [Fact]
        public void ValidarFechas_CheckInEnPasado_LanzaArgumentException()
        {
            var checkIn  = DateTime.Today.AddDays(-1);
            var checkOut = DateTime.Today.AddDays(2);
            var ex = Assert.Throws<ArgumentException>(() =>
                ReservacionValidator.ValidarFechas(checkIn, checkOut));
            Assert.Equal("La fecha de check-in no puede ser en el pasado", ex.Message);
        }

        [Fact]
        public void ValidarFechas_CheckOutAnteriorCheckIn_LanzaArgumentException()
        {
            var checkIn  = DateTime.Today.AddDays(3);
            var checkOut = DateTime.Today.AddDays(1);
            var ex = Assert.Throws<ArgumentException>(() =>
                ReservacionValidator.ValidarFechas(checkIn, checkOut));
            Assert.Equal("La fecha de check-out debe ser posterior al check-in", ex.Message);
        }

        [Fact]
        public void ValidarFechas_CheckInIgualCheckOut_LanzaArgumentException()
        {
            var fecha = DateTime.Today.AddDays(2);
            var ex = Assert.Throws<ArgumentException>(() =>
                ReservacionValidator.ValidarFechas(fecha, fecha));
            Assert.Equal("La fecha de check-out debe ser posterior al check-in", ex.Message);
        }

        [Fact]
        public void ValidarCapacidad_HuespedesDentroDeCapacidad_NoLanzaExcepcion()
        {
            var ex = Record.Exception(() => ReservacionValidator.ValidarCapacidad(2, 4));
            Assert.Null(ex);
        }

        [Fact]
        public void ValidarCapacidad_HuespedesSuperanCapacidad_LanzaArgumentException()
        {
            var ex = Assert.Throws<ArgumentException>(() =>
                ReservacionValidator.ValidarCapacidad(5, 3));
            Assert.Contains("capacidad máxima de 3", ex.Message);
        }

        [Fact]
        public void ValidarCapacidad_HuespedesEnCero_LanzaArgumentException()
        {
            var ex = Assert.Throws<ArgumentException>(() =>
                ReservacionValidator.ValidarCapacidad(0, 4));
            Assert.Equal("El número de huéspedes debe ser mayor a 0", ex.Message);
        }

        [Fact]
        public void CalcularPrecioTotal_TresNochesA100_Retorna300()
        {
            var checkIn  = DateTime.Today.AddDays(1);
            var checkOut = DateTime.Today.AddDays(4);
            var total = ReservacionValidator.CalcularPrecioTotal(checkIn, checkOut, 100m);
            Assert.Equal(300m, total);
        }

        [Fact]
        public void CalcularPrecioTotal_PrecioNocheEnCero_LanzaArgumentException()
        {
            var checkIn  = DateTime.Today.AddDays(1);
            var checkOut = DateTime.Today.AddDays(3);
            var ex = Assert.Throws<ArgumentException>(() =>
                ReservacionValidator.CalcularPrecioTotal(checkIn, checkOut, 0m));
            Assert.Equal("El precio por noche debe ser mayor a 0", ex.Message);
        }

        [Fact]
        public void CalcularPrecioTotal_UnaNoches_RetornaPrecioNoche()
        {
            var checkIn  = DateTime.Today.AddDays(1);
            var checkOut = DateTime.Today.AddDays(2);
            var total = ReservacionValidator.CalcularPrecioTotal(checkIn, checkOut, 150m);
            Assert.Equal(150m, total);
        }

        [Fact]
        public void ValidarCancelacion_ReservacionYaCancelada_LanzaArgumentException()
        {
            var ex = Assert.Throws<ArgumentException>(() =>
                ReservacionValidator.ValidarCancelacion("Cancelada", DateTime.Today.AddDays(3)));
            Assert.Equal("La reservación ya está cancelada", ex.Message);
        }

        [Fact]
        public void ValidarCancelacion_CheckInHoy_LanzaArgumentException()
        {
            var ex = Assert.Throws<ArgumentException>(() =>
                ReservacionValidator.ValidarCancelacion("Confirmada", DateTime.Today));
            Assert.Equal("No se puede cancelar una reservación en curso o pasada", ex.Message);
        }

        [Fact]
        public void ValidarCancelacion_ReservacionFutura_NoLanzaExcepcion()
        {
            var ex = Record.Exception(() =>
                ReservacionValidator.ValidarCancelacion("Confirmada", DateTime.Today.AddDays(5)));
            Assert.Null(ex);
        }

        [Fact]
        public void ValidarModificacion_EstadoCancelada_LanzaArgumentException()
        {
            var checkIn  = DateTime.Today.AddDays(1);
            var checkOut = DateTime.Today.AddDays(3);
            var ex = Assert.Throws<ArgumentException>(() =>
                ReservacionValidator.ValidarModificacion("Cancelada", checkIn, checkOut));
            Assert.Contains("cancelada o completada", ex.Message);
        }

        [Fact]
        public void ValidarModificacion_FechasValidas_NoLanzaExcepcion()
        {
            var checkIn  = DateTime.Today.AddDays(1);
            var checkOut = DateTime.Today.AddDays(4);
            var ex = Record.Exception(() =>
                ReservacionValidator.ValidarModificacion("Confirmada", checkIn, checkOut));
            Assert.Null(ex);
        }
    }
}