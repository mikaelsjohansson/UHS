package com.uhs.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for the response after creating a new user.
 * Part of Phase 1A user management implementation.
 *
 * Contains the created user details and a setup URL that the new user
 * can use to set their password for the first time.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateUserResponseDto {

    /**
     * The created user's details.
     */
    private UserDto user;

    /**
     * The URL the new user should visit to set their password.
     * This URL contains the first-time login token.
     * Example: /setup-password?token=abc123-uuid-token
     */
    private String setupUrl;
}
