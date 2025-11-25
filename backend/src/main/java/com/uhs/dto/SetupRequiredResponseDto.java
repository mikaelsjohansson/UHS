package com.uhs.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for setup-required response.
 * Part of Phase 1C authentication API implementation.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SetupRequiredResponseDto {

    private Boolean setupRequired;
}
