/**
 * @file admin.routes.charts.patch.js
 * @brief Línea a agregar en `src/routes/admin.routes.js`.
 *
 * Agregar esta línea en la sección "RUTAS DEL DASHBOARD",
 * justo después de la ruta /dashboard:
 */

router.get('/dashboard/charts', ...isAdmin, ctrl.dashboardCharts);