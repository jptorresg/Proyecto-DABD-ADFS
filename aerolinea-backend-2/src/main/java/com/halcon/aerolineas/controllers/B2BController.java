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

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.halcon.aerolineas.dao.AgenciaB2BDAO;
import com.halcon.aerolineas.dao.PaisDAO;
import com.halcon.aerolineas.models.AgenciaB2B;
import com.halcon.aerolineas.models.Pasajero;
import com.halcon.aerolineas.models.Reservacion;
import com.halcon.aerolineas.models.Vuelo;
import com.halcon.aerolineas.services.ReservacionService;
import com.halcon.aerolineas.services.VueloService;
import com.halcon.aerolineas.utils.JsonResponse;

/**
 * Puerta B2B de la API de aerolínea.
 * <p>
 * Replica los endpoints públicos pero exige un token Bearer en la cabecera
 * {@code Authorization} para que sólo agencias autorizadas (registradas en
 * la tabla {@code AGENCIAS_B2B}) puedan consumirlos. La lógica de negocio
 * se delega en los services existentes.
 * </p>
 * <p>Rutas soportadas:
 * <ul>
 *   <li>GET    /api/b2b/vuelos                    Búsqueda de vuelos</li>
 *   <li>GET    /api/b2b/vuelos/{id}               Detalle de un vuelo</li>
 *   <li>GET    /api/b2b/vuelos/{id1-id2-...}      Detalle de vuelo con escalas</li>
 *   <li>GET    /api/b2b/paises                    Catálogo de países</li>
 *   <li>POST   /api/b2b/reservaciones             Crear reservación</li>
 *   <li>PUT    /api/b2b/reservaciones/{id}/cancelar Cancelar reservación</li>
 * </ul>
 */
@WebServlet("/api/b2b/*")
public class B2BController extends HttpServlet {

    private VueloService vueloService;
    private ReservacionService reservacionService;
    private AgenciaB2BDAO agenciaDAO;
    private PaisDAO paisDAO;

    @Override
    public void init() throws ServletException {
        this.vueloService       = new VueloService();
        this.reservacionService = new ReservacionService();
        this.agenciaDAO         = new AgenciaB2BDAO();
        this.paisDAO            = new PaisDAO();
    }

    /**
     * Valida el header {@code Authorization: Bearer <token>}.
     * Si es válido, devuelve la agencia; si no, escribe 401 en la respuesta y
     * devuelve {@code null} para que el caller corte el flujo.
     */
    private AgenciaB2B autenticar(HttpServletRequest request, HttpServletResponse response, PrintWriter out)
            throws IOException {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            response.setStatus(401);
            out.print(JsonResponse.error("Falta cabecera Authorization Bearer"));
            return null;
        }
        String token = header.substring("Bearer ".length()).trim();
        try {
            AgenciaB2B a = agenciaDAO.validarToken(token);
            if (a == null) {
                response.setStatus(401);
                out.print(JsonResponse.error("Token invalido o agencia inactiva"));
                return null;
            }
            return a;
        } catch (Exception e) {
            response.setStatus(500);
            out.print(JsonResponse.error("Error validando token: " + e.getMessage()));
            return null;
        }
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        AgenciaB2B agencia = autenticar(request, response, out);
        if (agencia == null) return;

        String pathInfo = request.getPathInfo();
        if (pathInfo == null) pathInfo = "/";

