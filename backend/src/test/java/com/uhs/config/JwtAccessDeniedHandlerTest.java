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
import org.springframework.security.access.AccessDeniedException;

import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for JwtAccessDeniedHandler.
 * Part of Phase 1E security configuration implementation.
 * Tests 403 Forbidden response handling.
 */
@ExtendWith(MockitoExtension.class)
class JwtAccessDeniedHandlerTest {

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    private JwtAccessDeniedHandler accessDeniedHandler;
    private StringWriter stringWriter;
    private PrintWriter printWriter;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() throws IOException {
        accessDeniedHandler = new JwtAccessDeniedHandler();
        stringWriter = new StringWriter();
        printWriter = new PrintWriter(stringWriter);
        objectMapper = new ObjectMapper();
    }

    @Test
    @DisplayName("handle should return 403 Forbidden status")
    void handle_ShouldReturn403Status() throws IOException, ServletException {
        // Given
        AccessDeniedException accessDeniedException = new AccessDeniedException("Access denied");
        when(response.getWriter()).thenReturn(printWriter);

        // When
        accessDeniedHandler.handle(request, response, accessDeniedException);

        // Then
        verify(response).setStatus(HttpServletResponse.SC_FORBIDDEN);
    }

    @Test
    @DisplayName("handle should set content type to application/json")
    void handle_ShouldSetContentTypeToJson() throws IOException, ServletException {
        // Given
        AccessDeniedException accessDeniedException = new AccessDeniedException("Access denied");
        when(response.getWriter()).thenReturn(printWriter);

        // When
        accessDeniedHandler.handle(request, response, accessDeniedException);

        // Then
        verify(response).setContentType("application/json");
    }

    @Test
    @DisplayName("handle should return JSON error response with message")
    void handle_ShouldReturnJsonErrorResponseWithMessage() throws IOException, ServletException {
        // Given
        AccessDeniedException accessDeniedException = new AccessDeniedException("Access denied");
        when(response.getWriter()).thenReturn(printWriter);

        // When
        accessDeniedHandler.handle(request, response, accessDeniedException);
        printWriter.flush();

        // Then
        String responseBody = stringWriter.toString();
        JsonNode jsonNode = objectMapper.readTree(responseBody);
        assertTrue(jsonNode.has("message"));
        assertEquals("Access denied", jsonNode.get("message").asText());
    }

    @Test
    @DisplayName("handle should return JSON error response with timestamp")
    void handle_ShouldReturnJsonErrorResponseWithTimestamp() throws IOException, ServletException {
        // Given
        AccessDeniedException accessDeniedException = new AccessDeniedException("Access denied");
        when(response.getWriter()).thenReturn(printWriter);

        // When
        accessDeniedHandler.handle(request, response, accessDeniedException);
        printWriter.flush();

        // Then
        String responseBody = stringWriter.toString();
        JsonNode jsonNode = objectMapper.readTree(responseBody);
        assertTrue(jsonNode.has("timestamp"));
    }

    @Test
    @DisplayName("handle should return JSON error response with status code")
    void handle_ShouldReturnJsonErrorResponseWithStatusCode() throws IOException, ServletException {
        // Given
        AccessDeniedException accessDeniedException = new AccessDeniedException("Access denied");
        when(response.getWriter()).thenReturn(printWriter);

        // When
        accessDeniedHandler.handle(request, response, accessDeniedException);
        printWriter.flush();

        // Then
        String responseBody = stringWriter.toString();
        JsonNode jsonNode = objectMapper.readTree(responseBody);
        assertTrue(jsonNode.has("status"));
        assertEquals(403, jsonNode.get("status").asInt());
    }

    @Test
    @DisplayName("handle should return JSON error response with error type")
    void handle_ShouldReturnJsonErrorResponseWithErrorType() throws IOException, ServletException {
        // Given
        AccessDeniedException accessDeniedException = new AccessDeniedException("Access denied");
        when(response.getWriter()).thenReturn(printWriter);

        // When
        accessDeniedHandler.handle(request, response, accessDeniedException);
        printWriter.flush();

        // Then
        String responseBody = stringWriter.toString();
        JsonNode jsonNode = objectMapper.readTree(responseBody);
        assertTrue(jsonNode.has("error"));
        assertEquals("Forbidden", jsonNode.get("error").asText());
    }
}
