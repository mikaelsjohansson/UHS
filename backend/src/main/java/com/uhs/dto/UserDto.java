package com.uhs.dto;

import com.uhs.model.UserRole;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for transferring User data across API boundaries.
 * Part of Phase 1A user management implementation.
 *
 * Note: passwordHash is intentionally excluded from this DTO for security.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {

    private Long id;

    private String username;

    private String email;

    private UserRole role;

    private Boolean isActive;

    private Boolean passwordSet;

    private Boolean isDefaultAdmin;

    private LocalDateTime createdAt;
}
