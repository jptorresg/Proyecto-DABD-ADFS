package com.halcon.aerolineas.services;

import com.halcon.aerolineas.dao.UsuarioDAO;
import com.halcon.aerolineas.dao.PaisDAO;
import com.halcon.aerolineas.models.Usuario;
import com.halcon.aerolineas.models.Pais;
import com.halcon.aerolineas.utils.PasswordUtil;

import java.sql.SQLException;

/**
 * Servicio de lógica de negocio para autenticación y gestión de cuentas de usuario.
 * <p>
 * Proporciona métodos para el inicio de sesión, registro de nuevos usuarios y cambio de contraseña.
 * </p>
 */
public class AuthService {
    
    private UsuarioDAO usuarioDAO;
    private PaisDAO paisDAO;
    
    /**
     * Constructor que inicializa el servicio con los DAO necesarios.
     */
    public AuthService() {
        this.usuarioDAO = new UsuarioDAO();
        this.paisDAO = new PaisDAO();
    }
    
    /**
     * Autentica a un usuario utilizando su correo electrónico y contraseña.
     * <p>
     * Verifica que el usuario exista, esté activo y que la contraseña proporcionada
     * coincida con el hash almacenado. Si la autenticación es exitosa, retorna el objeto
     * {@link Usuario} sin el hash de la contraseña.
     * </p>
     *
     * @param email    Correo electrónico del usuario.
     * @param password Contraseña en texto plano.
     * @return El objeto {@link Usuario} autenticado (sin el campo {@code passwordHash}).
     * @throws SQLException             Si ocurre un error en la consulta a la base de datos.
     * @throws IllegalArgumentException Si el usuario no existe, está inactivo o la contraseña es incorrecta.
     */
    public Usuario login(String email, String password) throws SQLException {
        Usuario usuario = usuarioDAO.findByEmail(email);
        
        if (usuario == null) {
            throw new IllegalArgumentException("Usuario no encontrado");
        }
        
        if (!usuario.isActivo()) {
            throw new IllegalArgumentException("Usuario inactivo");
        }
        
        if (!PasswordUtil.verifyPassword(password, usuario.getPasswordHash())) {
            throw new IllegalArgumentException("Contraseña incorrecta");
        }
        
        // No retornar el hash de password al frontend
        usuario.setPasswordHash(null);
        
        return usuario;
    }
    
    /**
     * Registra un nuevo usuario en el sistema.
     * <p>
     * Realiza validaciones de formato de correo, longitud de contraseña y edad.
     * Verifica que el correo no esté ya registrado y que el país proporcionado sea válido.
     * Almacena el hash de la contraseña y asigna el rol por defecto {@code REGISTRADO}.
     * </p>
     *
     * @param email       Correo electrónico del nuevo usuario.
     * @param password    Contraseña en texto plano (mínimo 8 caracteres).
     * @param nombres     Nombres del usuario.
     * @param apellidos   Apellidos del usuario.
     * @param edad        Edad del usuario (entre 18 y 120 años).
     * @param codigoPais  Código ISO alfa-2 del país de origen (ej. "GT", "MX").
     * @param numPasaporte Número de pasaporte del usuario.
     * @return El objeto {@link Usuario} recién creado (sin el campo {@code passwordHash}).
     * @throws SQLException             Si ocurre un error en la consulta a la base de datos.
     * @throws IllegalArgumentException Si alguna validación falla.
     */
    public Usuario registrar(String email, String password, String nombres, String apellidos,
                            Integer edad, String codigoPais, String numPasaporte) throws SQLException {
        
        // Validaciones
        if (email == null || !email.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            throw new IllegalArgumentException("Email inválido");
        }
        
        if (password == null || password.length() < 8) {
            throw new IllegalArgumentException("La contraseña debe tener al menos 8 caracteres");
        }
        
        if (edad < 18 || edad > 120) {
            throw new IllegalArgumentException("La edad debe estar entre 18 y 120 años");
        }
        
        // Verificar que el email no exista
        if (usuarioDAO.findByEmail(email) != null) {
            throw new IllegalArgumentException("El email ya está registrado");
        }
        
        // Obtener ID del país
        Pais pais = paisDAO.findByAlfa2(codigoPais);
        if (pais == null) {
            throw new IllegalArgumentException("País no válido");
        }
        
        // Crear usuario
        Usuario nuevoUsuario = new Usuario();
        nuevoUsuario.setEmail(email);
        nuevoUsuario.setPasswordHash(PasswordUtil.hashPassword(password));
        nuevoUsuario.setNombres(nombres);
        nuevoUsuario.setApellidos(apellidos);
        nuevoUsuario.setEdad(edad);
        nuevoUsuario.setIdPaisOrigen(pais.getId());
        nuevoUsuario.setNumPasaporte(numPasaporte);
        nuevoUsuario.setTipoUsuario("REGISTRADO");
        
        Long idUsuario = usuarioDAO.create(nuevoUsuario);
        
        if (idUsuario == null) {
            throw new SQLException("Error al crear usuario");
        }
        
        // Retornar usuario creado (sin password)
        Usuario usuarioCreado = usuarioDAO.findById(idUsuario);
        usuarioCreado.setPasswordHash(null);
        
        return usuarioCreado;
    }
    
    /**
     * Cambia la contraseña de un usuario existente.
     * <p>
     * Verifica que la contraseña actual sea correcta y que la nueva cumpla con los
     * requisitos mínimos de seguridad (mínimo 8 caracteres). Actualiza el hash
     * almacenado en la base de datos.
     * </p>
     *
     * @param idUsuario      Identificador del usuario.
     * @param passwordActual Contraseña actual en texto plano.
     * @param passwordNuevo  Nueva contraseña en texto plano.
     * @return {@code true} si la actualización fue exitosa, {@code false} en caso contrario.
     * @throws SQLException             Si ocurre un error en la consulta a la base de datos.
     * @throws IllegalArgumentException Si el usuario no existe, la contraseña actual es incorrecta
     *                                  o la nueva contraseña no cumple los requisitos.
     */
    public boolean cambiarPassword(Long idUsuario, String passwordActual, String passwordNuevo) throws SQLException {
        Usuario usuario = usuarioDAO.findById(idUsuario);
        
        if (usuario == null) {
            throw new IllegalArgumentException("Usuario no encontrado");
        }
        
        if (!PasswordUtil.verifyPassword(passwordActual, usuario.getPasswordHash())) {
            throw new IllegalArgumentException("Contraseña actual incorrecta");
        }
        
        if (passwordNuevo.length() < 8) {
            throw new IllegalArgumentException("La nueva contraseña debe tener al menos 8 caracteres");
        }
        
        usuario.setPasswordHash(PasswordUtil.hashPassword(passwordNuevo));
        return usuarioDAO.update(usuario);
    }
}