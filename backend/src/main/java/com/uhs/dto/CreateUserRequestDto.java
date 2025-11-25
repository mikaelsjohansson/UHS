package com.uhs.dto;

import com.uhs.model.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for creating a new user request.
 * Part of Phase 1A user management implementation.
 *
 * When a user is created, they receive a first-time login token
 * to set their password. The role defaults to USER if not specified.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateUserRequestDto {

    @NotBlank(message = "Username is required")
    private String username;

    @Email(message = "Email must be valid")
    private String email;

    private UserRole role = UserRole.USER;
}
