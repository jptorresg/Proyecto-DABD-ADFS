/**
 * @fileoverview Unit Tests del Frontend — Bedly (Sistema de Hoteles)
 * Herramienta : Jest
 * Archivo     : bedly.test.js
 * Ubicación   : Frontend/hotel/test/bedly.test.js
 *
 * Cubre 2 módulos:
 *   1. proceso_reserva.js  → validarReserva()
 *   2. habitaciones.js     → filtrarHabitaciones()
 */

const { validarReserva }      = require('../js/proceso_reserva');
const { filtrarHabitaciones } = require('../js/habitaciones');

// ═══════════════════════════════════════════════════════════════════════════
// SUITE 1 — validarReserva (proceso_reserva.js)
// ═══════════════════════════════════════════════════════════════════════════
describe('validarReserva', () => {

    // Objeto base válido reutilizable en cada test
    const datosValidos = {
        nombre     : 'José Rueda',
        email      : 'jose@hoteles.com',
        noches     : 3,
        precioNoche: 120,
        estado     : 'Disponible'
    };

    // ─────────────────────────────────────────────────────────────────────
    // FE-T01  Todos los datos válidos → valido=true y total correcto
    // ─────────────────────────────────────────────────────────────────────
    test('FE-T01: datos válidos retornan valido=true y total=360', () => {
        const resultado = validarReserva(datosValidos);

        expect(resultado.valido).toBe(true);
        expect(resultado.errores).toHaveLength(0);
        expect(resultado.total).toBe(360); // 120 * 3
    });

    // ─────────────────────────────────────────────────────────────────────
    // FE-T02  Nombre vacío → error "obligatorio"
    // ─────────────────────────────────────────────────────────────────────
    test('FE-T02: nombre vacío agrega error de obligatorio', () => {
        const resultado = validarReserva({ ...datosValidos, nombre: '' });

        expect(resultado.valido).toBe(false);
        expect(resultado.errores.some(e => e.includes('obligatorio'))).toBe(true);
    });

    // ─────────────────────────────────────────────────────────────────────
    // FE-T03  Nombre con menos de 3 caracteres → error "3 caracteres"
    // ─────────────────────────────────────────────────────────────────────
    test('FE-T03: nombre con menos de 3 caracteres agrega error', () => {
        const resultado = validarReserva({ ...datosValidos, nombre: 'Jo' });

        expect(resultado.valido).toBe(false);
        expect(resultado.errores.some(e => e.includes('3 caracteres'))).toBe(true);
    });

    // ─────────────────────────────────────────────────────────────────────
    // FE-T04  Email sin @ → error "formato"
    // ─────────────────────────────────────────────────────────────────────
    test('FE-T04: email sin @ agrega error de formato', () => {
        const resultado = validarReserva({ ...datosValidos, email: 'josehoteles.com' });

        expect(resultado.valido).toBe(false);
        expect(resultado.errores.some(e => e.includes('formato'))).toBe(true);
    });

    // ─────────────────────────────────────────────────────────────────────
    // FE-T05  Email vacío → error "obligatorio"
    // ─────────────────────────────────────────────────────────────────────
    test('FE-T05: email vacío agrega error de obligatorio', () => {
        const resultado = validarReserva({ ...datosValidos, email: '' });

        expect(resultado.valido).toBe(false);
        expect(resultado.errores.some(e => e.includes('obligatorio'))).toBe(true);
    });

    // ─────────────────────────────────────────────────────────────────────
    // FE-T06  Noches = 0 → error "mayor a 0"
    // ─────────────────────────────────────────────────────────────────────
    test('FE-T06: noches=0 agrega error de mayor a 0', () => {
        const resultado = validarReserva({ ...datosValidos, noches: 0 });

        expect(resultado.valido).toBe(false);
        expect(resultado.errores.some(e => e.includes('mayor a 0'))).toBe(true);
    });

    // ─────────────────────────────────────────────────────────────────────
    // FE-T07  Noches negativas → error "mayor a 0"
    // ─────────────────────────────────────────────────────────────────────
    test('FE-T07: noches negativas agrega error de mayor a 0', () => {
        const resultado = validarReserva({ ...datosValidos, noches: -2 });

        expect(resultado.valido).toBe(false);
        expect(resultado.errores.some(e => e.includes('mayor a 0'))).toBe(true);
    });

    // ─────────────────────────────────────────────────────────────────────
    // FE-T08  Noches decimales → error "entero"
    // ─────────────────────────────────────────────────────────────────────
    test('FE-T08: noches decimales agrega error de número entero', () => {
        const resultado = validarReserva({ ...datosValidos, noches: 1.5 });

        expect(resultado.valido).toBe(false);
        expect(resultado.errores.some(e => e.includes('entero'))).toBe(true);
    });

    // ─────────────────────────────────────────────────────────────────────
    // FE-T09  Precio noche = 0 → error "mayor a 0"
    // ─────────────────────────────────────────────────────────────────────
    test('FE-T09: precioNoche=0 agrega error de mayor a 0', () => {
        const resultado = validarReserva({ ...datosValidos, precioNoche: 0 });

        expect(resultado.valido).toBe(false);
        expect(resultado.errores.some(e => e.includes('mayor a 0'))).toBe(true);
    });

    // ─────────────────────────────────────────────────────────────────────
    // FE-T10  Habitación no disponible → error "disponible"
    // ─────────────────────────────────────────────────────────────────────
    test('FE-T10: estado Ocupada agrega error de no disponible', () => {
        const resultado = validarReserva({ ...datosValidos, estado: 'Ocupada' });

        expect(resultado.valido).toBe(false);
        expect(resultado.errores.some(e => e.includes('disponible'))).toBe(true);
    });

    // ─────────────────────────────────────────────────────────────────────
    // FE-T11  Datos inválidos → total es 0
    // ─────────────────────────────────────────────────────────────────────
    test('FE-T11: datos inválidos retornan total=0', () => {
        const resultado = validarReserva({ ...datosValidos, nombre: '' });

        expect(resultado.total).toBe(0);
    });

    // ─────────────────────────────────────────────────────────────────────
    // FE-T12  1 noche a Q380 → total=380
    // ─────────────────────────────────────────────────────────────────────
    test('FE-T12: 1 noche a Q380 retorna total=380', () => {
        const resultado = validarReserva({ ...datosValidos, noches: 1, precioNoche: 380 });

        expect(resultado.valido).toBe(true);
        expect(resultado.total).toBe(380);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// SUITE 2 — filtrarHabitaciones (habitaciones.js)
// ═══════════════════════════════════════════════════════════════════════════
describe('filtrarHabitaciones', () => {

    // Dataset base reutilizable
    const habitaciones = [
        { id: 1, nombre: 'Habitación Sencilla', precio: 50,  desc: 'Confort individual.' },
        { id: 2, nombre: 'Suite Ejecutiva',     precio: 120, desc: 'Perfecta para negocios.' },
        { id: 3, nombre: 'Habitación Doble',    precio: 85,  desc: 'Espacio para la familia.' }
    ];

    // ─────────────────────────────────────────────────────────────────────
    // FE-T13  Sin criterios → retorna todas las habitaciones
    // ─────────────────────────────────────────────────────────────────────
    test('FE-T13: sin criterios retorna todas las habitaciones', () => {
        const resultado = filtrarHabitaciones(habitaciones, {});

        expect(resultado).toHaveLength(3);
    });

    // ─────────────────────────────────────────────────────────────────────
    // FE-T14  Búsqueda "suite" → retorna solo Suite Ejecutiva
    // ─────────────────────────────────────────────────────────────────────
    test('FE-T14: búsqueda "suite" retorna solo Suite Ejecutiva', () => {
        const resultado = filtrarHabitaciones(habitaciones, { busqueda: 'suite' });

        expect(resultado).toHaveLength(1);
        expect(resultado[0].nombre).toBe('Suite Ejecutiva');
    });

    // ─────────────────────────────────────────────────────────────────────
    // FE-T15  Búsqueda en descripción "familia" → retorna Habitación Doble
    // ─────────────────────────────────────────────────────────────────────
    test('FE-T15: búsqueda "familia" en descripción retorna Habitación Doble', () => {
        const resultado = filtrarHabitaciones(habitaciones, { busqueda: 'familia' });

        expect(resultado).toHaveLength(1);
        expect(resultado[0].nombre).toBe('Habitación Doble');
    });

    // ─────────────────────────────────────────────────────────────────────
    // FE-T16  Búsqueda sin coincidencias → retorna lista vacía
    // ─────────────────────────────────────────────────────────────────────
    test('FE-T16: búsqueda sin coincidencias retorna lista vacía', () => {
        const resultado = filtrarHabitaciones(habitaciones, { busqueda: 'penthouse' });

        expect(resultado).toHaveLength(0);
    });

    // ─────────────────────────────────────────────────────────────────────
    // FE-T17  precioMax=85 → retorna habitaciones con precio ≤ 85
    // ─────────────────────────────────────────────────────────────────────
    test('FE-T17: precioMax=85 retorna habitaciones con precio <= 85', () => {
        const resultado = filtrarHabitaciones(habitaciones, { precioMax: 85 });

        expect(resultado).toHaveLength(2);
        resultado.forEach(h => expect(h.precio).toBeLessThanOrEqual(85));
    });

    // ─────────────────────────────────────────────────────────────────────
    // FE-T18  precioMin=85 → retorna habitaciones con precio ≥ 85
    // ─────────────────────────────────────────────────────────────────────
    test('FE-T18: precioMin=85 retorna habitaciones con precio >= 85', () => {
        const resultado = filtrarHabitaciones(habitaciones, { precioMin: 85 });

        expect(resultado).toHaveLength(2);
        resultado.forEach(h => expect(h.precio).toBeGreaterThanOrEqual(85));
    });

    // ─────────────────────────────────────────────────────────────────────
    // FE-T19  orden asc → primera habitación tiene el precio más bajo
    // ─────────────────────────────────────────────────────────────────────
    test('FE-T19: orden asc retorna habitaciones de menor a mayor precio', () => {
        const resultado = filtrarHabitaciones(habitaciones, { orden: 'asc' });

        expect(resultado[0].precio).toBe(50);
        expect(resultado[1].precio).toBe(85);
        expect(resultado[2].precio).toBe(120);
    });

    // ─────────────────────────────────────────────────────────────────────
    // FE-T20  orden desc → primera habitación tiene el precio más alto
    // ─────────────────────────────────────────────────────────────────────
    test('FE-T20: orden desc retorna habitaciones de mayor a menor precio', () => {
        const resultado = filtrarHabitaciones(habitaciones, { orden: 'desc' });

        expect(resultado[0].precio).toBe(120);
        expect(resultado[1].precio).toBe(85);
        expect(resultado[2].precio).toBe(50);
    });

    // ─────────────────────────────────────────────────────────────────────
    // FE-T21  busqueda + precioMax combinados → filtro múltiple
    // ─────────────────────────────────────────────────────────────────────
    test('FE-T21: búsqueda "habitación" con precioMax=60 retorna solo Sencilla', () => {
        const resultado = filtrarHabitaciones(habitaciones, {
            busqueda : 'habitación',
            precioMax: 60
        });

        expect(resultado).toHaveLength(1);
        expect(resultado[0].nombre).toBe('Habitación Sencilla');
    });

    // ─────────────────────────────────────────────────────────────────────
    // FE-T22  No modifica el array original (inmutabilidad)
    // ─────────────────────────────────────────────────────────────────────
    test('FE-T22: la función no modifica el array original', () => {
        const copia = [...habitaciones];
        filtrarHabitaciones(habitaciones, { orden: 'desc' });

        expect(habitaciones[0].nombre).toBe(copia[0].nombre);
        expect(habitaciones[1].nombre).toBe(copia[1].nombre);
        expect(habitaciones[2].nombre).toBe(copia[2].nombre);
    });
});
