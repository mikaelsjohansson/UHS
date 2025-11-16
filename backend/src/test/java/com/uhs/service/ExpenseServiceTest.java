package com.uhs.service;

import com.uhs.dto.ExpenseDto;
import com.uhs.model.Expense;
import com.uhs.repository.ExpenseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExpenseServiceTest {

    @Mock
    private ExpenseRepository expenseRepository;

    @InjectMocks
    private ExpenseService expenseService;

    private Expense testExpense;
    private ExpenseDto testExpenseDto;

    @BeforeEach
    void setUp() {
        testExpense = new Expense();
        testExpense.setId(1L);
        testExpense.setDescription("Test Expense");
        testExpense.setAmount(new BigDecimal("100.00"));
        testExpense.setExpenseDate(LocalDateTime.now());
        testExpense.setCategory("Food");

        testExpenseDto = new ExpenseDto();
        testExpenseDto.setDescription("Test Expense");
        testExpenseDto.setAmount(new BigDecimal("100.00"));
        testExpenseDto.setExpenseDate(LocalDateTime.now());
        testExpenseDto.setCategory("Food");
    }

    @Test
    void getAllExpenses_ShouldReturnListOfExpenses() {
        // Given
        List<Expense> expenses = Arrays.asList(testExpense);
        when(expenseRepository.findAll()).thenReturn(expenses);

        // When
        List<ExpenseDto> result = expenseService.getAllExpenses();

        // Then
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Test Expense", result.get(0).getDescription());
        verify(expenseRepository, times(1)).findAll();
    }

    @Test
    void getExpenseById_WhenExpenseExists_ShouldReturnExpense() {
        // Given
        when(expenseRepository.findById(1L)).thenReturn(Optional.of(testExpense));

        // When
        ExpenseDto result = expenseService.getExpenseById(1L);

        // Then
        assertNotNull(result);
        assertEquals("Test Expense", result.getDescription());
        verify(expenseRepository, times(1)).findById(1L);
    }

    @Test
    void getExpenseById_WhenExpenseDoesNotExist_ShouldThrowException() {
        // Given
        when(expenseRepository.findById(1L)).thenReturn(Optional.empty());

        // When & Then
        assertThrows(RuntimeException.class, () -> expenseService.getExpenseById(1L));
        verify(expenseRepository, times(1)).findById(1L);
    }

    @Test
    void createExpense_ShouldSaveAndReturnExpense() {
        // Given
        when(expenseRepository.save(any(Expense.class))).thenReturn(testExpense);

        // When
        ExpenseDto result = expenseService.createExpense(testExpenseDto);

        // Then
        assertNotNull(result);
        assertEquals("Test Expense", result.getDescription());
        verify(expenseRepository, times(1)).save(any(Expense.class));
    }

    @Test
    void updateExpense_WhenExpenseExists_ShouldUpdateAndReturnExpense() {
        // Given
        when(expenseRepository.findById(1L)).thenReturn(Optional.of(testExpense));
        when(expenseRepository.save(any(Expense.class))).thenReturn(testExpense);

        testExpenseDto.setDescription("Updated Expense");

        // When
        ExpenseDto result = expenseService.updateExpense(1L, testExpenseDto);

        // Then
        assertNotNull(result);
        verify(expenseRepository, times(1)).findById(1L);
        verify(expenseRepository, times(1)).save(any(Expense.class));
    }

    @Test
    void updateExpense_WhenExpenseDoesNotExist_ShouldThrowException() {
        // Given
        when(expenseRepository.findById(1L)).thenReturn(Optional.empty());

        // When & Then
        assertThrows(RuntimeException.class, () -> expenseService.updateExpense(1L, testExpenseDto));
        verify(expenseRepository, times(1)).findById(1L);
        verify(expenseRepository, never()).save(any(Expense.class));
    }

    @Test
    void deleteExpense_WhenExpenseExists_ShouldDeleteExpense() {
        // Given
        when(expenseRepository.existsById(1L)).thenReturn(true);

        // When
        expenseService.deleteExpense(1L);

        // Then
        verify(expenseRepository, times(1)).existsById(1L);
        verify(expenseRepository, times(1)).deleteById(1L);
    }

    @Test
    void deleteExpense_WhenExpenseDoesNotExist_ShouldThrowException() {
        // Given
        when(expenseRepository.existsById(1L)).thenReturn(false);

        // When & Then
        assertThrows(RuntimeException.class, () -> expenseService.deleteExpense(1L));
        verify(expenseRepository, times(1)).existsById(1L);
        verify(expenseRepository, never()).deleteById(anyLong());
    }
}

