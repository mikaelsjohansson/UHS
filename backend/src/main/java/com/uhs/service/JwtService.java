package com.uhs.service;

import com.uhs.dto.JwtValidationResultDto;
import com.uhs.model.User;
import com.uhs.model.UserRole;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * Service for creating and validating JWT tokens.
 * Part of Phase 1B user management implementation.
 *
 * JWT tokens are used for user authentication after the initial password setup.
 * Tokens include user ID, username, and role claims.
 */
@Service
public class JwtService {

    private static final String CLAIM_USER_ID = "userId";
    private static final String CLAIM_USERNAME = "username";
    private static final String CLAIM_ROLE = "role";

    private final SecretKey secretKey;
    private final long expirationMs;

    public JwtService(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration-ms}") long expirationMs) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    /**
     * Generates a JWT token for the given user.
     *
     * @param user the user to generate a token for
     * @return the JWT token string
     */
    public String generateToken(User user) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .claim(CLAIM_USER_ID, user.getId())
                .claim(CLAIM_USERNAME, user.getUsername())
                .claim(CLAIM_ROLE, user.getRole().name())
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(secretKey)
                .compact();
    }

    /**
     * Validates a JWT token and extracts user information.
     *
     * @param token the JWT token to validate
     * @return JwtValidationResultDto with validation result and user info if valid
     */
    public JwtValidationResultDto validateToken(String token) {
        if (token == null || token.isEmpty()) {
            return JwtValidationResultDto.invalid();
        }

        try {
            Claims claims = parseClaimsFromToken(token);

            Long userId = claims.get(CLAIM_USER_ID, Long.class);
            String username = claims.get(CLAIM_USERNAME, String.class);
            String roleString = claims.get(CLAIM_ROLE, String.class);
            UserRole role = UserRole.valueOf(roleString);

            return JwtValidationResultDto.valid(userId, username, role);
        } catch (Exception e) {
            return JwtValidationResultDto.invalid();
        }
    }

    /**
     * Extracts the user ID from a JWT token.
     *
     * @param token the JWT token
     * @return the user ID, or null if the token is invalid
     */
    public Long extractUserId(String token) {
        try {
            Claims claims = parseClaimsFromToken(token);
            return claims.get(CLAIM_USER_ID, Long.class);
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Extracts the user role from a JWT token.
     *
     * @param token the JWT token
     * @return the UserRole, or null if the token is invalid
     */
    public UserRole extractRole(String token) {
        try {
            Claims claims = parseClaimsFromToken(token);
            String roleString = claims.get(CLAIM_ROLE, String.class);
            return UserRole.valueOf(roleString);
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Checks if a JWT token is expired.
     *
     * @param token the JWT token
     * @return true if the token is expired or invalid, false otherwise
     */
    public boolean isTokenExpired(String token) {
        if (token == null || token.isEmpty()) {
            return true;
        }

        try {
            Claims claims = parseClaimsFromToken(token);
            Date expiration = claims.getExpiration();
            return expiration.before(new Date());
        } catch (ExpiredJwtException e) {
            return true;
        } catch (Exception e) {
            return true;
        }
    }

    /**
     * Parses and validates the claims from a JWT token.
     *
     * @param token the JWT token
     * @return the Claims object
     * @throws Exception if the token is invalid or expired
     */
    private Claims parseClaimsFromToken(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
