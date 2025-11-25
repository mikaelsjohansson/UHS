package com.uhs.controller;

import com.uhs.dto.*;
import com.uhs.model.FirstTimeLoginToken;
import com.uhs.model.User;
import com.uhs.repository.FirstTimeLoginTokenRepository;
import com.uhs.repository.UserRepository;
import com.uhs.service.JwtService;
import com.uhs.service.PasswordEncodingService;
import com.uhs.service.TokenGenerationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * REST Controller for authentication endpoints.
 * Part of Phase 1C authentication API implementation.
 *
 * Base path: /api/auth
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final FirstTimeLoginTokenRepository tokenRepository;
    private final JwtService jwtService;
    private final PasswordEncodingService passwordEncodingService;
    private final TokenGenerationService tokenGenerationService;

    @Value("${jwt.expiration-ms}")
    private long jwtExpirationMs;

    /**
     * POST /login - Authenticate user and return JWT token.
     *
     * @param request LoginRequestDto with username and password
     * @return LoginResponseDto with token, user info, and expiration
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequestDto request) {
        // Find user by username (case-insensitive)
        Optional<User> userOpt = userRepository.findByUsername(request.getUsername().toLowerCase());

        // If not found with lowercase, try original case
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByUsername(request.getUsername());
        }

        // Also try to find with case-insensitive search by iterating (for SQLite compatibility)
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findAll().stream()
                    .filter(u -> u.getUsername().equalsIgnoreCase(request.getUsername()))
                    .findFirst();
        }

        // Generic error for invalid credentials (don't leak if user exists)
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("Invalid credentials"));
        }

        User user = userOpt.get();

        // Verify password
        if (!passwordEncodingService.matchPassword(request.getPassword(), user.getPasswordHash())) {
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("Invalid credentials"));
        }

        // Check if user is activated (passwordSet == true)
        if (!Boolean.TRUE.equals(user.getPasswordSet())) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "User not activated");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        }

        // Generate JWT token
        String token = jwtService.generateToken(user);
        LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(jwtExpirationMs / 1000);

        LoginResponseDto response = new LoginResponseDto();
        response.setToken(token);
        response.setUser(convertToUserDto(user));
        response.setExpiresAt(expiresAt);

        return ResponseEntity.ok(response);
    }

    /**
     * POST /logout - Invalidate user session.
     * Requires authentication via Bearer token.
     *
     * @param authHeader Authorization header with Bearer token
     * @return LogoutResponseDto with success message
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        // Validate token
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

        // Token invalidation could be implemented with a blacklist
        // For now, just return success (stateless approach)
        return ResponseEntity.ok(new LogoutResponseDto("Logged out successfully"));
    }

    /**
     * GET /me - Get current authenticated user info.
     * Requires authentication via Bearer token.
     *
     * @param authHeader Authorization header with Bearer token
     * @return UserDto with current user information
     */
    @GetMapping("/me")
    public ResponseEntity<?> me(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        // Validate token
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

        // Get user from database
        Optional<User> userOpt = userRepository.findById(validation.getUserId());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(createErrorResponse("Unauthorized"));
        }

        return ResponseEntity.ok(convertToUserDto(userOpt.get()));
    }

    /**
     * GET /setup-required - Check if initial admin setup is required.
     * Public endpoint.
     *
     * @return SetupRequiredResponseDto indicating if setup is needed
     */
    @GetMapping("/setup-required")
    public ResponseEntity<SetupRequiredResponseDto> setupRequired() {
        Optional<User> defaultAdmin = userRepository.findByIsDefaultAdmin(true);

        boolean setupRequired = defaultAdmin.isEmpty() || !Boolean.TRUE.equals(defaultAdmin.get().getPasswordSet());

        return ResponseEntity.ok(new SetupRequiredResponseDto(setupRequired));
    }

    /**
     * POST /setup-admin - Set up the initial admin password.
     * Public endpoint (one-time use).
     *
     * @param request SetPasswordRequestDto with password
     * @return UserDto with updated admin info
     */
    @PostMapping("/setup-admin")
    public ResponseEntity<?> setupAdmin(@Valid @RequestBody SetPasswordRequestDto request) {
        // Find default admin
        Optional<User> defaultAdminOpt = userRepository.findByIsDefaultAdmin(true);

        if (defaultAdminOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("Default admin not found"));
        }

        User admin = defaultAdminOpt.get();

        // Check if setup is already complete
        if (Boolean.TRUE.equals(admin.getPasswordSet())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(createErrorResponse("Setup already complete"));
        }

        // Validate password complexity
        PasswordValidationResultDto validation = passwordEncodingService.validatePasswordComplexity(request.getPassword());
        if (!validation.isValid()) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("message", "Invalid password");
            errorResponse.put("errors", validation.getErrors());
            return ResponseEntity.badRequest().body(errorResponse);
        }

        // Encode and set password
        admin.setPasswordHash(passwordEncodingService.encodePassword(request.getPassword()));
        admin.setPasswordSet(true);
        admin.setIsActive(true);
        userRepository.save(admin);

        return ResponseEntity.ok(convertToUserDto(admin));
    }

    /**
     * POST /set-password/{token} - Set password using a first-time login token.
     * Public endpoint.
     *
     * @param tokenValue The token from the URL path
     * @param request SetPasswordRequestDto with password
     * @return UserDto with updated user info
     */
    @PostMapping("/set-password/{token}")
    public ResponseEntity<?> setPassword(
            @PathVariable("token") String tokenValue,
            @Valid @RequestBody SetPasswordRequestDto request) {

        // Validate token
        TokenValidationResultDto tokenValidation = tokenGenerationService.validateToken(tokenValue);

        if (!tokenValidation.isValid()) {
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("Invalid or expired token"));
        }

        User user = tokenValidation.getUser();

        // Validate password complexity
        PasswordValidationResultDto passwordValidation = passwordEncodingService.validatePasswordComplexity(request.getPassword());
        if (!passwordValidation.isValid()) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("message", "Invalid password");
            errorResponse.put("errors", passwordValidation.getErrors());
            return ResponseEntity.badRequest().body(errorResponse);
        }

        // Encode and set password
        user.setPasswordHash(passwordEncodingService.encodePassword(request.getPassword()));
        user.setPasswordSet(true);
        user.setIsActive(true);
        userRepository.save(user);

        // Mark token as used
        tokenGenerationService.markTokenAsUsed(tokenValue);

        return ResponseEntity.ok(convertToUserDto(user));
    }

    /**
     * GET /validate-token/{token} - Validate a first-time login token.
     * Public endpoint.
     *
     * @param tokenValue The token from the URL path
     * @return TokenValidationResponseDto with validation result
     */
    @GetMapping("/validate-token/{token}")
    public ResponseEntity<TokenValidationResponseDto> validateToken(@PathVariable("token") String tokenValue) {
        TokenValidationResultDto validation = tokenGenerationService.validateToken(tokenValue);

        TokenValidationResponseDto response = new TokenValidationResponseDto();

        if (validation.isValid()) {
            response.setValid(true);
            response.setUsername(validation.getUser().getUsername());

            // Get token expiration from repository
            Optional<FirstTimeLoginToken> tokenOpt = tokenRepository.findByToken(tokenValue);
            tokenOpt.ifPresent(t -> response.setExpiresAt(t.getExpiresAt()));
        } else {
            response.setValid(false);
            response.setUsername(null);
            response.setExpiresAt(null);
        }

        return ResponseEntity.ok(response);
    }

    // ==================== Helper methods ====================

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
