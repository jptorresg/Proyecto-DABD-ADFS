function procesoReserva() {
    return {
        step: 1,
        datosCliente: { nombre: '', email: '', nit: '' },
        reserva: { 
            habitacion: 'Suite Ejecutiva', 
            precioNoche: 120, 
            noches: 1 
        },
        get total() {
            return this.reserva.precioNoche * this.reserva.noches;
        },
        confirmar() {
            // Aquí se enviaría el JSON al Backend en C#
            alert('Enviando reserva al sistema de Hoteles...');
            window.location.href = 'confirmacion.html';
        }
    }
}