package com.halcon.aerolineas.services;

import com.halcon.aerolineas.dao.ComentarioDAO;
import com.halcon.aerolineas.models.ComentarioRating;
import com.halcon.aerolineas.config.DatabaseConfig;

import java.sql.Connection;
import java.util.*;
import java.util.stream.Collectors;

public class ComentarioService {

    public ComentarioResponse obtenerComentarios(int idVuelo) {

        try (Connection conn = DatabaseConfig.getConnection()) {

            ComentarioDAO dao = new ComentarioDAO(conn);
            List<ComentarioRating> lista = dao.getComentariosByVuelo(idVuelo);

            // Construir árbol jerárquico
            List<ComentarioNode> arbol = construirArbol(lista);

            // Calcular promedio de ratings
            double promedio = lista.stream()
                    .filter(c -> c.getRating() != null)
                    .mapToInt(ComentarioRating::getRating)
                    .average()
                    .orElse(0.0);

            // Total de ratings (no incluye respuestas sin rating)
            long totalRatings = lista.stream()
                    .filter(c -> c.getRating() != null)
                    .count();

            return new ComentarioResponse(arbol, promedio, totalRatings);

        } catch (Exception e) {
            throw new RuntimeException("Error obteniendo comentarios", e);
        }
    }

    /**
     * Convierte lista plana en estructura jerárquica padre-hijo
     */
    private List<ComentarioNode> construirArbol(List<ComentarioRating> lista) {

        Map<Long, ComentarioNode> mapa = new HashMap<>();
        List<ComentarioNode> raiz = new ArrayList<>();

        // 1️⃣ Convertimos todos a nodos
        for (ComentarioRating c : lista) {

            ComentarioNode node = new ComentarioNode();

            node.setIdComentario(c.getIdComentario());
            node.setIdUsuario(c.getIdUsuario());
            node.setIdComentarioPadre(c.getIdComentarioPadre());
            node.setRating(c.getRating());
            node.setTextoComentario(c.getTextoComentario());
            node.setFechaCreacion(c.getFechaCreacion());

            mapa.put(node.getIdComentario(), node);
        }

        // 2️⃣ Construimos relaciones padre-hijo
        for (ComentarioNode node : mapa.values()) {

            if (node.getIdComentarioPadre() == null) {
                raiz.add(node);
            } else {
                ComentarioNode padre = mapa.get(node.getIdComentarioPadre());
                if (padre != null) {
                    padre.getRespuestas().add(node);
                }
            }
        }

        return raiz;
    }

    // =========================================================
    // CLASE INTERNA: Nodo con respuestas
    // =========================================================
    public static class ComentarioNode extends ComentarioRating {

        private List<ComentarioNode> respuestas = new ArrayList<>();

        public List<ComentarioNode> getRespuestas() {
            return respuestas;
        }

        public void setRespuestas(List<ComentarioNode> respuestas) {
            this.respuestas = respuestas;
        }
    }

    // =========================================================
    // CLASE INTERNA: Respuesta del endpoint
    // =========================================================
    public static class ComentarioResponse {

        private List<ComentarioNode> comentarios;
        private double promedio;
        private long totalRatings;

        public ComentarioResponse(List<ComentarioNode> comentarios,
                                  double promedio,
                                  long totalRatings) {
            this.comentarios = comentarios;
            this.promedio = promedio;
            this.totalRatings = totalRatings;
        }

        public List<ComentarioNode> getComentarios() {
            return comentarios;
        }

        public double getPromedio() {
            return promedio;
        }

        public long getTotalRatings() {
            return totalRatings;
        }
    }

    public void crearComentario(ComentarioRating comentario) {

        try (Connection conn = DatabaseConfig.getConnection()) {

            ComentarioDAO dao = new ComentarioDAO(conn);
            dao.insertarComentario(comentario);

        } catch (Exception e) {
            throw new RuntimeException("Error creando comentario", e);
        }
    }
}