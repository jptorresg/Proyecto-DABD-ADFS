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
import com.halcon.aerolineas.dao.CategoriaVueloDAO;
import com.halcon.aerolineas.dao.PaisDAO;
import com.halcon.aerolineas.models.AgenciaB2B;
import com.halcon.aerolineas.models.CategoriaVuelo;
import com.halcon.aerolineas.models.Pasajero;
import com.halcon.aerolineas.models.Reservacion;
import com.halcon.aerolineas.models.Vuelo;
import com.halcon.aerolineas.models.VueloConEscala;
import com.halcon.aerolineas.services.ReservacionService;
import com.halcon.aerolineas.services.VueloService;
import com.halcon.aerolineas.utils.JsonResponse;

import java.util.Collections;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

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
 *   <li>GET    /api/b2b/vuelos                    Búsqueda de vuelos (v1)</li>
 *   <li>GET    /api/b2b/vuelos/{id}               Detalle de un vuelo (v1)</li>
 *   <li>GET    /api/b2b/vuelos/{id1-id2-...}      Detalle de vuelo con escalas (v1)</li>
 *   <li>GET    /api/b2b/v2/vuelos                 Búsqueda de vuelos con array categorias[]</li>
 *   <li>GET    /api/b2b/v2/vuelos/{id}            Detalle de un vuelo con array categorias[]</li>
 *   <li>GET    /api/b2b/paises                    Catálogo de países</li>
 *   <li>POST   /api/b2b/reservaciones             Crear reservación</li>
 *   <li>PUT    /api/b2b/reservaciones/{id}/cancelar Cancelar reservación</li>
 * </ul>
 *
 * <p>API v2: introduce el modelo de categorías de asiento (CATEGORIAS_VUELO).
 * Cada vuelo trae un array {@code categorias} con tipoAsiento/precio/asientos
 * por clase. La API v1 mantiene compatibilidad: sigue exponiendo los campos
 * planos {@code tipoAsiento}/{@code precioBase}/{@code asientosDisponibles}
 * que vienen del trigger de sincronización con CATEGORIAS_VUELO.
 */
@WebServlet("/api/b2b/*")
public class B2BController extends HttpServlet {

    private VueloService vueloService;
    private ReservacionService reservacionService;
    private AgenciaB2BDAO agenciaDAO;
    private PaisDAO paisDAO;
    private CategoriaVueloDAO categoriaDAO;

    @Override
    public void init() throws ServletException {
        this.vueloService       = new VueloService();
        this.reservacionService = new ReservacionService();
        this.agenciaDAO         = new AgenciaB2BDAO();
        this.paisDAO            = new PaisDAO();
        this.categoriaDAO       = new CategoriaVueloDAO();
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
            if (pathInfo.startsWith("/v2/vuelos")) {
                handleV2Vuelos(request, pathInfo.substring("/v2/vuelos".length()), out);
                return;
            }
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

    /**
     * Maneja GET /api/b2b/v2/vuelos[/{id}]. Mismo flujo que v1 pero hidrata
     * {@code Vuelo.categorias} para que Gson serialice el array nuevo.
     */
    @SuppressWarnings("unchecked")
    private void handleV2Vuelos(HttpServletRequest request, String resto, PrintWriter out) throws Exception {
        if (resto == null || resto.isEmpty() || "/".equals(resto)) {
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

            // El service devuelve List<Object> donde cada elemento puede ser un
            // Vuelo directo o una lista (cadena con escalas). Recolectamos los
            // id_vuelo y hacemos un único batch fetch a CATEGORIAS_VUELO.
            Set<Long> idsVuelo = new HashSet<>();
            for (Object o : vuelos) collectIds(o, idsVuelo);

            Map<Long, List<CategoriaVuelo>> porVuelo = categoriaDAO.findByVueloIds(idsVuelo);
            for (Object o : vuelos) hydrate(o, porVuelo);

            out.print(JsonResponse.success(vuelos));
            return;
        }

        String idParam = resto.substring(1);
        if (idParam.contains("-")) {
            List<Long> ids = new ArrayList<>();
            for (String part : idParam.split("-")) ids.add(Long.parseLong(part));
            Object detalle = vueloService.obtenerVueloConEscalas(ids);
            Map<Long, List<CategoriaVuelo>> porVuelo = categoriaDAO.findByVueloIds(ids);
            hydrate(detalle, porVuelo);
            out.print(JsonResponse.success(detalle));
        } else {
            Vuelo v = vueloService.obtenerVuelo(Long.parseLong(idParam));
            if (v != null) {
                v.setCategorias(categoriaDAO.findByVueloId(v.getIdVuelo()));
            }
            out.print(JsonResponse.success(v));
        }
    }

    /** Recolecta ids de Vuelo de elementos que pueden ser Vuelo, List o cualquier
     *  estructura anidada producida por VueloService. */
    private void collectIds(Object o, Set<Long> ids) {
        if (o == null) return;
        if (o instanceof Vuelo) {
            Long id = ((Vuelo) o).getIdVuelo();
            if (id != null) ids.add(id);
        } else if (o instanceof VueloConEscala) {
            collectIds(((VueloConEscala) o).getTramos(), ids);
        } else if (o instanceof Iterable) {
            for (Object child : (Iterable<?>) o) collectIds(child, ids);
        }
    }

    /** Espejo de collectIds: setea categorias en cada Vuelo encontrado. */
    private void hydrate(Object o, Map<Long, List<CategoriaVuelo>> porVuelo) {
        if (o == null) return;
        if (o instanceof Vuelo) {
            Vuelo v = (Vuelo) o;
            List<CategoriaVuelo> cats = porVuelo.get(v.getIdVuelo());
            v.setCategorias(cats != null ? cats : Collections.emptyList());
        } else if (o instanceof VueloConEscala) {
            hydrate(((VueloConEscala) o).getTramos(), porVuelo);
        } else if (o instanceof Iterable) {
            for (Object child : (Iterable<?>) o) hydrate(child, porVuelo);
        }
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
