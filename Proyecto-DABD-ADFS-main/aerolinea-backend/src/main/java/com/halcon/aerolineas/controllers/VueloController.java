package com.halcon.aerolineas.controllers;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.halcon.aerolineas.models.Vuelo;
import com.halcon.aerolineas.services.VueloService;
import com.halcon.aerolineas.utils.JsonResponse;

@WebServlet("/api/vuelos/*")
public class VueloController extends HttpServlet {
    private VueloService vueloService;
    
    @Override
    public void init() throws ServletException {
        this.vueloService = new VueloService();
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
                handleBuscarVuelos(request, out);
            } else {
                // GET /api/vuelos/{id}
                Long id = Long.parseLong(pathInfo.substring(1));
                Vuelo vuelo = vueloService.obtenerVuelo(id);
                out.print(JsonResponse.success(vuelo));
            }
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
        
        // Verificar que sea admin
        if (!esAdmin(request)) {
            response.setStatus(403);
            out.print(JsonResponse.error("Acceso denegado - Solo administradores"));
            return;
        }
        
        try {
            JsonObject json = parseRequestBody(request);
            
            Vuelo vuelo = vueloService.crearVuelo(
                json.get("codigoVuelo").getAsString(),
                json.get("origenCiudad").getAsString(),
                json.get("origenIata").getAsString(),
                json.get("destinoCiudad").getAsString(),
                json.get("destinoIata").getAsString(),
                LocalDate.parse(json.get("fechaSalida").getAsString()),
                json.get("horaSalida").getAsString(),
                LocalDate.parse(json.get("fechaLlegada").getAsString()),
                json.get("horaLlegada").getAsString(),
                json.get("tipoAsiento").getAsString(),
                new BigDecimal(json.get("precioBase").getAsString()),
                json.get("asientosTotales").getAsInt(),
                getUsuarioIdFromSession(request)
            );
            
            response.setStatus(201);
            out.print(JsonResponse.success("Vuelo creado exitosamente", vuelo));
            
        } catch (Exception e) {
            response.setStatus(400);
            out.print(JsonResponse.error(e.getMessage()));
        }
    }
    
    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();
        
        if (!esAdmin(request)) {
            response.setStatus(403);
            out.print(JsonResponse.error("Acceso denegado"));
            return;
        }
        
        try {
            String pathInfo = request.getPathInfo();
            Long id = Long.parseLong(pathInfo.substring(1));
            
            JsonObject json = parseRequestBody(request);
            
            Vuelo vuelo = vueloService.obtenerVuelo(id);
            
            // Actualizar campos
            vuelo.setOrigenCiudad(json.get("origenCiudad").getAsString());
            vuelo.setOrigenCodigoIata(json.get("origenIata").getAsString());
            vuelo.setDestinoCiudad(json.get("destinoCiudad").getAsString());
            vuelo.setDestinoCodigoIata(json.get("destinoIata").getAsString());
            vuelo.setFechaSalida(LocalDate.parse(json.get("fechaSalida").getAsString()));
            vuelo.setHoraSalida(json.get("horaSalida").getAsString());
            vuelo.setFechaLlegada(LocalDate.parse(json.get("fechaLlegada").getAsString()));
            vuelo.setHoraLlegada(json.get("horaLlegada").getAsString());
            vuelo.setTipoAsiento(json.get("tipoAsiento").getAsString());
            vuelo.setPrecioBase(new BigDecimal(json.get("precioBase").getAsString()));
            vuelo.setAsientosTotales(json.get("asientosTotales").getAsInt());
            vuelo.setAsientosDisponibles(json.get("asientosDisponibles").getAsInt());
            vuelo.setEstado(json.get("estado").getAsString());
            
            vueloService.actualizarVuelo(vuelo);
            out.print(JsonResponse.success("Vuelo actualizado exitosamente", vuelo));
            
        } catch (Exception e) {
            response.setStatus(400);
            out.print(JsonResponse.error(e.getMessage()));
        }
    }
    
    @Override
    protected void doDelete(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();
        
        if (!esAdmin(request)) {
            response.setStatus(403);
            out.print(JsonResponse.error("Acceso denegado"));
            return;
        }
        
        try {
            String pathInfo = request.getPathInfo();
            Long id = Long.parseLong(pathInfo.substring(1));
            
            vueloService.eliminarVuelo(id);
            out.print(JsonResponse.success("Vuelo eliminado exitosamente", null));
            
        } catch (Exception e) {
            response.setStatus(400);
            out.print(JsonResponse.error(e.getMessage()));
        }
    }
    
    private void handleBuscarVuelos(HttpServletRequest request, PrintWriter out) throws Exception {
        String origen = request.getParameter("origen");
        String destino = request.getParameter("destino");
        String fechaSalidaStr = request.getParameter("fechaSalida");
        String tipoAsiento = request.getParameter("tipoAsiento");
        
        LocalDate fechaSalida = (fechaSalidaStr != null) ? LocalDate.parse(fechaSalidaStr) : null;
        
        List<Vuelo> vuelos = vueloService.buscarVuelos(origen, destino, fechaSalida, tipoAsiento);
        out.print(JsonResponse.success(vuelos));
    }
    
    private boolean esAdmin(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) return false;
        
        String tipo = (String) session.getAttribute("usuarioTipo");
        return "ADMIN".equals(tipo);
    }
    
    private Long getUsuarioIdFromSession(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) return null;
        return (Long) session.getAttribute("usuarioId");
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