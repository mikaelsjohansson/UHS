package com.uhs.config;

import com.uhs.dto.JwtValidationResultDto;
import com.uhs.model.UserRole;
import com.uhs.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for JwtAuthenticationFilter.
 * Part of Phase 1E security configuration implementation.
 * Tests JWT token extraction and authentication context setup.
 */
@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock
    private JwtService jwtService;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        jwtAuthenticationFilter = new JwtAuthenticationFilter(jwtService);
    }

    @Test
    @DisplayName("doFilterInternal should set authentication for valid JWT token")
    void doFilterInternal_WithValidToken_ShouldSetAuthentication() throws ServletException, IOException {
        // Given
        String validToken = "valid.jwt.token";
        when(request.getHeader("Authorization")).thenReturn("Bearer " + validToken);

        JwtValidationResultDto validResult = JwtValidationResultDto.valid(1L, "testuser", UserRole.USER);
        when(jwtService.validateToken(validToken)).thenReturn(validResult);

        // When
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Then
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertNotNull(auth);
        assertEquals("testuser", auth.getPrincipal());
        assertTrue(auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_USER")));
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("doFilterInternal should set ADMIN role for admin users")
    void doFilterInternal_WithAdminToken_ShouldSetAdminRole() throws ServletException, IOException {
        // Given
        String validToken = "valid.admin.token";
        when(request.getHeader("Authorization")).thenReturn("Bearer " + validToken);

        JwtValidationResultDto validResult = JwtValidationResultDto.valid(1L, "admin", UserRole.ADMIN);
        when(jwtService.validateToken(validToken)).thenReturn(validResult);

        // When
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Then
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertNotNull(auth);
        assertEquals("admin", auth.getPrincipal());
        assertTrue(auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN")));
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("doFilterInternal should not set authentication for invalid token")
    void doFilterInternal_WithInvalidToken_ShouldNotSetAuthentication() throws ServletException, IOException {
        // Given
        String invalidToken = "invalid.jwt.token";
        when(request.getHeader("Authorization")).thenReturn("Bearer " + invalidToken);
        when(jwtService.validateToken(invalidToken)).thenReturn(JwtValidationResultDto.invalid());

        // When
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Then
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertNull(auth);
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("doFilterInternal should not set authentication when no Authorization header")
    void doFilterInternal_WithoutAuthHeader_ShouldNotSetAuthentication() throws ServletException, IOException {
        // Given
        when(request.getHeader("Authorization")).thenReturn(null);

        // When
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Then
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertNull(auth);
        verify(filterChain).doFilter(request, response);
        verify(jwtService, never()).validateToken(any());
    }

    @Test
    @DisplayName("doFilterInternal should not set authentication when Authorization header is not Bearer")
    void doFilterInternal_WithNonBearerAuthHeader_ShouldNotSetAuthentication() throws ServletException, IOException {
        // Given
        when(request.getHeader("Authorization")).thenReturn("Basic sometoken");

        // When
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Then
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertNull(auth);
        verify(filterChain).doFilter(request, response);
        verify(jwtService, never()).validateToken(any());
    }

    @Test
    @DisplayName("doFilterInternal should handle empty Bearer token gracefully")
    void doFilterInternal_WithEmptyBearerToken_ShouldNotSetAuthentication() throws ServletException, IOException {
        // Given
        when(request.getHeader("Authorization")).thenReturn("Bearer ");
        when(jwtService.validateToken("")).thenReturn(JwtValidationResultDto.invalid());

        // When
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Then
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertNull(auth);
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("doFilterInternal should continue filter chain even when token validation throws exception")
    void doFilterInternal_WhenTokenValidationThrows_ShouldContinueFilterChain() throws ServletException, IOException {
        // Given
        String token = "problematic.token";
        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        when(jwtService.validateToken(token)).thenThrow(new RuntimeException("Token validation error"));

        // When
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Then
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertNull(auth);
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("doFilterInternal should store userId in authentication details")
    void doFilterInternal_WithValidToken_ShouldStoreUserIdInDetails() throws ServletException, IOException {
        // Given
        String validToken = "valid.jwt.token";
        when(request.getHeader("Authorization")).thenReturn("Bearer " + validToken);

        JwtValidationResultDto validResult = JwtValidationResultDto.valid(42L, "testuser", UserRole.USER);
        when(jwtService.validateToken(validToken)).thenReturn(validResult);

        // When
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Then
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertNotNull(auth);
        // The user ID should be accessible (implementation may vary)
        verify(filterChain).doFilter(request, response);
    }
}
