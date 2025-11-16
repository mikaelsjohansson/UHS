package com.uhs.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.uhs.dto.ExpenseDto;
import com.uhs.service.ExpenseService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ExpenseController.class)
class ExpenseControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ExpenseService expenseService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void getAllExpenses_ShouldReturnListOfExpenses() throws Exception {
        // Given
        ExpenseDto expense1 = new ExpenseDto(1L, "Expense 1", new BigDecimal("50.00"), LocalDateTime.now(), "Food");
        ExpenseDto expense2 = new ExpenseDto(2L, "Expense 2", new BigDecimal("100.00"), LocalDateTime.now(), "Transport");
        List<ExpenseDto> expenses = Arrays.asList(expense1, expense2);

        when(expenseService.getAllExpenses()).thenReturn(expenses);

        // When & Then
        mockMvc.perform(get("/api/expenses"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].description").value("Expense 1"))
                .andExpect(jsonPath("$[1].description").value("Expense 2"));

        verify(expenseService, times(1)).getAllExpenses();
    }

    @Test
    void getExpenseById_ShouldReturnExpense() throws Exception {
        // Given
        ExpenseDto expense = new ExpenseDto(1L, "Test Expense", new BigDecimal("100.00"), LocalDateTime.now(), "Food");
        when(expenseService.getExpenseById(1L)).thenReturn(expense);

        // When & Then
        mockMvc.perform(get("/api/expenses/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.description").value("Test Expense"))
                .andExpect(jsonPath("$.amount").value(100.00));

        verify(expenseService, times(1)).getExpenseById(1L);
    }

    @Test
    void createExpense_ShouldReturnCreatedExpense() throws Exception {
        // Given
        ExpenseDto inputDto = new ExpenseDto(null, "New Expense", new BigDecimal("75.00"), LocalDateTime.now(), "Food");
        ExpenseDto createdDto = new ExpenseDto(1L, "New Expense", new BigDecimal("75.00"), LocalDateTime.now(), "Food");

        when(expenseService.createExpense(any(ExpenseDto.class))).thenReturn(createdDto);

        // When & Then
        mockMvc.perform(post("/api/expenses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(inputDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.description").value("New Expense"));

        verify(expenseService, times(1)).createExpense(any(ExpenseDto.class));
    }

    @Test
    void updateExpense_ShouldReturnUpdatedExpense() throws Exception {
        // Given
        ExpenseDto updateDto = new ExpenseDto(1L, "Updated Expense", new BigDecimal("150.00"), LocalDateTime.now(), "Food");
        when(expenseService.updateExpense(eq(1L), any(ExpenseDto.class))).thenReturn(updateDto);

        // When & Then
        mockMvc.perform(put("/api/expenses/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.description").value("Updated Expense"))
                .andExpect(jsonPath("$.amount").value(150.00));

        verify(expenseService, times(1)).updateExpense(eq(1L), any(ExpenseDto.class));
    }

    @Test
    void deleteExpense_ShouldReturnNoContent() throws Exception {
        // Given
        doNothing().when(expenseService).deleteExpense(1L);

        // When & Then
        mockMvc.perform(delete("/api/expenses/1"))
                .andExpect(status().isNoContent());

        verify(expenseService, times(1)).deleteExpense(1L);
    }
}

