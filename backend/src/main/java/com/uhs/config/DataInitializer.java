package com.uhs.config;

import com.uhs.dto.CategoryDto;
import com.uhs.service.CategoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

/**
 * Initializes the database with default categories if none exist.
 * Only runs in non-test profiles to avoid interfering with tests.
 */
@Component
@Profile("!test")
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final CategoryService categoryService;

    private static final List<String> DEFAULT_CATEGORIES = Arrays.asList(
            "Food",
            "Transport",
            "Shopping",
            "Bills",
            "Entertainment",
            "Other"
    );

    @Override
    public void run(String... args) {
        // Check if database already has categories
        List<CategoryDto> existingCategories = categoryService.getAllCategories();
        
        if (existingCategories.isEmpty()) {
            log.info("No categories found. Initializing database with default categories...");
            
            for (String categoryName : DEFAULT_CATEGORIES) {
                try {
                    CategoryDto categoryDto = new CategoryDto();
                    categoryDto.setName(categoryName);
                    categoryService.createCategory(categoryDto);
                    log.debug("Created default category: {}", categoryName);
                } catch (Exception e) {
                    // Ignore if category already exists (shouldn't happen on first run)
                    log.warn("Could not create category '{}': {}", categoryName, e.getMessage());
                }
            }
            
            log.info("Database initialized with {} default categories", DEFAULT_CATEGORIES.size());
        } else {
            log.debug("Database already contains {} categories. Skipping initialization.", existingCategories.size());
        }
    }
}

