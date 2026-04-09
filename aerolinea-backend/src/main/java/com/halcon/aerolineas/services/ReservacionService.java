package com.halcon.aerolineas.services;

import com.halcon.aerolineas.dao.*;
import com.halcon.aerolineas.models.*;
import com.halcon.aerolineas.utils.PasswordUtil;

import java.math.BigDecimal;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;

/**
 * Servicio de lógica de negocio para la gestión de reservaciones.
 * <p>
 * Proporciona métodos para crear, consultar y cancelar reservaciones,
 * incluyendo la gestión de pasajeros asociados.
 * </p>
 */
public class ReservacionService {
    
    private ReservacionDAO reservacionDAO;
    private VueloDAO vueloDAO;
    private PasajeroDAO pasajeroDAO;
    
    /**
     * Constructor que inicializa el servicio con los DAO necesarios.
     */
    public ReservacionService() {
        this.reservacionDAO = new ReservacionDAO();
        this.vueloDAO = new VueloDAO();
        this.pasajeroDAO = new PasajeroDAO();
    }
    
    /**
     * Crea una nueva reservación junto con sus pasajeros asociados.
     * <p>
     * Realiza las siguientes validaciones y operaciones:
     * <ol>
     *   <li>Verifica que el vuelo exista y esté activo.</li>
     *   <li>Comprueba que haya suficientes asientos disponibles.</li>
     *   <li>Calcula el precio total multiplicando el precio base por el número de pasajeros.</li>
     *   <li>Genera un código único de reservación.</li>
     *   <li>Inserta la reservación en la base de datos.</li>
     *   <li>Crea los registros de pasajeros asociados.</li>
     * </ol>
     * 
     *
     * @param idVuelo    Identificador del vuelo a reservar.
     * @param idUsuario  Identificador del usuario que realiza la reserva.
     * @param pasajeros  Lista de objetos {@link Pasajero} con los datos de los viajeros.
     * @param metodoPago Método de pago utilizado (ej. "TARJETA", "EFECTIVO").
     * @return La reservación creada, incluyendo el código generado y demás datos.
     * @throws SQLException             Si ocurre un error en la base de datos.
     * @throws IllegalArgumentException Si el vuelo no existe, no está activo o no hay asientos suficientes.
     */
    public Reservacion crearReservacion(Long idVuelo, Long idUsuario, 
                                       List<Pasajero> pasajeros, String metodoPago) throws SQLException {
        
        // Validar vuelo existe y tiene disponibilidad
        Vuelo vuelo = vueloDAO.findById(idVuelo);
        if (vuelo == null) {
            throw new IllegalArgumentException("Vuelo no encontrado");
        }
        
        if (!vuelo.getEstado().equals("ACTIVO")) {
            throw new IllegalArgumentException("El vuelo no está activo");
        }
        
        int numPasajeros = pasajeros.size();
        if (vuelo.getAsientosDisponibles() < numPasajeros) {
            throw new IllegalArgumentException("No hay suficientes asientos disponibles");
        }
        
        // Calcular precio total
        BigDecimal precioTotal = vuelo.getPrecioBase().multiply(new BigDecimal(numPasajeros));
        
        // Crear reservación
        Reservacion reservacion = new Reservacion();
        reservacion.setCodigoReservacion(PasswordUtil.generarCodigoReservacion());
        reservacion.setIdVuelo(idVuelo);
        reservacion.setIdUsuario(idUsuario);
        reservacion.setNumPasajeros(numPasajeros);
        reservacion.setPrecioTotal(precioTotal);
        reservacion.setMetodoPago(metodoPago);
        
        Long idReservacion = reservacionDAO.create(reservacion);
        
        if (idReservacion == null) {
            throw new SQLException("Error al crear reservación");
        }
        
        // Crear pasajeros asociados
        for (Pasajero pasajero : pasajeros) {
            pasajero.setIdReservacion(idReservacion);
            pasajero.setTipoAsiento(vuelo.getTipoAsiento());
            pasajeroDAO.create(pasajero);
        }
        
        // Retornar reservación completa
        return reservacionDAO.findByCodigo(reservacion.getCodigoReservacion());
    }
    
    /**
     * Obtiene todas las reservaciones asociadas a un usuario.
     *
     * @param idUsuario Identificador del usuario.
     * @return Lista de objetos {@link Reservacion} pertenecientes al usuario.
     * @throws SQLException Si ocurre un error en la consulta a la base de datos.
     */
    public List<Reservacion> obtenerReservacionesUsuario(Long idUsuario) throws SQLException {
        return reservacionDAO.findByUsuario(idUsuario);
    }
    
    /**
     * Busca una reservación por su código único.
     *
     * @param codigo Código de la reservación.
     * @return La reservación encontrada.
     * @throws SQLException             Si ocurre un error en la consulta.
     * @throws IllegalArgumentException Si la reservación no existe.
     */
    public Reservacion buscarPorCodigo(String codigo) throws SQLException {
        Reservacion reservacion = reservacionDAO.findByCodigo(codigo);
        if (reservacion == null) {
            throw new IllegalArgumentException("Reservación no encontrada");
        }
        return reservacion;
    }
    
    /**
     * Obtiene la lista de pasajeros asociados a una reservación.
     *
     * @param idReservacion Identificador de la reservación.
     * @return Lista de objetos {@link Pasajero} que viajan en dicha reservación.
     * @throws SQLException Si ocurre un error en la consulta.
     */
    public List<Pasajero> obtenerPasajeros(Long idReservacion) throws SQLException {
        return pasajeroDAO.findByReservacion(idReservacion);
    }

    /**
     * Cancela una reservación existente.
     * <p>
     * Verifica que la reservación exista y que su estado sea {@code CONFIRMADA}.
     * Luego, procede a cancelarla, liberando los asientos correspondientes.
     * </p>
     *
     * @param idReservacion ID de la reservación a cancelar.
     * @throws SQLException             Si ocurre un error en la base de datos.
     * @throws IllegalArgumentException Si la reservación no existe o no está en estado {@code CONFIRMADA}.
     */
    public void cancelarReservacion(Long idReservacion) throws SQLException {
        Reservacion reservacion = reservacionDAO.findById(idReservacion);

        if (reservacion == null) {
            throw new IllegalArgumentException("Reservación no encontrada");
        }

        if (!"CONFIRMADA".equals(reservacion.getEstado())) {
            throw new IllegalArgumentException("Solo se pueden cancelar reservaciones confirmadas");
        }

        reservacionDAO.cancelar(idReservacion);
    }
}