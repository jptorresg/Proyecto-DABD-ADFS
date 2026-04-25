package com.halcon.aerolineas.controllers;

import java.io.IOException;
import java.io.PrintWriter;
import java.io.BufferedReader;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import com.google.gson.Gson;

import com.halcon.aerolineas.services.ComentarioService;
import com.halcon.aerolineas.services.ComentarioService.ComentarioResponse;
import com.halcon.aerolineas.utils.JsonResponse;
import com.halcon.aerolineas.models.ComentarioRating;

/**
 * Controlador para la gestión de comentarios y valoraciones de vuelos.
 * <p>
 * Maneja las peticiones HTTP dirigidas a {@code /api/comentarios/*} y proporciona
 * endpoints para obtener y crear comentarios asociados a un vuelo.
 * </p>
 * <p>
 * Métodos soportados:
 * <ul>
 *   <li>GET  /api/comentarios/{idVuelo} - Obtiene los comentarios de un vuelo.</li>
 *   <li>POST /api/comentarios           - Crea un nuevo comentario.</li>
 * </ul>
 * 
 */
@WebServlet("/api/comentarios/*")
public class ComentarioController extends HttpServlet {

    private ComentarioService comentarioService;

    /**
     * Inicializa el servicio de comentarios.
     * <p>
     * Este método es invocado automáticamente por el contenedor de servlets
     * cuando se carga el servlet.
     * </p>
     *
     * @throws ServletException si ocurre un error durante la inicialización.
     */
    @Override
    public void init() throws ServletException {
        this.comentarioService = new ComentarioService();
    }

    /**
     * Maneja las peticiones HTTP GET.
     * <p>
     * Endpoints disponibles:
     * <ul>
     *   <li>{@code /api/comentarios/{idVuelo}} - Devuelve la lista de comentarios de un vuelo.</li>
     * </ul>
     * 
     *
     * @param request  Objeto {@code HttpServletRequest} con la solicitud del cliente.
     * @param response Objeto {@code HttpServletResponse} para enviar la respuesta.
     * @throws IOException      Si ocurre un error de entrada/salida al escribir la respuesta.
     * @throws ServletException Si ocurre un error al procesar la solicitud.
     */
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        String pathInfo = request.getPathInfo();

        try {
            if (pathInfo == null || "/".equals(pathInfo)) {
                response.setStatus(400);
                out.print(JsonResponse.error("Debe proporcionar el ID del vuelo"));
                return;
            }

            // GET /api/comentarios/{idVuelo}
            String idParam = pathInfo.substring(1);

            Long idVuelo;

            if (idParam.contains("-")) {
                // 🔥 vuelo con escalas → usamos el primero
                idVuelo = Long.parseLong(idParam.split("-")[0]);
            } else {
                // ✅ vuelo normal
                idVuelo = Long.parseLong(idParam);
            }

            ComentarioResponse comentarios =
                    comentarioService.obtenerComentarios(idVuelo.intValue());

            out.print(JsonResponse.success(comentarios));

        } catch (NumberFormatException e) {
            response.setStatus(400);
            out.print(JsonResponse.error("ID de vuelo inválido"));
        } catch (Exception e) {
            e.printStackTrace(); // 👈 CLAVE
            response.setStatus(500);
            out.print(JsonResponse.error(e.getMessage()));
        }
    }

    /**
     * Maneja las peticiones HTTP POST.
     * <p>
     * Endpoints disponibles:
     * <ul>
     *   <li>{@code /api/comentarios} - Crea un nuevo comentario.</li>
     * </ul>
     * 
     *
     * @param request  Objeto {@code HttpServletRequest} con la solicitud del cliente.
     * @param response Objeto {@code HttpServletResponse} para enviar la respuesta.
     * @throws IOException      Si ocurre un error de entrada/salida al escribir la respuesta.
     * @throws ServletException Si ocurre un error al procesar la solicitud.
     */
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        try {

            StringBuilder sb = new StringBuilder();
            String line;
            BufferedReader reader = request.getReader();
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }

            String json = sb.toString();

            Gson gson = new Gson();
            ComentarioRating comentario = gson.fromJson(json, ComentarioRating.class);

            // 🔥 VALIDACIÓN CLAVE
            if (comentario == null || comentario.getIdVuelo() == null) {
                response.setStatus(400);
                out.print(JsonResponse.error("Datos inválidos"));
                return;
            }

            comentarioService.crearComentario(comentario);

            out.print(JsonResponse.success("Comentario creado"));

        } catch (com.google.gson.JsonSyntaxException e) {
            response.setStatus(400);
            out.print(JsonResponse.error("JSON inválido"));

        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(500);
            out.print(JsonResponse.error(e.getMessage()));
        }
    }
}