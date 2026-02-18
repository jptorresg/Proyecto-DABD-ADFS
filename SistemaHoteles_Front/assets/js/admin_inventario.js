function gestionInventario() {
    return {
        habitaciones: [
            { id: 101, tipo: 'Suite', precio: 150, estado: 'Disponible' },
            { id: 102, tipo: 'Doble', precio: 85, estado: 'Ocupada' },
            { id: 103, tipo: 'Sencilla', precio: 50, estado: 'Mantenimiento' }
        ],
        nuevaHab: { id: '', tipo: '', precio: '', estado: 'Disponible' },
        agregarHabitacion() {
            this.habitaciones.push({...this.nuevaHab});
            this.nuevaHab = { id: '', tipo: '', precio: '', estado: 'Disponible' };
            // Aquí se cerraría el modal automáticamente
        },
        eliminar(id) {
            this.habitaciones = this.habitaciones.filter(h => h.id !== id);
        }
    }
}