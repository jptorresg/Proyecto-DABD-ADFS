package com.halcon.aerolineas.controllers;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.PrintWriter;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpResponse.BodyHandlers;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Enumeration;
import java.util.Properties;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.halcon.aerolineas.utils.JsonResponse;

/**
 * Integración cruzada: la aerolínea consume la API B2B de la cadena de
 * hoteles como si fuera una agencia más. El frontend de Aerolíneas Halcón
 * llama a estos endpoints públicos; este servlet reenvía la petición a
 * Bedly inyectando el token Bearer guardado en {@code cross.properties}
 * para que las credenciales nunca lleguen al navegador.
 * <p>Rutas soportadas:</p>
 * <ul>
 *   <li>GET  /api/cross/hoteles/disponibilidad  → /api/b2b/disponibilidad de Bedly</li>
 *   <li>POST /api/cross/hoteles/reservar        → /api/b2b/reservar de Bedly</li>
 *   <li>GET  /api/cross/hoteles/habitaciones    → /api/habitaciones de Bedly (catálogo público)</li>
 * </ul>
 */
@WebServlet("/api/cross/*")
public class CrossController extends HttpServlet {

    private String hotelEndpoint;
    private String hotelToken;
    private HttpClient http;

    @Override
    public void init() throws ServletException {
        Properties config = new Properties();
        try (InputStream in = getClass().getClassLoader().getResourceAsStream("cross.properties")) {
            if (in == null) {
                throw new ServletException("Falta cross.properties en el classpath");
            }
            config.load(in);
        } catch (IOException e) {
            throw new ServletException("No se pudo cargar cross.properties", e);
        }
        this.hotelEndpoint = trimSlash(config.getProperty("hotel.endpoint", "").trim());
        this.hotelToken    = config.getProperty("hotel.token", "").trim();
        long timeoutMs     = Long.parseLong(config.getProperty("hotel.timeout.ms", "15000").trim());

        this.http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofMillis(timeoutMs))
            .build();
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        String pathInfo = request.getPathInfo();
        if (pathInfo == null) pathInfo = "/";

        try {
            String targetPath;
            if (pathInfo.equals("/hoteles/disponibilidad")) {
                targetPath = "/api/b2b/disponibilidad";
            } else if (pathInfo.equals("/hoteles/habitaciones")) {
                targetPath = "/api/habitaciones"; // catálogo público
            } else {
                response.setStatus(404);
                out.print(JsonResponse.error("Recurso cross no soportado: " + pathInfo));
                return;
            }

            String query = buildQuery(request);
            String targetUrl = hotelEndpoint + targetPath + (query.isEmpty() ? "" : "?" + query);

            HttpRequest req = HttpRequest.newBuilder(URI.create(targetUrl))
                .header("Authorization", "Bearer " + hotelToken)
                .header("Accept", "application/json")
                .GET()
                .build();

            HttpResponse<String> resp = http.send(req, BodyHandlers.ofString(StandardCharsets.UTF_8));
            response.setStatus(resp.statusCode());
            out.print(resp.body());
        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(502);
            out.print(JsonResponse.error("Error consultando partner: " + e.getMessage()));
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        String pathInfo = request.getPathInfo();
        if (pathInfo == null) pathInfo = "/";

        try {
            String targetPath;
            if (pathInfo.equals("/hoteles/reservar")) {
                targetPath = "/api/b2b/reservar";
            } else {
                response.setStatus(404);
                out.print(JsonResponse.error("Recurso cross no soportado: " + pathInfo));
                return;
            }

            String body = readBody(request);

            HttpRequest req = HttpRequest.newBuilder(URI.create(hotelEndpoint + targetPath))
                .header("Authorization", "Bearer " + hotelToken)
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8))
                .build();

            HttpResponse<String> resp = http.send(req, BodyHandlers.ofString(StandardCharsets.UTF_8));
            response.setStatus(resp.statusCode());
            out.print(resp.body());
        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(502);
            out.print(JsonResponse.error("Error consultando partner: " + e.getMessage()));
        }
    }

    private static String trimSlash(String s) {
        if (s == null) return "";
        return s.endsWith("/") ? s.substring(0, s.length() - 1) : s;
    }

    private static String buildQuery(HttpServletRequest request) {
        StringBuilder sb = new StringBuilder();
        Enumeration<String> names = request.getParameterNames();
        while (names.hasMoreElements()) {
            String name = names.nextElement();
            for (String value : request.getParameterValues(name)) {
                if (sb.length() > 0) sb.append('&');
                sb.append(URLEncoder.encode(name, StandardCharsets.UTF_8));
                sb.append('=');
                sb.append(URLEncoder.encode(value, StandardCharsets.UTF_8));
            }
        }
        return sb.toString();
    }

    private static String readBody(HttpServletRequest request) throws IOException {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader br = request.getReader()) {
            String line;
            while ((line = br.readLine()) != null) sb.append(line);
        }
        return sb.toString();
    }
}
