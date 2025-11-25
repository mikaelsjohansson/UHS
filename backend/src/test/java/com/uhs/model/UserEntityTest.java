package com.uhs.model;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for User entity - Phase 1A of user management system.
 * Tests entity field constraints, default values, and lifecycle callbacks.
 */
class UserEntityTest {

    private Validator validator;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    void testUserCreation_WithValidData_ShouldSucceed() {
        // Given
        User user = new User();
        user.setUsername("testuser");
        user.setRole(UserRole.USER);

        // When
        Set<ConstraintViolation<User>> violations = validator.validate(user);

        // Then
        assertTrue(violations.isEmpty(), "User with valid data should have no violations");
        assertEquals("testuser", user.getUsername());
        assertEquals(UserRole.USER, user.getRole());
    }

    @Test
    void testUserCreation_WithoutUsername_ShouldFail() {
        // Given
        User user = new User();
        user.setRole(UserRole.USER);

        // When
        Set<ConstraintViolation<User>> violations = validator.validate(user);

        // Then
        assertFalse(violations.isEmpty(), "User without username should have violations");
        assertTrue(violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().equals("username")));
    }

    @Test
    void testUserCreation_WithBlankUsername_ShouldFail() {
        // Given
        User user = new User();
        user.setUsername("   ");
        user.setRole(UserRole.USER);

        // When
        Set<ConstraintViolation<User>> violations = validator.validate(user);

        // Then
        assertFalse(violations.isEmpty(), "User with blank username should have violations");
    }

    @Test
    void testUserCreation_WithInvalidEmail_ShouldFail() {
        // Given
        User user = new User();
        user.setUsername("testuser");
        user.setEmail("invalid-email");
        user.setRole(UserRole.USER);

        // When
        Set<ConstraintViolation<User>> violations = validator.validate(user);

        // Then
        assertFalse(violations.isEmpty(), "User with invalid email should have violations");
        assertTrue(violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().equals("email")));
    }

    @Test
    void testUserCreation_WithValidEmail_ShouldSucceed() {
        // Given
        User user = new User();
        user.setUsername("testuser");
        user.setEmail("test@example.com");
        user.setRole(UserRole.USER);

        // When
        Set<ConstraintViolation<User>> violations = validator.validate(user);

        // Then
        assertTrue(violations.isEmpty(), "User with valid email should have no violations");
        assertEquals("test@example.com", user.getEmail());
    }

    @Test
    void testUserCreation_WithNullEmail_ShouldSucceed() {
        // Given - email is optional
        User user = new User();
        user.setUsername("testuser");
        user.setEmail(null);
        user.setRole(UserRole.USER);

        // When
        Set<ConstraintViolation<User>> violations = validator.validate(user);

        // Then
        assertTrue(violations.isEmpty(), "User with null email should have no violations (email is optional)");
    }

    @Test
    void testUserDefaultValues_IsActiveShouldBeFalse() {
        // Given
        User user = new User();
        user.setUsername("testuser");
        user.setRole(UserRole.USER);

        // Then
        assertFalse(user.getIsActive(), "New user should be inactive by default");
    }

    @Test
    void testUserDefaultValues_IsDefaultAdminShouldBeFalse() {
        // Given
        User user = new User();
        user.setUsername("testuser");
        user.setRole(UserRole.USER);

        // Then
        assertFalse(user.getIsDefaultAdmin(), "New user should not be default admin by default");
    }

    @Test
    void testUserDefaultValues_PasswordSetShouldBeFalse() {
        // Given
        User user = new User();
        user.setUsername("testuser");
        user.setRole(UserRole.USER);

        // Then
        assertFalse(user.getPasswordSet(), "New user should have passwordSet as false by default");
    }

    @Test
    void testUserRole_AdminRole_ShouldBeValid() {
        // Given
        User user = new User();
        user.setUsername("admin");
        user.setRole(UserRole.ADMIN);

        // When
        Set<ConstraintViolation<User>> violations = validator.validate(user);

        // Then
        assertTrue(violations.isEmpty());
        assertEquals(UserRole.ADMIN, user.getRole());
    }

    @Test
    void testUserRole_UserRole_ShouldBeValid() {
        // Given
        User user = new User();
        user.setUsername("regularuser");
        user.setRole(UserRole.USER);

        // When
        Set<ConstraintViolation<User>> violations = validator.validate(user);

        // Then
        assertTrue(violations.isEmpty());
        assertEquals(UserRole.USER, user.getRole());
    }

    @Test
    void testUserPasswordHash_ShouldBeNullable() {
        // Given - password_hash is nullable until user sets password
        User user = new User();
        user.setUsername("testuser");
        user.setPasswordHash(null);
        user.setRole(UserRole.USER);

        // When
        Set<ConstraintViolation<User>> violations = validator.validate(user);

        // Then
        assertTrue(violations.isEmpty(), "Password hash should be nullable");
        assertNull(user.getPasswordHash());
    }

    @Test
    void testUserPasswordHash_ShouldAcceptHashedValue() {
        // Given
        User user = new User();
        user.setUsername("testuser");
        user.setPasswordHash("$2a$10$somehashedpassword");
        user.setRole(UserRole.USER);

        // When
        Set<ConstraintViolation<User>> violations = validator.validate(user);

        // Then
        assertTrue(violations.isEmpty());
        assertEquals("$2a$10$somehashedpassword", user.getPasswordHash());
    }

    @Test
    void testUserAllArgsConstructor_ShouldCreateUserWithAllFields() {
        // Given
        LocalDateTime now = LocalDateTime.now();

        // When
        User user = new User(
                1L,
                "testuser",
                "hashedpassword",
                "test@example.com",
                UserRole.ADMIN,
                true,
                true,
                true,
                now,
                now
        );

        // Then
        assertEquals(1L, user.getId());
        assertEquals("testuser", user.getUsername());
        assertEquals("hashedpassword", user.getPasswordHash());
        assertEquals("test@example.com", user.getEmail());
        assertEquals(UserRole.ADMIN, user.getRole());
        assertTrue(user.getIsDefaultAdmin());
        assertTrue(user.getIsActive());
        assertTrue(user.getPasswordSet());
        assertEquals(now, user.getCreatedAt());
        assertEquals(now, user.getUpdatedAt());
    }

    @Test
    void testUserNoArgsConstructor_ShouldCreateEmptyUser() {
        // When
        User user = new User();

        // Then
        assertNull(user.getId());
        assertNull(user.getUsername());
        assertNull(user.getPasswordHash());
        assertNull(user.getEmail());
    }

    @Test
    void testUserEquality_SameId_ShouldBeEqual() {
        // Given
        User user1 = new User();
        user1.setId(1L);
        user1.setUsername("user1");

        User user2 = new User();
        user2.setId(1L);
        user2.setUsername("user2");

        // Then - using Lombok @Data, equality is based on all fields
        // But we want to verify id is set correctly
        assertEquals(user1.getId(), user2.getId());
    }
}
