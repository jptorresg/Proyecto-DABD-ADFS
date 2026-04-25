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

/**
 * Controlador para la gestión de vuelos.
 * <p>
 * Maneja las peticiones HTTP dirigidas a {@code /api/vuelos/*} y proporciona
 * endpoints para buscar, listar, crear, actualizar y eliminar vuelos.
 * </p>
 * <p>
 * Métodos soportados:
 * <ul>
 *   <li>GET    /api/vuelos                 - Buscar vuelos según parámetros.</li>
 *   <li>GET    /api/vuelos/admin           - Listar todos los vuelos (administrador).</li>
 *   <li>GET    /api/vuelos/{id}            - Obtener un vuelo por su ID.</li>
 *   <li>GET    /api/vuelos/{id1}-{id2}     - Obtener vuelo con escalas (múltiples IDs).</li>
 *   <li>POST   /api/vuelos                 - Crear un nuevo vuelo.</li>
 *   <li>PUT    /api/vuelos/{id}            - Actualizar un vuelo existente.</li>
 *   <li>DELETE /api/vuelos/{id}            - Eliminar un vuelo.</li>
 * </ul>
 * 
 */
@WebServlet("/api/vuelos/*")
public class VueloController extends HttpServlet {
    private VueloService vueloService;
    
    /**
     * Inicializa el servicio de vuelos.
     * <p>
     * Este método es invocado automáticamente por el contenedor de servlets
     * cuando se carga el servlet.
     * </p>
     * 
     * @throws ServletException si ocurre un error durante la inicialización.
     */
    @Override
    public void init() throws ServletException {
        this.vueloService = new VueloService();
    }
    
    /**
     * Maneja las peticiones HTTP GET.
     * <p>
     * Endpoints disponibles:
     * <ul>
     *   <li>{@code GET /api/vuelos} - Búsqueda con parámetros (origen, destino, fechaSalida, tipoAsiento).</li>
     *   <li>{@code GET /api/vuelos/admin} - Listado completo de vuelos (acceso administrativo).</li>
     *   <li>{@code GET /api/vuelos/{idVuelo}} - Detalle de un vuelo por su ID.</li>
     *   <li>{@code GET /api/vuelos/{idVuelo}-{idEscalera}} - Detalle de un vuelo con escalas.</li>
     * </ul>
     * 
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
    
    /**
     * Maneja las peticiones HTTP POST para crear un nuevo vuelo.
     * <p>
     * Endpoint: {@code POST /api/vuelos}
     * </p>
     * <p>
     * Cuerpo de la solicitud esperado (JSON):
     * <pre>
     * {
     *   "idUsuarioCreador": 1,
     *   "codigoVuelo": "AV123",
     *   "origenCiudad": "Ciudad de México",
     *   "origenIata": "MEX",
     *   "destinoCiudad": "Cancún",
     *   "destinoIata": "CUN",
     *   "fechaSalida": "2026-04-10",
     *   "horaSalida": "08:00",
     *   "fechaLlegada": "2026-04-10",
     *   "horaLlegada": "10:30",
     *   "tipoAsiento": "Económico",
     *   "precioBase": "150.00",
     *   "asientosTotales": 180
     * }
     * </pre>
     * 
     *
     * @param request  Objeto {@code HttpServletRequest} con la solicitud del cliente.
     * @param response Objeto {@code HttpServletResponse} para enviar la respuesta.
     * @throws ServletException Si ocurre un error durante el procesamiento.
     * @throws IOException      Si ocurre un error de entrada/salida al escribir la respuesta.
     */
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
    
    /**
     * Actualiza un vuelo existente.
     * <p>
     * Endpoint: {@code PUT /api/vuelos/{id}}
     * </p>
     * <p>
     * El cuerpo de la solicitud debe contener los campos del vuelo a modificar en formato JSON.
     * </p>
     *
     * @param request  Petición con el ID del vuelo en la ruta y los campos a actualizar en el cuerpo.
     * @param response Respuesta con el estado de la operación y el vuelo actualizado.
     * @throws ServletException Si no se puede procesar la petición.
     * @throws IOException      Si no se puede serializar la respuesta.
     */
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
    
    /**
     * Elimina un vuelo por su ID.
     * <p>
     * Endpoint: {@code DELETE /api/vuelos/{id}}
     * </p>
     *
     * @param request  Petición con el ID del vuelo en la ruta.
     * @param response Respuesta con el estado de la operación.
     * @throws ServletException Si no se puede procesar la petición.
     * @throws IOException      Si no se puede serializar la respuesta.
     */
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
    
    /**
     * Busca vuelos disponibles según los parámetros proporcionados.
     *
     * @param request Petición con los parámetros de búsqueda (origen, destino, fechaSalida, tipoAsiento).
     * @param out     {@code PrintWriter} para escribir la respuesta JSON.
     * @throws Exception Si ocurre un error al procesar la búsqueda.
     */
    private void handleBuscarVuelos(HttpServletRequest request, PrintWriter out) throws Exception {
        String origen = request.getParameter("origen");
        String destino = request.getParameter("destino");
        String fechaSalidaStr = request.getParameter("fechaSalida");
        String fechaRegresoStr = request.getParameter("fechaRegreso");
        String tipoAsiento = request.getParameter("tipoAsiento");
        
        LocalDate fechaSalida = (fechaSalidaStr != null) ? LocalDate.parse(fechaSalidaStr) : null;
        LocalDate fechaRegreso = (fechaRegresoStr != null) ? LocalDate.parse(fechaRegresoStr) : null;
        
        List<Object> vuelos = vueloService.buscarVuelos(
            origen, destino, fechaSalida, fechaRegreso, tipoAsiento
        );
        out.print(JsonResponse.success(vuelos));
    }

    /**
     * Lista todos los vuelos (acceso exclusivo para administradores).
     * <p>
     * Actualmente el control de acceso está comentado, pero se mantiene la lógica
     * de obtención de vuelos.
     * </p>
     *
     * @param request Petición con la sesión del usuario.
     * @param out     {@code PrintWriter} para escribir la respuesta JSON.
     * @throws Exception Si ocurre un error al obtener los vuelos.
     */
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
    
    /**
     * Verifica si el usuario en la sesión actual tiene rol de administrador.
     *
     * @param request Petición con la sesión del usuario.
     * @return {@code true} si el usuario es administrador, {@code false} en caso contrario.
     */
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
    
    /**
     * Obtiene el ID del usuario desde la sesión actual.
     *
     * @param request Petición con la sesión del usuario.
     * @return El ID del usuario en la sesión, o {@code null} si no hay sesión activa.
     */
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
    
    /**
     * Parsea el cuerpo de la solicitud HTTP en un objeto JSON.
     *
     * @param request La solicitud HTTP.
     * @return Un objeto {@code JsonObject} que representa el cuerpo de la solicitud.
     * @throws IOException Si ocurre un error durante la lectura del cuerpo.
     */
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