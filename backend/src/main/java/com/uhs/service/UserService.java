package com.uhs.service;

import com.uhs.dto.CreateUserRequestDto;
import com.uhs.dto.PasswordValidationResultDto;
import com.uhs.dto.UpdateUserRequestDto;
import com.uhs.model.User;
import com.uhs.model.UserRole;
import com.uhs.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Service for core user business logic.
 * Part of Phase 1B user management implementation.
 *
 * Handles user CRUD operations, password management, and default admin creation.
 */
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncodingService passwordEncodingService;
    private final TokenGenerationService tokenGenerationService;

    /**
     * Creates a new user with a first-time login token.
     * The user is created inactive and without a password set.
     * A random password is generated but not used until the user sets their own password.
     *
     * @param request the user creation request DTO
     * @return the created User entity
     * @throws RuntimeException if username already exists
     */
    @Transactional
    public User createUser(CreateUserRequestDto request) {
        // Check if username already exists (case-insensitive)
        if (userRepository.findByUsernameIgnoreCase(request.getUsername()).isPresent()) {
            throw new RuntimeException("Username already exists: " + request.getUsername());
        }

        // Create new user
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setRole(request.getRole() != null ? request.getRole() : UserRole.USER);
        user.setIsActive(false);
        user.setPasswordSet(false);
        user.setIsDefaultAdmin(false);

        // Generate and set a random password (placeholder until user sets their own)
        String randomPassword = UUID.randomUUID().toString();
        user.setPasswordHash(passwordEncodingService.encodePassword(randomPassword));

        // Save user
        User savedUser = userRepository.save(user);

        // Generate first-time login token (pass User entity directly to avoid extra DB read)
        tokenGenerationService.generateTokenForUser(savedUser);

        return savedUser;
    }

    /**
     * Gets a user by their ID.
     *
     * @param id the user ID
     * @return the User entity
     * @throws RuntimeException if user not found
     */
    @Transactional(readOnly = true)
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }

    /**
     * Gets a user by their username.
     *
     * @param username the username
     * @return the User entity
     * @throws RuntimeException if user not found
     */
    @Transactional(readOnly = true)
    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found with username: " + username));
    }

    /**
     * Gets all users.
     *
     * @return list of all User entities
     */
    @Transactional(readOnly = true)
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    /**
     * Updates an existing user.
     * Only updates non-null fields from the request.
     *
     * @param id the user ID
     * @param request the update request DTO
     * @return the updated User entity
     * @throws RuntimeException if user not found
     */
    @Transactional
    public User updateUser(Long id, UpdateUserRequestDto request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        // Update only non-null fields
        if (request.getEmail() != null) {
            user.setEmail(request.getEmail());
        }
        if (request.getRole() != null) {
            user.setRole(request.getRole());
        }
        if (request.getIsActive() != null) {
            user.setIsActive(request.getIsActive());
        }

        return userRepository.save(user);
    }

    /**
     * Deletes a user.
     * The default admin user cannot be deleted.
     *
     * @param id the user ID
     * @throws RuntimeException if user not found or is the default admin
     */
    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        // Prevent deletion of default admin
        if (user.getIsDefaultAdmin()) {
            throw new RuntimeException("Cannot delete the default admin user");
        }

        userRepository.delete(user);
    }

    /**
     * Sets a user's password after first-time login token validation.
     * Validates password complexity, encodes the password, and activates the user.
     *
     * @param userId the user ID
     * @param password the new password
     * @throws RuntimeException if user not found or password doesn't meet complexity requirements
     */
    @Transactional
    public void setUserPassword(Long userId, String password) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        // Validate password complexity
        PasswordValidationResultDto validationResult = passwordEncodingService.validatePasswordComplexity(password);
        if (!validationResult.isValid()) {
            throw new RuntimeException("Password does not meet complexity requirements: " +
                    String.join(", ", validationResult.getErrors()));
        }

        // Encode and set password
        String encodedPassword = passwordEncodingService.encodePassword(password);
        user.setPasswordHash(encodedPassword);
        user.setPasswordSet(true);
        user.setIsActive(true);

        userRepository.save(user);
    }

    /**
     * Creates the default admin user if it doesn't already exist.
     * Called on application startup.
     *
     * The default admin:
     * - username: "admin"
     * - role: ADMIN
     * - isDefaultAdmin: true
     * - isActive: false (until password is set)
     * - passwordSet: false
     */
    @Transactional
    public void createDefaultAdmin() {
        // Check if default admin already exists
        if (userRepository.findByIsDefaultAdmin(true).isPresent()) {
            return; // Default admin already exists
        }

        // Create default admin
        User admin = new User();
        admin.setUsername("admin");
        admin.setEmail(null); // No email for default admin
        admin.setRole(UserRole.ADMIN);
        admin.setIsDefaultAdmin(true);
        admin.setIsActive(false);
        admin.setPasswordSet(false);
        admin.setPasswordHash(null); // No password initially

        User savedAdmin = userRepository.save(admin);

        // Generate first-time login token
        tokenGenerationService.generateToken(savedAdmin.getId());
    }
}
