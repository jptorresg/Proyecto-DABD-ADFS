package com.halcon.aerolineas.services;

import com.halcon.aerolineas.dao.ComentarioDAO;
import com.halcon.aerolineas.models.ComentarioRating;
import com.halcon.aerolineas.config.DatabaseConfig;

import java.sql.Connection;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Servicio de lógica de negocio para la gestión de comentarios y valoraciones.
 * <p>
 * Proporciona métodos para obtener los comentarios de un vuelo en estructura jerárquica
 * (con respuestas anidadas) y para crear nuevos comentarios.
 * </p>
 */
public class ComentarioService {

    /**
     * Obtiene los comentarios asociados a un vuelo específico.
     * <p>
     * Recupera todos los comentarios desde la base de datos, construye una estructura
     * jerárquica de tipo padre-hijo (comentarios raíz con sus respectivas respuestas)
     * y calcula el promedio de valoraciones y el total de ratings.
     * </p>
     *
     * @param idVuelo Identificador del vuelo del cual se desean obtener los comentarios.
     * @return Objeto {@link ComentarioResponse} que contiene la lista jerárquica de comentarios,
     *         el promedio de ratings y el número total de valoraciones.
     * @throws RuntimeException Si ocurre un error al ejecutar la consulta a la base de datos.
     */
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
     * Convierte una lista plana de comentarios en una estructura jerárquica padre-hijo.
     *
     * @param lista Lista plana de objetos {@link ComentarioRating}.
     * @return Lista de nodos raíz ({@link ComentarioNode}) con sus respuestas anidadas.
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
    /**
     * Representa un nodo en la estructura jerárquica de comentarios.
     * <p>
     * Extiende {@link ComentarioRating} añadiendo una lista de respuestas (hijos)
     * para construir un árbol de comentarios.
     * </p>
     */
    public static class ComentarioNode extends ComentarioRating {

        /** Lista de respuestas asociadas a este comentario. */
        private List<ComentarioNode> respuestas = new ArrayList<>();

        /**
         * @return la lista de respuestas anidadas.
         */
        public List<ComentarioNode> getRespuestas() {
            return respuestas;
        }

        /**
         * @param respuestas la lista de respuestas a asignar.
         */
        public void setRespuestas(List<ComentarioNode> respuestas) {
            this.respuestas = respuestas;
        }
    }

    // =========================================================
    // CLASE INTERNA: Respuesta del endpoint
    // =========================================================
    /**
     * Encapsula la respuesta del endpoint de comentarios.
     * <p>
     * Contiene la estructura jerárquica de comentarios, el promedio de ratings
     * y el total de valoraciones realizadas.
     * </p>
     */
    public static class ComentarioResponse {

        /** Lista de comentarios raíz (con sus respuestas anidadas). */
        private List<ComentarioNode> comentarios;
        
        /** Promedio de todas las valoraciones (ratings) del vuelo. */
        private double promedio;
        
        /** Número total de valoraciones (no incluye respuestas sin rating). */
        private long totalRatings;

        /**
         * Constructor de la respuesta.
         *
         * @param comentarios   Lista de nodos raíz de comentarios.
         * @param promedio      Promedio de ratings.
         * @param totalRatings  Total de valoraciones.
         */
        public ComentarioResponse(List<ComentarioNode> comentarios,
                                  double promedio,
                                  long totalRatings) {
            this.comentarios = comentarios;
            this.promedio = promedio;
            this.totalRatings = totalRatings;
        }

        /**
         * @return la lista jerárquica de comentarios.
         */
        public List<ComentarioNode> getComentarios() {
            return comentarios;
        }

        /**
         * @return el promedio de ratings.
         */
        public double getPromedio() {
            return promedio;
        }

        /**
         * @return el total de valoraciones.
         */
        public long getTotalRatings() {
            return totalRatings;
        }
    }

    /**
     * Crea un nuevo comentario en la base de datos.
     * <p>
     * Inserta el comentario en la tabla {@code COMENTARIOS_RATINGS}. La fecha de creación
     * se asigna automáticamente en la capa de acceso a datos.
     * </p>
     *
     * @param comentario El objeto {@link ComentarioRating} que contiene los datos del comentario.
     * @throws RuntimeException Si ocurre un error durante la inserción.
     */
    public void crearComentario(ComentarioRating comentario) {

        try (Connection conn = DatabaseConfig.getConnection()) {

            ComentarioDAO dao = new ComentarioDAO(conn);
            dao.insertarComentario(comentario);

        } catch (Exception e) {
            throw new RuntimeException("Error creando comentario", e);
        }
    }
}