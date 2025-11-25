package com.uhs.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.uhs.dto.LoginRequestDto;
import com.uhs.model.User;
import com.uhs.model.UserRole;
import com.uhs.repository.FirstTimeLoginTokenRepository;
import com.uhs.repository.UserRepository;
import com.uhs.service.JwtService;
import com.uhs.service.PasswordEncodingService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for SecurityConfig.
 * Part of Phase 1E security configuration implementation.
 * Tests endpoint authorization, CORS, and JWT authentication flow.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SecurityConfigTest {

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
        tokenRepository.deleteAll();
        userRepository.deleteAll();
    }

    @AfterEach
    void tearDown() {
        tokenRepository.deleteAll();
        userRepository.deleteAll();
    }

    // ==================== Public Endpoint Tests ====================

    @Test
    @DisplayName("Public endpoint /api/auth/login should be accessible without authentication")
    void publicEndpoint_Login_ShouldBeAccessible() throws Exception {
        // Given - create user for login
        createActiveUserWithPassword("testuser", VALID_PASSWORD);
        LoginRequestDto request = new LoginRequestDto("testuser", VALID_PASSWORD);

        // When & Then
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Public endpoint /api/auth/setup-required should be accessible without authentication")
    void publicEndpoint_SetupRequired_ShouldBeAccessible() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/auth/setup-required"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Public endpoint /api/auth/setup-admin should be accessible without authentication")
    void publicEndpoint_SetupAdmin_ShouldBeAccessible() throws Exception {
        // Given - create default admin without password
        User admin = new User();
        admin.setUsername("admin");
        admin.setRole(UserRole.ADMIN);
        admin.setIsDefaultAdmin(true);
        admin.setIsActive(false);
        admin.setPasswordSet(false);
        userRepository.save(admin);

        // When & Then - should get 200 OK (not 401 Unauthorized)
        mockMvc.perform(post("/api/auth/setup-admin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"password\":\"SecurePass123!\"}"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Public endpoint /api/auth/validate-token/{token} should be accessible without authentication")
    void publicEndpoint_ValidateToken_ShouldBeAccessible() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/auth/validate-token/any-token"))
                .andExpect(status().isOk()); // Returns 200 with valid=false, not 401
    }

    // ==================== Protected Endpoint Tests ====================

    @Test
    @DisplayName("Protected endpoint /api/expenses should require authentication")
    void protectedEndpoint_Expenses_ShouldRequireAuth() throws Exception {
        // When & Then - without token should get 401
        mockMvc.perform(get("/api/expenses"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Protected endpoint /api/categories should require authentication")
    void protectedEndpoint_Categories_ShouldRequireAuth() throws Exception {
        // When & Then - without token should get 401
        mockMvc.perform(get("/api/categories"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Protected endpoint /api/auth/me should require authentication")
    void protectedEndpoint_Me_ShouldRequireAuth() throws Exception {
        // When & Then - without token should get 401
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Protected endpoint /api/users should require authentication")
    void protectedEndpoint_Users_ShouldRequireAuth() throws Exception {
        // When & Then - without token should get 401
        mockMvc.perform(get("/api/users"))
                .andExpect(status().isUnauthorized());
    }

    // ==================== JWT Authentication Tests ====================

    @Test
    @DisplayName("Protected endpoint should be accessible with valid JWT token")
    void protectedEndpoint_WithValidJwt_ShouldBeAccessible() throws Exception {
        // Given
        String token = createUserAndGetToken("jwtuser", VALID_PASSWORD);

        // When & Then
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("jwtuser"));
    }

    @Test
    @DisplayName("Protected endpoint should return 401 with invalid JWT token")
    void protectedEndpoint_WithInvalidJwt_ShouldReturn401() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer invalid.token.here"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Protected endpoint should return 401 with expired JWT token")
    void protectedEndpoint_WithExpiredJwt_ShouldReturn401() throws Exception {
        // Given - create a token with negative expiration (already expired)
        User user = createActiveUserWithPassword("expireduser", VALID_PASSWORD);
        JwtService shortLivedJwtService = new JwtService(
                "uhs-expense-tracker-super-secret-key-min-32-chars-for-hs256",
                -1000L // Already expired
        );
        String expiredToken = shortLivedJwtService.generateToken(user);

        // When & Then
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + expiredToken))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Protected endpoint should return 401 with malformed Authorization header")
    void protectedEndpoint_WithMalformedAuthHeader_ShouldReturn401() throws Exception {
        // When & Then - missing "Bearer " prefix
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "token-without-bearer-prefix"))
                .andExpect(status().isUnauthorized());
    }

    // ==================== CORS Tests ====================

    @Test
    @DisplayName("CORS should allow requests from localhost:5173")
    void cors_ShouldAllowLocalhostOrigin() throws Exception {
        // When & Then
        mockMvc.perform(options("/api/auth/login")
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isOk())
                .andExpect(header().exists("Access-Control-Allow-Origin"));
    }

    @Test
    @DisplayName("CORS should allow requests from localhost:3000")
    void cors_ShouldAllowLocalhostOrigin3000() throws Exception {
        // When & Then
        mockMvc.perform(options("/api/auth/login")
                        .header("Origin", "http://localhost:3000")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isOk())
                .andExpect(header().exists("Access-Control-Allow-Origin"));
    }

    // ==================== Full Authentication Flow Test ====================

    @Test
    @DisplayName("Full authentication flow: login -> access protected resource -> logout")
    void fullAuthenticationFlow_ShouldWork() throws Exception {
        // Given - create user
        createActiveUserWithPassword("flowuser", VALID_PASSWORD);
        LoginRequestDto loginRequest = new LoginRequestDto("flowuser", VALID_PASSWORD);

        // Step 1: Login and get token
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andReturn();

        String token = objectMapper.readTree(loginResult.getResponse().getContentAsString())
                .get("token").asText();

        // Step 2: Access protected resource with token
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("flowuser"));

        // Step 3: Logout
        mockMvc.perform(post("/api/auth/logout")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Logged out successfully"));
    }

    // ==================== Helper Methods ====================

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

    private String createUserAndGetToken(String username, String password) throws Exception {
        User user = createActiveUserWithPassword(username, password);
        return jwtService.generateToken(user);
    }
}
