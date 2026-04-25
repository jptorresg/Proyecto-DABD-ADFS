package com.halcon.aerolineas.controllers;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class HealthControllerTest {

    private HealthController controller;
    private HttpServletRequest request;
    private HttpServletResponse response;

    private StringWriter responseWriter;

    @BeforeEach
    void setUp() throws Exception {
        controller = spy(new HealthController());

        request = mock(HttpServletRequest.class);
        response = mock(HttpServletResponse.class);

        responseWriter = new StringWriter();
        when(response.getWriter()).thenReturn(new PrintWriter(responseWriter));
    }

    @Test
    void testHealthOK() throws Exception {

        // mocks DB
        Connection conn = mock(Connection.class);
        Statement stmt = mock(Statement.class);
        ResultSet rs = mock(ResultSet.class);

        doReturn(conn).when(controller).getConnection();

        when(conn.createStatement()).thenReturn(stmt);
        when(stmt.executeQuery(anyString())).thenReturn(rs);
        when(rs.next()).thenReturn(true);
        when(rs.getInt("total")).thenReturn(10);

        controller.doGet(request, response);

        String result = responseWriter.toString();

        assertTrue(result.contains("ok"));
        assertTrue(result.contains("connected"));
        assertTrue(result.contains("10"));
    }

    @Test
    void testHealthError() throws Exception {

        doThrow(new RuntimeException("DB error"))
                .when(controller).getConnection();

        controller.doGet(request, response);

        String result = responseWriter.toString();

        assertTrue(result.contains("error"));
        assertTrue(result.contains("DB error"));
    }
}