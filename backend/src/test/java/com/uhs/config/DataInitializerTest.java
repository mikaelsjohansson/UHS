package com.uhs.config;

import com.uhs.model.User;
import com.uhs.model.UserRole;
import com.uhs.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests for DataInitializer - default admin creation.
 * Part of Phase 1E security configuration implementation.
 * Tests that default admin user is created on application startup.
 */
@SpringBootTest
@ActiveProfiles("test")
class DataInitializerTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DataInitializer dataInitializer;

    @BeforeEach
    void setUp() {
        // Clean up users before each test
        userRepository.deleteAll();
    }

    @AfterEach
    void tearDown() {
        // Clean up after tests
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("init should create default admin user when no admin exists")
    void init_ShouldCreateDefaultAdminUser_WhenNoAdminExists() throws Exception {
        // Given - no users exist
        assertEquals(0, userRepository.count());

        // When - run initializer
        dataInitializer.run();

        // Then - default admin should be created
        Optional<User> adminOpt = userRepository.findByIsDefaultAdmin(true);
        assertTrue(adminOpt.isPresent(), "Default admin should be created");

        User admin = adminOpt.get();
        assertEquals("admin", admin.getUsername());
        assertEquals(UserRole.ADMIN, admin.getRole());
        assertTrue(admin.getIsDefaultAdmin());
        assertFalse(admin.getIsActive(), "Admin should be inactive until password is set");
        assertFalse(admin.getPasswordSet(), "Password should not be set initially");
    }

    @Test
    @DisplayName("init should not create duplicate admin if one already exists")
    void init_ShouldNotCreateDuplicateAdmin_WhenAdminAlreadyExists() throws Exception {
        // Given - create existing default admin
        User existingAdmin = new User();
        existingAdmin.setUsername("admin");
        existingAdmin.setRole(UserRole.ADMIN);
        existingAdmin.setIsDefaultAdmin(true);
        existingAdmin.setIsActive(true);
        existingAdmin.setPasswordSet(true);
        existingAdmin.setPasswordHash("existing-hash");
        userRepository.save(existingAdmin);

        long initialCount = userRepository.count();

        // When - run initializer again
        dataInitializer.run();

        // Then - no new admin should be created
        assertEquals(initialCount, userRepository.count(), "Should not create duplicate admin");

        // Verify existing admin is unchanged
        Optional<User> adminOpt = userRepository.findByIsDefaultAdmin(true);
        assertTrue(adminOpt.isPresent());
        User admin = adminOpt.get();
        assertEquals("existing-hash", admin.getPasswordHash(), "Existing admin should not be modified");
        assertTrue(admin.getIsActive(), "Existing admin's active status should not change");
    }

    @Test
    @DisplayName("init should set correct default admin properties")
    void init_ShouldSetCorrectDefaultAdminProperties() throws Exception {
        // When
        dataInitializer.run();

        // Then
        Optional<User> adminOpt = userRepository.findByUsernameIgnoreCase("admin");
        assertTrue(adminOpt.isPresent());

        User admin = adminOpt.get();
        assertEquals("admin", admin.getUsername());
        assertEquals("admin@uhs.local", admin.getEmail());
        assertEquals(UserRole.ADMIN, admin.getRole());
        assertTrue(admin.getIsDefaultAdmin());
        assertFalse(admin.getIsActive());
        assertFalse(admin.getPasswordSet());
        assertNotNull(admin.getCreatedAt());
        assertNotNull(admin.getUpdatedAt());
    }

    @Test
    @DisplayName("init should still work when non-default-admin users exist")
    void init_ShouldStillWork_WhenNonDefaultAdminUsersExist() throws Exception {
        // Given - create a regular user
        User regularUser = new User();
        regularUser.setUsername("regularuser");
        regularUser.setRole(UserRole.USER);
        regularUser.setIsDefaultAdmin(false);
        regularUser.setIsActive(true);
        regularUser.setPasswordSet(true);
        userRepository.save(regularUser);

        // When
        dataInitializer.run();

        // Then - default admin should be created
        Optional<User> adminOpt = userRepository.findByIsDefaultAdmin(true);
        assertTrue(adminOpt.isPresent(), "Default admin should be created even when regular users exist");

        // Regular user should still exist
        Optional<User> regularUserOpt = userRepository.findByUsername("regularuser");
        assertTrue(regularUserOpt.isPresent(), "Regular user should not be affected");
    }

    @Test
    @DisplayName("init should handle multiple calls gracefully (idempotent)")
    void init_ShouldBeIdempotent() throws Exception {
        // When - run initializer multiple times
        dataInitializer.run();
        dataInitializer.run();
        dataInitializer.run();

        // Then - only one default admin should exist
        long adminCount = userRepository.findAll().stream()
                .filter(User::getIsDefaultAdmin)
                .count();
        assertEquals(1, adminCount, "Should only have one default admin");
    }
}
