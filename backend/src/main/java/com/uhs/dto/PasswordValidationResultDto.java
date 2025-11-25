package com.uhs.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * DTO representing the result of password complexity validation.
 * Part of Phase 1B user management implementation.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PasswordValidationResultDto {

    private boolean valid;
    private List<String> errors = new ArrayList<>();

    /**
     * Creates a valid result with no errors.
     */
    public static PasswordValidationResultDto valid() {
        PasswordValidationResultDto result = new PasswordValidationResultDto();
        result.setValid(true);
        result.setErrors(new ArrayList<>());
        return result;
    }

    /**
     * Creates an invalid result with the given errors.
     */
    public static PasswordValidationResultDto invalid(List<String> errors) {
        PasswordValidationResultDto result = new PasswordValidationResultDto();
        result.setValid(false);
        result.setErrors(new ArrayList<>(errors));
        return result;
    }

    /**
     * Adds an error message to the result.
     */
    public void addError(String error) {
        if (this.errors == null) {
            this.errors = new ArrayList<>();
        }
        this.errors.add(error);
        this.valid = false;
    }
}
