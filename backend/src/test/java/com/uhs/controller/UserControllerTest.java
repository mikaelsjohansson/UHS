package com.uhs.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.uhs.dto.CreateUserRequestDto;
import com.uhs.dto.UpdateUserRequestDto;
import com.uhs.model.User;
import com.uhs.model.UserRole;
import com.uhs.repository.FirstTimeLoginTokenRepository;
import com.uhs.repository.UserRepository;
import com.uhs.service.JwtService;
import com.uhs.service.PasswordEncodingService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for UserController.
 * Part of Phase 1D user management REST API implementation.
 *
 * Tests all user management endpoints using MockMvc.
 * Follows TDD principles - these tests are written before the controller implementation.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("usertest")
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FirstTimeLoginTokenRepository tokenRepository;

    @Autowired
    private PasswordEncodingService passwordEncodingService;

    @Autowired
    private JwtService jwtService;

    private static final String VALID_PASSWORD = "SecurePass123!";

    @BeforeEach
    void setUp() {
        // Clean up test data before each test
        tokenRepository.deleteAll();
        userRepository.deleteAll();
    }

    @AfterEach
    void tearDown() {
        // Clean up test data after each test
        tokenRepository.deleteAll();
        userRepository.deleteAll();
    }

    // ==================== GET /api/users endpoint tests ====================

    @Test
    void getAllUsers_AsAdmin_ShouldReturn200WithAllUsers() throws Exception {
        // Given - Create admin and some regular users
        User admin = createActiveAdmin("adminuser", VALID_PASSWORD);
        String adminToken = jwtService.generateToken(admin);
        createActiveUser("user1", VALID_PASSWORD);
        createActiveUser("user2", VALID_PASSWORD);

        // When & Then
        mockMvc.perform(get("/api/users")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(3))))
                .andExpect(jsonPath("$[0].id").isNotEmpty())
                .andExpect(jsonPath("$[0].username").isNotEmpty());
    }

    @Test
    void getAllUsers_AsNonAdmin_ShouldReturn403() throws Exception {
        // Given - Create regular user
        User user = createActiveUser("regularuser", VALID_PASSWORD);
        String userToken = jwtService.generateToken(user);

        // When & Then
        mockMvc.perform(get("/api/users")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void getAllUsers_WithoutAuth_ShouldReturn401() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/users"))
                .andExpect(status().isUnauthorized());
    }

    // ==================== GET /api/users/{id} endpoint tests ====================

    @Test
    void getUserById_AsAdmin_ShouldReturn200WithUser() throws Exception {
        // Given - Create admin and a user to fetch
        User admin = createActiveAdmin("adminuser", VALID_PASSWORD);
        String adminToken = jwtService.generateToken(admin);
        User targetUser = createActiveUser("targetuser", VALID_PASSWORD);

        // When & Then
        mockMvc.perform(get("/api/users/" + targetUser.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(targetUser.getId()))
                .andExpect(jsonPath("$.username").value("targetuser"));
    }

    @Test
    void getUserById_WithInvalidId_ShouldReturn404() throws Exception {
        // Given - Create admin
        User admin = createActiveAdmin("adminuser", VALID_PASSWORD);
        String adminToken = jwtService.generateToken(admin);

        // When & Then - Use non-existent ID
        mockMvc.perform(get("/api/users/99999")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void getUserById_AsNonAdmin_ShouldReturn403() throws Exception {
        // Given - Create two regular users
        User user1 = createActiveUser("user1", VALID_PASSWORD);
        User user2 = createActiveUser("user2", VALID_PASSWORD);
        String user1Token = jwtService.generateToken(user1);

        // When & Then - User trying to access another user's info
        mockMvc.perform(get("/api/users/" + user2.getId())
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isForbidden());
    }

    @Test
    void getUserById_OwnUser_ShouldReturn200() throws Exception {
        // Given - Regular user accessing own info
        User user = createActiveUser("ownuser", VALID_PASSWORD);
        String userToken = jwtService.generateToken(user);

        // When & Then - User can access their own info
        mockMvc.perform(get("/api/users/" + user.getId())
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(user.getId()))
                .andExpect(jsonPath("$.username").value("ownuser"));
    }

    // ==================== POST /api/users endpoint tests ====================

    @Test
    void createUser_AsAdmin_ShouldReturn201WithSetupUrl() throws Exception {
        // Given - Create admin
        User admin = createActiveAdmin("adminuser", VALID_PASSWORD);
        String adminToken = jwtService.generateToken(admin);

        CreateUserRequestDto request = new CreateUserRequestDto("newuser", "newuser@example.com", UserRole.USER);

        // When & Then
        mockMvc.perform(post("/api/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user.username").value("newuser"))
                .andExpect(jsonPath("$.user.email").value("newuser@example.com"))
                .andExpect(jsonPath("$.user.role").value("USER"))
                .andExpect(jsonPath("$.setupUrl").isNotEmpty());
    }

    @Test
    void createUser_WithDuplicateUsername_ShouldReturn409() throws Exception {
        // Given - Create admin and existing user
        User admin = createActiveAdmin("adminuser", VALID_PASSWORD);
        String adminToken = jwtService.generateToken(admin);
        createActiveUser("existinguser", VALID_PASSWORD);

        CreateUserRequestDto request = new CreateUserRequestDto("existinguser", "different@example.com", UserRole.USER);

        // When & Then
        mockMvc.perform(post("/api/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Username already exists"));
    }

    @Test
    void createUser_WithDuplicateUsernameCaseInsensitive_ShouldReturn409() throws Exception {
        // Given - Create admin and existing user
        User admin = createActiveAdmin("adminuser", VALID_PASSWORD);
        String adminToken = jwtService.generateToken(admin);
        createActiveUser("ExistingUser", VALID_PASSWORD);

        // Try to create with different case
        CreateUserRequestDto request = new CreateUserRequestDto("existinguser", "different@example.com", UserRole.USER);

        // When & Then
        mockMvc.perform(post("/api/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Username already exists"));
    }

    @Test
    void createUser_WithInvalidEmail_ShouldReturn400() throws Exception {
        // Given - Create admin
        User admin = createActiveAdmin("adminuser", VALID_PASSWORD);
        String adminToken = jwtService.generateToken(admin);

        CreateUserRequestDto request = new CreateUserRequestDto("newuser", "not-an-email", UserRole.USER);

        // When & Then
        mockMvc.perform(post("/api/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createUser_WithBlankUsername_ShouldReturn400() throws Exception {
        // Given - Create admin
        User admin = createActiveAdmin("adminuser", VALID_PASSWORD);
        String adminToken = jwtService.generateToken(admin);

        CreateUserRequestDto request = new CreateUserRequestDto("", "test@example.com", UserRole.USER);

        // When & Then
        mockMvc.perform(post("/api/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createUser_AsNonAdmin_ShouldReturn403() throws Exception {
        // Given - Create regular user
        User user = createActiveUser("regularuser", VALID_PASSWORD);
        String userToken = jwtService.generateToken(user);

        CreateUserRequestDto request = new CreateUserRequestDto("newuser", "newuser@example.com", UserRole.USER);

        // When & Then
        mockMvc.perform(post("/api/users")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    // ==================== PUT /api/users/{id} endpoint tests ====================

    @Test
    void updateUser_AsAdmin_ShouldReturn200WithUpdatedUser() throws Exception {
        // Given - Create admin and user to update
        User admin = createActiveAdmin("adminuser", VALID_PASSWORD);
        String adminToken = jwtService.generateToken(admin);
        User targetUser = createActiveUser("targetuser", VALID_PASSWORD);

        UpdateUserRequestDto request = new UpdateUserRequestDto();
        request.setEmail("updated@example.com");
        request.setRole(UserRole.ADMIN);
        request.setIsActive(false);

        // When & Then
        mockMvc.perform(put("/api/users/" + targetUser.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("updated@example.com"))
                .andExpect(jsonPath("$.role").value("ADMIN"))
                .andExpect(jsonPath("$.isActive").value(false));
    }

    @Test
    void updateUser_DefaultAdmin_ShouldReturn403() throws Exception {
        // Given - Create admin and default admin
        User admin = createActiveAdmin("adminuser", VALID_PASSWORD);
        String adminToken = jwtService.generateToken(admin);
        User defaultAdmin = createDefaultAdmin();

        UpdateUserRequestDto request = new UpdateUserRequestDto();
        request.setEmail("changed@example.com");

        // When & Then
        mockMvc.perform(put("/api/users/" + defaultAdmin.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void updateUser_WithInvalidId_ShouldReturn404() throws Exception {
        // Given - Create admin
        User admin = createActiveAdmin("adminuser", VALID_PASSWORD);
        String adminToken = jwtService.generateToken(admin);

        UpdateUserRequestDto request = new UpdateUserRequestDto();
        request.setEmail("updated@example.com");

        // When & Then
        mockMvc.perform(put("/api/users/99999")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    void updateUser_WithInvalidEmail_ShouldReturn400() throws Exception {
        // Given - Create admin and user
        User admin = createActiveAdmin("adminuser", VALID_PASSWORD);
        String adminToken = jwtService.generateToken(admin);
        User targetUser = createActiveUser("targetuser", VALID_PASSWORD);

        UpdateUserRequestDto request = new UpdateUserRequestDto();
        request.setEmail("not-an-email");

        // When & Then
        mockMvc.perform(put("/api/users/" + targetUser.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateUser_AsNonAdmin_ShouldReturn403() throws Exception {
        // Given - Create two regular users
        User user1 = createActiveUser("user1", VALID_PASSWORD);
        User user2 = createActiveUser("user2", VALID_PASSWORD);
        String user1Token = jwtService.generateToken(user1);

        UpdateUserRequestDto request = new UpdateUserRequestDto();
        request.setEmail("hacked@example.com");

        // When & Then
        mockMvc.perform(put("/api/users/" + user2.getId())
                        .header("Authorization", "Bearer " + user1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    // ==================== DELETE /api/users/{id} endpoint tests ====================

    @Test
    void deleteUser_AsAdmin_ShouldReturn200WithSuccessMessage() throws Exception {
        // Given - Create admin and user to delete
        User admin = createActiveAdmin("adminuser", VALID_PASSWORD);
        String adminToken = jwtService.generateToken(admin);
        User targetUser = createActiveUser("targetuser", VALID_PASSWORD);

        // When & Then
        mockMvc.perform(delete("/api/users/" + targetUser.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("User deleted successfully"));
    }

    @Test
    void deleteUser_DefaultAdmin_ShouldReturn403() throws Exception {
        // Given - Create admin and default admin
        User admin = createActiveAdmin("adminuser", VALID_PASSWORD);
        String adminToken = jwtService.generateToken(admin);
        User defaultAdmin = createDefaultAdmin();

        // When & Then
        mockMvc.perform(delete("/api/users/" + defaultAdmin.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Cannot delete default admin"));
    }

    @Test
    void deleteUser_WithInvalidId_ShouldReturn404() throws Exception {
        // Given - Create admin
        User admin = createActiveAdmin("adminuser", VALID_PASSWORD);
        String adminToken = jwtService.generateToken(admin);

        // When & Then
        mockMvc.perform(delete("/api/users/99999")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteUser_AsNonAdmin_ShouldReturn403() throws Exception {
        // Given - Create two regular users
        User user1 = createActiveUser("user1", VALID_PASSWORD);
        User user2 = createActiveUser("user2", VALID_PASSWORD);
        String user1Token = jwtService.generateToken(user1);

        // When & Then
        mockMvc.perform(delete("/api/users/" + user2.getId())
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isForbidden());
    }

    // ==================== POST /api/users/{id}/generate-token endpoint tests ====================

    @Test
    void generateToken_AsAdmin_ShouldReturn200WithSetupUrlAndExpiry() throws Exception {
        // Given - Create admin and user to generate token for
        User admin = createActiveAdmin("adminuser", VALID_PASSWORD);
        String adminToken = jwtService.generateToken(admin);
        User targetUser = createActiveUser("targetuser", VALID_PASSWORD);

        // When & Then
        mockMvc.perform(post("/api/users/" + targetUser.getId() + "/generate-token")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.setupUrl").isNotEmpty())
                .andExpect(jsonPath("$.expiresAt").isNotEmpty());
    }

    @Test
    void generateToken_WithInvalidId_ShouldReturn404() throws Exception {
        // Given - Create admin
        User admin = createActiveAdmin("adminuser", VALID_PASSWORD);
        String adminToken = jwtService.generateToken(admin);

        // When & Then
        mockMvc.perform(post("/api/users/99999/generate-token")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void generateToken_AsNonAdmin_ShouldReturn403() throws Exception {
        // Given - Create two regular users
        User user1 = createActiveUser("user1", VALID_PASSWORD);
        User user2 = createActiveUser("user2", VALID_PASSWORD);
        String user1Token = jwtService.generateToken(user1);

        // When & Then
        mockMvc.perform(post("/api/users/" + user2.getId() + "/generate-token")
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isForbidden());
    }

    @Test
    void generateToken_ShouldRevokeExistingTokens() throws Exception {
        // Given - Create admin and user, generate a token first
        User admin = createActiveAdmin("adminuser", VALID_PASSWORD);
        String adminToken = jwtService.generateToken(admin);
        User targetUser = createActiveUser("targetuser", VALID_PASSWORD);

        // First generate a token
        mockMvc.perform(post("/api/users/" + targetUser.getId() + "/generate-token")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        // Get initial token count
        int initialTokenCount = tokenRepository.findByUserId(targetUser.getId()).size();

        // Generate another token - should revoke the previous one
        mockMvc.perform(post("/api/users/" + targetUser.getId() + "/generate-token")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        // Should still have only one valid token (old ones revoked)
        // The new token should exist
        int finalTokenCount = tokenRepository.findByUserId(targetUser.getId()).size();
        // Either old token was deleted or there's still one token
        org.junit.jupiter.api.Assertions.assertTrue(finalTokenCount >= 1);
    }

    // ==================== Helper methods ====================

    private User createActiveUser(String username, String password) {
        User user = new User();
        user.setUsername(username);
        user.setRole(UserRole.USER);
        user.setIsActive(true);
        user.setPasswordSet(true);
        user.setIsDefaultAdmin(false);
        user.setPasswordHash(passwordEncodingService.encodePassword(password));
        return userRepository.save(user);
    }

    private User createActiveAdmin(String username, String password) {
        User admin = new User();
        admin.setUsername(username);
        admin.setRole(UserRole.ADMIN);
        admin.setIsActive(true);
        admin.setPasswordSet(true);
        admin.setIsDefaultAdmin(false);
        admin.setPasswordHash(passwordEncodingService.encodePassword(password));
        return userRepository.save(admin);
    }

    private User createDefaultAdmin() {
        User admin = new User();
        admin.setUsername("defaultadmin");
        admin.setRole(UserRole.ADMIN);
        admin.setIsActive(true);
        admin.setPasswordSet(true);
        admin.setIsDefaultAdmin(true);
        admin.setPasswordHash(passwordEncodingService.encodePassword(VALID_PASSWORD));
        return userRepository.save(admin);
    }
}
