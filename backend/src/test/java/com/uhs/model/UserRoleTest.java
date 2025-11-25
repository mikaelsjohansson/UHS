package com.uhs.model;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for UserRole enum - Phase 1A of user management system.
 */
class UserRoleTest {

    @Test
    void testUserRoleValues_ShouldContainUserAndAdmin() {
        // When
        UserRole[] roles = UserRole.values();

        // Then
        assertEquals(2, roles.length, "UserRole should have exactly 2 values");
        assertNotNull(UserRole.valueOf("USER"));
        assertNotNull(UserRole.valueOf("ADMIN"));
    }

    @Test
    void testUserRole_USER_ShouldExist() {
        // When
        UserRole role = UserRole.USER;

        // Then
        assertEquals("USER", role.name());
    }

    @Test
    void testUserRole_ADMIN_ShouldExist() {
        // When
        UserRole role = UserRole.ADMIN;

        // Then
        assertEquals("ADMIN", role.name());
    }

    @Test
    void testUserRole_InvalidValue_ShouldThrowException() {
        // When & Then
        assertThrows(IllegalArgumentException.class, () -> UserRole.valueOf("INVALID"));
    }

    @Test
    void testUserRole_Ordinal_UserShouldBeZero() {
        // When
        int ordinal = UserRole.USER.ordinal();

        // Then
        assertEquals(0, ordinal, "USER should be first (ordinal 0)");
    }

    @Test
    void testUserRole_Ordinal_AdminShouldBeOne() {
        // When
        int ordinal = UserRole.ADMIN.ordinal();

        // Then
        assertEquals(1, ordinal, "ADMIN should be second (ordinal 1)");
    }
}
