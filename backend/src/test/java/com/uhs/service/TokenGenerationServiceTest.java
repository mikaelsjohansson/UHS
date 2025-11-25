package com.uhs.service;

import com.uhs.dto.TokenValidationResultDto;
import com.uhs.model.FirstTimeLoginToken;
import com.uhs.model.User;
import com.uhs.model.UserRole;
import com.uhs.repository.FirstTimeLoginTokenRepository;
import com.uhs.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for TokenGenerationService.
 * Part of Phase 1B user management implementation.
 * Tests token generation, validation, and lifecycle management.
 */
@ExtendWith(MockitoExtension.class)
class TokenGenerationServiceTest {

    private static final int TOKEN_EXPIRY_MINUTES = 15;

    @Mock
    private FirstTimeLoginTokenRepository tokenRepository;

    @Mock
    private UserRepository userRepository;

    private TokenGenerationService tokenGenerationService;

    private User testUser;
    private FirstTimeLoginToken testToken;

    @BeforeEach
    void setUp() {
        // Create service with explicit token expiry
        tokenGenerationService = new TokenGenerationService(
                tokenRepository, userRepository, TOKEN_EXPIRY_MINUTES);

        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");
        testUser.setEmail("test@example.com");
        testUser.setRole(UserRole.USER);
        testUser.setIsActive(false);
        testUser.setPasswordSet(false);
        testUser.setIsDefaultAdmin(false);

        testToken = new FirstTimeLoginToken();
        testToken.setId(1L);
        testToken.setToken(UUID.randomUUID().toString());
        testToken.setUser(testUser);
        testToken.setExpiresAt(LocalDateTime.now().plusMinutes(15));
        testToken.setUsed(false);
    }

    // ==================== Token Generation Tests ====================

    @Test
    @DisplayName("generateToken should create a new token for user")
    void generateToken_ShouldCreateNewTokenForUser() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(tokenRepository.save(any(FirstTimeLoginToken.class))).thenAnswer(invocation -> {
            FirstTimeLoginToken saved = invocation.getArgument(0);
            saved.setId(1L);
            return saved;
        });

        // When
        FirstTimeLoginToken result = tokenGenerationService.generateToken(1L);

