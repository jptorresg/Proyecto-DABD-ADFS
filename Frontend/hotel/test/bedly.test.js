const { validarReserva } = require('../js/proceso_reserva');
const { filtrarHabitaciones } = require('../js/habitaciones');

// ══════════════════════════════════════════
// PRUEBAS — validarReserva
// ══════════════════════════════════════════

describe('validarReserva', () => {

    test('1. Reserva válida completa devuelve valido=true y total correcto', () => {
        const datos = {
            nombre: 'Juan Perez',
            email: 'juan@email.com',
            noches: 3,
            precioNoche: 120,
            estado: 'Disponible'
        };
        const resultado = validarReserva(datos);
        expect(resultado.valido).toBe(true);
        expect(resultado.errores).toHaveLength(0);
        expect(resultado.total).toBe(360);
    });

    test('2. Nombre vacío genera error', () => {
        const datos = {
            nombre: '',
            email: 'juan@email.com',
            noches: 2,
            precioNoche: 85,
            estado: 'Disponible'
        };
        const resultado = validarReserva(datos);
        expect(resultado.valido).toBe(false);
        expect(resultado.errores).toContain('El nombre del cliente es obligatorio');
        expect(resultado.total).toBe(0);
    });

    test('3. Email con formato inválido genera error', () => {
        const datos = {
            nombre: 'Maria Lopez',
            email: 'correo-invalido',
            noches: 1,
            precioNoche: 50,
            estado: 'Disponible'
        };
        const resultado = validarReserva(datos);
        expect(resultado.valido).toBe(false);
        expect(resultado.errores).toContain('El formato del email no es válido');
    });

    test('4. Noches con valor 0 genera error', () => {
        const datos = {
            nombre: 'Carlos Ruiz',
            email: 'carlos@email.com',
            noches: 0,
            precioNoche: 150,
            estado: 'Disponible'
        };
        const resultado = validarReserva(datos);
        expect(resultado.valido).toBe(false);
        expect(resultado.errores).toContain('El número de noches debe ser mayor a 0');
    });

    test('5. Habitación no disponible genera error', () => {
        const datos = {
            nombre: 'Ana García',
            email: 'ana@email.com',
            noches: 2,
            precioNoche: 85,
            estado: 'Ocupada'
        };
        const resultado = validarReserva(datos);
        expect(resultado.valido).toBe(false);
        expect(resultado.errores).toContain('La habitación no está disponible');
    });

});

// ══════════════════════════════════════════
// PRUEBAS — filtrarHabitaciones
// ══════════════════════════════════════════

const habitacionesMock = [
    { id: 1, nombre: 'Habitación Sencilla', precio: 50,  desc: 'Confort individual.' },
    { id: 2, nombre: 'Suite Ejecutiva',     precio: 120, desc: 'Perfecta para negocios.' },
    { id: 3, nombre: 'Habitación Doble',    precio: 85,  desc: 'Espacio para la familia.' }
];

describe('filtrarHabitaciones', () => {

    test('1. Sin criterios devuelve todas las habitaciones', () => {
        const resultado = filtrarHabitaciones(habitacionesMock, {});
        expect(resultado).toHaveLength(3);
    });

    test('2. Búsqueda por texto devuelve coincidencias correctas', () => {
        const resultado = filtrarHabitaciones(habitacionesMock, { busqueda: 'suite' });
        expect(resultado).toHaveLength(1);
        expect(resultado[0].nombre).toBe('Suite Ejecutiva');
    });

    test('3. Filtro por precio máximo devuelve solo habitaciones dentro del rango', () => {
        const resultado = filtrarHabitaciones(habitacionesMock, { precioMax: 85 });
        expect(resultado).toHaveLength(2);
        resultado.forEach(h => expect(h.precio).toBeLessThanOrEqual(85));
    });

    test('4. Ordenar por precio ascendente', () => {
        const resultado = filtrarHabitaciones(habitacionesMock, { orden: 'asc' });
        expect(resultado[0].precio).toBe(50);
        expect(resultado[1].precio).toBe(85);
        expect(resultado[2].precio).toBe(120);
    });

});