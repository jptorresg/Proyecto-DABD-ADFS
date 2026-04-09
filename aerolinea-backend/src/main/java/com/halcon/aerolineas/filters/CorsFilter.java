package com.halcon.aerolineas.filters;

import java.io.IOException;

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.annotation.WebFilter;
import javax.servlet.http.HttpServletResponse;

/**
 * Filtro para habilitar CORS (Cross-Origin Resource Sharing) en la aplicación.
 * <p>
 * Permite solicitudes desde el frontend (por ejemplo, {@code http://localhost:8080})
 * estableciendo las cabeceras CORS adecuadas en cada respuesta.
 * </p>
 */
@WebFilter("/*")
public class CorsFilter implements Filter {

    /**
     * Intercepta cada solicitud entrante para agregar las cabeceras CORS necesarias.
     * <p>
     * Este método establece los siguientes encabezados:
     * <ul>
     *   <li>{@code Access-Control-Allow-Origin}: {@code http://localhost:8080}</li>
     *   <li>{@code Access-Control-Allow-Credentials}: {@code true}</li>
     *   <li>{@code Access-Control-Allow-Methods}: {@code GET, POST, PUT, DELETE, OPTIONS}</li>
     *   <li>{@code Access-Control-Allow-Headers}: {@code Content-Type, Authorization}</li>
     *   <li>{@code Access-Control-Max-Age}: {@code 3600}</li>
     * </ul>
     * 
     *
     * @param req   La solicitud entrante.
     * @param res   La respuesta saliente.
     * @param chain La cadena de filtros para continuar procesando la solicitud.
     * @throws IOException      Si ocurre un error de entrada/salida.
     * @throws ServletException Si ocurre un error en el filtro del servlet.
     */
    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        HttpServletResponse response = (HttpServletResponse) res;
        response.setHeader("Access-Control-Allow-Origin", "http://localhost:8080");
        response.setHeader("Access-Control-Allow-Credentials", "true");
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        response.setHeader("Access-Control-Max-Age", "3600");
        chain.doFilter(req, res);
    }
}