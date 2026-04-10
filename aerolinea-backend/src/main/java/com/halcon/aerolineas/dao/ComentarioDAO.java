package com.halcon.aerolineas.dao;

import com.halcon.aerolineas.models.ComentarioRating;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Clase de acceso a datos para la gestión de comentarios y valoraciones de vuelos.
 * <p>
 * Proporciona métodos para obtener los comentarios asociados a un vuelo y para
 * insertar nuevos comentarios en la base de datos.
 * </p>
 */
public class ComentarioDAO {

    private Connection conn;

    /**
     * Constructor que recibe una conexión activa a la base de datos.
     *
     * @param conn Conexión JDBC que será utilizada para ejecutar las consultas.
     */
    public ComentarioDAO(Connection conn) {
        this.conn = conn;
    }

    /**
     * Obtiene los comentarios asociados a un vuelo específico.
     * <p>
     * Devuelve una lista de objetos {@link ComentarioRating} ordenados por fecha
     * de creación en orden descendente (los más recientes primero).
     * </p>
     *
     * @param idVuelo Identificador del vuelo del cual se desean obtener los comentarios.
     * @return Lista de objetos {@link ComentarioRating} con los comentarios del vuelo.
     * @throws SQLException Si ocurre un error al ejecutar la consulta.
     */
    public List<ComentarioRating> getComentariosByVuelo(int idVuelo) throws SQLException {

        String sql =
                "SELECT ID_COMENTARIO, ID_USUARIO, ID_COMENTARIO_PADRE, " +
                "RATING, TEXTO_COMENTARIO, FECHA_CREACION " +
                "FROM COMENTARIOS_RATINGS " +
                "WHERE ID_VUELO = ? " +
                "ORDER BY FECHA_CREACION DESC";

        PreparedStatement ps = conn.prepareStatement(sql);
        ps.setInt(1, idVuelo);

        ResultSet rs = ps.executeQuery();

        List<ComentarioRating> lista = new ArrayList<>();

        while (rs.next()) {

            ComentarioRating c = new ComentarioRating();

            c.setIdComentario(rs.getLong("ID_COMENTARIO"));
            c.setIdUsuario(rs.getLong("ID_USUARIO"));

            Object padre = rs.getObject("ID_COMENTARIO_PADRE");
            if (padre != null) {
                c.setIdComentarioPadre(rs.getLong("ID_COMENTARIO_PADRE"));
            }

            Object rating = rs.getObject("RATING");
            if (rating != null) {
                c.setRating(rs.getInt("RATING"));
            }

            c.setTextoComentario(rs.getString("TEXTO_COMENTARIO"));

            Timestamp timestamp = rs.getTimestamp("FECHA_CREACION");
            if (timestamp != null) {
                c.setFechaCreacion(timestamp.toLocalDateTime());
            }

            lista.add(c);
        }

        rs.close();
        ps.close();

        return lista;
    }

    /**
     * Inserta un nuevo comentario en la base de datos.
     * <p>
     * El comentario se almacena en la tabla {@code COMENTARIOS_RATINGS}. La fecha
     * de creación se establece automáticamente utilizando la función
     * {@code SYSTIMESTAMP} de Oracle.
     * </p>
     *
     * @param comentario Objeto {@link ComentarioRating} que contiene los datos del comentario a insertar.
     * @throws SQLException Si ocurre un error al ejecutar la inserción.
     */
    public void insertarComentario(ComentarioRating comentario) throws SQLException {

        String sql =
            "INSERT INTO COMENTARIOS_RATINGS " +
            "(ID_VUELO, ID_USUARIO, ID_COMENTARIO_PADRE, RATING, TEXTO_COMENTARIO, FECHA_CREACION) " +
            "VALUES (?, ?, ?, ?, ?, SYSTIMESTAMP)";

        PreparedStatement ps = conn.prepareStatement(sql);

        ps.setLong(1, comentario.getIdVuelo());
        ps.setLong(2, comentario.getIdUsuario());

        if (comentario.getIdComentarioPadre() != null) {
            ps.setLong(3, comentario.getIdComentarioPadre());
        } else {
            ps.setNull(3, Types.NUMERIC);
        }

        if (comentario.getRating() != null) {
            ps.setInt(4, comentario.getRating());
        } else {
            ps.setNull(4, Types.NUMERIC);
        }

        ps.setString(5, comentario.getTextoComentario());

        ps.executeUpdate();
        ps.close();
    }
}