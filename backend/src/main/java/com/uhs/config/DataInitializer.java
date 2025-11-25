package com.uhs.config;

import com.uhs.dto.CategoryDto;
import com.uhs.model.User;
import com.uhs.model.UserRole;
import com.uhs.repository.UserRepository;
import com.uhs.service.CategoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

/**
 * Initializes the database with default data on application startup.
 * Part of Phase 1E security configuration implementation.
 *
 * Creates:
 * - Default categories if none exist
 * - Default admin user if none exists
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final CategoryService categoryService;
    private final UserRepository userRepository;

    private static final List<String> DEFAULT_CATEGORIES = Arrays.asList(
            "Food",
            "Transport",
            "Shopping",
            "Bills",
            "Entertainment",
            "Other"
    );

    private static final String DEFAULT_ADMIN_USERNAME = "admin";
    private static final String DEFAULT_ADMIN_EMAIL = "admin@uhs.local";

    @Override
    public void run(String... args) {
        initializeCategories();
        initializeDefaultAdmin();
    }

    /**
     * Initialize default categories if none exist.
     */
    private void initializeCategories() {
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
            log.debug("Database already contains {} categories. Skipping category initialization.", existingCategories.size());
        }
    }

    /**
     * Initialize default admin user if none exists.
     * The default admin:
     * - username: "admin"
     * - email: "admin@uhs.local"
     * - role: ADMIN
     * - isDefaultAdmin: true
     * - isActive: false (until password is set via /api/auth/setup-admin)
     * - passwordSet: false
     */
    private void initializeDefaultAdmin() {
        // Check if default admin already exists
        Optional<User> existingAdmin = userRepository.findByUsernameIgnoreCase(DEFAULT_ADMIN_USERNAME);

        if (existingAdmin.isEmpty()) {
            log.info("No admin user found. Creating default admin user...");

            User admin = new User();
            admin.setUsername(DEFAULT_ADMIN_USERNAME);
            admin.setEmail(DEFAULT_ADMIN_EMAIL);
            admin.setRole(UserRole.ADMIN);
            admin.setIsDefaultAdmin(true);
            admin.setIsActive(false);
            admin.setPasswordSet(false);
            admin.setPasswordHash(null); // No password initially - must be set via /api/auth/setup-admin
            admin.setCreatedAt(LocalDateTime.now());
            admin.setUpdatedAt(LocalDateTime.now());

            userRepository.save(admin);

            log.info("Default admin user '{}' created successfully. Use /api/auth/setup-admin to set password.", DEFAULT_ADMIN_USERNAME);
        } else {
            log.debug("Admin user already exists. Skipping admin initialization.");
        }
    }
}
