package com.uhs.service;

import com.uhs.dto.JwtValidationResultDto;
import com.uhs.model.User;
import com.uhs.model.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for JwtService.
 * Part of Phase 1B user management implementation.
 * Tests JWT token generation, validation, and claim extraction.
 */
class JwtServiceTest {

    private static final String TEST_SECRET = "uhs-expense-tracker-super-secret-key-min-32-chars-for-hs256-testing";
    private static final long EXPIRATION_MS = 86400000L; // 24 hours

    private JwtService jwtService;
    private User testUser;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(TEST_SECRET, EXPIRATION_MS);

        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");
        testUser.setEmail("test@example.com");
        testUser.setRole(UserRole.USER);
        testUser.setIsActive(true);
        testUser.setPasswordSet(true);
        testUser.setIsDefaultAdmin(false);
        testUser.setCreatedAt(LocalDateTime.now());
    }

    // ==================== Token Generation Tests ====================

    @Test
    @DisplayName("generateToken should return a valid JWT token")
    void generateToken_ShouldReturnValidJwtToken() {
        // When
        String token = jwtService.generateToken(testUser);

        // Then
        assertNotNull(token);
        assertTrue(token.split("\\.").length == 3, "JWT should have 3 parts separated by dots");
    }

    @Test
    @DisplayName("generateToken should produce different tokens for different users")
    void generateToken_ShouldProduceDifferentTokensForDifferentUsers() {
        // Given
        User anotherUser = new User();
        anotherUser.setId(2L);
        anotherUser.setUsername("anotheruser");
        anotherUser.setRole(UserRole.ADMIN);

        // When
        String token1 = jwtService.generateToken(testUser);
        String token2 = jwtService.generateToken(anotherUser);

        // Then
        assertNotEquals(token1, token2);
    }

    @Test
    @DisplayName("generateToken should include user information in claims")
    void generateToken_ShouldIncludeUserInformationInClaims() {
        // When
        String token = jwtService.generateToken(testUser);

        // Then - verify by extracting claims
        Long userId = jwtService.extractUserId(token);
        UserRole role = jwtService.extractRole(token);

        assertEquals(testUser.getId(), userId);
        assertEquals(testUser.getRole(), role);
    }

    // ==================== Token Validation Tests ====================

    @Test
    @DisplayName("validateToken should return valid result for valid token")
    void validateToken_ShouldReturnValidResultForValidToken() {
        // Given
        String token = jwtService.generateToken(testUser);

        // When
        JwtValidationResultDto result = jwtService.validateToken(token);

        // Then
        assertTrue(result.isValid());
        assertEquals(testUser.getId(), result.getUserId());
        assertEquals(testUser.getUsername(), result.getUsername());
        assertEquals(testUser.getRole(), result.getRole());
    }

    @Test
    @DisplayName("validateToken should return invalid result for null token")
    void validateToken_ShouldReturnInvalidResultForNullToken() {
        // When
        JwtValidationResultDto result = jwtService.validateToken(null);

        // Then
        assertFalse(result.isValid());
        assertNull(result.getUserId());
    }

    @Test
    @DisplayName("validateToken should return invalid result for empty token")
    void validateToken_ShouldReturnInvalidResultForEmptyToken() {
        // When
        JwtValidationResultDto result = jwtService.validateToken("");

        // Then
        assertFalse(result.isValid());
    }

    @Test
    @DisplayName("validateToken should return invalid result for malformed token")
    void validateToken_ShouldReturnInvalidResultForMalformedToken() {
        // When
        JwtValidationResultDto result = jwtService.validateToken("not-a-valid-jwt-token");

        // Then
        assertFalse(result.isValid());
    }

    @Test
    @DisplayName("validateToken should return invalid result for token with wrong signature")
    void validateToken_ShouldReturnInvalidResultForWrongSignature() {
        // Given - generate token with one secret
        String token = jwtService.generateToken(testUser);

        // When - validate with different secret
        JwtService differentSecretService = new JwtService(
                "different-secret-key-that-is-at-least-32-chars-long", EXPIRATION_MS);
        JwtValidationResultDto result = differentSecretService.validateToken(token);

        // Then
        assertFalse(result.isValid());
    }

    @Test
    @DisplayName("validateToken should return invalid result for expired token")
    void validateToken_ShouldReturnInvalidResultForExpiredToken() {
        // Given - create service with very short expiration (already expired)
        JwtService shortExpiryService = new JwtService(TEST_SECRET, -1000L); // Expired 1 second ago
        String token = shortExpiryService.generateToken(testUser);

        // When
        JwtValidationResultDto result = jwtService.validateToken(token);

        // Then
        assertFalse(result.isValid());
    }

    // ==================== Extract User ID Tests ====================

    @Test
    @DisplayName("extractUserId should return correct user ID from token")
    void extractUserId_ShouldReturnCorrectUserId() {
        // Given
        String token = jwtService.generateToken(testUser);

        // When
        Long userId = jwtService.extractUserId(token);

        // Then
        assertEquals(testUser.getId(), userId);
    }

    @Test
    @DisplayName("extractUserId should return null for invalid token")
    void extractUserId_ShouldReturnNullForInvalidToken() {
        // When
        Long userId = jwtService.extractUserId("invalid-token");

        // Then
        assertNull(userId);
    }

    // ==================== Extract Role Tests ====================

    @Test
    @DisplayName("extractRole should return correct role from token")
    void extractRole_ShouldReturnCorrectRole() {
        // Given
        testUser.setRole(UserRole.ADMIN);
        String token = jwtService.generateToken(testUser);

        // When
        UserRole role = jwtService.extractRole(token);

        // Then
        assertEquals(UserRole.ADMIN, role);
    }

    @Test
    @DisplayName("extractRole should return null for invalid token")
    void extractRole_ShouldReturnNullForInvalidToken() {
        // When
        UserRole role = jwtService.extractRole("invalid-token");

        // Then
        assertNull(role);
    }

    @Test
    @DisplayName("extractRole should work for USER role")
    void extractRole_ShouldWorkForUserRole() {
        // Given
        testUser.setRole(UserRole.USER);
        String token = jwtService.generateToken(testUser);

        // When
        UserRole role = jwtService.extractRole(token);

        // Then
        assertEquals(UserRole.USER, role);
    }

    // ==================== Token Expiry Tests ====================

    @Test
    @DisplayName("isTokenExpired should return false for valid token")
    void isTokenExpired_ShouldReturnFalseForValidToken() {
        // Given
        String token = jwtService.generateToken(testUser);

        // When
        boolean expired = jwtService.isTokenExpired(token);

        // Then
        assertFalse(expired);
    }

    @Test
    @DisplayName("isTokenExpired should return true for expired token")
    void isTokenExpired_ShouldReturnTrueForExpiredToken() {
        // Given - create service with already expired tokens
        JwtService shortExpiryService = new JwtService(TEST_SECRET, -1000L);
        String token = shortExpiryService.generateToken(testUser);

        // When
        boolean expired = jwtService.isTokenExpired(token);

        // Then
        assertTrue(expired);
    }

    @Test
    @DisplayName("isTokenExpired should return true for invalid token")
    void isTokenExpired_ShouldReturnTrueForInvalidToken() {
        // When
        boolean expired = jwtService.isTokenExpired("invalid-token");

        // Then
        assertTrue(expired);
    }

    @Test
    @DisplayName("isTokenExpired should return true for null token")
    void isTokenExpired_ShouldReturnTrueForNullToken() {
        // When
        boolean expired = jwtService.isTokenExpired(null);

        // Then
        assertTrue(expired);
    }

    // ==================== Admin User Token Tests ====================

    @Test
    @DisplayName("generateToken should work for admin user")
    void generateToken_ShouldWorkForAdminUser() {
        // Given
        testUser.setRole(UserRole.ADMIN);
        testUser.setIsDefaultAdmin(true);

        // When
        String token = jwtService.generateToken(testUser);

        // Then
        assertNotNull(token);
        JwtValidationResultDto result = jwtService.validateToken(token);
        assertTrue(result.isValid());
        assertEquals(UserRole.ADMIN, result.getRole());
    }
}
