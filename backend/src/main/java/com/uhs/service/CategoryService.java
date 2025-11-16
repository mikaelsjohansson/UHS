package com.uhs.service;

import com.uhs.dto.CategoryDto;
import com.uhs.model.Category;
import com.uhs.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public List<CategoryDto> getAllCategories() {
        List<Category> categories = categoryRepository.findAll();
        return categories.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CategoryDto getCategoryById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));
        return toDto(category);
    }
    
    @Transactional
    public CategoryDto createCategory(CategoryDto categoryDto) {
        try {
            Category category = toEntity(categoryDto);
            Category savedCategory = categoryRepository.save(category);
            return toDto(savedCategory);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            // Handle unique constraint violation (category name already exists)
            throw new RuntimeException("Category with name '" + categoryDto.getName() + "' already exists", e);
        }
    }

    @Transactional
    public CategoryDto updateCategory(Long id, CategoryDto categoryDto) {
        Category existingCategory = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));
        
        existingCategory.setName(categoryDto.getName());
        existingCategory.setDescription(categoryDto.getDescription());
        
        try {
            Category updatedCategory = categoryRepository.save(existingCategory);
            return toDto(updatedCategory);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            // Handle unique constraint violation (category name already exists)
            throw new RuntimeException("Category with name '" + categoryDto.getName() + "' already exists", e);
        }
    }

    @Transactional
    public void deleteCategory(Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new RuntimeException("Category not found with id: " + id);
        }
        categoryRepository.deleteById(id);
    }

    private CategoryDto toDto(Category category) {
        CategoryDto dto = new CategoryDto();
        dto.setId(category.getId());
        dto.setName(category.getName());
        dto.setDescription(category.getDescription());
        return dto;
    }

    private Category toEntity(CategoryDto dto) {
        Category category = new Category();
        category.setName(dto.getName());
        category.setDescription(dto.getDescription());
        return category;
    }
}

