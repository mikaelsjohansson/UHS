package com.uhs.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.uhs.dto.ExpenseDto;
import com.uhs.service.ExpenseService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import jakarta.persistence.EntityManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.test.annotation.Commit;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests to verify the new autocomplete endpoints work with real database.
 * These tests verify the full stack: Controller -> Service -> Repository -> Database
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ExpenseControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ExpenseService expenseService;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private EntityManager entityManager;

    @BeforeEach
    @Transactional
    void setUp() {
        // Clean up any existing expenses before each test
        List<ExpenseDto> allExpenses = expenseService.getAllExpenses();
        for (ExpenseDto expense : allExpenses) {
            if (expense.getId() != null) {
                expenseService.deleteExpense(expense.getId());
            }
        }
    }

    @Test
    void getDescriptionSuggestions_WithMatchingExpenses_ShouldReturnSuggestions() throws Exception {
        // Given - Create expenses with different descriptions
        ExpenseDto expense1 = new ExpenseDto();
        expense1.setDescription("Skånetrafiken");
        expense1.setAmount(new BigDecimal("50.00"));
        expense1.setExpenseDate(LocalDateTime.now());
        expense1.setCategory("Transport");
        expenseService.createExpense(expense1);

        ExpenseDto expense2 = new ExpenseDto();
        expense2.setDescription("Skåne Express");
        expense2.setAmount(new BigDecimal("30.00"));
        expense2.setExpenseDate(LocalDateTime.now());
        expense2.setCategory("Transport");
        expenseService.createExpense(expense2);

        ExpenseDto expense3 = new ExpenseDto();
        expense3.setDescription("ICA Supermarket");
        expense3.setAmount(new BigDecimal("100.00"));
        expense3.setExpenseDate(LocalDateTime.now());
        expense3.setCategory("Food");
        expenseService.createExpense(expense3);

        // When & Then - Search for "skåne"
        mockMvc.perform(get("/api/expenses/suggestions")
                        .param("query", "skåne"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0]").value("Skåne Express"))
                .andExpect(jsonPath("$[1]").value("Skånetrafiken"));
    }

    @Test
    void getDescriptionSuggestions_WithNoMatches_ShouldReturnEmptyList() throws Exception {
        // Given - Create expenses that don't match
        ExpenseDto expense1 = new ExpenseDto();
        expense1.setDescription("ICA Supermarket");
        expense1.setAmount(new BigDecimal("100.00"));
        expense1.setExpenseDate(LocalDateTime.now());
        expense1.setCategory("Food");
        expenseService.createExpense(expense1);

        // When & Then - Search for something that doesn't match
        mockMvc.perform(get("/api/expenses/suggestions")
                        .param("query", "xyz123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void getDescriptionSuggestions_WithCaseInsensitive_ShouldReturnMatches() throws Exception {
        // Given - Create expense with mixed case
        ExpenseDto expense1 = new ExpenseDto();
        expense1.setDescription("Skånetrafiken");
        expense1.setAmount(new BigDecimal("50.00"));
        expense1.setExpenseDate(LocalDateTime.now());
        expense1.setCategory("Transport");
        expenseService.createExpense(expense1);

        // When & Then - Search with different case (lowercase)
        mockMvc.perform(get("/api/expenses/suggestions")
                        .param("query", "skåne"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0]").value("Skånetrafiken"));
    }

    @Test
    void getCategoryHint_WithExistingExpenses_ShouldReturnMostCommonCategory() throws Exception {
        // Given - Create multiple expenses with same description but different categories
        // Most common category should be "Transport" (3 times) vs "Food" (1 time)
        ExpenseDto expense1 = new ExpenseDto();
        expense1.setDescription("Skånetrafiken");
        expense1.setAmount(new BigDecimal("50.00"));
        expense1.setExpenseDate(LocalDateTime.now());
        expense1.setCategory("Transport");
        expenseService.createExpense(expense1);

        ExpenseDto expense2 = new ExpenseDto();
        expense2.setDescription("Skånetrafiken");
        expense2.setAmount(new BigDecimal("50.00"));
        expense2.setExpenseDate(LocalDateTime.now());
        expense2.setCategory("Transport");
        expenseService.createExpense(expense2);

        ExpenseDto expense3 = new ExpenseDto();
        expense3.setDescription("Skånetrafiken");
        expense3.setAmount(new BigDecimal("50.00"));
        expense3.setExpenseDate(LocalDateTime.now());
        expense3.setCategory("Transport");
        expenseService.createExpense(expense3);

        ExpenseDto expense4 = new ExpenseDto();
        expense4.setDescription("Skånetrafiken");
        expense4.setAmount(new BigDecimal("50.00"));
        expense4.setExpenseDate(LocalDateTime.now());
        expense4.setCategory("Food");
        expenseService.createExpense(expense4);

        // When & Then - Get category hint
        mockMvc.perform(get("/api/expenses/category-hint")
                        .param("description", "Skånetrafiken"))
                .andExpect(status().isOk())
                .andExpect(content().string("Transport"));
    }

    @Test
    void getCategoryHint_WithNoMatchingExpenses_ShouldReturnNoContent() throws Exception {
        // Given - Create expenses with different description
        ExpenseDto expense1 = new ExpenseDto();
        expense1.setDescription("ICA Supermarket");
        expense1.setAmount(new BigDecimal("100.00"));
        expense1.setExpenseDate(LocalDateTime.now());
        expense1.setCategory("Food");
        expenseService.createExpense(expense1);

        // When & Then - Get category hint for non-existent description
        mockMvc.perform(get("/api/expenses/category-hint")
                        .param("description", "NonExistent"))
                .andExpect(status().isNoContent());
    }

    @Test
    void getCategoryHint_WithExpensesWithoutCategory_ShouldReturnNoContent() throws Exception {
        // Given - Create expense without category
        ExpenseDto expense1 = new ExpenseDto();
        expense1.setDescription("Skånetrafiken");
        expense1.setAmount(new BigDecimal("50.00"));
        expense1.setExpenseDate(LocalDateTime.now());
        expense1.setCategory(null);
        expenseService.createExpense(expense1);

        // When & Then - Get category hint (should return no content since no category exists)
        mockMvc.perform(get("/api/expenses/category-hint")
                        .param("description", "Skånetrafiken"))
                .andExpect(status().isNoContent());
    }

    @Test
    void getCategoryHint_WithCaseInsensitive_ShouldReturnCategory() throws Exception {
        // Given - Create expense with mixed case description
        ExpenseDto expense1 = new ExpenseDto();
        expense1.setDescription("Skånetrafiken");
        expense1.setAmount(new BigDecimal("50.00"));
        expense1.setExpenseDate(LocalDateTime.now());
        expense1.setCategory("Transport");
        expenseService.createExpense(expense1);

        // When & Then - Get category hint with different case (lowercase)
        mockMvc.perform(get("/api/expenses/category-hint")
                        .param("description", "skånetrafiken"))
                .andExpect(status().isOk())
                .andExpect(content().string("Transport"));
    }

    @Test
    void getDescriptionSuggestions_WithPartialMatch_ShouldReturnMatches() throws Exception {
        // Given - Create expenses
        ExpenseDto expense1 = new ExpenseDto();
        expense1.setDescription("Skånetrafiken");
        expense1.setAmount(new BigDecimal("50.00"));
        expense1.setExpenseDate(LocalDateTime.now());
        expense1.setCategory("Transport");
        expenseService.createExpense(expense1);

        ExpenseDto expense2 = new ExpenseDto();
        expense2.setDescription("Skåne Express");
        expense2.setAmount(new BigDecimal("30.00"));
        expense2.setExpenseDate(LocalDateTime.now());
        expense2.setCategory("Transport");
        expenseService.createExpense(expense2);

        // When & Then - Search with partial match
        mockMvc.perform(get("/api/expenses/suggestions")
                        .param("query", "trafik"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0]").value("Skånetrafiken"));
    }
}

