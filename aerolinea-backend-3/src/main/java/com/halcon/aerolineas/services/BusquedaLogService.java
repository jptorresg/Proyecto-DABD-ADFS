package com.halcon.aerolineas.services;

import java.time.LocalDate;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;

import com.halcon.aerolineas.dao.BusquedaLogDAO;
import com.halcon.aerolineas.models.Usuario;

public class BusquedaLogService {

    private BusquedaLogDAO dao = new BusquedaLogDAO();

    public void registrarBusqueda(
        HttpServletRequest request,
        String tipoBusqueda,
        String origen,
        String destino,
        LocalDate fechaSalida,
        LocalDate fechaRegreso,
        String tipoAsiento
    ) {
        try {
            HttpSession session = request.getSession(false);

            Long usuarioId = null;
            boolean esAgencia = false;

            if (session != null) {
                Usuario usuario = (Usuario) session.getAttribute("usuario");
                if (usuario != null) {
                    usuarioId = usuario.getIdUsuario();
                    esAgencia = false;
                }
            }

            String tipoOrigen = request.getRequestURI().contains("/api/")
                ? "WEB"
                : "REST";

            dao.guardarLog(
                tipoBusqueda,
                origen,
                destino,
                fechaSalida,
                fechaRegreso,
                tipoAsiento,
                usuarioId,
                esAgencia,
                tipoOrigen
            );

        } catch (Exception e) {
            e.printStackTrace(); // log, pero no rompas la búsqueda
        }
    }
}