        // Then
        assertNotNull(result);
        assertNotNull(result.getToken());
        assertEquals(testUser, result.getUser());
        assertFalse(result.getUsed());
        verify(tokenRepository, times(1)).save(any(FirstTimeLoginToken.class));
    }

    @Test
    @DisplayName("generateToken should create UUID format token")
    void generateToken_ShouldCreateUUIDFormatToken() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(tokenRepository.save(any(FirstTimeLoginToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        FirstTimeLoginToken result = tokenGenerationService.generateToken(1L);

        // Then
        assertNotNull(result.getToken());
        // Validate UUID format
        assertDoesNotThrow(() -> UUID.fromString(result.getToken()));
    }

    @Test
    @DisplayName("generateToken should set expiry to 15 minutes from now")
    void generateToken_ShouldSetExpiryTo15Minutes() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(tokenRepository.save(any(FirstTimeLoginToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        LocalDateTime beforeGeneration = LocalDateTime.now();

        // When
        FirstTimeLoginToken result = tokenGenerationService.generateToken(1L);

        LocalDateTime afterGeneration = LocalDateTime.now();

        // Then
        assertNotNull(result.getExpiresAt());
        // Token should expire between 14 and 16 minutes from now (with some tolerance)
        LocalDateTime minExpiry = beforeGeneration.plusMinutes(14);
        LocalDateTime maxExpiry = afterGeneration.plusMinutes(16);
        assertTrue(result.getExpiresAt().isAfter(minExpiry), "Expiry should be at least 14 minutes from now");
        assertTrue(result.getExpiresAt().isBefore(maxExpiry), "Expiry should be at most 16 minutes from now");
    }

    @Test
    @DisplayName("generateToken should throw exception for non-existent user")
    void generateToken_ShouldThrowExceptionForNonExistentUser() {
        // Given
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        assertThrows(RuntimeException.class, () -> tokenGenerationService.generateToken(999L));
        verify(tokenRepository, never()).save(any());
    }

    // ==================== Token Validation Tests ====================

    @Test
    @DisplayName("validateToken should return valid result for valid token")
    void validateToken_ShouldReturnValidResultForValidToken() {
        // Given
        String tokenString = testToken.getToken();
        when(tokenRepository.findByToken(tokenString)).thenReturn(Optional.of(testToken));

        // When
        TokenValidationResultDto result = tokenGenerationService.validateToken(tokenString);

        // Then
        assertTrue(result.isValid());
        assertNull(result.getReason());
        assertEquals(testUser, result.getUser());
    }

    @Test
    @DisplayName("validateToken should return invalid for non-existent token")
    void validateToken_ShouldReturnInvalidForNonExistentToken() {
        // Given
        String nonExistentToken = "non-existent-token";
        when(tokenRepository.findByToken(nonExistentToken)).thenReturn(Optional.empty());

        // When
        TokenValidationResultDto result = tokenGenerationService.validateToken(nonExistentToken);

        // Then
        assertFalse(result.isValid());
        assertEquals(TokenValidationResultDto.InvalidReason.NOT_FOUND, result.getReason());
        assertNull(result.getUser());
    }

    @Test
    @DisplayName("validateToken should return invalid for expired token")
    void validateToken_ShouldReturnInvalidForExpiredToken() {
        // Given
        testToken.setExpiresAt(LocalDateTime.now().minusMinutes(1));
        String tokenString = testToken.getToken();
        when(tokenRepository.findByToken(tokenString)).thenReturn(Optional.of(testToken));

        // When
        TokenValidationResultDto result = tokenGenerationService.validateToken(tokenString);

        // Then
        assertFalse(result.isValid());
        assertEquals(TokenValidationResultDto.InvalidReason.EXPIRED, result.getReason());
        assertNull(result.getUser());
    }

    @Test
    @DisplayName("validateToken should return invalid for already used token")
    void validateToken_ShouldReturnInvalidForAlreadyUsedToken() {
        // Given
        testToken.setUsed(true);
        String tokenString = testToken.getToken();
        when(tokenRepository.findByToken(tokenString)).thenReturn(Optional.of(testToken));

        // When
        TokenValidationResultDto result = tokenGenerationService.validateToken(tokenString);

        // Then
        assertFalse(result.isValid());
        assertEquals(TokenValidationResultDto.InvalidReason.ALREADY_USED, result.getReason());
        assertNull(result.getUser());
    }

    @Test
    @DisplayName("validateToken should return invalid for null token")
    void validateToken_ShouldReturnInvalidForNullToken() {
        // When
        TokenValidationResultDto result = tokenGenerationService.validateToken(null);

        // Then
        assertFalse(result.isValid());
        assertEquals(TokenValidationResultDto.InvalidReason.NOT_FOUND, result.getReason());
    }

    @Test
    @DisplayName("validateToken should return invalid for empty token")
    void validateToken_ShouldReturnInvalidForEmptyToken() {
        // When
        TokenValidationResultDto result = tokenGenerationService.validateToken("");

        // Then
        assertFalse(result.isValid());
        assertEquals(TokenValidationResultDto.InvalidReason.NOT_FOUND, result.getReason());
    }

    // ==================== Mark Token As Used Tests ====================

    @Test
    @DisplayName("markTokenAsUsed should set used flag to true")
    void markTokenAsUsed_ShouldSetUsedFlagToTrue() {
        // Given
        String tokenString = testToken.getToken();
        when(tokenRepository.findByToken(tokenString)).thenReturn(Optional.of(testToken));
        when(tokenRepository.save(any(FirstTimeLoginToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        tokenGenerationService.markTokenAsUsed(tokenString);

        // Then
        ArgumentCaptor<FirstTimeLoginToken> tokenCaptor = ArgumentCaptor.forClass(FirstTimeLoginToken.class);
        verify(tokenRepository, times(1)).save(tokenCaptor.capture());
        assertTrue(tokenCaptor.getValue().getUsed());
    }

    @Test
    @DisplayName("markTokenAsUsed should throw exception for non-existent token")
    void markTokenAsUsed_ShouldThrowExceptionForNonExistentToken() {
        // Given
        String nonExistentToken = "non-existent-token";
        when(tokenRepository.findByToken(nonExistentToken)).thenReturn(Optional.empty());

        // When & Then
        assertThrows(RuntimeException.class, () -> tokenGenerationService.markTokenAsUsed(nonExistentToken));
        verify(tokenRepository, never()).save(any());
    }

    // ==================== Revoke Expired Tokens Tests ====================

    @Test
    @DisplayName("revokeExpiredTokens should delete all expired tokens")
    void revokeExpiredTokens_ShouldDeleteAllExpiredTokens() {
        // Given
        FirstTimeLoginToken expiredToken1 = new FirstTimeLoginToken();
        expiredToken1.setId(1L);
        expiredToken1.setToken("expired-token-1");
        expiredToken1.setExpiresAt(LocalDateTime.now().minusHours(1));
        expiredToken1.setUsed(false);

        FirstTimeLoginToken expiredToken2 = new FirstTimeLoginToken();
        expiredToken2.setId(2L);
        expiredToken2.setToken("expired-token-2");
        expiredToken2.setExpiresAt(LocalDateTime.now().minusMinutes(30));
        expiredToken2.setUsed(false);

        List<FirstTimeLoginToken> expiredTokens = Arrays.asList(expiredToken1, expiredToken2);
        when(tokenRepository.findExpiredTokens(any(LocalDateTime.class))).thenReturn(expiredTokens);

        // When
        tokenGenerationService.revokeExpiredTokens();

        // Then
        verify(tokenRepository, times(1)).deleteAll(expiredTokens);
    }

    @Test
    @DisplayName("revokeExpiredTokens should do nothing when no expired tokens exist")
    void revokeExpiredTokens_ShouldDoNothingWhenNoExpiredTokens() {
        // Given
        when(tokenRepository.findExpiredTokens(any(LocalDateTime.class))).thenReturn(List.of());

        // When
        tokenGenerationService.revokeExpiredTokens();

        // Then
        verify(tokenRepository, never()).deleteAll(anyList());
    }
}
