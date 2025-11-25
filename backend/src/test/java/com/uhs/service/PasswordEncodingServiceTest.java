package com.uhs.service;

import com.uhs.dto.PasswordValidationResultDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for PasswordEncodingService.
 * Part of Phase 1B user management implementation.
 * Tests password encoding with BCrypt and password complexity validation.
 */
class PasswordEncodingServiceTest {

    private PasswordEncodingService passwordEncodingService;

    @BeforeEach
    void setUp() {
        passwordEncodingService = new PasswordEncodingService();
    }

    // ==================== Password Encoding Tests ====================

    @Test
    @DisplayName("encodePassword should return BCrypt encoded password")
    void encodePassword_ShouldReturnBCryptEncodedPassword() {
        // Given
        String rawPassword = "SecurePassword123!";

        // When
        String encodedPassword = passwordEncodingService.encodePassword(rawPassword);

        // Then
        assertNotNull(encodedPassword);
        assertTrue(encodedPassword.startsWith("$2a$") || encodedPassword.startsWith("$2b$"));
        assertNotEquals(rawPassword, encodedPassword);
    }

    @Test
    @DisplayName("encodePassword should produce different hashes for same password")
    void encodePassword_ShouldProduceDifferentHashesForSamePassword() {
        // Given
        String rawPassword = "SecurePassword123!";

        // When
        String encodedPassword1 = passwordEncodingService.encodePassword(rawPassword);
        String encodedPassword2 = passwordEncodingService.encodePassword(rawPassword);

        // Then
        assertNotEquals(encodedPassword1, encodedPassword2);
    }

    @Test
    @DisplayName("encodePassword should use strength 12")
    void encodePassword_ShouldUseStrength12() {
        // Given
        String rawPassword = "SecurePassword123!";

        // When
        String encodedPassword = passwordEncodingService.encodePassword(rawPassword);

        // Then - BCrypt format: $2a$12$... where 12 is the strength
        assertTrue(encodedPassword.contains("$12$"), "BCrypt should use strength 12");
    }

    // ==================== Password Matching Tests ====================

    @Test
    @DisplayName("matchPassword should return true for matching passwords")
    void matchPassword_ShouldReturnTrueForMatchingPasswords() {
        // Given
        String rawPassword = "SecurePassword123!";
        String encodedPassword = passwordEncodingService.encodePassword(rawPassword);

        // When
        boolean matches = passwordEncodingService.matchPassword(rawPassword, encodedPassword);

        // Then
        assertTrue(matches);
    }

    @Test
    @DisplayName("matchPassword should return false for non-matching passwords")
    void matchPassword_ShouldReturnFalseForNonMatchingPasswords() {
        // Given
        String rawPassword = "SecurePassword123!";
        String wrongPassword = "WrongPassword456!";
        String encodedPassword = passwordEncodingService.encodePassword(rawPassword);

        // When
        boolean matches = passwordEncodingService.matchPassword(wrongPassword, encodedPassword);

        // Then
        assertFalse(matches);
    }

    @Test
    @DisplayName("matchPassword should return false for empty raw password")
    void matchPassword_ShouldReturnFalseForEmptyRawPassword() {
        // Given
        String rawPassword = "SecurePassword123!";
        String encodedPassword = passwordEncodingService.encodePassword(rawPassword);

        // When
        boolean matches = passwordEncodingService.matchPassword("", encodedPassword);

        // Then
        assertFalse(matches);
    }

    // ==================== Password Complexity Validation Tests ====================

    @Test
    @DisplayName("validatePasswordComplexity should pass for valid strong password")
    void validatePasswordComplexity_ShouldPassForValidStrongPassword() {
        // Given
        String strongPassword = "SecurePass123!@#";

        // When
        PasswordValidationResultDto result = passwordEncodingService.validatePasswordComplexity(strongPassword);

        // Then
        assertTrue(result.isValid());
        assertTrue(result.getErrors().isEmpty());
    }

