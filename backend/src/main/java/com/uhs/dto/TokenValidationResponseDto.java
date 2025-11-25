package com.uhs.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for the response when validating a first-time login token.
 * Part of Phase 1A user management implementation.
 *
 * Used by the frontend to determine if a token is valid and
 * display appropriate information during the password setup flow.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TokenValidationResponseDto {

    /**
     * Whether the token is valid (exists, not used, not expired).
     */
    private Boolean valid;

    /**
     * The username associated with this token (if valid).
     * Null if the token is invalid.
     */
    private String username;

    /**
     * When this token expires (if valid).
     * Null if the token is invalid.
     */
    private LocalDateTime expiresAt;
}
