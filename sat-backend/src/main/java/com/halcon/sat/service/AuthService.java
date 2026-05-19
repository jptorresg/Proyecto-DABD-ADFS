package com.halcon.sat.service;

import com.halcon.sat.dto.LoginRequest;
import com.halcon.sat.dto.LoginResponse;
import com.halcon.sat.model.Usuario;
import com.halcon.sat.repository.UsuarioRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UsuarioRepository usuarios;
    private final BCryptPasswordEncoder encoder;

    public AuthService(UsuarioRepository usuarios, BCryptPasswordEncoder encoder) {
        this.usuarios = usuarios;
        this.encoder = encoder;
    }

    public LoginResponse login(LoginRequest req) {
        Usuario u = usuarios.findByEmail(req.getEmail())
            .orElseThrow(() -> new InvalidCredentialsException("Credenciales inválidas"));

        if (!u.isActivo()) {
            throw new InvalidCredentialsException("Usuario inactivo");
        }
        if (!encoder.matches(req.getPassword(), u.getPasswordHash())) {
            throw new InvalidCredentialsException("Credenciales inválidas");
        }

        return new LoginResponse(
            u.getIdUsuario(), u.getEmail(),
            u.getNombres(), u.getApellidos(),
            u.getTipoUsuario()
        );
    }

    public static class InvalidCredentialsException extends RuntimeException {
        public InvalidCredentialsException(String msg) { super(msg); }
    }
}
