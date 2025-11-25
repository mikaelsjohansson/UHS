package com.uhs.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.uhs.dto.LoginRequestDto;
import com.uhs.dto.SetPasswordRequestDto;
import com.uhs.model.FirstTimeLoginToken;
import com.uhs.model.User;
import com.uhs.model.UserRole;
import com.uhs.repository.FirstTimeLoginTokenRepository;
import com.uhs.repository.UserRepository;
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
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for AuthController.
 * Part of Phase 1C authentication API implementation.
 *
 * Tests all authentication endpoints using MockMvc.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerTest {

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

    // ==================== /login endpoint tests ====================

    @Test
    void login_WithValidCredentials_ShouldReturn200WithToken() throws Exception {
        // Given - Create an active user with password set
        createActiveUserWithPassword("testuser", VALID_PASSWORD);

        LoginRequestDto request = new LoginRequestDto("testuser", VALID_PASSWORD);

        // When & Then
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.username").value("testuser"))
                .andExpect(jsonPath("$.user.role").value("USER"))
                .andExpect(jsonPath("$.expiresAt").isNotEmpty());
    }

    @Test
    void login_WithInvalidPassword_ShouldReturn400() throws Exception {
        // Given - Create an active user with password set
        createActiveUserWithPassword("testuser2", VALID_PASSWORD);

        LoginRequestDto request = new LoginRequestDto("testuser2", "WrongPassword123!");

        // When & Then - Use generic 400 to not reveal user exists
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void login_WithNonExistentUser_ShouldReturn400() throws Exception {
        // Given - No user exists
        LoginRequestDto request = new LoginRequestDto("nonexistent", "SomePassword123!");

        // When & Then - Use generic 400 to not reveal user doesn't exist
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void login_WithInactiveUser_ShouldReturn403() throws Exception {
        // Given - Create an inactive user (password not set)
        User user = new User();
        user.setUsername("inactiveuser");
        user.setRole(UserRole.USER);
        user.setIsActive(false);
        user.setPasswordSet(false);
        user.setIsDefaultAdmin(false);
        user.setPasswordHash(passwordEncodingService.encodePassword(VALID_PASSWORD));
        userRepository.save(user);

        LoginRequestDto request = new LoginRequestDto("inactiveuser", VALID_PASSWORD);

        // When & Then
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("User not activated"));
    }

    @Test
    void login_WithBlankUsername_ShouldReturn400() throws Exception {
        // Given
        LoginRequestDto request = new LoginRequestDto("", VALID_PASSWORD);

        // When & Then
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void login_WithBlankPassword_ShouldReturn400() throws Exception {
        // Given
        LoginRequestDto request = new LoginRequestDto("testuser", "");

        // When & Then
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void login_WithCaseInsensitiveUsername_ShouldReturn200() throws Exception {
        // Given - Create user with lowercase username
        createActiveUserWithPassword("caseuser", VALID_PASSWORD);

        // When & Then - Login with uppercase username
        LoginRequestDto request = new LoginRequestDto("CASEUSER", VALID_PASSWORD);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    // ==================== /logout endpoint tests ====================

    @Test
    void logout_WithValidToken_ShouldReturn200() throws Exception {
        // Given - Create user and get token
        String token = loginAndGetToken("logoutuser", VALID_PASSWORD);

        // When & Then
        mockMvc.perform(post("/api/auth/logout")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Logged out successfully"));
    }

    @Test
    void logout_WithoutToken_ShouldReturn401() throws Exception {
        // When & Then
        mockMvc.perform(post("/api/auth/logout"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void logout_WithInvalidToken_ShouldReturn401() throws Exception {
        // When & Then
        mockMvc.perform(post("/api/auth/logout")
                        .header("Authorization", "Bearer invalid-token"))
                .andExpect(status().isUnauthorized());
    }

    // ==================== /me endpoint tests ====================

    @Test
    void me_WithValidToken_ShouldReturn200WithUserInfo() throws Exception {
        // Given - Create user and get token
        String token = loginAndGetToken("meuser", VALID_PASSWORD);

        // When & Then
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("meuser"))
                .andExpect(jsonPath("$.role").value("USER"))
                .andExpect(jsonPath("$.isActive").value(true))
                .andExpect(jsonPath("$.passwordSet").value(true));
    }

    @Test
    void me_WithoutToken_ShouldReturn401() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void me_WithInvalidToken_ShouldReturn401() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer invalid-token"))
                .andExpect(status().isUnauthorized());
    }

    // ==================== /setup-required endpoint tests ====================

    @Test
    void setupRequired_WithNoAdminUser_ShouldReturnTrue() throws Exception {
        // Given - No users exist (including no default admin)

        // When & Then
        mockMvc.perform(get("/api/auth/setup-required"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.setupRequired").value(true));
    }

    @Test
    void setupRequired_WithDefaultAdminNoPassword_ShouldReturnTrue() throws Exception {
        // Given - Create default admin without password
        User admin = new User();
        admin.setUsername("adminNoPass");
        admin.setRole(UserRole.ADMIN);
        admin.setIsDefaultAdmin(true);
        admin.setIsActive(false);
        admin.setPasswordSet(false);
        userRepository.save(admin);

        // When & Then
        mockMvc.perform(get("/api/auth/setup-required"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.setupRequired").value(true));
    }

    @Test
    void setupRequired_WithDefaultAdminWithPassword_ShouldReturnFalse() throws Exception {
        // Given - Create default admin with password set
        User admin = new User();
        admin.setUsername("adminWithPass");
        admin.setRole(UserRole.ADMIN);
        admin.setIsDefaultAdmin(true);
        admin.setIsActive(true);
        admin.setPasswordSet(true);
        admin.setPasswordHash(passwordEncodingService.encodePassword(VALID_PASSWORD));
        userRepository.save(admin);

        // When & Then
        mockMvc.perform(get("/api/auth/setup-required"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.setupRequired").value(false));
    }

    // ==================== /setup-admin endpoint tests ====================

    @Test
    void setupAdmin_WithValidPassword_ShouldReturn200() throws Exception {
        // Given - Create default admin without password
        User admin = new User();
        admin.setUsername("setupadmin");
        admin.setRole(UserRole.ADMIN);
        admin.setIsDefaultAdmin(true);
        admin.setIsActive(false);
        admin.setPasswordSet(false);
        userRepository.save(admin);

        SetPasswordRequestDto request = new SetPasswordRequestDto(VALID_PASSWORD);

        // When & Then
        mockMvc.perform(post("/api/auth/setup-admin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("setupadmin"))
                .andExpect(jsonPath("$.role").value("ADMIN"))
                .andExpect(jsonPath("$.isActive").value(true))
                .andExpect(jsonPath("$.passwordSet").value(true));
    }

    @Test
    void setupAdmin_WhenAlreadySetUp_ShouldReturn409() throws Exception {
        // Given - Create default admin with password already set
        User admin = new User();
        admin.setUsername("alreadysetup");
        admin.setRole(UserRole.ADMIN);
        admin.setIsDefaultAdmin(true);
        admin.setIsActive(true);
        admin.setPasswordSet(true);
        admin.setPasswordHash(passwordEncodingService.encodePassword(VALID_PASSWORD));
        userRepository.save(admin);

        SetPasswordRequestDto request = new SetPasswordRequestDto("AnotherPass123!");

        // When & Then
        mockMvc.perform(post("/api/auth/setup-admin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    @Test
    void setupAdmin_WithInvalidPassword_ShouldReturn400WithValidationErrors() throws Exception {
        // Given - Create default admin without password
        User admin = new User();
        admin.setUsername("invalidpassadmin");
        admin.setRole(UserRole.ADMIN);
        admin.setIsDefaultAdmin(true);
        admin.setIsActive(false);
        admin.setPasswordSet(false);
        userRepository.save(admin);

        // Password too short and missing special characters
        SetPasswordRequestDto request = new SetPasswordRequestDto("short");

        // When & Then
        mockMvc.perform(post("/api/auth/setup-admin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors").isArray())
                .andExpect(jsonPath("$.errors").isNotEmpty());
    }

    @Test
    void setupAdmin_WithNoDefaultAdmin_ShouldReturn404() throws Exception {
        // Given - No default admin exists
        SetPasswordRequestDto request = new SetPasswordRequestDto(VALID_PASSWORD);

        // When & Then
        mockMvc.perform(post("/api/auth/setup-admin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    // ==================== /set-password/{token} endpoint tests ====================

    @Test
    void setPassword_WithValidTokenAndPassword_ShouldReturn200() throws Exception {
        // Given - Create user with token
        User user = new User();
        user.setUsername("newuser1");
        user.setRole(UserRole.USER);
        user.setIsActive(false);
        user.setPasswordSet(false);
        user.setIsDefaultAdmin(false);
        user = userRepository.save(user);

        String tokenValue = UUID.randomUUID().toString();
        FirstTimeLoginToken token = new FirstTimeLoginToken();
        token.setToken(tokenValue);
        token.setUser(user);
        token.setExpiresAt(LocalDateTime.now().plusMinutes(15));
        token.setUsed(false);
        tokenRepository.save(token);

        SetPasswordRequestDto request = new SetPasswordRequestDto(VALID_PASSWORD);

        // When & Then
        mockMvc.perform(post("/api/auth/set-password/" + tokenValue)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("newuser1"))
                .andExpect(jsonPath("$.isActive").value(true))
                .andExpect(jsonPath("$.passwordSet").value(true));
    }

    @Test
    void setPassword_WithExpiredToken_ShouldReturn400() throws Exception {
        // Given - Create user with expired token
        User user = new User();
        user.setUsername("newuser2");
        user.setRole(UserRole.USER);
        user.setIsActive(false);
        user.setPasswordSet(false);
        user.setIsDefaultAdmin(false);
        user = userRepository.save(user);

        String tokenValue = UUID.randomUUID().toString();
        FirstTimeLoginToken token = new FirstTimeLoginToken();
        token.setToken(tokenValue);
        token.setUser(user);
        token.setExpiresAt(LocalDateTime.now().minusMinutes(5)); // Expired
        token.setUsed(false);
        tokenRepository.save(token);

        SetPasswordRequestDto request = new SetPasswordRequestDto(VALID_PASSWORD);

        // When & Then
        mockMvc.perform(post("/api/auth/set-password/" + tokenValue)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void setPassword_WithUsedToken_ShouldReturn400() throws Exception {
        // Given - Create user with already used token
        User user = new User();
        user.setUsername("newuser3");
        user.setRole(UserRole.USER);
        user.setIsActive(false);
        user.setPasswordSet(false);
        user.setIsDefaultAdmin(false);
        user = userRepository.save(user);

        String tokenValue = UUID.randomUUID().toString();
        FirstTimeLoginToken token = new FirstTimeLoginToken();
        token.setToken(tokenValue);
        token.setUser(user);
        token.setExpiresAt(LocalDateTime.now().plusMinutes(15));
        token.setUsed(true); // Already used
        tokenRepository.save(token);

        SetPasswordRequestDto request = new SetPasswordRequestDto(VALID_PASSWORD);

        // When & Then
        mockMvc.perform(post("/api/auth/set-password/" + tokenValue)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void setPassword_WithInvalidToken_ShouldReturn400() throws Exception {
        // Given - Token doesn't exist
        SetPasswordRequestDto request = new SetPasswordRequestDto(VALID_PASSWORD);

        // When & Then
        mockMvc.perform(post("/api/auth/set-password/non-existent-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void setPassword_WithInvalidPassword_ShouldReturn400WithValidationErrors() throws Exception {
        // Given - Create user with valid token
        User user = new User();
        user.setUsername("newuser4");
        user.setRole(UserRole.USER);
        user.setIsActive(false);
        user.setPasswordSet(false);
        user.setIsDefaultAdmin(false);
        user = userRepository.save(user);

        String tokenValue = UUID.randomUUID().toString();
        FirstTimeLoginToken token = new FirstTimeLoginToken();
        token.setToken(tokenValue);
        token.setUser(user);
        token.setExpiresAt(LocalDateTime.now().plusMinutes(15));
        token.setUsed(false);
        tokenRepository.save(token);

        // Invalid password
        SetPasswordRequestDto request = new SetPasswordRequestDto("weak");

        // When & Then
        mockMvc.perform(post("/api/auth/set-password/" + tokenValue)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors").isArray())
                .andExpect(jsonPath("$.errors").isNotEmpty());
    }

    // ==================== /validate-token/{token} endpoint tests ====================

    @Test
    void validateToken_WithValidToken_ShouldReturnValidTrue() throws Exception {
        // Given - Create user with valid token
        User user = new User();
        user.setUsername("newuser5");
        user.setRole(UserRole.USER);
        user.setIsActive(false);
        user.setPasswordSet(false);
        user.setIsDefaultAdmin(false);
        user = userRepository.save(user);

        String tokenValue = UUID.randomUUID().toString();
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(15);
        FirstTimeLoginToken token = new FirstTimeLoginToken();
        token.setToken(tokenValue);
        token.setUser(user);
        token.setExpiresAt(expiresAt);
        token.setUsed(false);
        tokenRepository.save(token);

        // When & Then
        mockMvc.perform(get("/api/auth/validate-token/" + tokenValue))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.valid").value(true))
                .andExpect(jsonPath("$.username").value("newuser5"))
                .andExpect(jsonPath("$.expiresAt").isNotEmpty());
    }

    @Test
    void validateToken_WithInvalidToken_ShouldReturnValidFalse() throws Exception {
        // When & Then - Token doesn't exist
        mockMvc.perform(get("/api/auth/validate-token/non-existent-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.valid").value(false))
                .andExpect(jsonPath("$.username").isEmpty())
                .andExpect(jsonPath("$.expiresAt").isEmpty());
    }

    @Test
    void validateToken_WithExpiredToken_ShouldReturnValidFalse() throws Exception {
        // Given - Create user with expired token
        User user = new User();
        user.setUsername("newuser6");
        user.setRole(UserRole.USER);
        user.setIsActive(false);
        user.setPasswordSet(false);
        user.setIsDefaultAdmin(false);
        user = userRepository.save(user);

        String tokenValue = UUID.randomUUID().toString();
        FirstTimeLoginToken token = new FirstTimeLoginToken();
        token.setToken(tokenValue);
        token.setUser(user);
        token.setExpiresAt(LocalDateTime.now().minusMinutes(5)); // Expired
        token.setUsed(false);
        tokenRepository.save(token);

        // When & Then
        mockMvc.perform(get("/api/auth/validate-token/" + tokenValue))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.valid").value(false));
    }

    @Test
    void validateToken_WithUsedToken_ShouldReturnValidFalse() throws Exception {
        // Given - Create user with used token
        User user = new User();
        user.setUsername("newuser7");
        user.setRole(UserRole.USER);
        user.setIsActive(false);
        user.setPasswordSet(false);
        user.setIsDefaultAdmin(false);
        user = userRepository.save(user);

        String tokenValue = UUID.randomUUID().toString();
        FirstTimeLoginToken token = new FirstTimeLoginToken();
        token.setToken(tokenValue);
        token.setUser(user);
        token.setExpiresAt(LocalDateTime.now().plusMinutes(15));
        token.setUsed(true); // Already used
        tokenRepository.save(token);

        // When & Then
        mockMvc.perform(get("/api/auth/validate-token/" + tokenValue))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.valid").value(false));
    }

    // ==================== Helper methods ====================

    private User createActiveUserWithPassword(String username, String password) {
        User user = new User();
        user.setUsername(username);
        user.setRole(UserRole.USER);
        user.setIsActive(true);
        user.setPasswordSet(true);
        user.setIsDefaultAdmin(false);
        user.setPasswordHash(passwordEncodingService.encodePassword(password));
        return userRepository.save(user);
    }

    private String loginAndGetToken(String username, String password) throws Exception {
        // Create active user first
        createActiveUserWithPassword(username, password);

        LoginRequestDto request = new LoginRequestDto(username, password);

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        String response = result.getResponse().getContentAsString();
        return objectMapper.readTree(response).get("token").asText();
    }
}
