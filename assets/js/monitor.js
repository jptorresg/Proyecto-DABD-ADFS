function monitorAPI() {
    return {
        logs: [
            { id: 1, metodo: 'GET', endpoint: '/api/habitaciones', status: 200, tiempo: '15ms' },
            { id: 2, metodo: 'POST', endpoint: '/api/reservar', status: 201, tiempo: '45ms' },
            { id: 3, metodo: 'GET', endpoint: '/api/disponibilidad', status: 404, tiempo: '5ms' }
        ],
        jsonEjemplo: {
            "habitacion_id": 101,
            "fecha_inicio": "2026-02-15",
            "huesped": "Juan Perez",
            "agencia_id": "AG-TRAVEL-01"
        }
    }
}