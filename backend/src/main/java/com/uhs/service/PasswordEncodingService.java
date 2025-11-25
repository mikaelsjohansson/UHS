package com.uhs.service;

import com.uhs.dto.PasswordValidationResultDto;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Service for handling password encoding and validation.
 * Part of Phase 1B user management implementation.
 *
 * Uses BCrypt with strength 12 for password hashing.
 * Validates password complexity according to security policy.
 */
@Service
public class PasswordEncodingService {

    private static final int BCRYPT_STRENGTH = 12;
    private static final int MIN_PASSWORD_LENGTH = 12;

    // Patterns for password validation
    private static final Pattern UPPERCASE_PATTERN = Pattern.compile("[A-Z]");
    private static final Pattern LOWERCASE_PATTERN = Pattern.compile("[a-z]");
    private static final Pattern DIGIT_PATTERN = Pattern.compile("[0-9]");
    private static final Pattern SPECIAL_CHAR_PATTERN = Pattern.compile("[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?]");

    // Common patterns to reject
    private static final List<String> COMMON_PATTERNS = List.of(
        "password", "123456", "qwerty", "admin", "letmein",
        "welcome", "monkey", "dragon", "master", "abc123"
    );

    private final BCryptPasswordEncoder passwordEncoder;

    public PasswordEncodingService() {
        this.passwordEncoder = new BCryptPasswordEncoder(BCRYPT_STRENGTH);
    }

    /**
     * Encodes a raw password using BCrypt with strength 12.
     *
     * @param rawPassword the plain text password to encode
     * @return the BCrypt encoded password hash
     */
    public String encodePassword(String rawPassword) {
        return passwordEncoder.encode(rawPassword);
    }

    /**
     * Verifies that a raw password matches an encoded password hash.
     *
     * @param rawPassword the plain text password to verify
     * @param encodedPassword the BCrypt encoded password hash to compare against
     * @return true if the passwords match, false otherwise
     */
    public boolean matchPassword(String rawPassword, String encodedPassword) {
        if (rawPassword == null || rawPassword.isEmpty() || encodedPassword == null) {
            return false;
        }
        return passwordEncoder.matches(rawPassword, encodedPassword);
    }

    /**
     * Validates password complexity according to the security policy.
     *
     * Requirements:
     * - Minimum 12 characters
     * - At least 1 uppercase letter
     * - At least 1 lowercase letter
     * - At least 1 digit
     * - At least 1 special character (!@#$%^&*...)
     * - No common patterns
     *
     * @param password the password to validate
     * @return PasswordValidationResultDto containing validation result and any errors
     */
    public PasswordValidationResultDto validatePasswordComplexity(String password) {
        List<String> errors = new ArrayList<>();

        // Check for null or empty
        if (password == null || password.isEmpty()) {
            errors.add("Password cannot be empty");
            return PasswordValidationResultDto.invalid(errors);
        }

        // Check minimum length
        if (password.length() < MIN_PASSWORD_LENGTH) {
            errors.add("Password must be at least 12 characters long");
        }

        // Check for uppercase letter
        if (!UPPERCASE_PATTERN.matcher(password).find()) {
            errors.add("Password must contain at least one uppercase letter");
        }

        // Check for lowercase letter
        if (!LOWERCASE_PATTERN.matcher(password).find()) {
            errors.add("Password must contain at least one lowercase letter");
        }

        // Check for digit
        if (!DIGIT_PATTERN.matcher(password).find()) {
            errors.add("Password must contain at least one digit");
        }

        // Check for special character
        if (!SPECIAL_CHAR_PATTERN.matcher(password).find()) {
            errors.add("Password must contain at least one special character (!@#$%^&*...)");
        }

        // Check for common patterns
        String lowercasePassword = password.toLowerCase();
        for (String commonPattern : COMMON_PATTERNS) {
            if (lowercasePassword.contains(commonPattern)) {
                errors.add("Password contains a common pattern and is not allowed");
                break; // Only add this error once
            }
        }

        if (errors.isEmpty()) {
            return PasswordValidationResultDto.valid();
        }

        return PasswordValidationResultDto.invalid(errors);
    }
}
