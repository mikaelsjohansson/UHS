package com.uhs.service;

import com.uhs.dto.CategoryExpenseSummaryDto;
import com.uhs.dto.CategoryTrendDto;
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
import java.time.LocalDate;
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

    @Test
    void getExpensesByYearMonth_ShouldReturnGroupedByCategory() {
        // Given
        LocalDateTime startOfMonth = LocalDateTime.of(2024, 1, 1, 0, 0);
        LocalDateTime endOfMonth = LocalDateTime.of(2024, 1, 31, 23, 59, 59);
        
        Expense expense1 = new Expense();
        expense1.setId(1L);
        expense1.setDescription("Food Expense 1");
        expense1.setAmount(new BigDecimal("50.00"));
        expense1.setExpenseDate(LocalDateTime.of(2024, 1, 15, 10, 0));
        expense1.setCategory("Food");
        
        Expense expense2 = new Expense();
        expense2.setId(2L);
        expense2.setDescription("Food Expense 2");
        expense2.setAmount(new BigDecimal("30.00"));
        expense2.setExpenseDate(LocalDateTime.of(2024, 1, 20, 10, 0));
        expense2.setCategory("Food");
        
        Expense expense3 = new Expense();
        expense3.setId(3L);
        expense3.setDescription("Transport Expense");
        expense3.setAmount(new BigDecimal("100.00"));
        expense3.setExpenseDate(LocalDateTime.of(2024, 1, 10, 10, 0));
        expense3.setCategory("Transport");
        
        List<Expense> expenses = Arrays.asList(expense1, expense2, expense3);
        when(expenseRepository.findByExpenseDateBetween(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(expenses);

        // When
        List<CategoryExpenseSummaryDto> result = expenseService.getExpensesByYearMonth(2024, 1);

        // Then
        assertNotNull(result);
        assertEquals(2, result.size());
        
        CategoryExpenseSummaryDto foodSummary = result.stream()
                .filter(s -> "Food".equals(s.getCategory()))
                .findFirst()
                .orElse(null);
        assertNotNull(foodSummary);
        assertEquals(new BigDecimal("80.00"), foodSummary.getTotalAmount());
        assertEquals(2L, foodSummary.getCount());
        
        CategoryExpenseSummaryDto transportSummary = result.stream()
                .filter(s -> "Transport".equals(s.getCategory()))
                .findFirst()
                .orElse(null);
        assertNotNull(transportSummary);
        assertEquals(new BigDecimal("100.00"), transportSummary.getTotalAmount());
        assertEquals(1L, transportSummary.getCount());
        
        verify(expenseRepository, times(1)).findByExpenseDateBetween(any(LocalDateTime.class), any(LocalDateTime.class));
    }

    @Test
    void getCategoryTrend_ShouldReturnTrendData() {
        // Given
        String category = "Food";
        LocalDateTime startDate = LocalDateTime.of(2024, 1, 1, 0, 0);
        LocalDateTime endDate = LocalDateTime.of(2024, 1, 31, 23, 59, 59);
        
        Expense expense1 = new Expense();
        expense1.setId(1L);
        expense1.setDescription("Food Expense 1");
        expense1.setAmount(new BigDecimal("50.00"));
        expense1.setExpenseDate(LocalDateTime.of(2024, 1, 5, 10, 0));
        expense1.setCategory("Food");
        
        Expense expense2 = new Expense();
        expense2.setId(2L);
        expense2.setDescription("Food Expense 2");
        expense2.setAmount(new BigDecimal("30.00"));
        expense2.setExpenseDate(LocalDateTime.of(2024, 1, 5, 15, 0));
        expense2.setCategory("Food");
        
        Expense expense3 = new Expense();
        expense3.setId(3L);
        expense3.setDescription("Food Expense 3");
        expense3.setAmount(new BigDecimal("25.00"));
        expense3.setExpenseDate(LocalDateTime.of(2024, 1, 15, 10, 0));
        expense3.setCategory("Food");
        
        List<Expense> expenses = Arrays.asList(expense1, expense2, expense3);
        when(expenseRepository.findByCategoryAndExpenseDateBetween(category, startDate, endDate))
                .thenReturn(expenses);

        // When
        List<CategoryTrendDto> result = expenseService.getCategoryTrend(category, startDate, endDate);

        // Then
        assertNotNull(result);
        assertEquals(2, result.size()); // Grouped by date
        
        CategoryTrendDto day5Trend = result.stream()
                .filter(t -> LocalDate.of(2024, 1, 5).equals(t.getDate()))
                .findFirst()
                .orElse(null);
        assertNotNull(day5Trend);
        assertEquals(new BigDecimal("80.00"), day5Trend.getAmount());
        
        CategoryTrendDto day15Trend = result.stream()
                .filter(t -> LocalDate.of(2024, 1, 15).equals(t.getDate()))
                .findFirst()
                .orElse(null);
        assertNotNull(day15Trend);
        assertEquals(new BigDecimal("25.00"), day15Trend.getAmount());
        
        verify(expenseRepository, times(1)).findByCategoryAndExpenseDateBetween(category, startDate, endDate);
    }

    @Test
    void getDescriptionSuggestions_ShouldReturnMatchingDescriptions() {
        // Given
        String query = "skåne";
        List<String> suggestions = Arrays.asList("Skånetrafiken", "Skåne Express");
        when(expenseRepository.findDistinctDescriptionsContainingIgnoreCase(query))
                .thenReturn(suggestions);

        // When
        List<String> result = expenseService.getDescriptionSuggestions(query);

        // Then
        assertNotNull(result);
        assertEquals(2, result.size());
        assertTrue(result.contains("Skånetrafiken"));
        assertTrue(result.contains("Skåne Express"));
        verify(expenseRepository, times(1)).findDistinctDescriptionsContainingIgnoreCase(query);
    }

    @Test
    void getDescriptionSuggestions_WithEmptyQuery_ShouldReturnEmptyList() {
        // When
        List<String> result = expenseService.getDescriptionSuggestions("");

        // Then
        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(expenseRepository, never()).findDistinctDescriptionsContainingIgnoreCase(anyString());
    }

    @Test
    void getDescriptionSuggestions_WithNullQuery_ShouldReturnEmptyList() {
        // When
        List<String> result = expenseService.getDescriptionSuggestions(null);

        // Then
        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(expenseRepository, never()).findDistinctDescriptionsContainingIgnoreCase(anyString());
    }

    @Test
    void getCategoryHint_WhenExpensesExist_ShouldReturnMostCommonCategory() {
        // Given
        String description = "Skånetrafiken";
        
        Expense expense1 = new Expense();
        expense1.setId(1L);
        expense1.setDescription("Skånetrafiken");
        expense1.setCategory("Transport");
        expense1.setAmount(new BigDecimal("50.00"));
        expense1.setExpenseDate(LocalDateTime.now());
        
        Expense expense2 = new Expense();
        expense2.setId(2L);
        expense2.setDescription("Skånetrafiken");
        expense2.setCategory("Transport");
        expense2.setAmount(new BigDecimal("50.00"));
        expense2.setExpenseDate(LocalDateTime.now());
        
        Expense expense3 = new Expense();
        expense3.setId(3L);
        expense3.setDescription("Skånetrafiken");
        expense3.setCategory("Food");
        expense3.setAmount(new BigDecimal("50.00"));
        expense3.setExpenseDate(LocalDateTime.now());
        
        List<Expense> expenses = Arrays.asList(expense1, expense2, expense3);
        when(expenseRepository.findByDescriptionIgnoreCase(description)).thenReturn(expenses);

        // When
        String result = expenseService.getCategoryHint(description);

        // Then
        assertNotNull(result);
        assertEquals("Transport", result); // Most common category
        verify(expenseRepository, times(1)).findByDescriptionIgnoreCase(description);
    }

    @Test
    void getCategoryHint_WhenNoExpensesExist_ShouldReturnNull() {
        // Given
        String description = "NonExistent";
        when(expenseRepository.findByDescriptionIgnoreCase(description)).thenReturn(List.of());

        // When
        String result = expenseService.getCategoryHint(description);

        // Then
        assertNull(result);
        verify(expenseRepository, times(1)).findByDescriptionIgnoreCase(description);
    }

    @Test
    void getCategoryHint_WhenExpensesHaveNoCategory_ShouldReturnNull() {
        // Given
        String description = "Skånetrafiken";
        
        Expense expense1 = new Expense();
        expense1.setId(1L);
        expense1.setDescription("Skånetrafiken");
        expense1.setCategory(null);
        expense1.setAmount(new BigDecimal("50.00"));
        expense1.setExpenseDate(LocalDateTime.now());
        
        List<Expense> expenses = Arrays.asList(expense1);
        when(expenseRepository.findByDescriptionIgnoreCase(description)).thenReturn(expenses);

        // When
        String result = expenseService.getCategoryHint(description);

        // Then
        assertNull(result);
        verify(expenseRepository, times(1)).findByDescriptionIgnoreCase(description);
    }

    @Test
    void getCategoryHint_WithEmptyDescription_ShouldReturnNull() {
        // When
        String result = expenseService.getCategoryHint("");

        // Then
        assertNull(result);
        verify(expenseRepository, never()).findByDescriptionIgnoreCase(anyString());
    }

    @Test
    void getCategoryHint_WithNullDescription_ShouldReturnNull() {
        // When
        String result = expenseService.getCategoryHint(null);

        // Then
        assertNull(result);
        verify(expenseRepository, never()).findByDescriptionIgnoreCase(anyString());
    }

    @Test
    void getExpensesByMonth_ShouldReturnListOfExpenseDtos() {
        // Given
        LocalDateTime expenseDate1 = LocalDateTime.of(2024, 1, 15, 10, 0);
        LocalDateTime expenseDate2 = LocalDateTime.of(2024, 1, 20, 14, 30);
        
        Expense expense1 = new Expense();
        expense1.setId(1L);
        expense1.setDescription("Food Expense 1");
        expense1.setAmount(new BigDecimal("50.00"));
        expense1.setExpenseDate(expenseDate1);
        expense1.setCategory("Food");
        
        Expense expense2 = new Expense();
        expense2.setId(2L);
        expense2.setDescription("Transport Expense");
        expense2.setAmount(new BigDecimal("100.00"));
        expense2.setExpenseDate(expenseDate2);
        expense2.setCategory("Transport");
        
        List<Expense> expenses = Arrays.asList(expense1, expense2);
        when(expenseRepository.findByExpenseDateBetween(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(expenses);

        // When
        List<ExpenseDto> result = expenseService.getExpensesByMonth(2024, 1);

        // Then
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("Food Expense 1", result.get(0).getDescription());
        assertEquals(new BigDecimal("50.00"), result.get(0).getAmount());
        assertEquals("Food", result.get(0).getCategory());
        assertEquals("Transport Expense", result.get(1).getDescription());
        assertEquals(new BigDecimal("100.00"), result.get(1).getAmount());
        assertEquals("Transport", result.get(1).getCategory());
        
        verify(expenseRepository, times(1)).findByExpenseDateBetween(any(LocalDateTime.class), any(LocalDateTime.class));
    }

    @Test
    void getExpensesByMonth_WithInvalidMonth_ShouldThrowException() {
        // When & Then
        assertThrows(IllegalArgumentException.class, () -> expenseService.getExpensesByMonth(2024, 13));
        assertThrows(IllegalArgumentException.class, () -> expenseService.getExpensesByMonth(2024, 0));
        verify(expenseRepository, never()).findByExpenseDateBetween(any(LocalDateTime.class), any(LocalDateTime.class));
    }

    @Test
    void getMultiCategoryTrend_WithMultipleCategories_ShouldReturnTrendDataForEachCategory() {
        // Given
        List<String> categories = Arrays.asList("Food", "Transport");
        LocalDateTime startDate = LocalDateTime.of(2024, 1, 1, 0, 0);
        LocalDateTime endDate = LocalDateTime.of(2024, 1, 31, 23, 59, 59);
        
        Expense foodExpense1 = new Expense();
        foodExpense1.setId(1L);
        foodExpense1.setDescription("Food Expense 1");
        foodExpense1.setAmount(new BigDecimal("50.00"));
        foodExpense1.setExpenseDate(LocalDateTime.of(2024, 1, 5, 10, 0));
        foodExpense1.setCategory("Food");
        
        Expense foodExpense2 = new Expense();
        foodExpense2.setId(2L);
        foodExpense2.setDescription("Food Expense 2");
        foodExpense2.setAmount(new BigDecimal("30.00"));
        foodExpense2.setExpenseDate(LocalDateTime.of(2024, 1, 5, 15, 0));
        foodExpense2.setCategory("Food");
        
        Expense transportExpense1 = new Expense();
        transportExpense1.setId(3L);
        transportExpense1.setDescription("Transport Expense 1");
        transportExpense1.setAmount(new BigDecimal("100.00"));
        transportExpense1.setExpenseDate(LocalDateTime.of(2024, 1, 10, 10, 0));
        transportExpense1.setCategory("Transport");
        
        List<Expense> expenses = Arrays.asList(foodExpense1, foodExpense2, transportExpense1);
        when(expenseRepository.findByCategoryInAndExpenseDateBetween(categories, startDate, endDate))
                .thenReturn(expenses);

        // When
        List<com.uhs.dto.MultiCategoryTrendDto> result = expenseService.getMultiCategoryTrend(categories, startDate, endDate);

        // Then
        assertNotNull(result);
        assertEquals(2, result.size()); // 1 for Food (grouped by date), 1 for Transport
        
        // Verify Food category data
        long foodCount = result.stream()
                .filter(t -> "Food".equals(t.getCategory()))
                .count();
        assertEquals(1, foodCount); // Grouped by date
        
        com.uhs.dto.MultiCategoryTrendDto foodTrend = result.stream()
                .filter(t -> "Food".equals(t.getCategory()) && LocalDate.of(2024, 1, 5).equals(t.getDate()))
                .findFirst()
                .orElse(null);
        assertNotNull(foodTrend);
        assertEquals(new BigDecimal("80.00"), foodTrend.getAmount());
        
        // Verify Transport category data
        com.uhs.dto.MultiCategoryTrendDto transportTrend = result.stream()
                .filter(t -> "Transport".equals(t.getCategory()) && LocalDate.of(2024, 1, 10).equals(t.getDate()))
                .findFirst()
                .orElse(null);
        assertNotNull(transportTrend);
        assertEquals(new BigDecimal("100.00"), transportTrend.getAmount());
        
        verify(expenseRepository, times(1)).findByCategoryInAndExpenseDateBetween(categories, startDate, endDate);
    }

    @Test
    void getMultiCategoryTrend_WithAllCategories_ShouldReturnTrendDataForAllCategories() {
        // Given
        LocalDateTime startDate = LocalDateTime.of(2024, 1, 1, 0, 0);
        LocalDateTime endDate = LocalDateTime.of(2024, 1, 31, 23, 59, 59);
        
        Expense foodExpense = new Expense();
        foodExpense.setId(1L);
        foodExpense.setDescription("Food Expense");
        foodExpense.setAmount(new BigDecimal("50.00"));
        foodExpense.setExpenseDate(LocalDateTime.of(2024, 1, 5, 10, 0));
        foodExpense.setCategory("Food");
        
        Expense transportExpense = new Expense();
        transportExpense.setId(2L);
        transportExpense.setDescription("Transport Expense");
        transportExpense.setAmount(new BigDecimal("100.00"));
        transportExpense.setExpenseDate(LocalDateTime.of(2024, 1, 10, 10, 0));
        transportExpense.setCategory("Transport");
        
        List<Expense> expenses = Arrays.asList(foodExpense, transportExpense);
        when(expenseRepository.findByExpenseDateBetween(startDate, endDate))
                .thenReturn(expenses);

        // When
        List<com.uhs.dto.MultiCategoryTrendDto> result = expenseService.getMultiCategoryTrend(null, startDate, endDate);

        // Then
        assertNotNull(result);
        assertEquals(2, result.size());
        
        verify(expenseRepository, times(1)).findByExpenseDateBetween(startDate, endDate);
        verify(expenseRepository, never()).findByCategoryInAndExpenseDateBetween(anyList(), any(LocalDateTime.class), any(LocalDateTime.class));
    }
}

