package com.uhs.dto;

import com.uhs.model.UserRole;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO representing the result of JWT token validation.
 * Part of Phase 1B user management implementation.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class JwtValidationResultDto {

    private boolean valid;
    private Long userId;
    private String username;
    private UserRole role;

    /**
     * Creates a valid result with the extracted user information.
     */
    public static JwtValidationResultDto valid(Long userId, String username, UserRole role) {
        JwtValidationResultDto result = new JwtValidationResultDto();
        result.setValid(true);
        result.setUserId(userId);
        result.setUsername(username);
        result.setRole(role);
        return result;
    }

    /**
     * Creates an invalid result.
     */
    public static JwtValidationResultDto invalid() {
        JwtValidationResultDto result = new JwtValidationResultDto();
        result.setValid(false);
        result.setUserId(null);
        result.setUsername(null);
        result.setRole(null);
        return result;
    }
}
