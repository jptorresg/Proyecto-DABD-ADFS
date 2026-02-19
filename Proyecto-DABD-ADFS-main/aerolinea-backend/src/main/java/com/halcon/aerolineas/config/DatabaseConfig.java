package com.halcon.aerolineas.config;

import java.io.IOException;
import java.io.InputStream;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Properties;

public class DatabaseConfig {
    private static final String URL;
    private static final String USERNAME;
    private static final String PASSWORD;
    private static final String DRIVER;

    static {
        try {
            Properties props = new Properties();
            try (InputStream input = DatabaseConfig.class.getClassLoader()
                    .getResourceAsStream("db.properties")) {
                
                if (input == null) throw new RuntimeException("No se encontró db.properties");
                props.load(input);
            }

            URL = props.getProperty("db.url");
            USERNAME = props.getProperty("db.user");
            PASSWORD = props.getProperty("db.password");
            DRIVER = props.getProperty("db.driver");

            Class.forName(DRIVER);
        } catch (IOException | ClassNotFoundException e) {
            // Se usa un logger o se lanza una excepción de sistema
            throw new ExceptionInInitializerError("Error crítico de configuración DB: " + e.getMessage());
        }
    }
    
    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(URL, USERNAME, PASSWORD);
    }
    
    public static void testConnection() {
        try (Connection conn = getConnection()) {
            System.out.println("✅ Conexión exitosa a Oracle!");
            System.out.println("📊 Catálogo: " + conn.getCatalog());
        } catch (SQLException e) {
            System.err.println("❌ Error de conexión: " + e.getMessage());
            throw new RuntimeException("Error en la operación de base de datos", e);
        }
    }
    
    public static void main(String[] args) {
        testConnection();
    }
}