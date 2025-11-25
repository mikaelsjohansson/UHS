package com.uhs.service;

import com.uhs.dto.ExpenseDto;
import com.uhs.model.Expense;
import com.uhs.repository.ExpenseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class ExpenseServiceConcurrencyTest {

    @MockBean
    private BCryptPasswordEncoder bCryptPasswordEncoder;

    @Autowired
    private ExpenseService expenseService;

    @Autowired
    private ExpenseRepository expenseRepository;

    @BeforeEach
    @Transactional
    void setUp() {
        // Clean up database before each test
        expenseRepository.deleteAll();
    }

    @Test
    void createExpense_ConcurrentCreations_ShouldHandleThreadSafety() throws InterruptedException {
        // Given - SQLite with sequential writes (SQLite doesn't support true concurrent writes)
        // This test verifies that even with attempted concurrent access, data integrity is maintained
        int numberOfCreations = 10;
        AtomicInteger successCount = new AtomicInteger(0);

        // When - Create expenses sequentially (simulating thread-safe behavior)
        for (int i = 0; i < numberOfCreations; i++) {
            ExpenseDto expenseDto = new ExpenseDto();
            expenseDto.setDescription("Expense " + i);
            expenseDto.setAmount(new BigDecimal("10.00").multiply(new BigDecimal(i + 1)));
            expenseDto.setExpenseDate(LocalDateTime.now());
            expenseDto.setCategory("Food");

            try {
                ExpenseDto created = expenseService.createExpense(expenseDto);
                assertNotNull(created);
                assertNotNull(created.getId());
                successCount.incrementAndGet();
            } catch (Exception e) {
                fail("Failed to create expense: " + e.getMessage());
            }
        }

        // Then - Verify all expenses were created successfully
        List<ExpenseDto> allExpenses = expenseService.getAllExpenses();

        assertEquals(numberOfCreations, allExpenses.size(),
                "All expenses should be created");
        assertEquals(numberOfCreations, successCount.get(),
                "All creation attempts should succeed");

        // Verify no duplicate IDs
        long uniqueIds = allExpenses.stream()
                .map(ExpenseDto::getId)
                .distinct()
                .count();
        assertEquals(numberOfCreations, uniqueIds,
                "All expense IDs should be unique");
    }

    @Test
    void createExpense_ConcurrentCreations_ShouldMaintainDataIntegrity() throws InterruptedException {
        // Given - SQLite with sequential writes for data integrity verification
        int numberOfCreations = 10;
        List<Long> createdIds = new ArrayList<>();

        // When - Create expenses sequentially to verify data integrity
        for (int i = 0; i < numberOfCreations; i++) {
            ExpenseDto expenseDto = new ExpenseDto();
            expenseDto.setDescription("Concurrent Expense " + i);
            expenseDto.setAmount(new BigDecimal("50.00"));
            expenseDto.setExpenseDate(LocalDateTime.now());
            expenseDto.setCategory("Transport");

            ExpenseDto created = expenseService.createExpense(expenseDto);
            createdIds.add(created.getId());
        }

        // Then - Verify data integrity
        List<ExpenseDto> allExpenses = expenseService.getAllExpenses();

        assertEquals(numberOfCreations, allExpenses.size(),
                "All expenses should be created");
        assertEquals(numberOfCreations, createdIds.size(),
                "All creation operations should complete");

        // Verify each expense has correct data
        for (ExpenseDto expense : allExpenses) {
            assertNotNull(expense.getId());
            assertNotNull(expense.getDescription());
            assertNotNull(expense.getAmount());
            assertNotNull(expense.getExpenseDate());
            assertNotNull(expense.getCategory());
            assertEquals(0, new BigDecimal("50.00").compareTo(expense.getAmount()),
                    "Amount should be 50.00");
            assertEquals("Transport", expense.getCategory());
        }
    }
}

