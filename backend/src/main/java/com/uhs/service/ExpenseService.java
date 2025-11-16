package com.uhs.service;

import com.uhs.dto.CategoryExpenseSummaryDto;
import com.uhs.dto.CategoryTrendDto;
import com.uhs.dto.ExpenseDto;
import com.uhs.dto.MultiCategoryTrendDto;
import com.uhs.model.Expense;
import com.uhs.repository.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;

    @Transactional(readOnly = true, propagation = Propagation.REQUIRES_NEW)
    public List<Expense> fetchAllExpenses() {
        // Fetch expenses in a separate transaction that closes immediately
        return expenseRepository.findAll();
    }
    
    public List<ExpenseDto> getAllExpenses() {
        // Fetch in separate transaction, then convert outside transaction to release connection
        List<Expense> expenses = fetchAllExpenses();
        return expenses.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true, propagation = Propagation.REQUIRES_NEW)
    public ExpenseDto getExpenseById(Long id) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Expense not found with id: " + id));
        return toDto(expense);
    }

    @Transactional
    public ExpenseDto createExpense(ExpenseDto expenseDto) {
        Expense expense = toEntity(expenseDto);
        Expense savedExpense = expenseRepository.save(expense);
        return toDto(savedExpense);
    }

    @Transactional
    public ExpenseDto updateExpense(Long id, ExpenseDto expenseDto) {
        Expense existingExpense = expenseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Expense not found with id: " + id));
        
        existingExpense.setDescription(expenseDto.getDescription());
        existingExpense.setAmount(expenseDto.getAmount());
        existingExpense.setExpenseDate(expenseDto.getExpenseDate());
        existingExpense.setCategory(expenseDto.getCategory());
        
        Expense updatedExpense = expenseRepository.save(existingExpense);
        return toDto(updatedExpense);
    }

    @Transactional
    public void deleteExpense(Long id) {
        if (!expenseRepository.existsById(id)) {
            throw new RuntimeException("Expense not found with id: " + id);
        }
        expenseRepository.deleteById(id);
    }

    private ExpenseDto toDto(Expense expense) {
        ExpenseDto dto = new ExpenseDto();
        dto.setId(expense.getId());
        dto.setDescription(expense.getDescription());
        dto.setAmount(expense.getAmount());
        dto.setExpenseDate(expense.getExpenseDate());
        dto.setCategory(expense.getCategory());
        return dto;
    }

    private Expense toEntity(ExpenseDto dto) {
        Expense expense = new Expense();
        expense.setDescription(dto.getDescription());
        expense.setAmount(dto.getAmount());
        expense.setExpenseDate(dto.getExpenseDate());
        expense.setCategory(dto.getCategory());
        return expense;
    }

    @Transactional(readOnly = true, propagation = Propagation.REQUIRES_NEW)
    public List<Expense> fetchExpensesByYearMonth(int year, int month) {
        // Validate month range
        if (month < 1 || month > 12) {
            throw new IllegalArgumentException("Month must be between 1 and 12");
        }
        
        LocalDateTime startOfMonth = LocalDateTime.of(year, month, 1, 0, 0);
        LocalDateTime endOfMonth = LocalDateTime.of(year, month, 
                startOfMonth.toLocalDate().lengthOfMonth(), 23, 59, 59);
        
        return expenseRepository.findByExpenseDateBetween(startOfMonth, endOfMonth);
    }
    
    public List<CategoryExpenseSummaryDto> getExpensesByYearMonth(int year, int month) {
        // Fetch in separate transaction, then process outside transaction to release connection
        List<Expense> expenses = fetchExpensesByYearMonth(year, month);
        
        Map<String, List<Expense>> groupedByCategory = expenses.stream()
                .collect(Collectors.groupingBy(
                        expense -> expense.getCategory() != null ? expense.getCategory() : "Uncategorized"
                ));
        
        return groupedByCategory.entrySet().stream()
                .map(entry -> {
                    String category = entry.getKey();
                    List<Expense> categoryExpenses = entry.getValue();
                    BigDecimal totalAmount = categoryExpenses.stream()
                            .map(Expense::getAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    Long count = (long) categoryExpenses.size();
                    
                    return new CategoryExpenseSummaryDto(category, totalAmount, count);
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true, propagation = Propagation.REQUIRES_NEW)
    public List<Expense> fetchCategoryTrendExpenses(String category, LocalDateTime startDate, LocalDateTime endDate) {
        return expenseRepository.findByCategoryAndExpenseDateBetween(category, startDate, endDate);
    }
    
    public List<CategoryTrendDto> getCategoryTrend(String category, LocalDateTime startDate, LocalDateTime endDate) {
        // Fetch in separate transaction, then process outside transaction to release connection
        List<Expense> expenses = fetchCategoryTrendExpenses(category, startDate, endDate);
        
        Map<LocalDate, List<Expense>> groupedByDate = expenses.stream()
                .collect(Collectors.groupingBy(
                        expense -> expense.getExpenseDate().toLocalDate()
                ));
        
        return groupedByDate.entrySet().stream()
                .map(entry -> {
                    LocalDate date = entry.getKey();
                    BigDecimal totalAmount = entry.getValue().stream()
                            .map(Expense::getAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    
                    return new CategoryTrendDto(date, totalAmount);
                })
                .sorted((a, b) -> a.getDate().compareTo(b.getDate()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true, propagation = Propagation.REQUIRES_NEW)
    public List<String> fetchDescriptionSuggestions(String query) {
        if (query == null || query.trim().isEmpty()) {
            return List.of();
        }
        return expenseRepository.findDistinctDescriptionsContainingIgnoreCase(query.trim());
    }

    public List<String> getDescriptionSuggestions(String query) {
        // Fetch in separate transaction, then return outside transaction to release connection
        return fetchDescriptionSuggestions(query);
    }

    @Transactional(readOnly = true, propagation = Propagation.REQUIRES_NEW)
    public List<Expense> fetchExpensesByDescription(String description) {
        if (description == null || description.trim().isEmpty()) {
            return List.of();
        }
        return expenseRepository.findByDescriptionIgnoreCase(description.trim());
    }

    public String getCategoryHint(String description) {
        // Fetch in separate transaction, then process outside transaction to release connection
        List<Expense> expenses = fetchExpensesByDescription(description);
        
        if (expenses.isEmpty()) {
            return null;
        }
        
        // Count categories and find the most common one
        Map<String, Long> categoryCounts = expenses.stream()
                .filter(expense -> expense.getCategory() != null && !expense.getCategory().trim().isEmpty())
                .collect(Collectors.groupingBy(
                        Expense::getCategory,
                        Collectors.counting()
                ));
        
        if (categoryCounts.isEmpty()) {
            return null;
        }
        
        // Return the category with the highest count
        return categoryCounts.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);
    }

    public List<ExpenseDto> getExpensesByMonth(int year, int month) {
        // Fetch in separate transaction, then convert outside transaction to release connection
        List<Expense> expenses = fetchExpensesByYearMonth(year, month);
        return expenses.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true, propagation = Propagation.REQUIRES_NEW)
    public List<Expense> fetchMultiCategoryTrendExpenses(List<String> categories, LocalDateTime startDate, LocalDateTime endDate) {
        if (categories == null || categories.isEmpty()) {
            // Fetch all categories
            return expenseRepository.findByExpenseDateBetween(startDate, endDate);
        } else {
            // Fetch specific categories
            return expenseRepository.findByCategoryInAndExpenseDateBetween(categories, startDate, endDate);
        }
    }

    public List<MultiCategoryTrendDto> getMultiCategoryTrend(List<String> categories, LocalDateTime startDate, LocalDateTime endDate) {
        // Fetch in separate transaction, then process outside transaction to release connection
        List<Expense> expenses = fetchMultiCategoryTrendExpenses(categories, startDate, endDate);
        
        // Group by category and date
        Map<String, Map<LocalDate, List<Expense>>> groupedByCategoryAndDate = expenses.stream()
                .collect(Collectors.groupingBy(
                        expense -> expense.getCategory() != null ? expense.getCategory() : "Uncategorized",
                        Collectors.groupingBy(
                                expense -> expense.getExpenseDate().toLocalDate()
                        )
                ));
        
        // Flatten to list of MultiCategoryTrendDto
        return groupedByCategoryAndDate.entrySet().stream()
                .flatMap(categoryEntry -> {
                    String category = categoryEntry.getKey();
                    Map<LocalDate, List<Expense>> dateMap = categoryEntry.getValue();
                    return dateMap.entrySet().stream()
                            .map(dateEntry -> {
                                LocalDate date = dateEntry.getKey();
                                BigDecimal totalAmount = dateEntry.getValue().stream()
                                        .map(Expense::getAmount)
                                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                                return new MultiCategoryTrendDto(category, date, totalAmount);
                            });
                })
                .sorted((a, b) -> {
                    int categoryCompare = a.getCategory().compareTo(b.getCategory());
                    if (categoryCompare != 0) {
                        return categoryCompare;
                    }
                    return a.getDate().compareTo(b.getDate());
                })
                .collect(Collectors.toList());
    }
}

