package com.uhs.dto;

import com.uhs.model.UserRole;
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
 * Unit tests for User-related DTOs - Phase 1A of user management system.
 */
class UserDtoTest {

    private Validator validator;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    // UserDto tests

    @Test
    void testUserDto_AllArgsConstructor_ShouldCreateDto() {
        // Given
        LocalDateTime now = LocalDateTime.now();

        // When
        UserDto dto = new UserDto(1L, "testuser", "test@example.com",
                UserRole.USER, true, true, false, now);

        // Then
        assertEquals(1L, dto.getId());
        assertEquals("testuser", dto.getUsername());
        assertEquals("test@example.com", dto.getEmail());
        assertEquals(UserRole.USER, dto.getRole());
        assertTrue(dto.getIsActive());
        assertTrue(dto.getPasswordSet());
        assertFalse(dto.getIsDefaultAdmin());
        assertEquals(now, dto.getCreatedAt());
    }

    @Test
    void testUserDto_NoArgsConstructor_ShouldCreateEmptyDto() {
        // When
        UserDto dto = new UserDto();

        // Then
        assertNull(dto.getId());
        assertNull(dto.getUsername());
        assertNull(dto.getEmail());
        assertNull(dto.getRole());
    }

    // CreateUserRequestDto tests

    @Test
    void testCreateUserRequestDto_WithValidData_ShouldHaveNoViolations() {
        // Given
        CreateUserRequestDto dto = new CreateUserRequestDto();
        dto.setUsername("newuser");
        dto.setEmail("new@example.com");
        dto.setRole(UserRole.USER);

        // When
        Set<ConstraintViolation<CreateUserRequestDto>> violations = validator.validate(dto);

        // Then
        assertTrue(violations.isEmpty());
    }

    @Test
    void testCreateUserRequestDto_WithoutUsername_ShouldHaveViolation() {
        // Given
        CreateUserRequestDto dto = new CreateUserRequestDto();
        dto.setEmail("new@example.com");

        // When
        Set<ConstraintViolation<CreateUserRequestDto>> violations = validator.validate(dto);

        // Then
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().equals("username")));
    }

    @Test
    void testCreateUserRequestDto_WithInvalidEmail_ShouldHaveViolation() {
        // Given
        CreateUserRequestDto dto = new CreateUserRequestDto();
        dto.setUsername("newuser");
        dto.setEmail("invalid-email");

        // When
        Set<ConstraintViolation<CreateUserRequestDto>> violations = validator.validate(dto);

        // Then
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().equals("email")));
    }

    @Test
    void testCreateUserRequestDto_DefaultRole_ShouldBeUser() {
        // Given
        CreateUserRequestDto dto = new CreateUserRequestDto();
        dto.setUsername("newuser");

        // Then
        assertEquals(UserRole.USER, dto.getRole());
    }

    // CreateUserResponseDto tests

    @Test
    void testCreateUserResponseDto_ShouldContainUserAndSetupUrl() {
        // Given
        UserDto user = new UserDto(1L, "newuser", "new@example.com",
                UserRole.USER, false, false, false, LocalDateTime.now());
        String setupUrl = "/setup-password?token=abc123-uuid";

        // When
        CreateUserResponseDto dto = new CreateUserResponseDto(user, setupUrl);

        // Then
        assertNotNull(dto.getUser());
        assertEquals("newuser", dto.getUser().getUsername());
        assertEquals("/setup-password?token=abc123-uuid", dto.getSetupUrl());
    }

    // UpdateUserRequestDto tests

    @Test
    void testUpdateUserRequestDto_WithValidData_ShouldHaveNoViolations() {
        // Given
        UpdateUserRequestDto dto = new UpdateUserRequestDto();
        dto.setEmail("updated@example.com");
        dto.setRole(UserRole.ADMIN);
        dto.setIsActive(true);

        // When
        Set<ConstraintViolation<UpdateUserRequestDto>> violations = validator.validate(dto);

        // Then
        assertTrue(violations.isEmpty());
    }

    @Test
    void testUpdateUserRequestDto_WithInvalidEmail_ShouldHaveViolation() {
        // Given
        UpdateUserRequestDto dto = new UpdateUserRequestDto();
        dto.setEmail("invalid-email");

        // When
        Set<ConstraintViolation<UpdateUserRequestDto>> violations = validator.validate(dto);

        // Then
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().equals("email")));
    }

    @Test
    void testUpdateUserRequestDto_WithNullFields_ShouldHaveNoViolations() {
        // Given - all fields are optional for partial updates
        UpdateUserRequestDto dto = new UpdateUserRequestDto();

        // When
        Set<ConstraintViolation<UpdateUserRequestDto>> violations = validator.validate(dto);

        // Then
        assertTrue(violations.isEmpty());
    }

    // FirstTimeLoginTokenDto tests

    @Test
    void testFirstTimeLoginTokenDto_ShouldContainAllFields() {
        // Given
        LocalDateTime expiresAt = LocalDateTime.now().plusHours(24);

        // When
        FirstTimeLoginTokenDto dto = new FirstTimeLoginTokenDto(
                "abc123-uuid", "testuser", expiresAt);

        // Then
        assertEquals("abc123-uuid", dto.getToken());
        assertEquals("testuser", dto.getUsername());
        assertEquals(expiresAt, dto.getExpiresAt());
    }

    // TokenValidationResponseDto tests

    @Test
    void testTokenValidationResponseDto_ValidToken_ShouldContainDetails() {
        // Given
        LocalDateTime expiresAt = LocalDateTime.now().plusHours(24);

        // When
        TokenValidationResponseDto dto = new TokenValidationResponseDto(
                true, "testuser", expiresAt);

        // Then
        assertTrue(dto.getValid());
        assertEquals("testuser", dto.getUsername());
        assertEquals(expiresAt, dto.getExpiresAt());
    }

    @Test
    void testTokenValidationResponseDto_InvalidToken_ShouldHaveNullDetails() {
        // When
        TokenValidationResponseDto dto = new TokenValidationResponseDto(
                false, null, null);

        // Then
        assertFalse(dto.getValid());
        assertNull(dto.getUsername());
        assertNull(dto.getExpiresAt());
    }
}
