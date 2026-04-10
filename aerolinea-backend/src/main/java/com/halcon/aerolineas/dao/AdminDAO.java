package com.halcon.aerolineas.dao;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.halcon.aerolineas.config.DatabaseConfig;

/**
 * Clase de acceso a datos para operaciones administrativas.
 * <p>
 * Proporciona métodos para obtener estadísticas del sistema, listar usuarios
 * y actualizar roles de usuario.
 * </p>
 */
public class AdminDAO {

    /**
     * Cuenta el número de vuelos activos en el sistema.
     *
     * @return El número de vuelos activos.
     * @throws SQLException Si ocurre un error en la consulta a la base de datos.
     */
    public int contarVuelosActivosHoy() throws SQLException {

        String sql =
            "SELECT COUNT(*) " +
            "FROM VUELOS " +
            "WHERE estado = 'ACTIVO' ";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            if (rs.next()) {
                return rs.getInt(1);
            }
        } catch (Exception e) {
            e.printStackTrace();   // 👈 LOG IMPORTANTE
        }

        return 0;
    }

    /**
     * Cuenta el número total de usuarios registrados en la base de datos.
     *
     * @return El número de usuarios.
     * @throws SQLException Si ocurre un error en la consulta a la base de datos.
     */
    public int contarUsuarios() throws SQLException {

        String sql = "SELECT COUNT(*) FROM USUARIOS";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            if (rs.next()) {
                return rs.getInt(1);
            }
        } catch (Exception e) {
            e.printStackTrace();   // 👈 LOG IMPORTANTE
        }

        return 0;
    }

    /**
     * Calcula el ingreso total del mes actual.
     * <p>
     * Realiza una consulta SQL para obtener la suma de los precios totales de las
     * reservaciones realizadas en el mes y año en curso. Utiliza la función
     * {@code NVL} para retornar 0 en caso de no haber registros.
     * </p>
     *
     * @return El ingreso total del mes actual.
     * @throws SQLException Si ocurre un error en la consulta a la base de datos.
     */
    public double calcularIngresosMes() throws SQLException {

        String sql =
            "SELECT NVL(SUM(precio_total),0) " +
            "FROM RESERVACIONES " +
            "WHERE EXTRACT(MONTH FROM fecha_compra) = EXTRACT(MONTH FROM SYSDATE)" +
            "AND EXTRACT(YEAR FROM fecha_compra) = EXTRACT(YEAR FROM SYSDATE)";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            if (rs.next()) {
                return rs.getDouble(1);
            }
        } catch (Exception e) {
            e.printStackTrace();   // 👈 LOG IMPORTANTE
        }

        return 0;
    }

    /**
     * Cuenta el número de reservaciones realizadas en el mes actual.
     *
     * @return El número de reservaciones del mes.
     */
    public int contarReservacionesMes() {

        String sql =
            "SELECT COUNT(*) " +
            "FROM RESERVACIONES " +
            "WHERE EXTRACT(MONTH FROM FECHA_COMPRA) = EXTRACT(MONTH FROM SYSDATE) " +
            "AND EXTRACT(YEAR FROM FECHA_COMPRA) = EXTRACT(YEAR FROM SYSDATE)";

        try (Connection conn = DatabaseConfig.getConnection();
            PreparedStatement stmt = conn.prepareStatement(sql);
            ResultSet rs = stmt.executeQuery()) {

            if (rs.next()) {
                return rs.getInt(1);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return 0;
    }

    /**
     * Obtiene una lista de todos los usuarios del sistema.
     * <p>
     * Cada elemento de la lista es un {@code Map} con los siguientes campos:
     * <ul>
     *   <li>{@code id}            - Identificador del usuario.</li>
     *   <li>{@code email}         - Correo electrónico.</li>
     *   <li>{@code nombres}       - Nombres del usuario.</li>
     *   <li>{@code apellidos}     - Apellidos del usuario.</li>
     *   <li>{@code edad}          - Edad.</li>
     *   <li>{@code pais}          - País de origen.</li>
     *   <li>{@code numPasaporte}  - Número de pasaporte.</li>
     *   <li>{@code tipoUsuario}   - Rol del usuario (ej. "ADMIN", "CLIENTE").</li>
     *   <li>{@code fechaRegistro} - Fecha de registro.</li>
     *   <li>{@code activo}        - Estado (1: activo, 0: inactivo).</li>
     * </ul>
     * 
     *
     * @return La lista de usuarios del sistema.
     */
    public List<Map<String, Object>> obtenerUsuarios() {

        List<Map<String, Object>> usuarios = new ArrayList<>();

        String sql =
            "SELECT ID_USUARIO, EMAIL, NOMBRES, APELLIDOS, EDAD, PAIS_ORIGEN, " +
            "NUM_PASAPORTE, TIPO_USUARIO, FECHA_REGISTRO, ACTIVO " +
            "FROM USUARIOS";

        try (Connection conn = DatabaseConfig.getConnection();
            PreparedStatement stmt = conn.prepareStatement(sql);
            ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {

                Map<String, Object> user = new HashMap<>();

                user.put("id", rs.getInt("ID_USUARIO"));
                user.put("email", rs.getString("EMAIL"));
                user.put("nombres", rs.getString("NOMBRES"));
                user.put("apellidos", rs.getString("APELLIDOS"));
                user.put("edad", rs.getInt("EDAD"));
                user.put("pais", rs.getString("PAIS_ORIGEN"));
                user.put("numPasaporte", rs.getString("NUM_PASAPORTE"));
                user.put("tipoUsuario", rs.getString("TIPO_USUARIO"));
                user.put("fechaRegistro", rs.getDate("FECHA_REGISTRO"));
                user.put("activo", rs.getInt("ACTIVO"));

                usuarios.add(user);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return usuarios;
    }

    /**
     * Actualiza el rol del usuario especificado.
     *
     * @param userId   Identificador del usuario a actualizar.
     * @param nuevoRol Nuevo rol para el usuario.
     * @return {@code true} si se actualizó correctamente, {@code false} en caso contrario.
     */
    public boolean actualizarRolUsuario(int userId, String nuevoRol) {

        String sql = 
            "UPDATE USUARIOS " +
            "SET TIPO_USUARIO = ? " +
            "WHERE ID_USUARIO = ?";

        try (Connection conn = DatabaseConfig.getConnection();
            PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, nuevoRol);
            stmt.setInt(2, userId);

            int rows = stmt.executeUpdate();

            return rows > 0;

        } catch (Exception e) {
            e.printStackTrace();
        }

        return false;
    }
}