package com.uhs.service;

import com.uhs.dto.CreateUserRequestDto;
import com.uhs.dto.PasswordValidationResultDto;
import com.uhs.dto.UpdateUserRequestDto;
import com.uhs.model.FirstTimeLoginToken;
import com.uhs.model.User;
import com.uhs.model.UserRole;
import com.uhs.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Unit tests for UserService.
 * Part of Phase 1B user management implementation.
 * Tests user CRUD operations, password management, and admin functionality.
 */
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncodingService passwordEncodingService;

    @Mock
    private TokenGenerationService tokenGenerationService;

    private UserService userService;

    private User testUser;
    private CreateUserRequestDto createUserRequestDto;
    private UpdateUserRequestDto updateUserRequestDto;
    private FirstTimeLoginToken testToken;

    @BeforeEach
    void setUp() {
        userService = new UserService(userRepository, passwordEncodingService, tokenGenerationService);

        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");
        testUser.setEmail("test@example.com");
        testUser.setRole(UserRole.USER);
        testUser.setIsActive(false);
        testUser.setPasswordSet(false);
        testUser.setIsDefaultAdmin(false);
        testUser.setCreatedAt(LocalDateTime.now());

        createUserRequestDto = new CreateUserRequestDto();
        createUserRequestDto.setUsername("newuser");
        createUserRequestDto.setEmail("newuser@example.com");
        createUserRequestDto.setRole(UserRole.USER);

        updateUserRequestDto = new UpdateUserRequestDto();
        updateUserRequestDto.setEmail("updated@example.com");
        updateUserRequestDto.setRole(UserRole.ADMIN);
        updateUserRequestDto.setIsActive(true);

        testToken = new FirstTimeLoginToken();
        testToken.setId(1L);
        testToken.setToken(UUID.randomUUID().toString());
        testToken.setUser(testUser);
        testToken.setExpiresAt(LocalDateTime.now().plusMinutes(15));
        testToken.setUsed(false);
    }

    // ==================== Create User Tests ====================

    @Test
    @DisplayName("createUser should create new user with inactive status and no password set")
    void createUser_ShouldCreateNewUserWithInactiveStatusAndNoPasswordSet() {
        // Given
        when(userRepository.findByUsernameIgnoreCase(anyString())).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User saved = invocation.getArgument(0);
            saved.setId(1L);
            return saved;
        });
        when(passwordEncodingService.encodePassword(anyString())).thenReturn("encoded-random-password");
        when(tokenGenerationService.generateTokenForUser(any(User.class))).thenReturn(testToken);

        // When
        User result = userService.createUser(createUserRequestDto);

        // Then
        assertNotNull(result);
        assertEquals("newuser", result.getUsername());
        assertEquals("newuser@example.com", result.getEmail());
        assertEquals(UserRole.USER, result.getRole());
        assertFalse(result.getIsActive());
        assertFalse(result.getPasswordSet());
        assertFalse(result.getIsDefaultAdmin());

        verify(userRepository).save(any(User.class));
        verify(tokenGenerationService).generateTokenForUser(any(User.class));
    }

    @Test
    @DisplayName("createUser should throw exception if username already exists")
    void createUser_ShouldThrowExceptionIfUsernameExists() {
        // Given
        User existingUser = new User();
        existingUser.setUsername("newuser");
        when(userRepository.findByUsernameIgnoreCase("newuser")).thenReturn(Optional.of(existingUser));

        // When & Then
        assertThrows(RuntimeException.class, () -> userService.createUser(createUserRequestDto));
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("createUser should set default role to USER if not specified")
    void createUser_ShouldSetDefaultRoleToUserIfNotSpecified() {
        // Given
        createUserRequestDto.setRole(null);
        when(userRepository.findByUsernameIgnoreCase(anyString())).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User saved = invocation.getArgument(0);
            saved.setId(1L);
            return saved;
        });
        when(passwordEncodingService.encodePassword(anyString())).thenReturn("encoded-random-password");
        when(tokenGenerationService.generateTokenForUser(any(User.class))).thenReturn(testToken);

        // When
        User result = userService.createUser(createUserRequestDto);

        // Then
        assertEquals(UserRole.USER, result.getRole());
    }

    @Test
    @DisplayName("createUser should generate first-time login token")
    void createUser_ShouldGenerateFirstTimeLoginToken() {
        // Given
        when(userRepository.findByUsernameIgnoreCase(anyString())).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User saved = invocation.getArgument(0);
            saved.setId(1L);
            return saved;
        });
        when(passwordEncodingService.encodePassword(anyString())).thenReturn("encoded-random-password");
        when(tokenGenerationService.generateTokenForUser(any(User.class))).thenReturn(testToken);

        // When
        userService.createUser(createUserRequestDto);

        // Then
        verify(tokenGenerationService, times(1)).generateTokenForUser(any(User.class));
    }

    // ==================== Get User Tests ====================

    @Test
    @DisplayName("getUserById should return user when exists")
    void getUserById_ShouldReturnUserWhenExists() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        // When
        User result = userService.getUserById(1L);

        // Then
        assertNotNull(result);
        assertEquals(testUser.getId(), result.getId());
        assertEquals(testUser.getUsername(), result.getUsername());
    }

    @Test
    @DisplayName("getUserById should throw exception when user not found")
    void getUserById_ShouldThrowExceptionWhenNotFound() {
        // Given
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        assertThrows(RuntimeException.class, () -> userService.getUserById(999L));
    }

    @Test
    @DisplayName("getUserByUsername should return user when exists")
    void getUserByUsername_ShouldReturnUserWhenExists() {
        // Given
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));

        // When
        User result = userService.getUserByUsername("testuser");

        // Then
        assertNotNull(result);
        assertEquals(testUser.getUsername(), result.getUsername());
    }

    @Test
    @DisplayName("getUserByUsername should throw exception when user not found")
    void getUserByUsername_ShouldThrowExceptionWhenNotFound() {
        // Given
        when(userRepository.findByUsername("nonexistent")).thenReturn(Optional.empty());

        // When & Then
        assertThrows(RuntimeException.class, () -> userService.getUserByUsername("nonexistent"));
    }

    @Test
    @DisplayName("getAllUsers should return all users")
    void getAllUsers_ShouldReturnAllUsers() {
        // Given
        User user2 = new User();
        user2.setId(2L);
        user2.setUsername("user2");
        user2.setRole(UserRole.ADMIN);

        List<User> users = Arrays.asList(testUser, user2);
        when(userRepository.findAll()).thenReturn(users);

        // When
        List<User> result = userService.getAllUsers();

        // Then
        assertNotNull(result);
        assertEquals(2, result.size());
    }

    // ==================== Update User Tests ====================

    @Test
    @DisplayName("updateUser should update user fields")
    void updateUser_ShouldUpdateUserFields() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        User result = userService.updateUser(1L, updateUserRequestDto);

        // Then
        assertNotNull(result);
        assertEquals("updated@example.com", result.getEmail());
        assertEquals(UserRole.ADMIN, result.getRole());
        assertTrue(result.getIsActive());

        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("updateUser should throw exception when user not found")
    void updateUser_ShouldThrowExceptionWhenNotFound() {
        // Given
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        assertThrows(RuntimeException.class, () -> userService.updateUser(999L, updateUserRequestDto));
    }

    @Test
    @DisplayName("updateUser should only update non-null fields")
    void updateUser_ShouldOnlyUpdateNonNullFields() {
        // Given
        UpdateUserRequestDto partialUpdate = new UpdateUserRequestDto();
        partialUpdate.setEmail("partial@example.com");
        // role and isActive are null

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        User result = userService.updateUser(1L, partialUpdate);

        // Then
        assertEquals("partial@example.com", result.getEmail());
        assertEquals(UserRole.USER, result.getRole()); // Unchanged
        assertFalse(result.getIsActive()); // Unchanged
    }

    // ==================== Delete User Tests ====================

    @Test
    @DisplayName("deleteUser should delete non-admin user")
    void deleteUser_ShouldDeleteNonAdminUser() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        // When
        userService.deleteUser(1L);

        // Then
        verify(userRepository).delete(testUser);
    }

    @Test
    @DisplayName("deleteUser should throw exception for default admin")
    void deleteUser_ShouldThrowExceptionForDefaultAdmin() {
        // Given
        User adminUser = new User();
        adminUser.setId(1L);
        adminUser.setUsername("admin");
        adminUser.setRole(UserRole.ADMIN);
        adminUser.setIsDefaultAdmin(true);

        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));

        // When & Then
        assertThrows(RuntimeException.class, () -> userService.deleteUser(1L));
        verify(userRepository, never()).delete(any());
    }

    @Test
    @DisplayName("deleteUser should throw exception when user not found")
    void deleteUser_ShouldThrowExceptionWhenNotFound() {
        // Given
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        assertThrows(RuntimeException.class, () -> userService.deleteUser(999L));
    }

    // ==================== Set Password Tests ====================

    @Test
    @DisplayName("setUserPassword should set password and activate user")
    void setUserPassword_ShouldSetPasswordAndActivateUser() {
        // Given
        String validPassword = "SecurePass123!@#";
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(passwordEncodingService.validatePasswordComplexity(validPassword))
                .thenReturn(PasswordValidationResultDto.valid());
        when(passwordEncodingService.encodePassword(validPassword)).thenReturn("encoded-password");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        userService.setUserPassword(1L, validPassword);

        // Then
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());

        User savedUser = userCaptor.getValue();
        assertEquals("encoded-password", savedUser.getPasswordHash());
        assertTrue(savedUser.getPasswordSet());
        assertTrue(savedUser.getIsActive());
    }

    @Test
    @DisplayName("setUserPassword should throw exception for invalid password")
    void setUserPassword_ShouldThrowExceptionForInvalidPassword() {
        // Given
        String weakPassword = "weak";
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(passwordEncodingService.validatePasswordComplexity(weakPassword))
                .thenReturn(PasswordValidationResultDto.invalid(List.of("Password too weak")));

        // When & Then
        assertThrows(RuntimeException.class, () -> userService.setUserPassword(1L, weakPassword));
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("setUserPassword should throw exception when user not found")
    void setUserPassword_ShouldThrowExceptionWhenNotFound() {
        // Given
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        assertThrows(RuntimeException.class, () -> userService.setUserPassword(999L, "anypassword"));
    }

    // ==================== Create Default Admin Tests ====================

    @Test
    @DisplayName("createDefaultAdmin should create admin when not exists")
    void createDefaultAdmin_ShouldCreateAdminWhenNotExists() {
        // Given
        when(userRepository.findByIsDefaultAdmin(true)).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User saved = invocation.getArgument(0);
            saved.setId(1L);
            return saved;
        });
        when(tokenGenerationService.generateToken(1L)).thenReturn(testToken);

        // When
        userService.createDefaultAdmin();

        // Then
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());

        User savedAdmin = userCaptor.getValue();
        assertEquals("admin", savedAdmin.getUsername());
        assertEquals(UserRole.ADMIN, savedAdmin.getRole());
        assertTrue(savedAdmin.getIsDefaultAdmin());
        assertFalse(savedAdmin.getIsActive());
        assertFalse(savedAdmin.getPasswordSet());
    }

    @Test
    @DisplayName("createDefaultAdmin should not create admin when already exists")
    void createDefaultAdmin_ShouldNotCreateAdminWhenExists() {
        // Given
        User existingAdmin = new User();
        existingAdmin.setId(1L);
        existingAdmin.setUsername("admin");
        existingAdmin.setIsDefaultAdmin(true);

        when(userRepository.findByIsDefaultAdmin(true)).thenReturn(Optional.of(existingAdmin));

        // When
        userService.createDefaultAdmin();

        // Then
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("createDefaultAdmin should generate first-time login token for new admin")
    void createDefaultAdmin_ShouldGenerateFirstTimeLoginTokenForNewAdmin() {
        // Given
        when(userRepository.findByIsDefaultAdmin(true)).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User saved = invocation.getArgument(0);
            saved.setId(1L);
            return saved;
        });
        when(tokenGenerationService.generateToken(1L)).thenReturn(testToken);

        // When
        userService.createDefaultAdmin();

        // Then
        verify(tokenGenerationService).generateToken(1L);
    }

    // ==================== Edge Cases ====================

    @Test
    @DisplayName("createUser with admin role should work correctly")
    void createUser_WithAdminRoleShouldWorkCorrectly() {
        // Given
        createUserRequestDto.setRole(UserRole.ADMIN);
        when(userRepository.findByUsernameIgnoreCase(anyString())).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User saved = invocation.getArgument(0);
            saved.setId(1L);
            return saved;
        });
        when(passwordEncodingService.encodePassword(anyString())).thenReturn("encoded-random-password");
        when(tokenGenerationService.generateTokenForUser(any(User.class))).thenReturn(testToken);

        // When
        User result = userService.createUser(createUserRequestDto);

        // Then
        assertEquals(UserRole.ADMIN, result.getRole());
        assertFalse(result.getIsDefaultAdmin()); // Not a default admin
    }

    @Test
    @DisplayName("deleteUser should allow deleting non-default admin users")
    void deleteUser_ShouldAllowDeletingNonDefaultAdminUsers() {
        // Given
        User adminUser = new User();
        adminUser.setId(2L);
        adminUser.setUsername("secondadmin");
        adminUser.setRole(UserRole.ADMIN);
        adminUser.setIsDefaultAdmin(false); // Not the default admin

        when(userRepository.findById(2L)).thenReturn(Optional.of(adminUser));

        // When
        userService.deleteUser(2L);

        // Then
        verify(userRepository).delete(adminUser);
    }
}
