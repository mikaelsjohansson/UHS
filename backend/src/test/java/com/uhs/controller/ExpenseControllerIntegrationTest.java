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

    @Test
    void getExpensesByMonth_WithExpensesInMonth_ShouldReturnOnlyExpensesForThatMonth() throws Exception {
        // Given - Create expenses in different months
        ExpenseDto expense1 = new ExpenseDto();
        expense1.setDescription("January Expense 1");
        expense1.setAmount(new BigDecimal("50.00"));
        expense1.setExpenseDate(LocalDateTime.of(2024, 1, 15, 10, 0));
        expense1.setCategory("Food");
        expenseService.createExpense(expense1);

        ExpenseDto expense2 = new ExpenseDto();
        expense2.setDescription("January Expense 2");
        expense2.setAmount(new BigDecimal("100.00"));
        expense2.setExpenseDate(LocalDateTime.of(2024, 1, 20, 14, 30));
        expense2.setCategory("Transport");
        expenseService.createExpense(expense2);

        ExpenseDto expense3 = new ExpenseDto();
        expense3.setDescription("February Expense");
        expense3.setAmount(new BigDecimal("75.00"));
        expense3.setExpenseDate(LocalDateTime.of(2024, 2, 10, 9, 0));
        expense3.setCategory("Food");
        expenseService.createExpense(expense3);

        ExpenseDto expense4 = new ExpenseDto();
        expense4.setDescription("December Expense");
        expense4.setAmount(new BigDecimal("200.00"));
        expense4.setExpenseDate(LocalDateTime.of(2023, 12, 25, 16, 0));
        expense4.setCategory("Transport");
        expenseService.createExpense(expense4);

        // When & Then - Get expenses for January 2024
        mockMvc.perform(get("/api/expenses/month")
                        .param("year", "2024")
                        .param("month", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].description").exists())
                .andExpect(jsonPath("$[1].description").exists())
                .andExpect(jsonPath("$[?(@.description == 'January Expense 1')]").exists())
                .andExpect(jsonPath("$[?(@.description == 'January Expense 2')]").exists())
                .andExpect(jsonPath("$[?(@.description == 'February Expense')]").doesNotExist())
                .andExpect(jsonPath("$[?(@.description == 'December Expense')]").doesNotExist());
    }

    @Test
    void getExpensesByMonth_WithNoExpensesInMonth_ShouldReturnEmptyList() throws Exception {
        // Given - Create expenses in other months
        ExpenseDto expense1 = new ExpenseDto();
        expense1.setDescription("January Expense");
        expense1.setAmount(new BigDecimal("50.00"));
        expense1.setExpenseDate(LocalDateTime.of(2024, 1, 15, 10, 0));
        expense1.setCategory("Food");
        expenseService.createExpense(expense1);

        ExpenseDto expense2 = new ExpenseDto();
        expense2.setDescription("March Expense");
        expense2.setAmount(new BigDecimal("100.00"));
        expense2.setExpenseDate(LocalDateTime.of(2024, 3, 10, 9, 0));
        expense2.setCategory("Transport");
        expenseService.createExpense(expense2);

        // When & Then - Get expenses for February 2024 (no expenses)
        mockMvc.perform(get("/api/expenses/month")
                        .param("year", "2024")
                        .param("month", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void getExpensesByMonth_WithExpensesOnMonthBoundaries_ShouldIncludeAllDaysInMonth() throws Exception {
        // Given - Create expenses on first and last day of month
        ExpenseDto expense1 = new ExpenseDto();
        expense1.setDescription("First Day Expense");
        expense1.setAmount(new BigDecimal("50.00"));
        expense1.setExpenseDate(LocalDateTime.of(2024, 1, 1, 0, 0));
        expense1.setCategory("Food");
        expenseService.createExpense(expense1);

        ExpenseDto expense2 = new ExpenseDto();
        expense2.setDescription("Last Day Expense");
        expense2.setAmount(new BigDecimal("100.00"));
        expense2.setExpenseDate(LocalDateTime.of(2024, 1, 31, 23, 59, 59));
        expense2.setCategory("Transport");
        expenseService.createExpense(expense2);

        ExpenseDto expense3 = new ExpenseDto();
        expense3.setDescription("Next Month First Day");
        expense3.setAmount(new BigDecimal("75.00"));
        expense3.setExpenseDate(LocalDateTime.of(2024, 2, 1, 0, 0));
        expense3.setCategory("Food");
        expenseService.createExpense(expense3);

        // When & Then - Get expenses for January 2024
        mockMvc.perform(get("/api/expenses/month")
                        .param("year", "2024")
                        .param("month", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[?(@.description == 'First Day Expense')]").exists())
                .andExpect(jsonPath("$[?(@.description == 'Last Day Expense')]").exists())
                .andExpect(jsonPath("$[?(@.description == 'Next Month First Day')]").doesNotExist());
    }

    @Test
    void getExpensesByMonth_WithLeapYearFebruary_ShouldHandleCorrectly() throws Exception {
        // Given - Create expenses in February of a leap year (2024 is a leap year)
        ExpenseDto expense1 = new ExpenseDto();
        expense1.setDescription("Leap Year Feb 29");
        expense1.setAmount(new BigDecimal("50.00"));
        expense1.setExpenseDate(LocalDateTime.of(2024, 2, 29, 12, 0));
        expense1.setCategory("Food");
        expenseService.createExpense(expense1);

        ExpenseDto expense2 = new ExpenseDto();
        expense2.setDescription("Leap Year Feb 28");
        expense2.setAmount(new BigDecimal("100.00"));
        expense2.setExpenseDate(LocalDateTime.of(2024, 2, 28, 12, 0));
        expense2.setCategory("Transport");
        expenseService.createExpense(expense2);

        // When & Then - Get expenses for February 2024
        mockMvc.perform(get("/api/expenses/month")
                        .param("year", "2024")
                        .param("month", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[?(@.description == 'Leap Year Feb 29')]").exists())
                .andExpect(jsonPath("$[?(@.description == 'Leap Year Feb 28')]").exists());
    }

    @Test
    void getMultiCategoryTrend_WithMultipleCategories_ShouldReturnTrendDataForEachCategory() throws Exception {
        // Given - Create expenses for different categories in different dates
        ExpenseDto expense1 = new ExpenseDto();
        expense1.setDescription("Food Expense 1");
        expense1.setAmount(new BigDecimal("50.00"));
        expense1.setExpenseDate(LocalDateTime.of(2024, 1, 5, 10, 0));
        expense1.setCategory("Food");
        expenseService.createExpense(expense1);

        ExpenseDto expense2 = new ExpenseDto();
        expense2.setDescription("Food Expense 2");
        expense2.setAmount(new BigDecimal("30.00"));
        expense2.setExpenseDate(LocalDateTime.of(2024, 1, 5, 15, 0));
        expense2.setCategory("Food");
        expenseService.createExpense(expense2);

        ExpenseDto expense3 = new ExpenseDto();
        expense3.setDescription("Transport Expense 1");
        expense3.setAmount(new BigDecimal("100.00"));
        expense3.setExpenseDate(LocalDateTime.of(2024, 1, 10, 10, 0));
        expense3.setCategory("Transport");
        expenseService.createExpense(expense3);

        ExpenseDto expense4 = new ExpenseDto();
        expense4.setDescription("Food Expense 3");
        expense4.setAmount(new BigDecimal("25.00"));
        expense4.setExpenseDate(LocalDateTime.of(2024, 1, 15, 10, 0));
        expense4.setCategory("Food");
        expenseService.createExpense(expense4);

        ExpenseDto expense5 = new ExpenseDto();
        expense5.setDescription("Transport Expense 2");
        expense5.setAmount(new BigDecimal("75.00"));
        expense5.setExpenseDate(LocalDateTime.of(2024, 1, 20, 14, 0));
        expense5.setCategory("Transport");
        expenseService.createExpense(expense5);

        // When & Then - Get multi-category trend for Food and Transport
        mockMvc.perform(get("/api/expenses/analytics/categories/trend")
                        .param("categories", "Food", "Transport")
                        .param("startDate", "2024-01-01T00:00:00")
                        .param("endDate", "2024-01-31T23:59:59"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(4)) // 2 dates for Food, 2 dates for Transport
                .andExpect(jsonPath("$[?(@.category == 'Food' && @.date == '2024-01-05')]").exists())
                .andExpect(jsonPath("$[?(@.category == 'Food' && @.date == '2024-01-05')].amount").value(80))
                .andExpect(jsonPath("$[?(@.category == 'Food' && @.date == '2024-01-15')]").exists())
                .andExpect(jsonPath("$[?(@.category == 'Food' && @.date == '2024-01-15')].amount").value(25))
                .andExpect(jsonPath("$[?(@.category == 'Transport' && @.date == '2024-01-10')]").exists())
                .andExpect(jsonPath("$[?(@.category == 'Transport' && @.date == '2024-01-10')].amount").value(100))
                .andExpect(jsonPath("$[?(@.category == 'Transport' && @.date == '2024-01-20')]").exists())
                .andExpect(jsonPath("$[?(@.category == 'Transport' && @.date == '2024-01-20')].amount").value(75));
    }

    @Test
    void getMultiCategoryTrend_WithAllCategories_ShouldReturnTrendDataForAllCategories() throws Exception {
        // Given - Create expenses for different categories
        ExpenseDto expense1 = new ExpenseDto();
        expense1.setDescription("Food Expense");
        expense1.setAmount(new BigDecimal("50.00"));
        expense1.setExpenseDate(LocalDateTime.of(2024, 1, 5, 10, 0));
        expense1.setCategory("Food");
        expenseService.createExpense(expense1);

        ExpenseDto expense2 = new ExpenseDto();
        expense2.setDescription("Transport Expense");
        expense2.setAmount(new BigDecimal("100.00"));
        expense2.setExpenseDate(LocalDateTime.of(2024, 1, 10, 10, 0));
        expense2.setCategory("Transport");
        expenseService.createExpense(expense2);

        ExpenseDto expense3 = new ExpenseDto();
        expense3.setDescription("Entertainment Expense");
        expense3.setAmount(new BigDecimal("75.00"));
        expense3.setExpenseDate(LocalDateTime.of(2024, 1, 15, 10, 0));
        expense3.setCategory("Entertainment");
        expenseService.createExpense(expense3);

        // When & Then - Get multi-category trend for all categories (no categories parameter)
        mockMvc.perform(get("/api/expenses/analytics/categories/trend")
                        .param("startDate", "2024-01-01T00:00:00")
                        .param("endDate", "2024-01-31T23:59:59"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(3)) // One entry per category/date combination
                .andExpect(jsonPath("$[?(@.category == 'Food')]").exists())
                .andExpect(jsonPath("$[?(@.category == 'Transport')]").exists())
                .andExpect(jsonPath("$[?(@.category == 'Entertainment')]").exists());
    }

    @Test
    void getMultiCategoryTrend_WithNoMatchingExpenses_ShouldReturnEmptyList() throws Exception {
        // Given - Create expenses outside the date range
        ExpenseDto expense1 = new ExpenseDto();
        expense1.setDescription("Food Expense");
        expense1.setAmount(new BigDecimal("50.00"));
        expense1.setExpenseDate(LocalDateTime.of(2023, 12, 15, 10, 0));
        expense1.setCategory("Food");
        expenseService.createExpense(expense1);

        ExpenseDto expense2 = new ExpenseDto();
        expense2.setDescription("Transport Expense");
        expense2.setAmount(new BigDecimal("100.00"));
        expense2.setExpenseDate(LocalDateTime.of(2024, 2, 10, 10, 0));
        expense2.setCategory("Transport");
        expenseService.createExpense(expense2);

        // When & Then - Get multi-category trend for January 2024 (no matching expenses)
        mockMvc.perform(get("/api/expenses/analytics/categories/trend")
                        .param("categories", "Food", "Transport")
                        .param("startDate", "2024-01-01T00:00:00")
                        .param("endDate", "2024-01-31T23:59:59"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void getMultiCategoryTrend_WithSingleCategory_ShouldReturnTrendDataForThatCategory() throws Exception {
        // Given - Create expenses for one category
        ExpenseDto expense1 = new ExpenseDto();
        expense1.setDescription("Food Expense 1");
        expense1.setAmount(new BigDecimal("50.00"));
        expense1.setExpenseDate(LocalDateTime.of(2024, 1, 5, 10, 0));
        expense1.setCategory("Food");
        expenseService.createExpense(expense1);

        ExpenseDto expense2 = new ExpenseDto();
        expense2.setDescription("Food Expense 2");
        expense2.setAmount(new BigDecimal("30.00"));
        expense2.setExpenseDate(LocalDateTime.of(2024, 1, 5, 15, 0));
        expense2.setCategory("Food");
        expenseService.createExpense(expense2);

        ExpenseDto expense3 = new ExpenseDto();
        expense3.setDescription("Food Expense 3");
        expense3.setAmount(new BigDecimal("25.00"));
        expense3.setExpenseDate(LocalDateTime.of(2024, 1, 15, 10, 0));
        expense3.setCategory("Food");
        expenseService.createExpense(expense3);

        // When & Then - Get multi-category trend for Food only
        mockMvc.perform(get("/api/expenses/analytics/categories/trend")
                        .param("categories", "Food")
                        .param("startDate", "2024-01-01T00:00:00")
                        .param("endDate", "2024-01-31T23:59:59"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2)) // 2 dates
                .andExpect(jsonPath("$[?(@.category == 'Food' && @.date == '2024-01-05')]").exists())
                .andExpect(jsonPath("$[?(@.category == 'Food' && @.date == '2024-01-05')].amount").value(80))
                .andExpect(jsonPath("$[?(@.category == 'Food' && @.date == '2024-01-15')]").exists())
                .andExpect(jsonPath("$[?(@.category == 'Food' && @.date == '2024-01-15')].amount").value(25));
    }

    @Test
    void getMultiCategoryTrend_WithDateBoundaries_ShouldIncludeAllDaysInRange() throws Exception {
        // Given - Create expenses on first and last day of range
        ExpenseDto expense1 = new ExpenseDto();
        expense1.setDescription("First Day Expense");
        expense1.setAmount(new BigDecimal("50.00"));
        expense1.setExpenseDate(LocalDateTime.of(2024, 1, 1, 0, 0, 0));
        expense1.setCategory("Food");
        expenseService.createExpense(expense1);

        ExpenseDto expense2 = new ExpenseDto();
        expense2.setDescription("Last Day Expense");
        expense2.setAmount(new BigDecimal("100.00"));
        expense2.setExpenseDate(LocalDateTime.of(2024, 1, 31, 23, 59, 59));
        expense2.setCategory("Transport");
        expenseService.createExpense(expense2);

        ExpenseDto expense3 = new ExpenseDto();
        expense3.setDescription("Before Range");
        expense3.setAmount(new BigDecimal("75.00"));
        expense3.setExpenseDate(LocalDateTime.of(2023, 12, 31, 23, 59, 59));
        expense3.setCategory("Food");
        expenseService.createExpense(expense3);

        ExpenseDto expense4 = new ExpenseDto();
        expense4.setDescription("After Range");
        expense4.setAmount(new BigDecimal("200.00"));
        expense4.setExpenseDate(LocalDateTime.of(2024, 2, 1, 0, 0, 0));
        expense4.setCategory("Transport");
        expenseService.createExpense(expense4);

        // When & Then - Get multi-category trend for January 2024
        mockMvc.perform(get("/api/expenses/analytics/categories/trend")
                        .param("categories", "Food", "Transport")
                        .param("startDate", "2024-01-01T00:00:00")
                        .param("endDate", "2024-01-31T23:59:59"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2)) // Only expenses within range
                .andExpect(jsonPath("$[?(@.category == 'Food' && @.date == '2024-01-01')]").exists())
                .andExpect(jsonPath("$[?(@.category == 'Transport' && @.date == '2024-01-31')]").exists())
                .andExpect(jsonPath("$[?(@.description == 'Before Range')]").doesNotExist())
                .andExpect(jsonPath("$[?(@.description == 'After Range')]").doesNotExist());
    }
}

