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


@WebServlet("/api/admin/*")
public class AdminController extends HttpServlet {

    private AdminService adminService;

    @Override
    public void init() {
        adminService = new AdminService();
    }

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

            }

        } catch (Exception e) {

            response.setStatus(500);
            out.print(JsonResponse.error(e.getMessage()));

        }
    }

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