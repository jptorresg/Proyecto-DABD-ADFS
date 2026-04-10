package com.halcon.aerolineas;

import com.halcon.aerolineas.utils.PasswordUtil;

/**
 * Clase auxiliar para generar el hash de una contraseña en línea de comandos.
 * <p>
 * Útil para crear hashes de contraseñas que luego pueden insertarse manualmente
 * en la base de datos (por ejemplo, para cuentas de administrador).
 * </p>
 */
public class GeneratePasswordHash {

    /**
     * Punto de entrada para generar un hash de contraseña y mostrarlo por consola.
     * <p>
     * Ejemplo de uso:
     * <pre>
     * java com.halcon.aerolineas.GeneratePasswordHash
     * </pre>
     * 
     *
     * @param args Argumentos de línea de comandos (no utilizados).
     */
    public static void main(String[] args) {
        String hash = PasswordUtil.hashPassword("123");
        System.out.println(hash);
    }
}