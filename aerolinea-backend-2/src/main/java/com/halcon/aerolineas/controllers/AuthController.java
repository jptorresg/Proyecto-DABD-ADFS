package com.halcon.aerolineas.controllers;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.halcon.aerolineas.models.Usuario;
import com.halcon.aerolineas.services.AuthService;
import com.halcon.aerolineas.utils.JsonResponse;

/**
 * Controlador para operaciones de autenticación y registro de usuarios.
 * <p>
 * Maneja las peticiones HTTP dirigidas a {@code /api/auth/*} y proporciona
 * endpoints para inicio de sesión, registro y cierre de sesión.
 * </p>
 * <p>
 * Métodos soportados:
 * <ul>
 *   <li>POST /api/auth/login   - Inicio de sesión</li>
 *   <li>POST /api/auth/register - Registro de nuevo usuario</li>
 *   <li>POST /api/auth/logout  - Cierre de sesión</li>
 * </ul>
 * 
 */
@WebServlet("/api/auth/*")
public class AuthController extends HttpServlet {
    
    private AuthService authService;

    /**
     * Inicializa el servicio de autenticación.
     *
     * @throws ServletException si ocurre un error durante la inicialización.
     */
    @Override
    public void init() throws ServletException {
        this.authService = new AuthService();
    }
    
    /**
     * Maneja las peticiones HTTP POST.
     * <p>
     * Endpoints disponibles:
     * <ul>
     *   <li>{@code /api/auth/login}   - Realiza el inicio de sesión de un usuario.</li>
     *   <li>{@code /api/auth/register} - Registra un nuevo usuario.</li>
     *   <li>{@code /api/auth/logout}  - Cierra la sesión de un usuario.</li>
     * </ul>
     * 
     * 
     * @param request  Objeto {@code HttpServletRequest} con la solicitud del cliente.
     * @param response Objeto {@code HttpServletResponse} para enviar la respuesta.
     * @throws ServletException Si ocurre un error durante el procesamiento.
     * @throws IOException Si ocurre un error de entrada/salida al escribir la respuesta.
     */
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();
        
        String pathInfo = request.getPathInfo();
        
        try {
            if ("/login".equals(pathInfo)) {
                handleLogin(request, response, out);
            } else if ("/register".equals(pathInfo)) {
                handleRegister(request, response, out);
            } else if ("/logout".equals(pathInfo)) {
                handleLogout(request, response, out);
            } else {
                response.setStatus(404);
                out.print(JsonResponse.error("Endpoint no encontrado"));
            }
        } catch (Exception e) {
            response.setStatus(500);
            out.print(JsonResponse.error(e.getMessage()));
        }
    }
    
    /**
     * Maneja el inicio de sesión de un usuario.
     * <p>
     * Lee las credenciales (email y password) del cuerpo de la solicitud en formato JSON,
     * valida la autenticación mediante {@link AuthService#login(String, String)} y,
     * si es exitosa, crea una sesión HTTP para el usuario.
     * </p>
     *
     * @param request  La solicitud HTTP.
     * @param response La respuesta HTTP.
     * @param out      El {@code PrintWriter} para escribir la respuesta JSON.
     */
    private void handleLogin(HttpServletRequest request, HttpServletResponse response, PrintWriter out) {
        try {
            // Leer JSON del request body
            JsonObject json = parseRequestBody(request);
            
            String email = json.get("email").getAsString();
            String password = json.get("password").getAsString();
            
            Usuario usuario = authService.login(email, password);
            
            if (usuario != null) {
                // Crear sesión
                HttpSession session = request.getSession(true);

                System.out.println("LOGIN SESSION ID: " + session.getId());
                
                session.setAttribute("usuarioId", usuario.getIdUsuario());
                session.setAttribute("usuarioEmail", usuario.getEmail());
                session.setAttribute("usuarioTipo", usuario.getTipoUsuario());
                session.setMaxInactiveInterval(3600); // 1 hora
            }
            
            out.print(JsonResponse.success("Login exitoso", usuario));
            
        } catch (Exception e) {
            response.setStatus(401);
            out.print(JsonResponse.error(e.getMessage()));
        }
    }
    
    /**
     * Maneja el registro de un nuevo usuario.
     * <p>
     * Lee los datos del nuevo usuario desde el cuerpo de la solicitud en formato JSON,
     * los valida y crea una nueva cuenta mediante {@link AuthService#registrar(String, String, String, String, Integer, String, String)}.
     * </p>
     *
     * @param request  La solicitud HTTP.
     * @param response La respuesta HTTP.
     * @param out      El {@code PrintWriter} para escribir la respuesta JSON.
     */
    private void handleRegister(HttpServletRequest request, HttpServletResponse response, PrintWriter out) {
        try {
            JsonObject json = parseRequestBody(request);
            
            String email = json.get("email").getAsString();
            String password = json.get("password").getAsString();
            String nombres = json.get("nombres").getAsString();
            String apellidos = json.get("apellidos").getAsString();
            Integer edad = json.get("edad").getAsInt();
            String codigoPais = json.get("codigoPais").getAsString();
            String numPasaporte = json.get("numPasaporte").getAsString();
            
            Usuario usuario = authService.registrar(email, password, nombres, apellidos, edad, codigoPais, numPasaporte);
            
            response.setStatus(201);
            out.print(JsonResponse.success("Usuario registrado exitosamente", usuario));
            
        } catch (Exception e) {
            response.setStatus(400);
            out.print(JsonResponse.error(e.getMessage()));
        }
    }
    
    /**
     * Maneja el cierre de sesión del usuario actual.
     * <p>
     * Invalida la sesión HTTP activa asociada a la solicitud.
     * </p>
     *
     * @param request  La solicitud HTTP.
     * @param response La respuesta HTTP.
     * @param out      El {@code PrintWriter} para escribir la respuesta JSON.
     */
    private void handleLogout(HttpServletRequest request, HttpServletResponse response, PrintWriter out) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        out.print(JsonResponse.success("Logout exitoso", null));
    }
    
    /**
     * Parsea el cuerpo de la solicitud HTTP en un objeto JSON.
     *
     * @param request La solicitud HTTP.
     * @return Un objeto {@code JsonObject} que representa el cuerpo de la solicitud.
     * @throws IOException si ocurre un error durante la lectura del cuerpo.
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