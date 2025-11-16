package com.uhs.repository;

import com.uhs.model.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findByCategory(String category);
    List<Expense> findByExpenseDateBetween(LocalDateTime start, LocalDateTime end);
    List<Expense> findByCategoryAndExpenseDateBetween(String category, LocalDateTime start, LocalDateTime end);
}