        try {
            if (pathInfo.startsWith("/vuelos")) {
                String resto = pathInfo.substring("/vuelos".length());
                if (resto.isEmpty() || "/".equals(resto)) {
                    // Búsqueda
                    LocalDate fechaSalida  = parseFecha(request.getParameter("fechaSalida"));
                    LocalDate fechaRegreso = parseFecha(request.getParameter("fechaRegreso"));
                    List<Object> vuelos = vueloService.buscarVuelos(
                        request,
                        request.getParameter("origen"),
                        request.getParameter("destino"),
                        fechaSalida,
                        fechaRegreso,
                        request.getParameter("tipoAsiento")
                    );
                    out.print(JsonResponse.success(vuelos));
                } else {
                    String idParam = resto.substring(1);
                    if (idParam.contains("-")) {
                        List<Long> ids = new ArrayList<>();
                        for (String part : idParam.split("-")) ids.add(Long.parseLong(part));
                        out.print(JsonResponse.success(vueloService.obtenerVueloConEscalas(ids)));
                    } else {
                        Vuelo v = vueloService.obtenerVuelo(Long.parseLong(idParam));
                        out.print(JsonResponse.success(v));
                    }
                }
            } else if ("/paises".equals(pathInfo) || "/paises/".equals(pathInfo)) {
                out.print(JsonResponse.success(paisDAO.findAll()));
            } else {
                response.setStatus(404);
                out.print(JsonResponse.error("Recurso no encontrado: " + pathInfo));
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

        AgenciaB2B agencia = autenticar(request, response, out);
        if (agencia == null) return;

        String pathInfo = request.getPathInfo();
        if (pathInfo == null) pathInfo = "/";

        try {
            if ("/reservaciones".equals(pathInfo) || "/reservaciones/".equals(pathInfo)) {
                JsonObject json = parseBody(request);

                // idUsuario lo trae la agencia en x-usuario-id (representa al cliente
                // final que reserva a través de la agencia). Default 1 si no llega.
                Long usuarioId = 1L;
                String headerUsuario = request.getHeader("x-usuario-id");
                if (headerUsuario != null && !headerUsuario.isEmpty()) {
                    try { usuarioId = Long.parseLong(headerUsuario); } catch (NumberFormatException ignored) {}
                }

                String idVueloStr = json.get("idVuelo").getAsString();
                List<Long> idsVuelo = new ArrayList<>();
                if (idVueloStr.contains("-")) {
                    for (String part : idVueloStr.split("-")) idsVuelo.add(Long.parseLong(part));
                } else {
                    idsVuelo.add(Long.parseLong(idVueloStr));
                }

                String metodoPago = json.get("metodoPago").getAsString();

                List<Pasajero> pasajeros = new ArrayList<>();
                JsonArray pasajerosArray = json.getAsJsonArray("pasajeros");
                for (JsonElement el : pasajerosArray) {
                    JsonObject p = el.getAsJsonObject();
                    Pasajero pas = new Pasajero();
                    pas.setNombres(p.get("nombres").getAsString());
                    pas.setApellidos(p.get("apellidos").getAsString());
                    pas.setFechaNacimiento(LocalDate.parse(p.get("fechaNacimiento").getAsString()));
                    pas.setIdNacionalidad(p.get("idNacionalidad").getAsLong());
                    pas.setNumPasaporte(p.get("numPasaporte").getAsString());
                    pasajeros.add(pas);
                }

                List<Reservacion> reservaciones = new ArrayList<>();
                boolean esMultiTramo = idsVuelo.size() > 1;
                for (Long id : idsVuelo) {
                    Reservacion r = reservacionService.crearReservacion(
                        id, usuarioId, pasajeros, metodoPago, !esMultiTramo
                    );
                    reservaciones.add(r);
                }
                if (esMultiTramo) {
                    reservacionService.enviarConfirmacionMultiTramo(reservaciones, pasajeros, usuarioId);
                }

                response.setStatus(201);
                out.print(JsonResponse.success("Reservaciones creadas", reservaciones));
            } else {
                response.setStatus(404);
                out.print(JsonResponse.error("Recurso no encontrado: " + pathInfo));
            }
        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(500);
            out.print(JsonResponse.error(e.getMessage()));
        }
    }

    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        AgenciaB2B agencia = autenticar(request, response, out);
        if (agencia == null) return;

        String pathInfo = request.getPathInfo();
        if (pathInfo == null) pathInfo = "/";

        try {
            // Esperamos /reservaciones/{id}/cancelar
            if (pathInfo.startsWith("/reservaciones/") && pathInfo.endsWith("/cancelar")) {
                String medio = pathInfo.substring("/reservaciones/".length(),
                                                   pathInfo.length() - "/cancelar".length());
                Long idReservacion = Long.parseLong(medio);

                reservacionService.cancelarReservacion(idReservacion);
                out.print(JsonResponse.success("Reservacion cancelada", null));
            } else {
                response.setStatus(404);
                out.print(JsonResponse.error("Recurso no encontrado: " + pathInfo));
            }
        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(500);
            out.print(JsonResponse.error(e.getMessage()));
        }
    }

    private LocalDate parseFecha(String s) {
        return (s != null && !s.isEmpty()) ? LocalDate.parse(s) : null;
    }

    private JsonObject parseBody(HttpServletRequest request) throws IOException {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader br = request.getReader()) {
            String line;
            while ((line = br.readLine()) != null) sb.append(line);
        }
        return JsonParser.parseString(sb.toString()).getAsJsonObject();
    }
}
