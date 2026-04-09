package com.halcon.aerolineas.controllers;

import java.io.IOException;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.halcon.aerolineas.config.DatabaseConfig;

/**
 * Controlador para verificar el estado de salud de la aplicación.
 * <p>
 * Proporciona un endpoint simple para comprobar la conexión a la base de datos
 * y obtener estadísticas básicas del sistema.
 * </p>
 */
@WebServlet("/api/health")
public class HealthController extends HttpServlet {

    /**
     * Maneja las peticiones HTTP GET para obtener el estado de salud.
     * <p>
     * Realiza una consulta a la base de datos para verificar la conectividad
     * y contar el número total de vuelos registrados.
     * </p>
     *
     * @param request  Objeto {@code HttpServletRequest} con la solicitud del cliente.
     * @param response Objeto {@code HttpServletResponse} para enviar la respuesta.
     * @throws ServletException Si ocurre un error durante el procesamiento.
     * @throws IOException      Si ocurre un error de entrada/salida al escribir la respuesta.
     */
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try (Connection conn = DatabaseConfig.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT COUNT(*) AS total FROM VUELOS")) {

            rs.next();
            int total = rs.getInt("total");

            response.getWriter().print(
                "{\"status\":\"ok\",\"database\":\"connected\",\"totalVuelos\":" + total + "}"
            );

        } catch (Exception e) {
            response.setStatus(500);
            response.getWriter().print(
                "{\"status\":\"error\",\"message\":\"" + e.getMessage() + "\"}"
            );
        }
    }
}