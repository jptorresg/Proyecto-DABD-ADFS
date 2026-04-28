package com.halcon.aerolineas.utils;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Utilidad para el manejo seguro de contraseñas y generación de códigos únicos.
 * <p>
 * Proporciona métodos para:
 * <ul>
 *   <li>Generar un hash seguro de una contraseña usando SHA-256 y salt aleatorio.</li>
 *   <li>Verificar si una contraseña en texto plano coincide con un hash almacenado.</li>
 *   <li>Generar códigos de reservación aleatorios.</li>
 * </ul>
 * 
 */
public class PasswordUtil {
    
    /**
     * Genera un hash seguro de una contraseña utilizando SHA-256 y un salt aleatorio.
     * <p>
     * El resultado es una cadena Base64 que contiene los primeros 16 bytes del salt
     * seguidos del hash de la contraseña. Este formato permite almacenar el salt y el hash
     * juntos en un solo campo de la base de datos.
     * </p>
     *
     * @param password La contraseña en texto plano a hashear.
     * @return Una cadena en Base64 que contiene el salt (16 bytes) + el hash SHA-256.
     * @throws RuntimeException Si el algoritmo SHA-256 no está disponible en el entorno.
     */
    public static String hashPassword(String password) {
        try {
            // Generar salt aleatorio
            SecureRandom random = new SecureRandom();
            byte[] salt = new byte[16];
            random.nextBytes(salt);
            
            // Hash con SHA-256
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            md.update(salt);
            byte[] hashedPassword = md.digest(password.getBytes());
            
            // Combinar salt + hash y convertir a Base64
            byte[] combined = new byte[salt.length + hashedPassword.length];
            System.arraycopy(salt, 0, combined, 0, salt.length);
            System.arraycopy(hashedPassword, 0, combined, salt.length, hashedPassword.length);
            
            return Base64.getEncoder().encodeToString(combined);
            
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Error al hashear contraseña", e);
        }
    }
    
    /**
     * Verifica si una contraseña en texto plano coincide con un hash almacenado.
     * <p>
     * Extrae el salt de los primeros 16 bytes del hash almacenado, aplica SHA-256 a la
     * contraseña proporcionada con ese mismo salt y compara los resultados de manera segura
     * (utilizando {@link MessageDigest#isEqual(byte[], byte[])} para evitar ataques de timing).
     * </p>
     *
     * @param password    La contraseña en texto plano a verificar.
     * @param storedHash  El hash almacenado (generado previamente con {@link #hashPassword(String)}).
     * @return {@code true} si la contraseña coincide, {@code false} en caso contrario.
     */
    public static boolean verifyPassword(String password, String storedHash) {
        try {
            byte[] combined = Base64.getDecoder().decode(storedHash);
            
            // Extraer salt (primeros 16 bytes)
            byte[] salt = new byte[16];
            System.arraycopy(combined, 0, salt, 0, 16);
            
            // Hash de la contraseña ingresada con el mismo salt
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            md.update(salt);
            byte[] hashedPassword = md.digest(password.getBytes());
            
            // Comparar con el hash almacenado
            byte[] storedPasswordHash = new byte[combined.length - 16];
            System.arraycopy(combined, 16, storedPasswordHash, 0, storedPasswordHash.length);
            
            return MessageDigest.isEqual(hashedPassword, storedPasswordHash);
            
        } catch (Exception e) {
            return false;
        }
    }
    
    /**
     * Genera un código único para identificar una reservación.
     * <p>
     * El código tiene el formato {@code RES-XXXXXXXX} donde cada {@code X} es un carácter
     * alfanumérico en mayúsculas (A-Z, 0-9), excluyendo letras minúsculas y caracteres especiales
     * para facilitar su lectura y comunicación.
     * </p>
     *
     * @return Un código de reservación único de 12 caracteres (incluyendo el prefijo "RES-").
     */
    public static String generarCodigoReservacion() {
        SecureRandom random = new SecureRandom();
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        StringBuilder sb = new StringBuilder("RES-");
        
        for (int i = 0; i < 8; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        
        return sb.toString();
    }
}