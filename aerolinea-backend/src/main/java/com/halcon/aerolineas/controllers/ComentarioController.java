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

@WebServlet("/api/comentarios/*")
public class ComentarioController extends HttpServlet {

    private ComentarioService comentarioService;

    @Override
    public void init() throws ServletException {
        this.comentarioService = new ComentarioService();
    }

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
            Long idVuelo = Long.parseLong(pathInfo.substring(1));

            ComentarioResponse comentarios =
                    comentarioService.obtenerComentarios(idVuelo.intValue());

            out.print(JsonResponse.success(comentarios));

        } catch (NumberFormatException e) {
            response.setStatus(400);
            out.print(JsonResponse.error("ID de vuelo inválido"));
        } catch (Exception e) {
            response.setStatus(500);
            out.print(JsonResponse.error(e.getMessage()));
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        try {

            // Leer JSON manualmente
            StringBuilder sb = new StringBuilder();
            String line;
            BufferedReader reader = request.getReader();
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }

            String json = sb.toString();

            // Parse simple (puedes usar Gson si ya lo usas en el proyecto)
            Gson gson = new Gson();
            ComentarioRating comentario = gson.fromJson(json, ComentarioRating.class);

            comentarioService.crearComentario(comentario);

            out.print(JsonResponse.success("Comentario creado"));

        } catch (Exception e) {
            response.setStatus(500);
            out.print(JsonResponse.error(e.getMessage()));
        }
    }
}