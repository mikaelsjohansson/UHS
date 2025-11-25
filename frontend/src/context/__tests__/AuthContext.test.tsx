import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserDto, LoginResponseDto } from '../../types/user';

// Create mocks using vi.hoisted to ensure they're available before module import
const mockAuthService = vi.hoisted(() => ({
  login: vi.fn(),
  logout: vi.fn(),
  getMe: vi.fn(),
  isSetupRequired: vi.fn(),
  setupAdmin: vi.fn(),
  setPassword: vi.fn(),
  validateToken: vi.fn(),
  getToken: vi.fn(),
  isAuthenticated: vi.fn(),
}));

vi.mock('../../services/authService', () => ({
  authService: mockAuthService,
  AUTH_TOKEN_KEY: 'auth_token',
}));

// Import after mocking
import { AuthProvider, useAuth } from '../AuthContext';

// Helper component to test useAuth hook
function TestComponent() {
  const { currentUser, isAuthenticated, isLoading, error, login, logout } = useAuth();

  const handleLogin = async () => {
    try {
      await login('testuser', 'password123');
    } catch {
      // Error is handled by context
    }
  };

  return (
    <div>
      <span data-testid="loading">{isLoading ? 'loading' : 'ready'}</span>
      <span data-testid="authenticated">{isAuthenticated ? 'authenticated' : 'not-authenticated'}</span>
      <span data-testid="error">{error || 'no-error'}</span>
      <span data-testid="username">{currentUser?.username || 'no-user'}</span>
      <button onClick={handleLogin}>Login</button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
}

// Helper component for testing getCurrentUser
function GetCurrentUserTestComponent() {
  const { getCurrentUser, currentUser } = useAuth();

  return (
    <div>
      <span data-testid="username">{currentUser?.username || 'no-user'}</span>
      <button onClick={() => getCurrentUser()}>Refresh User</button>
    </div>
  );
}

// Helper component for testing setPassword
function SetPasswordTestComponent() {
  const { setPassword, isLoading, error } = useAuth();

  const handleSetPassword = async () => {
    try {
      await setPassword('token123', 'newPassword');
    } catch {
      // Error is handled by context
    }
  };

  return (
    <div>
      <span data-testid="loading">{isLoading ? 'loading' : 'ready'}</span>
      <span data-testid="error">{error || 'no-error'}</span>
      <button onClick={handleSetPassword}>Set Password</button>
    </div>
  );
}

// Helper component for testing setupAdmin
function SetupAdminTestComponent() {
  const { setupAdmin, isLoading, error } = useAuth();

  const handleSetupAdmin = async () => {
    try {
      await setupAdmin('adminPassword');
    } catch {
      // Error is handled by context
    }
  };

  return (
    <div>
      <span data-testid="loading">{isLoading ? 'loading' : 'ready'}</span>
      <span data-testid="error">{error || 'no-error'}</span>
      <button onClick={handleSetupAdmin}>Setup Admin</button>
    </div>
  );
}

describe('AuthContext', () => {
  const mockUser: UserDto = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    role: 'USER',
    isActive: true,
    passwordSet: true,
    isDefaultAdmin: false,
    createdAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementations
    mockAuthService.getToken.mockReturnValue(null);
    mockAuthService.isAuthenticated.mockReturnValue(false);
    mockAuthService.getMe.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('AuthProvider', () => {
    it('provides auth context to children', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready');
      });

      expect(screen.getByTestId('authenticated')).toBeInTheDocument();
    });

    it('initializes as not authenticated when no token', async () => {
      mockAuthService.getToken.mockReturnValue(null);
      mockAuthService.isAuthenticated.mockReturnValue(false);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready');
      });

      expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
      expect(screen.getByTestId('username')).toHaveTextContent('no-user');
    });

    it('initializes as authenticated when token exists and user is valid', async () => {
      mockAuthService.getToken.mockReturnValue('valid-token');
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockAuthService.getMe.mockResolvedValue(mockUser);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready');
      });

      expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('username')).toHaveTextContent('testuser');
    });

    it('shows loading state during initialization', async () => {
      mockAuthService.getToken.mockReturnValue('valid-token');
      mockAuthService.isAuthenticated.mockReturnValue(true);
      // Delay the getMe response
      mockAuthService.getMe.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockUser), 100))
      );

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Should be loading initially
      expect(screen.getByTestId('loading')).toHaveTextContent('loading');

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready');
      });
    });
  });

  describe('login', () => {
    it('authenticates user on successful login', async () => {
      const user = userEvent.setup();
      const loginResponse: LoginResponseDto = {
        token: 'jwt-token-123',
        user: mockUser,
        expiresAt: '2024-01-02T00:00:00Z',
      };

      mockAuthService.login.mockResolvedValue(loginResponse);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready');
      });

      await user.click(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
      });

      expect(screen.getByTestId('username')).toHaveTextContent('testuser');
      expect(mockAuthService.login).toHaveBeenCalledWith('testuser', 'password123');
    });

    it('sets error on failed login', async () => {
      const user = userEvent.setup();
      mockAuthService.login.mockRejectedValue(new Error('Invalid credentials'));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready');
      });

      await user.click(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Invalid credentials');
      });

      expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
    });

    it('shows loading state during login', async () => {
      const user = userEvent.setup();
      const loginResponse: LoginResponseDto = {
        token: 'jwt-token-123',
        user: mockUser,
        expiresAt: '2024-01-02T00:00:00Z',
      };

      mockAuthService.login.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(loginResponse), 100))
      );

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready');
      });

      await user.click(screen.getByRole('button', { name: /login/i }));

      // Should show loading
      expect(screen.getByTestId('loading')).toHaveTextContent('loading');

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready');
      });
    });
  });

  describe('logout', () => {
    it('clears user on logout', async () => {
      const user = userEvent.setup();

      // Start authenticated
      mockAuthService.getToken.mockReturnValue('valid-token');
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockAuthService.getMe.mockResolvedValue(mockUser);
      mockAuthService.logout.mockResolvedValue(undefined);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
      });

      await user.click(screen.getByRole('button', { name: /logout/i }));

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
      });

      expect(screen.getByTestId('username')).toHaveTextContent('no-user');
      expect(mockAuthService.logout).toHaveBeenCalled();
    });
  });

  describe('getCurrentUser', () => {
    it('refreshes current user from API', async () => {
      const user = userEvent.setup();
      const updatedUser: UserDto = { ...mockUser, email: 'updated@example.com' };

      mockAuthService.getToken.mockReturnValue('valid-token');
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockAuthService.getMe
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(updatedUser);

      render(
        <AuthProvider>
          <GetCurrentUserTestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('username')).toHaveTextContent('testuser');
      });

      await user.click(screen.getByRole('button', { name: /refresh user/i }));

      await waitFor(() => {
        expect(mockAuthService.getMe).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('setPassword', () => {
    it('calls authService.setPassword with token and password', async () => {
      const user = userEvent.setup();
      mockAuthService.setPassword.mockResolvedValue(undefined);

      render(
        <AuthProvider>
          <SetPasswordTestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready');
      });

      await user.click(screen.getByRole('button', { name: /set password/i }));

      await waitFor(() => {
        expect(mockAuthService.setPassword).toHaveBeenCalledWith('token123', 'newPassword');
      });
    });

    it('sets error on failed setPassword', async () => {
      const user = userEvent.setup();
      mockAuthService.setPassword.mockRejectedValue(new Error('Token expired'));

      render(
        <AuthProvider>
          <SetPasswordTestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready');
      });

      await user.click(screen.getByRole('button', { name: /set password/i }));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Token expired');
      });
    });
  });

  describe('setupAdmin', () => {
    it('calls authService.setupAdmin with password', async () => {
      const user = userEvent.setup();
      mockAuthService.setupAdmin.mockResolvedValue(undefined);

      render(
        <AuthProvider>
          <SetupAdminTestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready');
      });

      await user.click(screen.getByRole('button', { name: /setup admin/i }));

      await waitFor(() => {
        expect(mockAuthService.setupAdmin).toHaveBeenCalledWith('adminPassword');
      });
    });

    it('sets error on failed setupAdmin', async () => {
      const user = userEvent.setup();
      mockAuthService.setupAdmin.mockRejectedValue(new Error('Setup already completed'));

      render(
        <AuthProvider>
          <SetupAdminTestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready');
      });

      await user.click(screen.getByRole('button', { name: /setup admin/i }));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Setup already completed');
      });
    });
  });

  describe('useAuth hook', () => {
    it('throws error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });
  });
});
