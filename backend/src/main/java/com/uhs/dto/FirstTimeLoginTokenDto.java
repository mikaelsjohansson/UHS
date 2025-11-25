package com.uhs.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for transferring FirstTimeLoginToken data.
 * Part of Phase 1A user management implementation.
 *
 * Used when displaying token information to admins or
 * when validating tokens during the password setup flow.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FirstTimeLoginTokenDto {

    /**
     * The unique token string (UUID format).
     */
    private String token;

    /**
     * The username associated with this token.
     */
    private String username;

    /**
     * When this token expires.
     */
    private LocalDateTime expiresAt;
}
