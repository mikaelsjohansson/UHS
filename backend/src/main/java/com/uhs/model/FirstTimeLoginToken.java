package com.uhs.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entity representing a first-time login token for new user setup.
 * Part of Phase 1A user management implementation.
 *
 * Tokens are generated when an admin creates a new user. The user receives
 * this token (via email or shared link) to set their password on first login.
 * Tokens have an expiration time and can only be used once.
 */
@Entity
@Table(name = "first_time_login_tokens", indexes = {
    @Index(name = "idx_token_value", columnList = "token", unique = true),
    @Index(name = "idx_token_user", columnList = "user_id"),
    @Index(name = "idx_token_expires", columnList = "expires_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FirstTimeLoginToken {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "token_seq")
    @SequenceGenerator(name = "token_seq", sequenceName = "token_sequence", allocationSize = 1)
    private Long id;

    @NotBlank(message = "Token value is required")
    @Column(nullable = false, unique = true)
    private String token;

    @NotNull(message = "User is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @NotNull(message = "Expiration date is required")
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    private Boolean used = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (used == null) {
            used = false;
        }
    }
}
