package com.uhs.config;

import com.uhs.dto.JwtValidationResultDto;
import com.uhs.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

/**
 * JWT Authentication Filter for Spring Security.
 * Part of Phase 1E security configuration implementation.
 *
 * This filter extracts JWT tokens from the Authorization header,
 * validates them, and sets the authentication in the SecurityContext.
 *
 * Note: This is not a @Component to avoid issues with WebMvcTest slice tests.
 * It's created as a @Bean in SecurityConfig instead.
 */
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        try {
            String jwt = extractJwtFromRequest(request);

            if (jwt != null) {
                JwtValidationResultDto validationResult = jwtService.validateToken(jwt);

                if (validationResult.isValid()) {
                    // Create authentication token with user details and role
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    validationResult.getUsername(),
                                    null, // No credentials needed after JWT validation
                                    Collections.singletonList(
                                            new SimpleGrantedAuthority("ROLE_" + validationResult.getRole().name())
                                    )
                            );

                    // Store additional user info in details (userId)
                    authentication.setDetails(validationResult.getUserId());

                    // Set authentication in SecurityContext
                    SecurityContextHolder.getContext().setAuthentication(authentication);

                    log.debug("Set authentication for user: {}", validationResult.getUsername());
                }
            }
        } catch (Exception ex) {
            log.error("Could not set user authentication in security context", ex);
            // Don't fail the filter chain - just continue without authentication
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Extracts JWT token from the Authorization header.
     *
     * @param request the HTTP request
     * @return the JWT token, or null if not present or invalid format
     */
    private String extractJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader(AUTHORIZATION_HEADER);

        if (bearerToken != null && bearerToken.startsWith(BEARER_PREFIX)) {
            return bearerToken.substring(BEARER_PREFIX.length());
        }

        return null;
    }
}