    @Test
    @DisplayName("validatePasswordComplexity should fail for password shorter than 12 characters")
    void validatePasswordComplexity_ShouldFailForShortPassword() {
        // Given
        String shortPassword = "Short1!";

        // When
        PasswordValidationResultDto result = passwordEncodingService.validatePasswordComplexity(shortPassword);

        // Then
        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream()
                .anyMatch(e -> e.toLowerCase().contains("12 character")));
    }

    @Test
    @DisplayName("validatePasswordComplexity should fail for password without uppercase letter")
    void validatePasswordComplexity_ShouldFailForPasswordWithoutUppercase() {
        // Given
        String noUppercasePassword = "securepass123!@#";

        // When
        PasswordValidationResultDto result = passwordEncodingService.validatePasswordComplexity(noUppercasePassword);

        // Then
        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream()
                .anyMatch(e -> e.toLowerCase().contains("uppercase")));
    }

    @Test
    @DisplayName("validatePasswordComplexity should fail for password without lowercase letter")
    void validatePasswordComplexity_ShouldFailForPasswordWithoutLowercase() {
        // Given
        String noLowercasePassword = "SECUREPASS123!@#";

        // When
        PasswordValidationResultDto result = passwordEncodingService.validatePasswordComplexity(noLowercasePassword);

        // Then
        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream()
                .anyMatch(e -> e.toLowerCase().contains("lowercase")));
    }

    @Test
    @DisplayName("validatePasswordComplexity should fail for password without digit")
    void validatePasswordComplexity_ShouldFailForPasswordWithoutDigit() {
        // Given
        String noDigitPassword = "SecurePassword!@#";

        // When
        PasswordValidationResultDto result = passwordEncodingService.validatePasswordComplexity(noDigitPassword);

        // Then
        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream()
                .anyMatch(e -> e.toLowerCase().contains("digit")));
    }

    @Test
    @DisplayName("validatePasswordComplexity should fail for password without special character")
    void validatePasswordComplexity_ShouldFailForPasswordWithoutSpecialCharacter() {
        // Given
        String noSpecialPassword = "SecurePassword123";

        // When
        PasswordValidationResultDto result = passwordEncodingService.validatePasswordComplexity(noSpecialPassword);

        // Then
        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream()
                .anyMatch(e -> e.toLowerCase().contains("special")));
    }

    @Test
    @DisplayName("validatePasswordComplexity should fail for null password")
    void validatePasswordComplexity_ShouldFailForNullPassword() {
        // When
        PasswordValidationResultDto result = passwordEncodingService.validatePasswordComplexity(null);

        // Then
        assertFalse(result.isValid());
        assertFalse(result.getErrors().isEmpty());
    }

    @Test
    @DisplayName("validatePasswordComplexity should fail for empty password")
    void validatePasswordComplexity_ShouldFailForEmptyPassword() {
        // When
        PasswordValidationResultDto result = passwordEncodingService.validatePasswordComplexity("");

        // Then
        assertFalse(result.isValid());
        assertFalse(result.getErrors().isEmpty());
    }

    @Test
    @DisplayName("validatePasswordComplexity should return multiple errors for multiple violations")
    void validatePasswordComplexity_ShouldReturnMultipleErrorsForMultipleViolations() {
        // Given - password missing uppercase, special char, and is too short
        String weakPassword = "weak1234567";

        // When
        PasswordValidationResultDto result = passwordEncodingService.validatePasswordComplexity(weakPassword);

        // Then
        assertFalse(result.isValid());
        assertTrue(result.getErrors().size() >= 2, "Should have at least 2 errors");
    }

    @Test
    @DisplayName("validatePasswordComplexity should reject common patterns - password")
    void validatePasswordComplexity_ShouldRejectCommonPatternPassword() {
        // Given
        String commonPattern = "Password1234!";

        // When
        PasswordValidationResultDto result = passwordEncodingService.validatePasswordComplexity(commonPattern);

        // Then
        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream()
                .anyMatch(e -> e.toLowerCase().contains("common")));
    }

    @Test
    @DisplayName("validatePasswordComplexity should reject common patterns - 123456")
    void validatePasswordComplexity_ShouldRejectCommonSequence123456() {
        // Given
        String commonSequence = "Abc123456789!";

        // When
        PasswordValidationResultDto result = passwordEncodingService.validatePasswordComplexity(commonSequence);

        // Then
        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream()
                .anyMatch(e -> e.toLowerCase().contains("common")));
    }

    @Test
    @DisplayName("validatePasswordComplexity should reject common patterns - qwerty")
    void validatePasswordComplexity_ShouldRejectCommonPatternQwerty() {
        // Given
        String qwertyPattern = "Qwerty12345!@";

        // When
        PasswordValidationResultDto result = passwordEncodingService.validatePasswordComplexity(qwertyPattern);

        // Then
        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream()
                .anyMatch(e -> e.toLowerCase().contains("common")));
    }

    @Test
    @DisplayName("validatePasswordComplexity should accept valid password with all requirements")
    void validatePasswordComplexity_ShouldAcceptValidPasswordWithAllRequirements() {
        // Given
        String validPassword = "MyStr0ng#Pass!";

        // When
        PasswordValidationResultDto result = passwordEncodingService.validatePasswordComplexity(validPassword);

        // Then
        assertTrue(result.isValid());
        assertTrue(result.getErrors().isEmpty());
    }

    @Test
    @DisplayName("validatePasswordComplexity should accept various special characters")
    void validatePasswordComplexity_ShouldAcceptVariousSpecialCharacters() {
        // Given - various special characters
        String[] passwords = {
            "ValidPass123!", "ValidPass123@", "ValidPass123#",
            "ValidPass123$", "ValidPass123%", "ValidPass123^",
            "ValidPass123&", "ValidPass123*"
        };

        for (String password : passwords) {
            // When
            PasswordValidationResultDto result = passwordEncodingService.validatePasswordComplexity(password);

            // Then
            assertTrue(result.isValid(), "Password with special char should be valid: " + password);
        }
    }

    @Test
    @DisplayName("validatePasswordComplexity should accept password with exactly 12 characters")
    void validatePasswordComplexity_ShouldAcceptPasswordWithExactly12Characters() {
        // Given - exactly 12 characters
        String password = "Aa1!Bb2@Cc3#";

        // When
        PasswordValidationResultDto result = passwordEncodingService.validatePasswordComplexity(password);

        // Then
        assertTrue(result.isValid());
    }
}
