package com.halcon.aerolineas.services;

import com.halcon.aerolineas.dao.UsuarioDAO;
import com.halcon.aerolineas.dao.PaisDAO;
import com.halcon.aerolineas.models.Usuario;
import com.halcon.aerolineas.models.Pais;
import com.halcon.aerolineas.utils.PasswordUtil;

import java.sql.SQLException;

public class AuthService {
    private UsuarioDAO usuarioDAO;
    private PaisDAO paisDAO;
    
    public AuthService() {
        this.usuarioDAO = new UsuarioDAO();
        this.paisDAO = new PaisDAO();
    }
    
    /**
     * Login - retorna usuario si credenciales son correctas
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
     * Registro de nuevo usuario
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
     * Cambiar contraseña
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