package com.uhs.repository;

import com.uhs.model.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findByCategory(String category);
    List<Expense> findByExpenseDateBetween(LocalDateTime start, LocalDateTime end);
    List<Expense> findByCategoryAndExpenseDateBetween(String category, LocalDateTime start, LocalDateTime end);
    
    @Query("SELECT DISTINCT e.description FROM Expense e WHERE LOWER(e.description) LIKE LOWER(CONCAT('%', :query, '%')) ORDER BY e.description")
    List<String> findDistinctDescriptionsContainingIgnoreCase(@Param("query") String query);
    
    List<Expense> findByDescriptionIgnoreCase(String description);
    
    @Query("SELECT e FROM Expense e WHERE e.category IS NULL OR e.category = ''")
    List<Expense> findExpensesWithoutCategory();
}

