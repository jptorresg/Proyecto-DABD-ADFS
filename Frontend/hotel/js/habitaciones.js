function dataHabitaciones() {
    return {
        search: '',
        habitaciones: [
            { id: 1, nombre: 'Habitación Sencilla', precio: 50, img: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=400', desc: 'Confort individual.' },
            { id: 2, nombre: 'Suite Ejecutiva', precio: 120, img: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=400', desc: 'Perfecta para negocios.' },
            { id: 3, nombre: 'Habitación Doble', precio: 85, img: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=400', desc: 'Espacio para la familia.' }
        ]
    }
}

function filtrarHabitaciones(habitaciones, criterios) {
    let resultado = [...habitaciones];

    if (criterios.busqueda && criterios.busqueda.trim() !== '') {
        const busq = criterios.busqueda.toLowerCase().trim();
        resultado = resultado.filter(h =>
            h.nombre.toLowerCase().includes(busq) ||
            h.desc.toLowerCase().includes(busq)
        );
    }

    if (criterios.precioMax && criterios.precioMax > 0) {
        resultado = resultado.filter(h => h.precio <= criterios.precioMax);
    }

    if (criterios.precioMin && criterios.precioMin > 0) {
        resultado = resultado.filter(h => h.precio >= criterios.precioMin);
    }

    if (criterios.orden === 'asc') {
        resultado.sort((a, b) => a.precio - b.precio);
    } else if (criterios.orden === 'desc') {
        resultado.sort((a, b) => b.precio - a.precio);
    }

    return resultado;
}

if (typeof module !== 'undefined') module.exports = { filtrarHabitaciones };