package com.halcon.aerolineas.dao;

import com.halcon.aerolineas.models.ComentarioRating;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class ComentarioDAO {

    private Connection conn;

    public ComentarioDAO(Connection conn) {
        this.conn = conn;
    }

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