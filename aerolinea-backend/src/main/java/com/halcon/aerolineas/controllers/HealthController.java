package com.halcon.aerolineas.controllers;

import java.io.IOException;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.halcon.aerolineas.config.DatabaseConfig;

@WebServlet("/api/health")
public class HealthController extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try (Connection conn = DatabaseConfig.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT COUNT(*) AS total FROM VUELOS")) {

            rs.next();
            int total = rs.getInt("total");

            response.getWriter().print(
                "{\"status\":\"ok\",\"database\":\"connected\",\"totalVuelos\":" + total + "}"
            );

        } catch (Exception e) {
            response.setStatus(500);
            response.getWriter().print(
                "{\"status\":\"error\",\"message\":\"" + e.getMessage() + "\"}"
            );
        }
    }
}
