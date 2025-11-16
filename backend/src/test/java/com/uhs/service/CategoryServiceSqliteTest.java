package com.uhs.service;

import com.uhs.dto.CategoryDto;
import com.uhs.repository.CategoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration test to verify category operations work with SQLite.
 * This test simulates the real-world scenario where getAllCategories() is called
 * followed by createCategory(), which was causing SQLITE_BUSY_SNAPSHOT errors.
 */
@SpringBootTest
@ActiveProfiles("test")
class CategoryServiceSqliteTest {

    @Autowired
    private CategoryService categoryService;

    @Autowired
    private CategoryRepository categoryRepository;

    @BeforeEach
    @Transactional
    void setUp() {
        categoryRepository.deleteAll();
    }

    @Test
    void getAllCategories_ThenCreateCategory_ShouldNotCauseBusySnapshot() {
        // Given - Simulate the UI scenario: first load categories, then create a new one
        // This is the exact sequence that was causing SQLITE_BUSY_SNAPSHOT errors
        
        // Step 1: Load all categories (simulates UI loading the categories page)
        List<CategoryDto> initialCategories = categoryService.getAllCategories();
        assertNotNull(initialCategories, "Initial categories list should not be null");
        
        // Step 2: Immediately create a new category (simulates user clicking "Add Category")
        // This should not cause BUSY_SNAPSHOT error if the read transaction was properly closed
        CategoryDto newCategory = new CategoryDto();
        newCategory.setName("Test Category");
        newCategory.setDescription("Test category description");
        
        CategoryDto created = categoryService.createCategory(newCategory);
        
        // Then - Verify the category was created successfully
        assertNotNull(created, "Created category should not be null");
        assertNotNull(created.getId(), "Created category should have an ID generated");
        assertEquals("Test Category", created.getName());
        assertEquals("Test category description", created.getDescription());
        
        // Verify it appears in the list
        List<CategoryDto> allCategories = categoryService.getAllCategories();
        assertEquals(1, allCategories.size(), 
                "Should have one category after creation");
        assertEquals("Test Category", allCategories.get(0).getName());
    }

    @Test
    void createCategory_WithSqlite_ShouldPersistAndReturnId() {
        // Given
        CategoryDto categoryDto = new CategoryDto();
        categoryDto.setName("Food Category");
        categoryDto.setDescription("Food and dining expenses");

        // When - Create category
        CategoryDto created = categoryService.createCategory(categoryDto);

        // Then - Verify it was created with an ID
        assertNotNull(created, "Created category should not be null");
        assertNotNull(created.getId(), "Created category should have an ID generated");
        assertEquals("Food Category", created.getName());
        assertEquals("Food and dining expenses", created.getDescription());

        // Verify it can be retrieved from database
        CategoryDto retrieved = categoryService.getCategoryById(created.getId());
        assertNotNull(retrieved);
        assertEquals(created.getId(), retrieved.getId());
        assertEquals("Food Category", retrieved.getName());
        assertEquals("Food and dining expenses", retrieved.getDescription());
    }

    @Test
    void createMultipleCategories_WithSqlite_ShouldGenerateUniqueIds() {
        // Given
        CategoryDto category1 = new CategoryDto();
        category1.setName("Food");
        category1.setDescription("Food expenses");

        CategoryDto category2 = new CategoryDto();
        category2.setName("Transport");
        category2.setDescription("Transportation expenses");

        // When - Create multiple categories
        CategoryDto created1 = categoryService.createCategory(category1);
        CategoryDto created2 = categoryService.createCategory(category2);

        // Then - Verify both have unique IDs
        assertNotNull(created1.getId());
        assertNotNull(created2.getId());
        assertNotEquals(created1.getId(), created2.getId(), 
                "Each category should have a unique ID");

        // Verify both are persisted
        List<CategoryDto> allCategories = categoryService.getAllCategories();
        assertEquals(2, allCategories.size(), 
                "Both categories should be persisted");
    }

    @Test
    void getAllCategories_ThenCreateCategory_ThenGetAllCategories_ShouldWork() {
        // Given - Simulate the full UI flow: load -> create -> reload
        List<CategoryDto> before = categoryService.getAllCategories();
        assertEquals(0, before.size(), "Should start with no categories");
        
        // When - Create a category
        CategoryDto newCategory = new CategoryDto();
        newCategory.setName("New Category");
        newCategory.setDescription("New category description");
        CategoryDto created = categoryService.createCategory(newCategory);
        
        // Then - Reload and verify
        List<CategoryDto> after = categoryService.getAllCategories();
        assertEquals(1, after.size(), "Should have one category after creation");
        assertEquals("New Category", after.get(0).getName());
        assertEquals("New category description", after.get(0).getDescription());
        assertEquals(created.getId(), after.get(0).getId());
    }
}

