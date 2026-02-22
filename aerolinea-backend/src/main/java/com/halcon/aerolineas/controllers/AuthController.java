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

@WebServlet("/api/auth/*")
public class AuthController extends HttpServlet {
    
    private AuthService authService;

    @Override
    public void init() throws ServletException {
        this.authService = new AuthService();
    }
    
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
    
    private void handleLogin(HttpServletRequest request, HttpServletResponse response, PrintWriter out) {
        try {
            // Leer JSON del request body
            JsonObject json = parseRequestBody(request);
            
            String email = json.get("email").getAsString();
            String password = json.get("password").getAsString();
            
            Usuario usuario = authService.login(email, password);
            
            // Crear sesión
            HttpSession session = request.getSession(true);
            session.setAttribute("usuarioId", usuario.getIdUsuario());
            session.setAttribute("usuarioEmail", usuario.getEmail());
            session.setAttribute("usuarioTipo", usuario.getTipoUsuario());
            session.setMaxInactiveInterval(3600); // 1 hora
            
            out.print(JsonResponse.success("Login exitoso", usuario));
            
        } catch (Exception e) {
            response.setStatus(401);
            out.print(JsonResponse.error(e.getMessage()));
        }
    }
    
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
    
    private void handleLogout(HttpServletRequest request, HttpServletResponse response, PrintWriter out) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        out.print(JsonResponse.success("Logout exitoso", null));
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