package com.uhs.service;

import com.uhs.dto.ExpenseDto;
import com.uhs.model.Expense;
import com.uhs.repository.ExpenseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration test to verify expense creation works with SQLite.
 * This test will fail initially because SQLite doesn't support getGeneratedKeys().
 * After fixing ID generation, this test should pass.
 */
@SpringBootTest
@ActiveProfiles("test")
class ExpenseServiceSqliteTest {

    @Autowired
    private ExpenseService expenseService;

    @Autowired
    private ExpenseRepository expenseRepository;

    @BeforeEach
    @Transactional
    void setUp() {
        expenseRepository.deleteAll();
    }

    @Test
    void createExpense_WithSqlite_ShouldPersistAndReturnId() {
        // Given
        ExpenseDto expenseDto = new ExpenseDto();
        expenseDto.setDescription("Test Expense for SQLite");
        expenseDto.setAmount(new BigDecimal("75.50"));
        expenseDto.setExpenseDate(LocalDateTime.now());
        expenseDto.setCategory("Food");

        // When - Create expense (this will fail if ID generation doesn't work)
        ExpenseDto created = expenseService.createExpense(expenseDto);

        // Then - Verify it was created with an ID
        assertNotNull(created, "Created expense should not be null");
        assertNotNull(created.getId(), "Created expense should have an ID generated");
        assertEquals("Test Expense for SQLite", created.getDescription());
        assertEquals(new BigDecimal("75.50"), created.getAmount());
        assertEquals("Food", created.getCategory());

        // Verify it can be retrieved from database
        ExpenseDto retrieved = expenseService.getExpenseById(created.getId());
        assertNotNull(retrieved);
        assertEquals(created.getId(), retrieved.getId());
        assertEquals("Test Expense for SQLite", retrieved.getDescription());
    }

    @Test
    void createMultipleExpenses_WithSqlite_ShouldGenerateUniqueIds() {
        // Given
        ExpenseDto expense1 = new ExpenseDto();
        expense1.setDescription("Expense 1");
        expense1.setAmount(new BigDecimal("10.00"));
        expense1.setExpenseDate(LocalDateTime.now());
        expense1.setCategory("Food");

        ExpenseDto expense2 = new ExpenseDto();
        expense2.setDescription("Expense 2");
        expense2.setAmount(new BigDecimal("20.00"));
        expense2.setExpenseDate(LocalDateTime.now());
        expense2.setCategory("Transport");

        // When - Create multiple expenses
        ExpenseDto created1 = expenseService.createExpense(expense1);
        ExpenseDto created2 = expenseService.createExpense(expense2);

        // Then - Verify both have unique IDs
        assertNotNull(created1.getId());
        assertNotNull(created2.getId());
        assertNotEquals(created1.getId(), created2.getId(), 
                "Each expense should have a unique ID");

        // Verify both are persisted
        List<ExpenseDto> allExpenses = expenseService.getAllExpenses();
        assertEquals(2, allExpenses.size(), 
                "Both expenses should be persisted");
    }
}

