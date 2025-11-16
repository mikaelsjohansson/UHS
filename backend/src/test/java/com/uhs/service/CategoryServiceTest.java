package com.uhs.service;

import com.uhs.dto.CategoryDto;
import com.uhs.model.Category;
import com.uhs.repository.CategoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private CategoryService categoryService;

    private Category testCategory;
    private CategoryDto testCategoryDto;

    @BeforeEach
    void setUp() {
        testCategory = new Category();
        testCategory.setId(1L);
        testCategory.setName("Food");
        testCategory.setDescription("Food and dining expenses");
        testCategory.setCreatedAt(LocalDateTime.now());

        testCategoryDto = new CategoryDto();
        testCategoryDto.setName("Food");
        testCategoryDto.setDescription("Food and dining expenses");
    }

    @Test
    void getAllCategories_ShouldReturnListOfCategories() {
        // Given
        List<Category> categories = Arrays.asList(testCategory);
        when(categoryRepository.findAll()).thenReturn(categories);

        // When
        List<CategoryDto> result = categoryService.getAllCategories();

        // Then
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Food", result.get(0).getName());
        assertEquals("Food and dining expenses", result.get(0).getDescription());
        verify(categoryRepository, times(1)).findAll();
    }

    @Test
    void getCategoryById_WhenCategoryExists_ShouldReturnCategory() {
        // Given
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(testCategory));

        // When
        CategoryDto result = categoryService.getCategoryById(1L);

        // Then
        assertNotNull(result);
        assertEquals("Food", result.getName());
        assertEquals("Food and dining expenses", result.getDescription());
        verify(categoryRepository, times(1)).findById(1L);
    }

    @Test
    void getCategoryById_WhenCategoryDoesNotExist_ShouldThrowException() {
        // Given
        when(categoryRepository.findById(1L)).thenReturn(Optional.empty());

        // When & Then
        assertThrows(RuntimeException.class, () -> categoryService.getCategoryById(1L));
        verify(categoryRepository, times(1)).findById(1L);
    }

    @Test
    void createCategory_ShouldSaveAndReturnCategory() {
        // Given
        when(categoryRepository.save(any(Category.class))).thenReturn(testCategory);

        // When
        CategoryDto result = categoryService.createCategory(testCategoryDto);

        // Then
        assertNotNull(result);
        assertEquals("Food", result.getName());
        assertEquals("Food and dining expenses", result.getDescription());
        verify(categoryRepository, times(1)).save(any(Category.class));
    }

    @Test
    void createCategory_WhenNameAlreadyExists_ShouldThrowException() {
        // Given - Simulate DataIntegrityViolationException when trying to save duplicate name
        when(categoryRepository.save(any(Category.class)))
                .thenThrow(new org.springframework.dao.DataIntegrityViolationException("Unique constraint violation"));

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, 
                () -> categoryService.createCategory(testCategoryDto));
        assertEquals("Category with name 'Food' already exists", exception.getMessage());
        verify(categoryRepository, times(1)).save(any(Category.class));
    }

    @Test
    void updateCategory_WhenCategoryExists_ShouldUpdateAndReturnCategory() {
        // Given
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(testCategory));
        when(categoryRepository.save(any(Category.class))).thenReturn(testCategory);

        testCategoryDto.setName("Updated Food");
        testCategoryDto.setDescription("Updated description");

        // When
        CategoryDto result = categoryService.updateCategory(1L, testCategoryDto);

        // Then
        assertNotNull(result);
        assertEquals("Updated Food", result.getName());
        assertEquals("Updated description", result.getDescription());
        verify(categoryRepository, times(1)).findById(1L);
        verify(categoryRepository, times(1)).save(any(Category.class));
    }

    @Test
    void updateCategory_WhenCategoryDoesNotExist_ShouldThrowException() {
        // Given
        when(categoryRepository.findById(1L)).thenReturn(Optional.empty());

        // When & Then
        assertThrows(RuntimeException.class, () -> categoryService.updateCategory(1L, testCategoryDto));
        verify(categoryRepository, times(1)).findById(1L);
        verify(categoryRepository, never()).save(any(Category.class));
    }

    @Test
    void updateCategory_WhenNameAlreadyExistsForDifferentCategory_ShouldThrowException() {
        // Given - Simulate DataIntegrityViolationException when trying to save duplicate name
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(testCategory));
        when(categoryRepository.save(any(Category.class)))
                .thenThrow(new org.springframework.dao.DataIntegrityViolationException("Unique constraint violation"));

        testCategoryDto.setName("Existing Category");

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, 
                () -> categoryService.updateCategory(1L, testCategoryDto));
        assertEquals("Category with name 'Existing Category' already exists", exception.getMessage());
        verify(categoryRepository, times(1)).findById(1L);
        verify(categoryRepository, times(1)).save(any(Category.class));
    }

    @Test
    void deleteCategory_WhenCategoryExists_ShouldDeleteCategory() {
        // Given
        when(categoryRepository.existsById(1L)).thenReturn(true);

        // When
        categoryService.deleteCategory(1L);

        // Then
        verify(categoryRepository, times(1)).existsById(1L);
        verify(categoryRepository, times(1)).deleteById(1L);
    }

    @Test
    void deleteCategory_WhenCategoryDoesNotExist_ShouldThrowException() {
        // Given
        when(categoryRepository.existsById(1L)).thenReturn(false);

        // When & Then
        assertThrows(RuntimeException.class, () -> categoryService.deleteCategory(1L));
        verify(categoryRepository, times(1)).existsById(1L);
        verify(categoryRepository, never()).deleteById(anyLong());
    }
}

