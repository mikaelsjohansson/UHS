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
        // Given - SQLite with WAL mode handles concurrent writes well
        int numberOfThreads = 5;
        int expensesPerThread = 3;
        ExecutorService executor = Executors.newFixedThreadPool(numberOfThreads);
        CountDownLatch latch = new CountDownLatch(numberOfThreads);
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failureCount = new AtomicInteger(0);
        List<CompletableFuture<Void>> futures = new ArrayList<>();

        // When - Create expenses concurrently
        for (int i = 0; i < numberOfThreads; i++) {
            final int threadId = i;
            CompletableFuture<Void> future = CompletableFuture.runAsync(() -> {
                try {
                    latch.countDown();
                    latch.await(); // Wait for all threads to be ready

                    for (int j = 0; j < expensesPerThread; j++) {
                        ExpenseDto expenseDto = new ExpenseDto();
                        expenseDto.setDescription("Expense from thread " + threadId + " - " + j);
                        expenseDto.setAmount(new BigDecimal("10.00").multiply(new BigDecimal(threadId + 1)));
                        expenseDto.setExpenseDate(LocalDateTime.now());
                        expenseDto.setCategory("Food");

                        try {
                            ExpenseDto created = expenseService.createExpense(expenseDto);
                            assertNotNull(created);
                            assertNotNull(created.getId());
                            successCount.incrementAndGet();
                        } catch (Exception e) {
                            failureCount.incrementAndGet();
                            fail("Failed to create expense: " + e.getMessage());
                        }
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    fail("Thread interrupted: " + e.getMessage());
                }
            }, executor);
            futures.add(future);
        }

        // Wait for all threads to complete
        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
        executor.shutdown();

        // Then - Verify all expenses were created successfully
        List<ExpenseDto> allExpenses = expenseService.getAllExpenses();
        
        assertEquals(numberOfThreads * expensesPerThread, allExpenses.size(), 
                "All expenses should be created");
        assertEquals(numberOfThreads * expensesPerThread, successCount.get(), 
                "All creation attempts should succeed");
        assertEquals(0, failureCount.get(), 
                "No failures should occur during concurrent creation");
        
        // Verify no duplicate IDs
        long uniqueIds = allExpenses.stream()
                .map(ExpenseDto::getId)
                .distinct()
                .count();
        assertEquals(numberOfThreads * expensesPerThread, uniqueIds, 
                "All expense IDs should be unique");
    }

    @Test
    void createExpense_ConcurrentCreations_ShouldMaintainDataIntegrity() throws InterruptedException {
        // Given - SQLite with WAL mode handles concurrent writes
        int numberOfThreads = 10;
        ExecutorService executor = Executors.newFixedThreadPool(numberOfThreads);
        CountDownLatch latch = new CountDownLatch(numberOfThreads);
        List<Long> createdIds = new ArrayList<>();
        Object lock = new Object();

        // When - Create expenses concurrently with same description
        for (int i = 0; i < numberOfThreads; i++) {
            final int threadId = i;
            CompletableFuture.runAsync(() -> {
                try {
                    latch.countDown();
                    latch.await(); // Wait for all threads to be ready

                    ExpenseDto expenseDto = new ExpenseDto();
                    expenseDto.setDescription("Concurrent Expense " + threadId);
                    expenseDto.setAmount(new BigDecimal("50.00"));
                    expenseDto.setExpenseDate(LocalDateTime.now());
                    expenseDto.setCategory("Transport");

                    ExpenseDto created = expenseService.createExpense(expenseDto);
                    
                    synchronized (lock) {
                        createdIds.add(created.getId());
                    }
                } catch (Exception e) {
                    fail("Failed to create expense: " + e.getMessage());
                }
            }, executor);
        }

        // Wait for all threads to complete
        Thread.sleep(3000);
        executor.shutdown();
        
        // Give a bit more time for all operations to complete
        Thread.sleep(1000);

        // Then - Verify data integrity
        List<ExpenseDto> allExpenses = expenseService.getAllExpenses();
        
        assertEquals(numberOfThreads, allExpenses.size(), 
                "All expenses should be created");
        assertEquals(numberOfThreads, createdIds.size(), 
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

