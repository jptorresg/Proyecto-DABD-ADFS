function adminDashboard() {

    return {

        stats: {
            vuelosActivos: 0,
            reservacionesMes: 0,
            usuariosRegistrados: 0,
            ingresosEstimados: 0
        },

        async init() {

            await this.cargarStats()

        },

        async cargarStats() {

            try {

                const response = await fetch("/api/admin/stats")

                const data = await response.json()

                if (data.success) {

                    this.stats = data.data

                }

            } catch (error) {

                console.error("Error cargando stats:", error)

            }

        },

        formatCurrency(value) {

            return new Intl.NumberFormat("es-GT", {
                style: "currency",
                currency: "GTQ"
            }).format(value)

        }

    }

}