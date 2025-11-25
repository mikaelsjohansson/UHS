package com.uhs.repository;

import com.uhs.model.User;
import com.uhs.model.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for User entity - Phase 1A of user management system.
 * Provides data access methods for user management operations.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Find a user by their unique username.
     * @param username the username to search for
     * @return Optional containing the user if found
     */
    Optional<User> findByUsername(String username);

    /**
     * Find a user by their email address.
     * @param email the email to search for
     * @return Optional containing the user if found
     */
    Optional<User> findByEmail(String email);

    /**
     * Check if a user exists with the given username.
     * @param username the username to check
     * @return true if a user exists with this username
     */
    boolean existsByUsername(String username);

    /**
     * Check if a user exists with the given email.
     * @param email the email to check
     * @return true if a user exists with this email
     */
    boolean existsByEmail(String email);

    /**
     * Find all users with a specific role.
     * @param role the role to filter by
     * @return list of users with the specified role
     */
    List<User> findByRole(UserRole role);

    /**
     * Find all active users.
     * @param isActive the active status to filter by
     * @return list of users matching the active status
     */
    List<User> findByIsActive(Boolean isActive);

    /**
     * Find the default admin user (if exists).
     * @param isDefaultAdmin true to find default admin
     * @return Optional containing the default admin user if found
     */
    Optional<User> findByIsDefaultAdmin(Boolean isDefaultAdmin);

    /**
     * Find a user by username, ignoring case.
     * @param username the username to search for
     * @return Optional containing the user if found
     */
    @Query("SELECT u FROM User u WHERE LOWER(u.username) = LOWER(:username)")
    Optional<User> findByUsernameIgnoreCase(@Param("username") String username);
}
