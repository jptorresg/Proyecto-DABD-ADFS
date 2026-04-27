package com.halcon.aerolineas.services;

import com.halcon.aerolineas.dao.AdminDAO;
import com.halcon.aerolineas.utils.PasswordUtil;

import java.math.BigDecimal;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

/**
 * Servicio de lógica de negocio para operaciones administrativas.
 * <p>
 * Actúa como capa intermedia entre los controladores y el DAO de administración,
 * proporcionando estadísticas generales del sistema y gestión de usuarios.
 * </p>
 */
public class AdminService {

    private AdminDAO adminDAO;

    /**
     * Constructor que inicializa el servicio con una instancia de {@link AdminDAO}.
     */
    public AdminService() {
        this.adminDAO = new AdminDAO();
    }

    /**
     * Obtiene estadísticas generales del sistema.
     * <p>
     * El mapa devuelto contiene las siguientes claves:
     * <ul>
     *   <li>{@code vuelosActivos}       - Número de vuelos actualmente activos.</li>
     *   <li>{@code reservacionesMes}    - Total de reservaciones realizadas en el mes actual.</li>
     *   <li>{@code usuariosRegistrados} - Total de usuarios registrados en el sistema.</li>
     *   <li>{@code ingresosEstimados}   - Ingresos totales estimados del mes actual.</li>
     * </ul>
     * 
     *
     * @return Mapa con las estadísticas del sistema.
     * @throws SQLException Si ocurre un error en la consulta a la base de datos.
     */
    public Map<String, Object> obtenerEstadisticas() throws SQLException {

        Map<String, Object> stats = new HashMap<>();

        stats.put("vuelosActivos", adminDAO.contarVuelosActivosHoy());
        stats.put("reservacionesMes", adminDAO.contarReservacionesMes());
        stats.put("usuariosRegistrados", adminDAO.contarUsuarios());
        stats.put("ingresosEstimados", adminDAO.calcularIngresosMes());

        return stats;
    }

    /**
     * Obtiene la lista completa de usuarios registrados en el sistema.
     * <p>
     * Los resultados incluyen la información del país de origen y se ordenan
     * por fecha de registro en orden descendente (los más recientes primero).
     * </p>
     *
     * @return Lista de objetos {@link Map} con la información de cada usuario.
     * @throws SQLException Si ocurre un error en la consulta a la base de datos.
     */
    public List<Map<String, Object>> obtenerUsuarios() throws SQLException {
        return adminDAO.obtenerUsuarios();
    }

    /**
     * Obtiene las reservaciones recientes de los usuarios.
     * <p>
     * Los resultados se ordenan por fecha de reserva en orden descendente
     * (las más recientes primero).
     * </p>
     *
     * @param limit Límite de reservaciones a obtener.
     * @return Lista de objetos {@link Map} con la información de cada reserva.
     * @throws SQLException Si ocurre un error en la consulta a la base de datos.
     */
    public List<Map<String, Object>> obtenerReservacionesRecientes(int limit) throws SQLException {
        return adminDAO.obtenerReservacionesRecientes(limit);
    }

    /**
     * Obtiene las reservaciones realizadas en los últimos 7 días.
     * <p>
     * Los resultados se ordenan por fecha de reserva en orden descendente
     * (las más recientes primero).
     * </p>
     *
     * @return Lista de objetos {@link Map} con la información de cada reserva.
     * @throws SQLException Si ocurre un error en la consulta a la base de datos.
     */
    public List<Map<String, Object>> obtenerReservacionesUltimos7Dias() throws SQLException {
        return adminDAO.obtenerReservacionesUltimos7Dias();
    }

    /**
     * Obtiene todas las reservaciones realizadas en el sistema.
     * <p>
     * Los resultados se ordenan por fecha de reserva en orden descendente
     * (las más recientes primero).
     * </p>
     *
     * @return Lista de objetos {@link Map} con la información de cada reserva.
     * @throws SQLException Si ocurre un error en la consulta a la base de datos.
     */
    public List<Map<String, Object>> obtenerTodasReservaciones() throws SQLException {
        return adminDAO.obtenerTodasReservaciones();
    }

    /**
     * Actualiza el rol del usuario especificado.
     * <p>
     * Delega la operación en el método correspondiente del {@link AdminDAO}.
     * </p>
     *
     * @param userId   Identificador del usuario a actualizar.
     * @param nuevoRol Nuevo rol para el usuario.
     * @return {@code true} si se actualizó correctamente, {@code false} en caso contrario.
     * @throws SQLException Si ocurre un error en la consulta a la base de datos.
     */
    public boolean actualizarRolUsuario(int userId, String nuevoRol) throws SQLException {
        return adminDAO.actualizarRolUsuario(userId, nuevoRol);
    }

    /**
     * Actualiza el estado de actividad del usuario especificado.
     * <p>
     * Delega la operación en el método correspondiente del {@link AdminDAO}.
     * </p>
     *
     * @param userId Identificador del usuario a actualizar.
     * @return {@code true} si se actualizó correctamente, {@code false} en caso contrario.
     * @throws SQLException Si ocurre un error en la consulta a la base de datos.
     */
    public boolean toggleActivoUsuario(int userId) throws SQLException {
        return adminDAO.toggleActivoUsuario(userId);
    }
}