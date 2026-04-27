package com.halcon.aerolineas.controllers;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.halcon.aerolineas.services.AdminService;
import com.halcon.aerolineas.utils.JsonResponse;

/**
 * Controlador para las operaciones de administración.
 * <p>
 * Maneja las peticiones HTTP dirigidas a {@code /api/admin/*} y proporciona
 * endpoints para obtener estadísticas de la aplicación, listar usuarios y
 * actualizar roles de usuario.
 * </p>
 * <p>
 * Métodos soportados:
 * <ul>
 *   <li>GET  /api/admin/stats      - Obtiene estadísticas generales</li>
 *   <li>GET  /api/admin/usuarios   - Obtiene lista de usuarios</li>
 *   <li>PUT  /api/admin/usuarios/{id}/rol - Actualiza el rol de un usuario</li>
 * </ul>
 * 
 */
@WebServlet("/api/admin/*")
public class AdminController extends HttpServlet {

    private AdminService adminService;

    /**
     * Inicializa el servicio de administración.
     * <p>
     * Este método es invocado automáticamente por el contenedor de servlets
     * cuando se carga el servlet.
     * </p>
     */
    @Override
    public void init() {
        adminService = new AdminService();
    }

    /**
     * Maneja las peticiones HTTP GET.
     * <p>
     * Endpoints disponibles:
     * <ul>
     *   <li>{@code /api/admin/stats}    - Devuelve estadísticas de la aplicación.</li>
     *   <li>{@code /api/admin/usuarios} - Devuelve la lista de usuarios registrados.</li>
     * </ul>
     * 
     *
     * @param request  Objeto {@code HttpServletRequest} con la solicitud del cliente.
     * @param response Objeto {@code HttpServletResponse} para enviar la respuesta.
     * @throws IOException Si ocurre un error de entrada/salida al escribir la respuesta.
     */
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws IOException {

        response.setContentType("application/json");
        PrintWriter out = response.getWriter();

        String path = request.getPathInfo();

        try {

            if (path == null || path.equals("/stats")) {

                Map<String, Object> stats = adminService.obtenerEstadisticas();
                out.print(JsonResponse.success(stats));

            } else if (path.equals("/usuarios")) {

                List<Map<String, Object>> usuarios = adminService.obtenerUsuarios();
                out.print(JsonResponse.success(usuarios));

            } else if (path.equals("/reservaciones/recientes")) {

                String limitParam = request.getParameter("limit");
                int limit = (limitParam != null) ? Integer.parseInt(limitParam) : 5;

                List<Map<String, Object>> reservaciones = adminService.obtenerReservacionesRecientes(limit);
                out.print(JsonResponse.success(reservaciones));

            } else if (path.equals("/reservaciones/ultimos7dias")) {

                List<Map<String, Object>> data = adminService.obtenerReservacionesUltimos7Dias();
                out.print(JsonResponse.success(data));

            } else if (path.equals("/reservaciones")) {

                List<Map<String, Object>> reservaciones = adminService.obtenerTodasReservaciones();
                out.print(JsonResponse.success(reservaciones));

            }

        } catch (Exception e) {

            response.setStatus(500);
            out.print(JsonResponse.error(e.getMessage()));

        }
    }

    /**
     * Maneja las peticiones HTTP PUT.
     * <p>
     * Endpoint disponible:
     * <ul>
     *   <li>{@code /api/admin/usuarios/{id}/rol} - Actualiza el rol de un usuario
     *       específico. El cuerpo de la solicitud debe contener un JSON con el campo
     *       {@code tipoUsuario} con el nuevo rol.</li>
     * </ul>
     * 
     *
     * @param request  Objeto {@code HttpServletRequest} que contiene la ruta con el ID
     *                 del usuario y el JSON con el nuevo rol.
     * @param response Objeto {@code HttpServletResponse} para enviar la respuesta.
     * @throws IOException Si ocurre un error de entrada/salida al leer el cuerpo o escribir la respuesta.
     */
    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response)
            throws IOException {

        response.setContentType("application/json");
        PrintWriter out = response.getWriter();

        String path = request.getPathInfo();

        try {

            if (path.matches("/usuarios/\\d+/rol")) {

                String[] parts = path.split("/");
                int userId = Integer.parseInt(parts[2]);

                BufferedReader reader = request.getReader();
                JsonObject body = JsonParser.parseReader(reader).getAsJsonObject();

                String nuevoRol = body.get("tipoUsuario").getAsString();

                boolean actualizado = adminService.actualizarRolUsuario(userId, nuevoRol);

                if (actualizado) {
                    out.print(JsonResponse.success("Rol actualizado"));
                } else {
                    response.setStatus(400);
                    out.print(JsonResponse.error("No se pudo actualizar el rol"));
                }

            }

        } catch (Exception e) {

            response.setStatus(500);
            out.print(JsonResponse.error(e.getMessage()));

        }
    }
}