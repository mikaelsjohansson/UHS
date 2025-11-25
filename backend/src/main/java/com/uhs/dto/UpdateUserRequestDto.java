package com.uhs.dto;

import com.uhs.model.UserRole;
import jakarta.validation.constraints.Email;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for updating an existing user.
 * Part of Phase 1A user management implementation.
 *
 * Note: username and password cannot be updated via this DTO.
 * Password changes require a separate flow.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRequestDto {

    @Email(message = "Email must be valid")
    private String email;

    private UserRole role;

    private Boolean isActive;
}
