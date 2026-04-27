/**
 * @file admin.controller.charts.js
 * @brief Funciones para alimentar las gráficas del dashboard administrativo.
 * @description Agregar estas funciones a `src/controllers/admin.controller.js`
 *              y exportarlas en el `module.exports` del mismo archivo.
 *
 * Devuelve en una sola llamada las 3 series:
 *   - ingresos por tipo de reserva (solo confirmadas)
 *   - búsquedas por tipo
 *   - usuarios registrados por día (últimos 30 días)
 */

/**
 * @brief Devuelve los datos consolidados para las 3 gráficas del dashboard.
 * @route GET /api/admin/dashboard/charts
 */
const dashboardCharts = async (req, res) => {
    try {
      // ── 1. Ingresos por tipo de reserva (solo confirmadas) ────────────
      // Mostramos también la cantidad de reservas para tooltip.
      const [ingresos] = await db.query(`
        SELECT tipo,
               COUNT(*)            AS cantidad,
               COALESCE(SUM(total), 0) AS total_ingresos
          FROM reservacion
         WHERE estado = 'confirmada'
         GROUP BY tipo
      `);
  
      // ── 2. Búsquedas por tipo ─────────────────────────────────────────
      // OJO: el buscador de paquetes inserta 2 filas (vuelo + hotel) en
      // historial_busqueda, no una de tipo 'paquete'. Para que la gráfica
      // refleje paquetes reales, los inferimos: cuando un mismo usuario
      // hace una búsqueda de vuelo y de hotel en la misma sesión (ventana
      // de 5 segundos) los contamos como 1 paquete y NO como vuelo+hotel.
      // Si prefieres no asumirlo, simplemente quita el bloque "paquetes".
      const [busquedasRaw] = await db.query(`
        SELECT tipo_busqueda AS tipo, COUNT(*) AS total
          FROM historial_busqueda
         GROUP BY tipo_busqueda
      `);
  
      const [[paquetes]] = await db.query(`
        SELECT COUNT(*) AS total
          FROM historial_busqueda h1
          JOIN historial_busqueda h2
            ON h1.id_usuario      = h2.id_usuario
           AND h1.tipo_busqueda   = 'vuelo'
           AND h2.tipo_busqueda   = 'hotel'
           AND ABS(TIMESTAMPDIFF(SECOND, h1.fecha_busqueda, h2.fecha_busqueda)) <= 5
         WHERE h1.id_usuario IS NOT NULL
      `);
  
      // Reorganizamos: restamos los paquetes inferidos de vuelo/hotel
      const mapaBusquedas = { vuelo: 0, hotel: 0, paquete: paquetes.total || 0 };
      busquedasRaw.forEach(b => {
        if (b.tipo === 'vuelo' || b.tipo === 'hotel') {
          mapaBusquedas[b.tipo] = b.total;
        }
      });
      if (mapaBusquedas.paquete > 0) {
        mapaBusquedas.vuelo = Math.max(0, mapaBusquedas.vuelo - mapaBusquedas.paquete);
        mapaBusquedas.hotel = Math.max(0, mapaBusquedas.hotel - mapaBusquedas.paquete);
      }
  
      const busquedas = [
        { tipo: 'vuelo',   total: mapaBusquedas.vuelo   },
        { tipo: 'hotel',   total: mapaBusquedas.hotel   },
        { tipo: 'paquete', total: mapaBusquedas.paquete },
      ];
  
      // ── 3. Usuarios registrados por día (últimos 30 días) ─────────────
      // Generamos el rango completo desde JS para no dejar huecos cuando
      // un día no tuvo registros. La consulta a BD trae solo los que sí.
      const [registrosRaw] = await db.query(`
        SELECT DATE(fecha_registro) AS dia,
               COUNT(*)             AS total
          FROM usuario
         WHERE fecha_registro >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
         GROUP BY DATE(fecha_registro)
         ORDER BY dia ASC
      `);
  
      const mapaRegistros = {};
      registrosRaw.forEach(r => {
        // r.dia puede venir como Date o string; normalizamos a YYYY-MM-DD
        const key = r.dia instanceof Date
          ? r.dia.toISOString().slice(0, 10)
          : String(r.dia).slice(0, 10);
        mapaRegistros[key] = r.total;
      });
  
      const registros = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        registros.push({ dia: key, total: mapaRegistros[key] || 0 });
      }
  
      return ok(res, {
        ingresos_por_tipo:    ingresos,
        busquedas_por_tipo:   busquedas,
        registros_por_dia:    registros,
      });
    } catch (e) {
      return err(res, e.message);
    }
  };
  
  // Recordá agregar `dashboardCharts` al module.exports del controller.
  module.exports.dashboardCharts = dashboardCharts;