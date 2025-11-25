package com.uhs.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for the response when generating a new first-time login token.
 * Part of Phase 1D user management REST API implementation.
 *
 * Contains the setup URL and expiration time for the generated token.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GenerateTokenResponseDto {

    /**
     * The URL the user should visit to set their password.
     * Format: http://localhost:5173/setup-password/{token}
     */
    private String setupUrl;

    /**
     * When the token expires.
     */
    private LocalDateTime expiresAt;
}
