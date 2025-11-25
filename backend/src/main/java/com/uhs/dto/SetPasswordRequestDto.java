package com.uhs.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for set password request (used for setup-admin and set-password endpoints).
 * Part of Phase 1C authentication API implementation.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SetPasswordRequestDto {

    @NotBlank(message = "Password is required")
    private String password;
}
