package com.uhs.config;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.AuthenticationException;

import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for JwtAuthenticationEntryPoint.
 * Part of Phase 1E security configuration implementation.
 * Tests 401 Unauthorized response handling.
 */
@ExtendWith(MockitoExtension.class)
class JwtAuthenticationEntryPointTest {

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private AuthenticationException authException;

    private JwtAuthenticationEntryPoint entryPoint;
    private StringWriter stringWriter;
    private PrintWriter printWriter;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() throws IOException {
        entryPoint = new JwtAuthenticationEntryPoint();
        stringWriter = new StringWriter();
        printWriter = new PrintWriter(stringWriter);
        objectMapper = new ObjectMapper();
    }

    @Test
    @DisplayName("commence should return 401 Unauthorized status")
    void commence_ShouldReturn401Status() throws IOException, ServletException {
        // Given
        when(response.getWriter()).thenReturn(printWriter);
        when(authException.getMessage()).thenReturn("Unauthorized");

        // When
        entryPoint.commence(request, response, authException);

        // Then
        verify(response).setStatus(HttpServletResponse.SC_UNAUTHORIZED);
    }

    @Test
    @DisplayName("commence should set content type to application/json")
    void commence_ShouldSetContentTypeToJson() throws IOException, ServletException {
        // Given
        when(response.getWriter()).thenReturn(printWriter);
        when(authException.getMessage()).thenReturn("Unauthorized");

        // When
        entryPoint.commence(request, response, authException);

        // Then
        verify(response).setContentType("application/json");
    }

    @Test
    @DisplayName("commence should return JSON error response with message")
    void commence_ShouldReturnJsonErrorResponseWithMessage() throws IOException, ServletException {
        // Given
        when(response.getWriter()).thenReturn(printWriter);
        when(authException.getMessage()).thenReturn("Authentication required");

        // When
        entryPoint.commence(request, response, authException);
        printWriter.flush();

        // Then
        String responseBody = stringWriter.toString();
        JsonNode jsonNode = objectMapper.readTree(responseBody);
        assertTrue(jsonNode.has("message"));
        assertEquals("Unauthorized", jsonNode.get("message").asText());
    }

    @Test
    @DisplayName("commence should return JSON error response with timestamp")
    void commence_ShouldReturnJsonErrorResponseWithTimestamp() throws IOException, ServletException {
        // Given
        when(response.getWriter()).thenReturn(printWriter);
        when(authException.getMessage()).thenReturn("Unauthorized");

        // When
        entryPoint.commence(request, response, authException);
        printWriter.flush();

        // Then
        String responseBody = stringWriter.toString();
        JsonNode jsonNode = objectMapper.readTree(responseBody);
        assertTrue(jsonNode.has("timestamp"));
    }

    @Test
    @DisplayName("commence should return JSON error response with status code")
    void commence_ShouldReturnJsonErrorResponseWithStatusCode() throws IOException, ServletException {
        // Given
        when(response.getWriter()).thenReturn(printWriter);
        when(authException.getMessage()).thenReturn("Unauthorized");

        // When
        entryPoint.commence(request, response, authException);
        printWriter.flush();

        // Then
        String responseBody = stringWriter.toString();
        JsonNode jsonNode = objectMapper.readTree(responseBody);
        assertTrue(jsonNode.has("status"));
        assertEquals(401, jsonNode.get("status").asInt());
    }

    @Test
    @DisplayName("commence should return JSON error response with error type")
    void commence_ShouldReturnJsonErrorResponseWithErrorType() throws IOException, ServletException {
        // Given
        when(response.getWriter()).thenReturn(printWriter);
        when(authException.getMessage()).thenReturn("Unauthorized");

        // When
        entryPoint.commence(request, response, authException);
        printWriter.flush();

        // Then
        String responseBody = stringWriter.toString();
        JsonNode jsonNode = objectMapper.readTree(responseBody);
        assertTrue(jsonNode.has("error"));
        assertEquals("Unauthorized", jsonNode.get("error").asText());
    }
}
