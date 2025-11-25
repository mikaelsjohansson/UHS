package com.uhs.dto;

import com.uhs.model.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO representing the result of first-time login token validation.
 * Part of Phase 1B user management implementation.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TokenValidationResultDto {

    /**
     * Possible reasons for token validation failure.
     */
    public enum InvalidReason {
        NOT_FOUND,
        EXPIRED,
        ALREADY_USED
    }

    private boolean valid;
    private InvalidReason reason;
    private User user;

    /**
     * Creates a valid result with the associated user.
     */
    public static TokenValidationResultDto valid(User user) {
        TokenValidationResultDto result = new TokenValidationResultDto();
        result.setValid(true);
        result.setUser(user);
        result.setReason(null);
        return result;
    }

    /**
     * Creates an invalid result with the specified reason.
     */
    public static TokenValidationResultDto invalid(InvalidReason reason) {
        TokenValidationResultDto result = new TokenValidationResultDto();
        result.setValid(false);
        result.setReason(reason);
        result.setUser(null);
        return result;
    }
}
