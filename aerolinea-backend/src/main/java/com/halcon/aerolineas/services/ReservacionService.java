package com.halcon.aerolineas.services;

import com.halcon.aerolineas.dao.*;
import com.halcon.aerolineas.models.*;
import com.halcon.aerolineas.utils.PasswordUtil;

import java.math.BigDecimal;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;
import java.util.Objects;

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
    private UsuarioDAO usuarioDAO;
    private CategoriaVueloDAO categoriaVueloDAO;
    private PdfService pdfService;
    private EmailService emailService;

    /**
     * Constructor que inicializa el servicio con los DAO necesarios.
     */
    public ReservacionService() {
        this.reservacionDAO = new ReservacionDAO();
        this.vueloDAO = new VueloDAO();
        this.pasajeroDAO = new PasajeroDAO();
        this.usuarioDAO = new UsuarioDAO();
        this.categoriaVueloDAO = new CategoriaVueloDAO();
        this.pdfService = new PdfService();
        this.emailService = new EmailService();
    }

    public ReservacionService(
        ReservacionDAO reservacionDAO,
        VueloDAO vueloDAO,
        PasajeroDAO pasajeroDAO,
        UsuarioDAO usuarioDAO,
        CategoriaVueloDAO categoriaVueloDAO,
        PdfService pdfService,
        EmailService emailService
    ) {
        this.reservacionDAO = reservacionDAO;
        this.vueloDAO = vueloDAO;
        this.pasajeroDAO = pasajeroDAO;
        this.usuarioDAO = usuarioDAO;
        this.categoriaVueloDAO = categoriaVueloDAO;
        this.pdfService = pdfService;
        this.emailService = emailService;
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
        return crearReservacion(idVuelo, idUsuario, pasajeros, metodoPago, true);
    }

    /**
     * Variante de {@link #crearReservacion(Long, Long, List, String)} que permite
     * suprimir el envío automático del correo de confirmación. Útil cuando un
     * mismo viaje se compone de varios tramos (roundtrip o escalas) y se quiere
     * notificar al usuario con un solo correo combinado al final.
     */
    public Reservacion crearReservacion(Long idVuelo, Long idUsuario,
                                       List<Pasajero> pasajeros, String metodoPago,
                                       boolean enviarCorreo) throws SQLException {

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

        if (enviarCorreo) {
            List<Pasajero> pasajerosList = pasajeroDAO.findByReservacion(idReservacion);
            byte[] pdf = pdfService.generarPDF(reservacion, pasajerosList);

            Usuario usuario = usuarioDAO.findById(idUsuario);
            if (usuario == null) {
                throw new IllegalArgumentException("Usuario no encontrado");
            }

            try {
                emailService.enviarCorreo(usuario.getEmail(), pdf, reservacion.getCodigoReservacion());
            } catch (Exception e) {
                e.printStackTrace();
                System.err.println("Error enviando correo: " + e.getMessage());
            }
        }

        // Retornar reservación completa
        return reservacionDAO.findByCodigo(reservacion.getCodigoReservacion());
    }

    /**
     * Variante v2 de {@code crearReservacion} que reserva una <em>categoría</em>
     * específica del vuelo (CATEGORIAS_VUELO), no el vuelo entero.
     * <p>
     * Diferencias con v1:
     * <ul>
     *   <li>El precio sale de {@code categoria.getPrecio()} (la categoría elegida),
     *       no de {@code vuelo.getPrecioBase()}.</li>
     *   <li>Los pasajeros heredan {@code tipoAsiento} de la categoría reservada.</li>
     *   <li>El stock se decrementa en {@code CATEGORIAS_VUELO.asientos_disponibles}
     *       en vez de {@code VUELOS.asientos_disponibles}. Los triggers de la
     *       migración 20260516_categorias_vuelo mantienen VUELOS sincronizado
     *       para que la API v1 siga viendo conteos coherentes.</li>
     *   <li>Se persiste {@code id_categoria} en RESERVACIONES, lo que permite a
     *       {@code cancelarReservacion()} devolver asientos a la categoría
     *       correcta.</li>
     * </ul>
     *
     * @throws IllegalArgumentException si la categoría no existe, no pertenece al
     *         vuelo, no hay stock, o el vuelo no está activo.
     */
    public Reservacion crearReservacion(Long idVuelo, Long idCategoria, Long idUsuario,
                                       List<Pasajero> pasajeros, String metodoPago,
                                       boolean enviarCorreo) throws SQLException {

        if (idCategoria == null) {
            throw new IllegalArgumentException("idCategoria es requerido");
        }

        Vuelo vuelo = vueloDAO.findById(idVuelo);
        if (vuelo == null) {
            throw new IllegalArgumentException("Vuelo no encontrado");
        }
        if (!"ACTIVO".equals(vuelo.getEstado())) {
            throw new IllegalArgumentException("El vuelo no está activo");
        }

        CategoriaVuelo categoria = categoriaVueloDAO.findById(idCategoria);
        if (categoria == null) {
            throw new IllegalArgumentException("Categoría no encontrada");
        }
        if (!Objects.equals(categoria.getIdVuelo(), idVuelo)) {
            throw new IllegalArgumentException(
                "La categoría " + idCategoria + " no pertenece al vuelo " + idVuelo);
        }

        int numPasajeros = pasajeros.size();
        if (categoria.getAsientosDisponibles() < numPasajeros) {
            throw new IllegalArgumentException("No hay suficientes asientos disponibles en la categoría");
        }

        BigDecimal precioTotal = categoria.getPrecio().multiply(new BigDecimal(numPasajeros));

        Reservacion reservacion = new Reservacion();
        reservacion.setCodigoReservacion(PasswordUtil.generarCodigoReservacion());
        reservacion.setIdVuelo(idVuelo);
        reservacion.setIdCategoria(idCategoria);
        reservacion.setIdUsuario(idUsuario);
        reservacion.setNumPasajeros(numPasajeros);
        reservacion.setPrecioTotal(precioTotal);
        reservacion.setMetodoPago(metodoPago);

        Long idReservacion = reservacionDAO.createConCategoria(reservacion);
        if (idReservacion == null) {
            throw new SQLException("Error al crear reservación");
        }

        for (Pasajero pasajero : pasajeros) {
            pasajero.setIdReservacion(idReservacion);
            pasajero.setTipoAsiento(categoria.getTipoAsiento());
            pasajeroDAO.create(pasajero);
        }

        if (enviarCorreo) {
            List<Pasajero> pasajerosList = pasajeroDAO.findByReservacion(idReservacion);
            byte[] pdf = pdfService.generarPDF(reservacion, pasajerosList);

            Usuario usuario = usuarioDAO.findById(idUsuario);
            if (usuario == null) {
                throw new IllegalArgumentException("Usuario no encontrado");
            }

            try {
                emailService.enviarCorreo(usuario.getEmail(), pdf, reservacion.getCodigoReservacion());
            } catch (Exception e) {
                e.printStackTrace();
                System.err.println("Error enviando correo: " + e.getMessage());
            }
        }

        return reservacionDAO.findByCodigo(reservacion.getCodigoReservacion());
    }

    /**
     * Envía un único correo de confirmación que combina todos los tramos de un
     * viaje (roundtrip o escalas). Genera un PDF que lista cada tramo con su
     * subtotal y muestra el total general sumado.
     *
     * @param reservaciones reservas a notificar, en orden cronológico de viaje.
     * @param pasajeros     pasajeros (los mismos para todos los tramos).
     * @param idUsuario     usuario destinatario del correo.
     */
    public void enviarConfirmacionMultiTramo(List<Reservacion> reservaciones,
                                             List<Pasajero> pasajeros,
                                             Long idUsuario) throws SQLException {
        Usuario usuario = usuarioDAO.findById(idUsuario);
        if (usuario == null) {
            throw new IllegalArgumentException("Usuario no encontrado");
        }

        // Releer cada reserva por código para obtener el objeto Vuelo poblado
        java.util.List<Reservacion> completas = new java.util.ArrayList<>();
        for (Reservacion r : reservaciones) {
            Reservacion full = reservacionDAO.findByCodigo(r.getCodigoReservacion());
            completas.add(full != null ? full : r);
        }

        byte[] pdf = pdfService.generarPDFMultiTramo(completas, pasajeros);

        StringBuilder codigosUnidos = new StringBuilder();
        for (int i = 0; i < completas.size(); i++) {
            if (i > 0) codigosUnidos.append("+");
            codigosUnidos.append(completas.get(i).getCodigoReservacion());
        }

        try {
            emailService.enviarCorreo(usuario.getEmail(), pdf, codigosUnidos.toString());
        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("Error enviando correo combinado: " + e.getMessage());
        }
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