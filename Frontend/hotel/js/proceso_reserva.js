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
            alert('Enviando reserva al sistema de Hoteles...');
            window.location.href = 'confirmacion.html';
        }
    }
}

function validarReserva(datos) {
    const errores = [];

    if (!datos.nombre || datos.nombre.trim() === '') {
        errores.push('El nombre del cliente es obligatorio');
    } else if (datos.nombre.trim().length < 3) {
        errores.push('El nombre debe tener al menos 3 caracteres');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!datos.email || datos.email.trim() === '') {
        errores.push('El email es obligatorio');
    } else if (!emailRegex.test(datos.email)) {
        errores.push('El formato del email no es válido');
    }

    if (!datos.noches || datos.noches <= 0) {
        errores.push('El número de noches debe ser mayor a 0');
    } else if (!Number.isInteger(datos.noches)) {
        errores.push('El número de noches debe ser un número entero');
    }

    if (!datos.precioNoche || datos.precioNoche <= 0) {
        errores.push('El precio por noche debe ser mayor a 0');
    }

    if (!datos.estado || datos.estado !== 'Disponible') {
        errores.push('La habitación no está disponible');
    }

    return {
        valido: errores.length === 0,
        errores: errores,
        total: errores.length === 0 ? datos.precioNoche * datos.noches : 0
    };
}

if (typeof module !== 'undefined') module.exports = { validarReserva };