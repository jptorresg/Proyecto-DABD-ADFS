package com.halcon.aerolineas.config;

import java.io.IOException;
import java.io.InputStream;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Properties;

public class DatabaseConfig {
    private static String URL;
    private static String USERNAME;
    private static String PASSWORD;
    private static String DRIVER;
    
    static {
        try {
            Properties props = new Properties();
            InputStream input = DatabaseConfig.class.getClassLoader()
                .getResourceAsStream("db.properties");
            
            if (input == null) {
                throw new RuntimeException("No se encontró db.properties");
            }
            
            props.load(input);
            URL = props.getProperty("db.url");
            USERNAME = props.getProperty("db.user");
            PASSWORD = props.getProperty("db.password");
            DRIVER = props.getProperty("db.driver");
            
            Class.forName(DRIVER);
            
        } catch (IOException | ClassNotFoundException e) {
            throw new RuntimeException("Error al cargar configuración DB", e);
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
            e.printStackTrace();
        }
    }
    
    public static void main(String[] args) {
        testConnection();
    }
}