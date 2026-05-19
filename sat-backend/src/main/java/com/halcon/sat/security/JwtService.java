package com.halcon.sat.security;

import com.halcon.sat.model.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtService {

    private final SecretKey key;
    private final long expirationMillis;

    public JwtService(@Value("${sat.jwt.secret}") String secret,
                      @Value("${sat.jwt.expiration-hours:8}") long expirationHours) {
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException(
                "sat.jwt.secret debe tener al menos 32 caracteres (256 bits). "
              + "Configuralo en application.properties.");
        }
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMillis = expirationHours * 3600 * 1000L;
    }

    public String generate(Usuario u) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
            .subject(u.getEmail())
            .claim("idUsuario", u.getIdUsuario())
            .claim("tipoUsuario", u.getTipoUsuario())
            .issuedAt(new Date(now))
            .expiration(new Date(now + expirationMillis))
            .signWith(key)
            .compact();
    }

    public Claims parse(String token) {
        return Jwts.parser()
            .verifyWith(key)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }
}
