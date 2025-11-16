package com.uhs.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.uhs.dto.CategoryExpenseSummaryDto;
import com.uhs.dto.CategoryTrendDto;
import com.uhs.dto.ExpenseDto;
import com.uhs.service.ExpenseService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
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

    @Test
    void getExpensesByYearMonth_ShouldReturnCategorySummaries() throws Exception {
        // Given
        CategoryExpenseSummaryDto foodSummary = new CategoryExpenseSummaryDto("Food", new BigDecimal("80.00"), 2L);
        CategoryExpenseSummaryDto transportSummary = new CategoryExpenseSummaryDto("Transport", new BigDecimal("100.00"), 1L);
        List<CategoryExpenseSummaryDto> summaries = Arrays.asList(foodSummary, transportSummary);

        when(expenseService.getExpensesByYearMonth(2024, 1)).thenReturn(summaries);

        // When & Then
        mockMvc.perform(get("/api/expenses/analytics")
                        .param("year", "2024")
                        .param("month", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].category").exists())
                .andExpect(jsonPath("$[0].totalAmount").exists())
                .andExpect(jsonPath("$[0].count").exists());

        verify(expenseService, times(1)).getExpensesByYearMonth(2024, 1);
    }

    @Test
    void getCategoryTrend_ShouldReturnTrendData() throws Exception {
        // Given
        CategoryTrendDto trend1 = new CategoryTrendDto(LocalDate.of(2024, 1, 5), new BigDecimal("80.00"));
        CategoryTrendDto trend2 = new CategoryTrendDto(LocalDate.of(2024, 1, 15), new BigDecimal("25.00"));
        List<CategoryTrendDto> trends = Arrays.asList(trend1, trend2);

        when(expenseService.getCategoryTrend(eq("Food"), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(trends);

        // When & Then
        mockMvc.perform(get("/api/expenses/analytics/category/Food")
                        .param("startDate", "2024-01-01T00:00:00")
                        .param("endDate", "2024-01-31T23:59:59"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].date").exists())
                .andExpect(jsonPath("$[0].amount").exists());

        verify(expenseService, times(1)).getCategoryTrend(eq("Food"), any(LocalDateTime.class), any(LocalDateTime.class));
    }
}

