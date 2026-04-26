package com.halcon.aerolineas.services;

import com.halcon.aerolineas.dao.VueloDAO;
import com.halcon.aerolineas.models.Vuelo;
import com.halcon.aerolineas.models.VueloConEscala;
import com.halcon.aerolineas.dao.UsuarioDAO;
import com.halcon.aerolineas.models.Usuario;

import java.math.BigDecimal;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;
import java.util.ArrayList;
import java.sql.Connection;
import java.sql.PreparedStatement;

/**
 * Servicio de lógica de negocio para la gestión de vuelos.
 * <p>
 * Proporciona métodos para buscar, crear, actualizar, eliminar y listar vuelos,
 * incluyendo la búsqueda de rutas con escalas.
 * </p>
 */
public class VueloService {
    private VueloDAO vueloDAO;

    private UsuarioDAO usuarioDAO = new UsuarioDAO();
    private EmailService emailService = new EmailService();
    
    /**
     * Constructor que inicializa el servicio con el DAO de vuelos.
     */

    public VueloService() {
        this.vueloDAO = new VueloDAO();
    }
    
    public VueloService(VueloDAO vueloDAO) {
        this.vueloDAO = vueloDAO;
    }
    
    /**
     * Busca vuelos disponibles según los criterios especificados.
     * <p>
     * Combina la búsqueda de vuelos directos y vuelos con escalas. Los resultados
     * incluyen objetos {@link Vuelo} para vuelos directos y {@link VueloConEscala}
     * para rutas compuestas.
     * </p>
     *
     * @param origen      Código IATA del aeropuerto de origen (opcional).
     * @param destino     Código IATA del aeropuerto de destino (opcional).
     * @param fechaSalida Fecha de salida deseada (opcional).
     * @param tipoAsiento Tipo de asiento requerido (opcional).
     * @return Lista heterogénea de objetos (pueden ser {@link Vuelo} o {@link VueloConEscala}).
     * @throws SQLException Si ocurre un error en la consulta a la base de datos.
     */
    public List<Object> buscarVuelos(String origen, String destino, LocalDate fechaSalida,
                                    LocalDate fechaRegreso, String tipoAsiento) throws SQLException {

        List<Object> resultados = new ArrayList<>();

        if (fechaRegreso != null && origen != null && !origen.isEmpty()
                                && destino != null && !destino.isEmpty()) {

            List<List<Vuelo>> pares = vueloDAO.buscarVuelosIdaYVuelta(
                origen, destino, fechaSalida, fechaRegreso, tipoAsiento
            );

            for (List<Vuelo> par : pares) {
                VueloConEscala vce = new VueloConEscala(par);
                vce.setEsIdaYVuelta(true);   // ← marca semántica para el frontend
                resultados.add(vce);
            }

            // Con fecha de regreso no buscamos vuelos directos ni con escalas normales
            return resultados;
        }

        // Directos
        resultados.addAll(vueloDAO.buscarVuelos(origen, destino, fechaSalida, tipoAsiento));

        // Con escalas
        if (origen != null && !origen.isEmpty() && destino != null && !destino.isEmpty()) {
            List<List<Vuelo>> cadenas = vueloDAO.buscarVuelosConEscala(
                origen, destino, fechaSalida, tipoAsiento
            );
            for (List<Vuelo> cadena : cadenas) {
                if (cadena.size() >= 2) {
                    resultados.add(new VueloConEscala(cadena));
                }
            }
        }

        System.out.println("=== BUSQUEDA ===");
        System.out.println("Origen: " + origen);
        System.out.println("Destino: " + destino);
        System.out.println("Fecha: " + fechaSalida);

        return resultados;
    }
    
    /**
     * Obtiene un vuelo por su identificador único.
     *
     * @param id Identificador del vuelo.
     * @return El objeto {@link Vuelo} correspondiente.
     * @throws SQLException             Si ocurre un error en la consulta.
     * @throws IllegalArgumentException Si el vuelo no existe.
     */
    public Vuelo obtenerVuelo(Long id) throws SQLException {
        Vuelo vuelo = vueloDAO.findById(id);
        if (vuelo == null) {
            throw new IllegalArgumentException("Vuelo no encontrado");
        }
        return vuelo;
    }

    /**
     * Obtiene un vuelo compuesto por múltiples tramos (escalas) según una lista de IDs.
     * <p>
     * Recupera cada vuelo individualmente y los agrupa en un objeto {@link VueloConEscala}.
     * </p>
     *
     * @param ids Lista de identificadores de vuelos que componen la ruta.
     * @return Objeto {@link VueloConEscala} que contiene la información de todos los tramos.
     * @throws SQLException             Si ocurre un error al procesar la búsqueda.
     * @throws IllegalArgumentException Si alguno de los IDs no corresponde a un vuelo existente.
     */
    public Object obtenerVueloConEscalas(List<Long> ids) throws SQLException {
        List<Vuelo> tramos = new ArrayList<>();

        for (Long id : ids) {
            Vuelo v = vueloDAO.findById(id);
            if (v == null) {
                throw new IllegalArgumentException("Vuelo no encontrado: " + id);
            }
            tramos.add(v);
        }

        return new VueloConEscala(tramos);
    }
    
