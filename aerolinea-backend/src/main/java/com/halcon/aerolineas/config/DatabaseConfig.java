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

            try (InputStream input = DatabaseConfig.class
                    .getClassLoader()
                    .getResourceAsStream("db.properties")) {

                if (input == null) {
                    throw new RuntimeException("No se encontró db.properties");
                }
                props.load(input);
            }

            // Leer desde variables de entorno si existen, de lo contrario usar db.properties
            URL = System.getenv().getOrDefault("DB_URL", props.getProperty("db.url"));
            USERNAME = System.getenv().getOrDefault("DB_USER", props.getProperty("db.user"));
            PASSWORD = System.getenv().getOrDefault("DB_PASSWORD", props.getProperty("db.password"));
            DRIVER = System.getenv().getOrDefault("DB_DRIVER", props.getProperty("db.driver"));

            Class.forName(DRIVER);

        } catch (IOException | ClassNotFoundException e) {
            throw new ExceptionInInitializerError(
                "Error crítico de configuración DB: " + e.getMessage()
            );
        }
    }

    /**
     * Devuelve una conexión a la base de datos.
     * @return Conexión a la base de datos.
     * @throws SQLException Si no se puede conectar a la base de datos.
     */
    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(URL, USERNAME, PASSWORD);
    }

    /**
     * Prueba la conexión a la base de datos.
     * <p>
     *     Intenta establecer una conexión a la base de datos y
     *     muestra un mensaje indicando si la conexión fue exitosa o no.
     * </p>
     * 
     */
    public static void testConnection() {
        try (Connection conn = getConnection()) {
            System.out.println("✅ Conexión exitosa a Oracle!");
            System.out.println("📊 Catálogo: " + conn.getCatalog());
        } catch (SQLException e) {
            System.err.println("❌ Error de conexión: " + e.getMessage());
            throw new RuntimeException("Error en la operación de base de datos", e);
        }
    }

/**
 * Método principal para probar la conexión a la base de datos.
 *
 * @param args argumentos de línea de comandos
 */
    public static void main(String[] args) {
        testConnection();
    }
}