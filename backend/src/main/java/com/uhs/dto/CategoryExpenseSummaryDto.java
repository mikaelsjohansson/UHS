package com.uhs.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CategoryExpenseSummaryDto {
    private String category;
    private BigDecimal totalAmount;
    private Long count;
}

