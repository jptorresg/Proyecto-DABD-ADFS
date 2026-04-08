package com.halcon.aerolineas.controllers;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.ArrayList;

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

            } else if ("/admin".equals(pathInfo)) {

                handleListarVuelosAdmin(request, out);

            } else {

                String idParam = pathInfo.substring(1);

                if (idParam.contains("-")) {
                    // 🔥 VUELO CON ESCALAS
                    List<Long> ids = new ArrayList<>();

                    for (String part : idParam.split("-")) {
                        ids.add(Long.parseLong(part));
                    }

                    Object vuelo = vueloService.obtenerVueloConEscalas(ids);
                    out.print(JsonResponse.success(vuelo));

                } else {
                    // ✅ VUELO NORMAL
                    Long id = Long.parseLong(idParam);
                    Vuelo vuelo = vueloService.obtenerVuelo(id);
                    out.print(JsonResponse.success(vuelo));
                }

            }
        } catch (Exception e) {
            e.printStackTrace();
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
            JsonObject json = parseRequestBody(request);

            System.out.println("════════════════════════════════════════");
            System.out.println("📥 JSON RECIBIDO:");
            System.out.println(json.toString());
            System.out.println("════════════════════════════════════════");

            // ⭐ LEER idUsuarioCreador DEL JSON (no de la sesión)
            Long idUsuarioCreador = null;
            
            if (json.has("idUsuarioCreador")) {
                idUsuarioCreador = json.get("idUsuarioCreador").getAsLong();
                System.out.println("✅ ID Usuario Creador (desde JSON): " + idUsuarioCreador);
            } else {
                System.err.println("❌ ERROR: idUsuarioCreador NO viene en el JSON!");
                System.err.println("Campos recibidos: " + json.keySet());
                response.setStatus(400);
                out.print(JsonResponse.error("Falta idUsuarioCreador en el payload"));
                return;
            }
            
            // Extraer demás campos
            String codigoVuelo = json.get("codigoVuelo").getAsString();
            String origenCiudad = json.get("origenCiudad").getAsString();
            String origenIata = json.get("origenIata").getAsString();
            String destinoCiudad = json.get("destinoCiudad").getAsString();
            String destinoIata = json.get("destinoIata").getAsString();
            LocalDate fechaSalida = LocalDate.parse(json.get("fechaSalida").getAsString());
            String horaSalida = json.get("horaSalida").getAsString();
            LocalDate fechaLlegada = LocalDate.parse(json.get("fechaLlegada").getAsString());
            String horaLlegada = json.get("horaLlegada").getAsString();
            String tipoAsiento = json.get("tipoAsiento").getAsString();
            BigDecimal precioBase = new BigDecimal(json.get("precioBase").getAsString());
            Integer asientosTotales = json.get("asientosTotales").getAsInt();
            
            // Crear vuelo
            Vuelo vuelo = vueloService.crearVuelo(
                codigoVuelo, origenCiudad, origenIata, destinoCiudad, destinoIata,
                fechaSalida, horaSalida, fechaLlegada, horaLlegada, tipoAsiento,
                precioBase, asientosTotales, idUsuarioCreador
            );
            
            response.setStatus(201);
            out.print(JsonResponse.success("Vuelo creado exitosamente", vuelo));
            
        } catch (Exception e) {
            System.err.println("❌ ERROR en VueloController: " + e.getMessage());
            e.printStackTrace();
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
        
        //if (!esAdmin(request)) {
        //    response.setStatus(403);
        //    out.print(JsonResponse.error("Acceso denegado"));
        //    return;
        //}
        
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
            vuelo.setPrecioBase(json.get("precioBase").getAsBigDecimal());
            vuelo.setAsientosTotales(json.get("asientosTotales").getAsInt());
            if (json.has("asientosDisponibles")) {
                vuelo.setAsientosDisponibles(json.get("asientosDisponibles").getAsInt());
            }
            if (json.has("estado")) {
                vuelo.setEstado(json.get("estado").getAsString());
            }
            
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
        
        //if (!esAdmin(request)) {
        //    response.setStatus(403);
        //    out.print(JsonResponse.error("Acceso denegado"));
        //    return;
        //}
        
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
        
        List<Object> vuelos = vueloService.buscarVuelos(origen, destino, fechaSalida, tipoAsiento);
        out.print(JsonResponse.success(vuelos));
    }

    private void handleListarVuelosAdmin(HttpServletRequest request, PrintWriter out) throws Exception {

        System.out.println("=== Entrando a handleListarVuelosAdmin ===");

        //if (!esAdmin(request)) {
          //  System.out.println("Usuario no es admin");
            //throw new IllegalAccessException("Acceso denegado - Solo administradores");
        //}

        System.out.println("Usuario es admin");

        List<Vuelo> vuelos = vueloService.listarVuelos(1, 100);

        System.out.println("Vuelos obtenidos: " + vuelos.size());

        out.print(JsonResponse.success(vuelos));
    }
    
    private boolean esAdmin(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
            if (session == null) {
                System.out.println("No hay sesión activa");
                return false;
            }        
        String tipo = (String) session.getAttribute("usuarioTipo");
        System.out.println("Rol en sesión: " + tipo);
        return "ADMIN".equals(tipo);
    }
    
    private Long getUsuarioIdFromSession(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) {
            System.out.println("No hay sesión");
            return null;
        } else {
            System.out.println("SESSION ID EN VUELOS: " + session.getId());
            System.out.println("usuarioId en sesión: " + session.getAttribute("usuarioId"));
            return (Long) session.getAttribute("usuarioId");
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