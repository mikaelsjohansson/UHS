package com.uhs.controller;

import com.uhs.dto.CategoryExpenseSummaryDto;
import com.uhs.dto.CategoryTrendDto;
import com.uhs.dto.ExpenseDto;
import com.uhs.dto.MultiCategoryTrendDto;
import com.uhs.service.ExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class ExpenseController {

    private final ExpenseService expenseService;

    @GetMapping
    public ResponseEntity<List<ExpenseDto>> getAllExpenses() {
        List<ExpenseDto> expenses = expenseService.getAllExpenses();
        return ResponseEntity.ok(expenses);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExpenseDto> getExpenseById(@PathVariable Long id) {
        ExpenseDto expense = expenseService.getExpenseById(id);
        return ResponseEntity.ok(expense);
    }

    @PostMapping
    public ResponseEntity<ExpenseDto> createExpense(@Valid @RequestBody ExpenseDto expenseDto) {
        ExpenseDto createdExpense = expenseService.createExpense(expenseDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdExpense);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ExpenseDto> updateExpense(
            @PathVariable Long id,
            @Valid @RequestBody ExpenseDto expenseDto) {
        ExpenseDto updatedExpense = expenseService.updateExpense(id, expenseDto);
        return ResponseEntity.ok(updatedExpense);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExpense(@PathVariable Long id) {
        expenseService.deleteExpense(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/analytics")
    public ResponseEntity<List<CategoryExpenseSummaryDto>> getExpensesByYearMonth(
            @RequestParam("year") int year,
            @RequestParam("month") int month) {
        List<CategoryExpenseSummaryDto> summaries = expenseService.getExpensesByYearMonth(year, month);
        return ResponseEntity.ok(summaries);
    }

    @GetMapping("/analytics/category/{category}")
    public ResponseEntity<List<CategoryTrendDto>> getCategoryTrend(
            @PathVariable String category,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        List<CategoryTrendDto> trends = expenseService.getCategoryTrend(category, startDate, endDate);
        return ResponseEntity.ok(trends);
    }

    @GetMapping("/analytics/categories/trend")
    public ResponseEntity<List<MultiCategoryTrendDto>> getMultiCategoryTrend(
            @RequestParam(required = false) List<String> categories,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        List<MultiCategoryTrendDto> trends = expenseService.getMultiCategoryTrend(categories, startDate, endDate);
        return ResponseEntity.ok(trends);
    }

    @GetMapping("/suggestions")
    public ResponseEntity<List<String>> getDescriptionSuggestions(@RequestParam("query") String query) {
        List<String> suggestions = expenseService.getDescriptionSuggestions(query);
        return ResponseEntity.ok(suggestions);
    }

    @GetMapping("/category-hint")
    public ResponseEntity<String> getCategoryHint(@RequestParam("description") String description) {
        String categoryHint = expenseService.getCategoryHint(description);
        if (categoryHint == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(categoryHint);
    }

    @GetMapping("/month")
    public ResponseEntity<List<ExpenseDto>> getExpensesByMonth(
            @RequestParam("year") int year,
            @RequestParam("month") int month) {
        List<ExpenseDto> expenses = expenseService.getExpensesByMonth(year, month);
        return ResponseEntity.ok(expenses);
    }
}

