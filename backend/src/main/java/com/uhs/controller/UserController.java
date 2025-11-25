package com.uhs.controller;

import com.uhs.dto.*;
import com.uhs.model.FirstTimeLoginToken;
import com.uhs.model.User;
import com.uhs.repository.FirstTimeLoginTokenRepository;
import com.uhs.repository.UserRepository;
import com.uhs.service.JwtService;
import com.uhs.service.TokenGenerationService;
import com.uhs.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * REST Controller for user management endpoints.
 * Part of Phase 1D user management REST API implementation.
 *
 * Base path: /api/users
 *
 * All endpoints require Admin role, except GET /users/{id} which allows
 * users to access their own information.
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;
    private final FirstTimeLoginTokenRepository tokenRepository;
    private final TokenGenerationService tokenGenerationService;
    private final JwtService jwtService;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    /**
     * GET /users - Get all users.
     * Requires Admin role.
     *
     * @param authHeader Authorization header with Bearer token
     * @return List of UserDto
     */
    @GetMapping
    public ResponseEntity<?> getAllUsers(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        // Validate authentication and admin role
        ResponseEntity<?> authError = validateAdminAuth(authHeader);
        if (authError != null) {
            return authError;
        }

        List<User> users = userService.getAllUsers();
        List<UserDto> userDtos = users.stream()
                .map(this::convertToUserDto)
                .collect(Collectors.toList());

        return ResponseEntity.ok(userDtos);
    }

    /**
     * GET /users/{id} - Get user by ID.
     * Requires Admin role OR own user.
     *
     * @param id User ID
     * @param authHeader Authorization header with Bearer token
     * @return UserDto
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        // Validate authentication
        ResponseEntity<?> unauthError = validateAuthentication(authHeader);
        if (unauthError != null) {
            return unauthError;
        }

        // Extract user info from token
        String token = extractToken(authHeader);
        JwtValidationResultDto validation = jwtService.validateToken(token);
        Long requestingUserId = validation.getUserId();
        User requestingUser = userRepository.findById(requestingUserId).orElse(null);

        // Check if admin or own user
        boolean isAdmin = requestingUser != null && requestingUser.getRole().name().equals("ADMIN");
        boolean isOwnUser = requestingUserId.equals(id);

        if (!isAdmin && !isOwnUser) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(createErrorResponse("Access denied"));
        }

        // Find user
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("User not found"));
        }

        return ResponseEntity.ok(convertToUserDto(userOpt.get()));
    }

    /**
     * POST /users - Create a new user.
     * Requires Admin role.
     *
     * @param request CreateUserRequestDto
     * @param authHeader Authorization header with Bearer token
     * @return CreateUserResponseDto with user and setup URL
     */
    @PostMapping
    public ResponseEntity<?> createUser(
            @Valid @RequestBody CreateUserRequestDto request,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        // Validate authentication and admin role
        ResponseEntity<?> authError = validateAdminAuth(authHeader);
        if (authError != null) {
            return authError;
        }

        // Create user (service handles case-insensitive duplicate check)
        User user;
        try {
            user = userService.createUser(request);
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("Username already exists")) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(createErrorResponse("Username already exists"));
            }
            throw e;
        }

        // Get the generated token
        List<FirstTimeLoginToken> tokens = tokenRepository.findByUserId(user.getId());
        String tokenValue = tokens.isEmpty() ? "" : tokens.get(tokens.size() - 1).getToken();

        // Build setup URL
        String setupUrl = frontendUrl + "/setup-password/" + tokenValue;

        // Create response
        CreateUserResponseDto response = new CreateUserResponseDto();
        response.setUser(convertToUserDto(user));
        response.setSetupUrl(setupUrl);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * PUT /users/{id} - Update an existing user.
     * Requires Admin role.
     * Cannot update the default admin user.
     *
     * @param id User ID
     * @param request UpdateUserRequestDto
     * @param authHeader Authorization header with Bearer token
     * @return Updated UserDto
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequestDto request,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        // Validate authentication and admin role
        ResponseEntity<?> authError = validateAdminAuth(authHeader);
        if (authError != null) {
            return authError;
        }

        // Find user
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("User not found"));
        }

        User user = userOpt.get();

        // Prevent updating default admin
        if (Boolean.TRUE.equals(user.getIsDefaultAdmin())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(createErrorResponse("Cannot modify default admin"));
        }

        // Update user
        User updatedUser = userService.updateUser(id, request);

        return ResponseEntity.ok(convertToUserDto(updatedUser));
    }

    /**
     * DELETE /users/{id} - Delete a user.
     * Requires Admin role.
     * Cannot delete the default admin user.
     *
     * @param id User ID
     * @param authHeader Authorization header with Bearer token
     * @return Success message
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        // Validate authentication and admin role
        ResponseEntity<?> authError = validateAdminAuth(authHeader);
        if (authError != null) {
            return authError;
        }

        // Find user
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("User not found"));
        }

        User user = userOpt.get();

        // Prevent deleting default admin
        if (Boolean.TRUE.equals(user.getIsDefaultAdmin())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(createErrorResponse("Cannot delete default admin"));
        }

        // Delete user
        userService.deleteUser(id);

        Map<String, String> response = new HashMap<>();
        response.put("message", "User deleted successfully");
        return ResponseEntity.ok(response);
    }

    /**
     * POST /users/{id}/generate-token - Generate a new first-time login token.
     * Requires Admin role.
     * Revokes any existing tokens for the user.
     *
     * @param id User ID
     * @param authHeader Authorization header with Bearer token
     * @return GenerateTokenResponseDto with setup URL and expiration
     */
    @PostMapping("/{id}/generate-token")
    public ResponseEntity<?> generateToken(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        // Validate authentication and admin role
        ResponseEntity<?> authError = validateAdminAuth(authHeader);
        if (authError != null) {
            return authError;
        }

        // Find user
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("User not found"));
        }

        // Revoke existing tokens for this user
        tokenRepository.deleteByUserId(id);

        // Generate new token
        FirstTimeLoginToken token = tokenGenerationService.generateToken(id);

        // Build setup URL
        String setupUrl = frontendUrl + "/setup-password/" + token.getToken();

        // Create response
        GenerateTokenResponseDto response = new GenerateTokenResponseDto();
        response.setSetupUrl(setupUrl);
        response.setExpiresAt(token.getExpiresAt());

        return ResponseEntity.ok(response);
    }

    // ==================== Helper methods ====================

    /**
     * Validates that the request has a valid authentication token.
     * Returns an error response if invalid, null if valid.
     */
    private ResponseEntity<?> validateAuthentication(String authHeader) {
        if (!isValidAuthHeader(authHeader)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(createErrorResponse("Unauthorized"));
        }

        String token = extractToken(authHeader);
        JwtValidationResultDto validation = jwtService.validateToken(token);

        if (!validation.isValid()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(createErrorResponse("Unauthorized"));
        }

        return null; // Valid
    }

    /**
     * Validates that the request has admin role.
     * Returns an error response if not admin, null if valid.
     * Uses the role from the JWT token to avoid database reads that can cause
     * SQLite lock issues in concurrent scenarios.
     */
    private ResponseEntity<?> validateAdminAuth(String authHeader) {
        // First validate authentication
        ResponseEntity<?> authError = validateAuthentication(authHeader);
        if (authError != null) {
            return authError;
        }

        // Check admin role from JWT (no database read needed)
        String token = extractToken(authHeader);
        JwtValidationResultDto validation = jwtService.validateToken(token);

        if (validation.getRole() == null || !validation.getRole().name().equals("ADMIN")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(createErrorResponse("Admin role required"));
        }

        return null; // Valid admin
    }

    private boolean isValidAuthHeader(String authHeader) {
        return authHeader != null && authHeader.startsWith("Bearer ");
    }

    private String extractToken(String authHeader) {
        return authHeader.substring(7); // Remove "Bearer " prefix
    }

    private UserDto convertToUserDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());
        dto.setIsActive(user.getIsActive());
        dto.setPasswordSet(user.getPasswordSet());
        dto.setIsDefaultAdmin(user.getIsDefaultAdmin());
        dto.setCreatedAt(user.getCreatedAt());
        return dto;
    }

    private Map<String, String> createErrorResponse(String message) {
        Map<String, String> error = new HashMap<>();
        error.put("message", message);
        return error;
    }
}