    /**
     * Crea un nuevo vuelo en el sistema (acceso exclusivo para administradores).
     * <p>
     * Realiza validaciones de negocio:
     * <ul>
     *   <li>El código de vuelo debe ser único.</li>
     *   <li>La fecha de salida no puede ser anterior a la fecha actual.</li>
     *   <li>La fecha de llegada debe ser posterior a la de salida.</li>
     *   <li>El precio base debe ser mayor a cero.</li>
     *   <li>El número de asientos totales debe ser positivo.</li>
     * </ul>
     * 
     *
     * @param codigoVuelo      Código alfanumérico del vuelo.
     * @param origenCiudad     Ciudad de origen.
     * @param origenIata       Código IATA del aeropuerto de origen.
     * @param destinoCiudad    Ciudad de destino.
     * @param destinoIata      Código IATA del aeropuerto de destino.
     * @param fechaSalida      Fecha de salida.
     * @param horaSalida       Hora de salida (formato "HH:mm").
     * @param fechaLlegada     Fecha de llegada.
     * @param horaLlegada      Hora de llegada (formato "HH:mm").
     * @param tipoAsiento      Tipo de asiento ofrecido.
     * @param precioBase       Precio base por asiento.
     * @param asientosTotales  Número total de asientos.
     * @param idUsuarioCreador ID del usuario administrador que crea el vuelo.
     * @return El objeto {@link Vuelo} recién creado.
     * @throws SQLException             Si ocurre un error en la base de datos.
     * @throws IllegalArgumentException Si alguna validación falla.
     */
    public Vuelo crearVuelo(String codigoVuelo, String origenCiudad, String origenIata,
                           String destinoCiudad, String destinoIata, LocalDate fechaSalida,
                           String horaSalida, LocalDate fechaLlegada, String horaLlegada,
                           String tipoAsiento, BigDecimal precioBase, Integer asientosTotales,
                           Long idUsuarioCreador) throws SQLException {
        
        // Validaciones
        if (vueloDAO.findByCodigo(codigoVuelo) != null) {
            throw new IllegalArgumentException("El código de vuelo ya existe");
        }
        
        if (fechaSalida.isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("La fecha de salida no puede ser en el pasado");
        }
        
        if (fechaLlegada.isBefore(fechaSalida)) {
            throw new IllegalArgumentException("La fecha de llegada debe ser posterior a la salida");
        }
        
        if (precioBase.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("El precio debe ser mayor a 0");
        }
        
        if (asientosTotales <= 0) {
            throw new IllegalArgumentException("La cantidad de asientos debe ser mayor a 0");
        }
        
        // Crear vuelo
        Vuelo nuevoVuelo = new Vuelo(
            codigoVuelo, origenCiudad, origenIata, destinoCiudad, destinoIata,
            fechaSalida, horaSalida, fechaLlegada, horaLlegada, tipoAsiento,
            precioBase, asientosTotales, asientosTotales
        );
        
        Long idVuelo = vueloDAO.create(nuevoVuelo, idUsuarioCreador);
        
        if (idVuelo == null) {
            throw new SQLException("Error al crear vuelo");
        }
        
        return vueloDAO.findById(idVuelo);
    }
    
    /**
     * Actualiza los datos de un vuelo existente (acceso exclusivo para administradores).
     *
     * @param vuelo Objeto {@link Vuelo} con los datos actualizados (debe incluir ID).
     * @return {@code true} si la actualización fue exitosa.
     * @throws SQLException             Si ocurre un error en la base de datos.
     * @throws IllegalArgumentException Si el vuelo no existe.
     */
    public boolean actualizarVuelo(Vuelo vuelo) throws SQLException {
        Vuelo existente = vueloDAO.findById(vuelo.getIdVuelo());
        if (existente == null) {
            throw new IllegalArgumentException("Vuelo no encontrado");
        }
        
        return vueloDAO.update(vuelo);
    }
    
    /**
     * Elimina lógicamente un vuelo (cambia su estado a {@code CANCELADO}).
     * <p>
     * Acceso exclusivo para administradores.
     * </p>
     *
     * @param idVuelo Identificador del vuelo a eliminar.
     * @return {@code true} si la eliminación fue exitosa.
     * @throws SQLException Si ocurre un error en la base de datos.
     */
    public boolean eliminarVuelo(Long idVuelo, String mensaje) throws Exception {

        // 1. Obtener info del vuelo (para el correo)
        Vuelo vuelo = vueloDAO.findById(idVuelo);
        if (vuelo == null) {
            throw new IllegalArgumentException("Vuelo no encontrado");
        }

        // 2. Obtener usuarios afectados
        List<Usuario> usuarios = usuarioDAO.findByVuelo(idVuelo);

        // 3. Cancelar en BD (transacción)
        boolean resultado = vueloDAO.deleteWithReservaciones(idVuelo);

        // 4. Enviar correos (FUERA de transacción)
        for (Usuario u : usuarios) {
            try {
                emailService.enviarCancelacionVuelo(
                    u.getEmail(),
                    u.getNombres(),
                    vuelo.getCodigoVuelo(),
                    vuelo.getOrigenCiudad(),
                    vuelo.getDestinoCiudad(),
                    vuelo.getFechaSalida().toString(),
                    mensaje
                );
            } catch (Exception e) {
                System.err.println("Error enviando correo a: " + u.getEmail());
            }
        }

        return resultado;
    }
    
    /**
     * Lista todos los vuelos con paginación.
     *
     * @param pagina   Número de página (comienza en 1).
     * @param porPagina Cantidad de resultados por página.
     * @return Lista de objetos {@link Vuelo} correspondientes a la página solicitada.
     * @throws SQLException Si ocurre un error en la consulta.
     */
    public List<Vuelo> listarVuelos(int pagina, int porPagina) throws SQLException {
        int offset = (pagina - 1) * porPagina;
        return vueloDAO.findAll(porPagina, offset);
    }
}