/*import static org.junit.jupiter.api.Assertions.*;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.DriverManager;
import java.time.LocalDate;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.halcon.aerolineas.dao.ReservacionDAO;
import com.halcon.aerolineas.models.Reservacion;

public class ReservacionDAOTest {

    private Connection conn;
    private ReservacionDAO dao;

    @BeforeEach
    void setUp() throws Exception {
        conn = DriverManager.getConnection("jdbc:h2:mem:testdb");
        
        conn.createStatement().execute(
            "CREATE TABLE VUELOS (" +
            "id_vuelo BIGINT AUTO_INCREMENT PRIMARY KEY, " +
            "asientos_disponibles INT" +
            ")"
        );

        conn.createStatement().execute(
            "CREATE TABLE RESERVACIONES (" +
            "id_reservacion BIGINT AUTO_INCREMENT PRIMARY KEY, " +
            "codigo_reservacion VARCHAR(50), " +
            "id_vuelo BIGINT, " +
            "id_usuario BIGINT, " +
            "num_pasajeros INT, " +
            "precio_total DECIMAL(10,2), " +
            "estado VARCHAR(20), " +
            "metodo_pago VARCHAR(50), " +
            "fecha_compra TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
            ")"
        );

        // Insertar vuelo de prueba
        conn.createStatement().execute(
            "INSERT INTO VUELOS (id_vuelo, asientos_disponibles) VALUES (1, 10)"
        );

        dao = new ReservacionDAO(conn);
    }

    @Test
    void testCreateReservacion() throws Exception {
        Reservacion r = new Reservacion();
        r.setCodigoReservacion("ABC123");
        r.setIdVuelo(1L);
        r.setIdUsuario(1L);
        r.setNumPasajeros(2);
        r.setPrecioTotal(new BigDecimal("500.00"));
        r.setMetodoPago("TARJETA");

        Long id = dao.create(r);

        assertNotNull(id);

        var rs = conn.createStatement()
            .executeQuery("SELECT asientos_disponibles FROM VUELOS WHERE id_vuelo = 1");

        rs.next();
        int asientos = rs.getInt(1);

        assertEquals(8, asientos); // 10 - 2
    }

    @Test
    void testCreateSinAsientos() throws Exception {
        conn.createStatement().execute(
            "UPDATE VUELOS SET asientos_disponibles = 1 WHERE id_vuelo = 1"
        );

        Reservacion r = new Reservacion();
        r.setCodigoReservacion("FAIL");
        r.setIdVuelo(1L);
        r.setIdUsuario(1L);
        r.setNumPasajeros(5);
        r.setPrecioTotal(new BigDecimal("100.00"));
        r.setMetodoPago("TARJETA");

        assertThrows(Exception.class, () -> dao.create(r));
    }

    @Test
    void testCancelar() throws Exception {
        // Crear reservación manual
        conn.createStatement().execute(
            "INSERT INTO RESERVACIONES " +
            "(id_reservacion, codigo_reservacion, id_vuelo, id_usuario, num_pasajeros, estado) " +
            "VALUES (1, 'ABC', 1, 1, 2, 'CONFIRMADA')"
        );

        conn.createStatement().execute(
            "UPDATE VUELOS SET asientos_disponibles = 8 WHERE id_vuelo = 1"
        );

        dao.cancelar(1L);

        var rs = conn.createStatement()
            .executeQuery("SELECT asientos_disponibles FROM VUELOS WHERE id_vuelo = 1");

        rs.next();
        assertEquals(10, rs.getInt(1)); // devolvió los asientos
    }
}*/