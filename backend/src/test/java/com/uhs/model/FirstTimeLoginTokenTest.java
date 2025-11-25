package com.uhs.model;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for FirstTimeLoginToken entity - Phase 1A of user management system.
 * Tests entity field constraints, default values, and lifecycle callbacks.
 */
class FirstTimeLoginTokenTest {

    private Validator validator;
    private User testUser;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();

        // Create a test user for token association
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");
        testUser.setRole(UserRole.USER);
    }

    @Test
    void testTokenCreation_WithValidData_ShouldSucceed() {
        // Given
        FirstTimeLoginToken token = new FirstTimeLoginToken();
        token.setToken(UUID.randomUUID().toString());
        token.setUser(testUser);
        token.setExpiresAt(LocalDateTime.now().plusHours(24));

        // When
        Set<ConstraintViolation<FirstTimeLoginToken>> violations = validator.validate(token);

        // Then
        assertTrue(violations.isEmpty(), "Token with valid data should have no violations");
    }

    @Test
    void testTokenCreation_WithoutToken_ShouldFail() {
        // Given
        FirstTimeLoginToken token = new FirstTimeLoginToken();
        token.setUser(testUser);
        token.setExpiresAt(LocalDateTime.now().plusHours(24));

        // When
        Set<ConstraintViolation<FirstTimeLoginToken>> violations = validator.validate(token);

        // Then
        assertFalse(violations.isEmpty(), "Token without token value should have violations");
        assertTrue(violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().equals("token")));
    }

    @Test
    void testTokenCreation_WithBlankToken_ShouldFail() {
        // Given
        FirstTimeLoginToken token = new FirstTimeLoginToken();
        token.setToken("   ");
        token.setUser(testUser);
        token.setExpiresAt(LocalDateTime.now().plusHours(24));

        // When
        Set<ConstraintViolation<FirstTimeLoginToken>> violations = validator.validate(token);

        // Then
        assertFalse(violations.isEmpty(), "Token with blank token value should have violations");
    }

    @Test
    void testTokenCreation_WithoutUser_ShouldFail() {
        // Given
        FirstTimeLoginToken token = new FirstTimeLoginToken();
        token.setToken(UUID.randomUUID().toString());
        token.setExpiresAt(LocalDateTime.now().plusHours(24));

        // When
        Set<ConstraintViolation<FirstTimeLoginToken>> violations = validator.validate(token);

        // Then
        assertFalse(violations.isEmpty(), "Token without user should have violations");
        assertTrue(violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().equals("user")));
    }

    @Test
    void testTokenCreation_WithoutExpiresAt_ShouldFail() {
        // Given
        FirstTimeLoginToken token = new FirstTimeLoginToken();
        token.setToken(UUID.randomUUID().toString());
        token.setUser(testUser);

        // When
        Set<ConstraintViolation<FirstTimeLoginToken>> violations = validator.validate(token);

        // Then
        assertFalse(violations.isEmpty(), "Token without expiresAt should have violations");
        assertTrue(violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().equals("expiresAt")));
    }

    @Test
    void testTokenDefaultValue_UsedShouldBeFalse() {
        // Given
        FirstTimeLoginToken token = new FirstTimeLoginToken();
        token.setToken(UUID.randomUUID().toString());
        token.setUser(testUser);
        token.setExpiresAt(LocalDateTime.now().plusHours(24));

        // Then
        assertFalse(token.getUsed(), "New token should have used=false by default");
    }

    @Test
    void testTokenSetUsed_ShouldUpdateValue() {
        // Given
        FirstTimeLoginToken token = new FirstTimeLoginToken();
        token.setToken(UUID.randomUUID().toString());
        token.setUser(testUser);
        token.setExpiresAt(LocalDateTime.now().plusHours(24));

        // When
        token.setUsed(true);

        // Then
        assertTrue(token.getUsed(), "Token used flag should be updateable");
    }

    @Test
    void testTokenExpiration_FutureDate_ShouldBeValid() {
        // Given
        FirstTimeLoginToken token = new FirstTimeLoginToken();
        token.setToken(UUID.randomUUID().toString());
        token.setUser(testUser);
        LocalDateTime futureDate = LocalDateTime.now().plusHours(24);
        token.setExpiresAt(futureDate);

        // When
        Set<ConstraintViolation<FirstTimeLoginToken>> violations = validator.validate(token);

        // Then
        assertTrue(violations.isEmpty());
        assertEquals(futureDate, token.getExpiresAt());
    }

    @Test
    void testTokenExpiration_PastDate_ShouldStillBeValid() {
        // Given - past dates are allowed (service layer handles expiration logic)
        FirstTimeLoginToken token = new FirstTimeLoginToken();
        token.setToken(UUID.randomUUID().toString());
        token.setUser(testUser);
        LocalDateTime pastDate = LocalDateTime.now().minusHours(24);
        token.setExpiresAt(pastDate);

        // When
        Set<ConstraintViolation<FirstTimeLoginToken>> violations = validator.validate(token);

        // Then - entity level validation passes, business logic handles expiration
        assertTrue(violations.isEmpty());
        assertEquals(pastDate, token.getExpiresAt());
    }

    @Test
    void testTokenAllArgsConstructor_ShouldCreateTokenWithAllFields() {
        // Given
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusHours(24);
        String tokenValue = UUID.randomUUID().toString();

        // When
        FirstTimeLoginToken token = new FirstTimeLoginToken(
                1L,
                tokenValue,
                testUser,
                expiresAt,
                true,
                now
        );

        // Then
        assertEquals(1L, token.getId());
        assertEquals(tokenValue, token.getToken());
        assertEquals(testUser, token.getUser());
        assertEquals(expiresAt, token.getExpiresAt());
        assertTrue(token.getUsed());
        assertEquals(now, token.getCreatedAt());
    }

    @Test
    void testTokenNoArgsConstructor_ShouldCreateEmptyToken() {
        // When
        FirstTimeLoginToken token = new FirstTimeLoginToken();

        // Then
        assertNull(token.getId());
        assertNull(token.getToken());
        assertNull(token.getUser());
        assertNull(token.getExpiresAt());
    }

    @Test
    void testTokenUserRelationship_ShouldMaintainReference() {
        // Given
        FirstTimeLoginToken token = new FirstTimeLoginToken();
        token.setToken(UUID.randomUUID().toString());
        token.setUser(testUser);
        token.setExpiresAt(LocalDateTime.now().plusHours(24));

        // Then
        assertNotNull(token.getUser());
        assertEquals(testUser.getId(), token.getUser().getId());
        assertEquals(testUser.getUsername(), token.getUser().getUsername());
    }

    @Test
    void testTokenValue_ShouldAcceptUuidFormat() {
        // Given
        String uuidToken = UUID.randomUUID().toString();
        FirstTimeLoginToken token = new FirstTimeLoginToken();
        token.setToken(uuidToken);
        token.setUser(testUser);
        token.setExpiresAt(LocalDateTime.now().plusHours(24));

        // When
        Set<ConstraintViolation<FirstTimeLoginToken>> violations = validator.validate(token);

        // Then
        assertTrue(violations.isEmpty());
        assertEquals(uuidToken, token.getToken());
        // UUID format: 8-4-4-4-12 = 36 characters
        assertEquals(36, token.getToken().length());
    }
}
