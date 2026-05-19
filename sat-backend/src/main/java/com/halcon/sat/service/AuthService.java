package com.halcon.sat.service;

import com.halcon.sat.dto.LoginRequest;
import com.halcon.sat.dto.LoginResponse;
import com.halcon.sat.model.Usuario;
import com.halcon.sat.repository.UsuarioRepository;
import com.halcon.sat.security.JwtService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UsuarioRepository usuarios;
    private final BCryptPasswordEncoder encoder;
    private final JwtService jwt;

    public AuthService(UsuarioRepository usuarios, BCryptPasswordEncoder encoder, JwtService jwt) {
        this.usuarios = usuarios;
        this.encoder = encoder;
        this.jwt = jwt;
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

        String token = jwt.generate(u);

        return new LoginResponse(
            u.getIdUsuario(), u.getEmail(),
            u.getNombres(), u.getApellidos(),
            u.getTipoUsuario(), token);
    }

    public static class InvalidCredentialsException extends RuntimeException {
        public InvalidCredentialsException(String msg) { super(msg); }
    }
}
