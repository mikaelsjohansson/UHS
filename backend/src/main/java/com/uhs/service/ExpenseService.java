package com.uhs.service;

import com.uhs.dto.CategoryExpenseSummaryDto;
import com.uhs.dto.CategoryTrendDto;
import com.uhs.dto.ExpenseDto;
import com.uhs.model.Expense;
import com.uhs.repository.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
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

    @Transactional(readOnly = true)
    public List<ExpenseDto> getAllExpenses() {
        return expenseRepository.findAll()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
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

    @Transactional(readOnly = true)
    public List<CategoryExpenseSummaryDto> getExpensesByYearMonth(int year, int month) {
        // Validate month range
        if (month < 1 || month > 12) {
            throw new IllegalArgumentException("Month must be between 1 and 12");
        }
        
        LocalDateTime startOfMonth = LocalDateTime.of(year, month, 1, 0, 0);
        LocalDateTime endOfMonth = LocalDateTime.of(year, month, 
                startOfMonth.toLocalDate().lengthOfMonth(), 23, 59, 59);
        
        List<Expense> expenses = expenseRepository.findByExpenseDateBetween(startOfMonth, endOfMonth);
        
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

    @Transactional(readOnly = true)
    public List<CategoryTrendDto> getCategoryTrend(String category, LocalDateTime startDate, LocalDateTime endDate) {
        List<Expense> expenses = expenseRepository.findByCategoryAndExpenseDateBetween(category, startDate, endDate);
        
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
}

