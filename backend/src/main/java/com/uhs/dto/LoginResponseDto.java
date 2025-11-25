package com.uhs.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for login response containing JWT token and user info.
 * Part of Phase 1C authentication API implementation.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponseDto {

    private String token;
    private UserDto user;
    private LocalDateTime expiresAt;
}
