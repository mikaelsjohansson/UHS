package com.uhs.service;

import com.uhs.dto.TokenValidationResultDto;
import com.uhs.model.FirstTimeLoginToken;
import com.uhs.model.User;
import com.uhs.repository.FirstTimeLoginTokenRepository;
import com.uhs.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Service for generating and managing first-time login tokens.
 * Part of Phase 1B user management implementation.
 *
 * Tokens are used to allow new users to set their initial password.
 * Each token is valid for a configurable time period (default: 15 minutes)
 * and can only be used once.
 */
@Service
public class TokenGenerationService {

    private final FirstTimeLoginTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final int tokenExpiryMinutes;

    public TokenGenerationService(
            FirstTimeLoginTokenRepository tokenRepository,
            UserRepository userRepository,
            @Value("${token.first-login-expiry-minutes:15}") int tokenExpiryMinutes) {
        this.tokenRepository = tokenRepository;
        this.userRepository = userRepository;
        this.tokenExpiryMinutes = tokenExpiryMinutes;
    }

    /**
     * Generates a new first-time login token for a user.
     *
     * @param userId the ID of the user to generate a token for
     * @return the generated FirstTimeLoginToken
     * @throws RuntimeException if the user is not found
     */
    @Transactional
    public FirstTimeLoginToken generateToken(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        return generateTokenForUser(user);
    }

    /**
     * Generates a new first-time login token for a user object.
     * This overload avoids additional database reads when the User entity is already available.
     *
     * @param user the User entity to generate a token for
     * @return the generated FirstTimeLoginToken
     */
    @Transactional
    public FirstTimeLoginToken generateTokenForUser(User user) {
        FirstTimeLoginToken token = new FirstTimeLoginToken();
        token.setToken(UUID.randomUUID().toString());
        token.setUser(user);
        token.setExpiresAt(LocalDateTime.now().plusMinutes(tokenExpiryMinutes));
        token.setUsed(false);

        return tokenRepository.save(token);
    }

    /**
     * Validates a first-time login token.
     *
     * @param tokenString the token string to validate
     * @return TokenValidationResultDto with validation result and reason if invalid
     */
    @Transactional(readOnly = true)
    public TokenValidationResultDto validateToken(String tokenString) {
        if (tokenString == null || tokenString.isEmpty()) {
            return TokenValidationResultDto.invalid(TokenValidationResultDto.InvalidReason.NOT_FOUND);
        }

        return tokenRepository.findByToken(tokenString)
                .map(token -> {
                    // Check if token is already used
                    if (token.getUsed()) {
                        return TokenValidationResultDto.invalid(TokenValidationResultDto.InvalidReason.ALREADY_USED);
                    }

                    // Check if token is expired
                    if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
                        return TokenValidationResultDto.invalid(TokenValidationResultDto.InvalidReason.EXPIRED);
                    }

                    // Token is valid
                    return TokenValidationResultDto.valid(token.getUser());
                })
                .orElse(TokenValidationResultDto.invalid(TokenValidationResultDto.InvalidReason.NOT_FOUND));
    }

    /**
     * Marks a token as used, preventing further use.
     *
     * @param tokenString the token string to mark as used
     * @throws RuntimeException if the token is not found
     */
    @Transactional
    public void markTokenAsUsed(String tokenString) {
        FirstTimeLoginToken token = tokenRepository.findByToken(tokenString)
                .orElseThrow(() -> new RuntimeException("Token not found: " + tokenString));

        token.setUsed(true);
        tokenRepository.save(token);
    }

    /**
     * Revokes (deletes) all expired tokens.
     * This can be scheduled to run periodically to clean up the database.
     */
    @Transactional
    public void revokeExpiredTokens() {
        List<FirstTimeLoginToken> expiredTokens = tokenRepository.findExpiredTokens(LocalDateTime.now());
        if (!expiredTokens.isEmpty()) {
            tokenRepository.deleteAll(expiredTokens);
        }
    }
}
