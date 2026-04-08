package com.halcon.aerolineas.controllers;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.halcon.aerolineas.models.Pasajero;
import com.halcon.aerolineas.models.Reservacion;
import com.halcon.aerolineas.services.ReservacionService;
import com.halcon.aerolineas.utils.JsonResponse;

@WebServlet("/api/reservaciones/*")
public class ReservacionController extends HttpServlet {
    private ReservacionService reservacionService;
    
    @Override
    public void init() throws ServletException {
        this.reservacionService = new ReservacionService();
    }

    //VERSIÓN DE PRODUCCION
    /*
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();
        
        HttpSession session = request.getSession(false);
        if (session == null) {
            response.setStatus(401);
            out.print(JsonResponse.error("No autenticado"));
            return;
        }
        
        try {
            Long usuarioId = (Long) session.getAttribute("usuarioId");
            List<Reservacion> reservaciones = reservacionService.obtenerReservacionesUsuario(usuarioId);
            out.print(JsonResponse.success(reservaciones));
            
        } catch (Exception e) {
            response.setStatus(500);
            out.print(JsonResponse.error(e.getMessage()));
        }
    }
    */

    //VERSIÓN DE DESARROLLO
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        Long usuarioId = null;

        try {
            String usuarioHeader = request.getHeader("x-usuario-id");
            if (usuarioHeader != null) {
                usuarioId = Long.parseLong(usuarioHeader);
            }
        } catch (NumberFormatException e) {
            response.setStatus(400);
            out.print(JsonResponse.error("ID de usuario inválido"));
            return;
        }

        try {
            List<Reservacion> reservaciones =
                    reservacionService.obtenerReservacionesUsuario(usuarioId);

            System.out.println("=== RESPONSE FINAL ===");
            System.out.println(reservaciones);

            out.print(JsonResponse.success(reservaciones));

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
        
        Long usuarioId = null;

        try {
            String usuarioHeader = request.getHeader("x-usuario-id");
            if (usuarioHeader != null) {
                usuarioId = Long.parseLong(usuarioHeader);
            }
        } catch (NumberFormatException e) {
            response.setStatus(400);
            out.print(JsonResponse.error("ID de usuario inválido"));
            return;
        }
        
        try {
            JsonObject json = parseRequestBody(request);
            
            String idVueloStr = json.get("idVuelo").getAsString();

            List<Long> idsVuelo = new ArrayList<>();

            if (idVueloStr.contains("-")) {
                for (String part : idVueloStr.split("-")) {
                    idsVuelo.add(Long.parseLong(part));
                }
            } else {
                idsVuelo.add(Long.parseLong(idVueloStr));
            }
            System.out.println("Usuario ID: " + usuarioId);
            String metodoPago = json.get("metodoPago").getAsString();
            
            // Parsear pasajeros
            List<Pasajero> pasajeros = new ArrayList<>();
            JsonArray pasajerosArray = json.getAsJsonArray("pasajeros");
            
            for (JsonElement elem : pasajerosArray) {
                JsonObject p = elem.getAsJsonObject();
                Pasajero pasajero = new Pasajero();
                pasajero.setNombres(p.get("nombres").getAsString());
                pasajero.setApellidos(p.get("apellidos").getAsString());
                pasajero.setFechaNacimiento(LocalDate.parse(p.get("fechaNacimiento").getAsString()));
                pasajero.setIdNacionalidad(p.get("idNacionalidad").getAsLong());
                pasajero.setNumPasaporte(p.get("numPasaporte").getAsString());
                pasajeros.add(pasajero);
            }
                        
            List<Reservacion> reservaciones = new ArrayList<>();

            for (Long id : idsVuelo) {
                Reservacion r = reservacionService.crearReservacion(id, usuarioId, pasajeros, metodoPago);
                reservaciones.add(r);
            }

            response.setStatus(201);
            out.print(JsonResponse.success("Reservaciones creadas", reservaciones));            
            
        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(400);
            out.print(JsonResponse.error(e.getMessage()));
        }
    }

    @Override
protected void doPut(HttpServletRequest request, HttpServletResponse response)
        throws ServletException, IOException {

        String pathInfo = request.getPathInfo(); 
        // /{id}/cancelar

        if (pathInfo != null && pathInfo.matches("/\\d+/cancelar")) {
            try {
                String[] parts = pathInfo.split("/");
                Long id = Long.parseLong(parts[1]);

                reservacionService.cancelarReservacion(id);

                response.setStatus(HttpServletResponse.SC_OK);
                response.getWriter().write("{\"mensaje\":\"Reservación cancelada\"}");

            } catch (Exception e) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"error\":\"" + e.getMessage() + "\"}");
            }
        }
    }
    
    private JsonObject parseRequestBody(HttpServletRequest request) throws IOException {
        StringBuilder sb = new StringBuilder();
        BufferedReader reader = request.getReader();
        String line;
        while ((line = reader.readLine()) != null) {
            sb.append(line);
        }
        return JsonParser.parseString(sb.toString()).getAsJsonObject();
    }
}