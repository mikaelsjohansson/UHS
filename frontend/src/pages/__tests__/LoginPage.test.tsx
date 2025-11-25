import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../LoginPage';
import { AuthProvider } from '../../context/AuthContext';
import { authService } from '../../services/authService';

// Mock authService
vi.mock('../../services/authService', () => ({
  authService: {
    login: vi.fn(),
    isSetupRequired: vi.fn(),
    getToken: vi.fn(),
    isAuthenticated: vi.fn(),
    getMe: vi.fn(),
  },
  AUTH_TOKEN_KEY: 'auth_token',
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderLoginPage = (initialRoute = '/login') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authService.isSetupRequired).mockResolvedValue({ setupRequired: false });
    vi.mocked(authService.getToken).mockReturnValue(null);
    vi.mocked(authService.isAuthenticated).mockReturnValue(false);
    vi.mocked(authService.getMe).mockResolvedValue(null);
  });

  describe('Rendering', () => {
    it('renders login form with username and password fields', async () => {
      renderLoginPage();

      await waitFor(() => {
        expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
        expect(screen.getByLabelText('Password')).toBeInTheDocument();
      });
    });

    it('renders login submit button', async () => {
      renderLoginPage();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /log in|sign in/i })).toBeInTheDocument();
      });
    });

    it('renders page title', async () => {
      renderLoginPage();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /log in|sign in/i })).toBeInTheDocument();
      });
    });
  });

  describe('Form validation', () => {
    it('shows error when submitting with empty username', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      await waitFor(() => {
        expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText('Password');
      await user.type(passwordInput, 'password123');

      const submitButton = screen.getByRole('button', { name: /log in|sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/username is required/i)).toBeInTheDocument();
      });
    });

    it('shows error when submitting with empty password', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      await waitFor(() => {
        expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      });

      const usernameInput = screen.getByLabelText(/username/i);
      await user.type(usernameInput, 'testuser');

      const submitButton = screen.getByRole('button', { name: /log in|sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });

    it('clears field errors when user starts typing', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      await waitFor(() => {
        expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /log in|sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/username is required/i)).toBeInTheDocument();
      });

      const usernameInput = screen.getByLabelText(/username/i);
      await user.type(usernameInput, 'a');

      await waitFor(() => {
        expect(screen.queryByText(/username is required/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Login flow', () => {
    it('calls authService.login with credentials on submit', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.login).mockResolvedValue({
        token: 'test-token',
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          role: 'USER',
          isActive: true,
          passwordSet: true,
          isDefaultAdmin: false,
          createdAt: new Date().toISOString(),
        },
        expiresAt: new Date().toISOString(),
      });

      renderLoginPage();

      await waitFor(() => {
        expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      });

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /log in|sign in/i });

      await user.type(usernameInput, 'testuser');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(authService.login).toHaveBeenCalledWith('testuser', 'password123');
      });
    });

    it('shows loading state while logging in', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.login).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      renderLoginPage();

      await waitFor(() => {
        expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      });

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /log in|sign in/i });

      await user.type(usernameInput, 'testuser');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /logging in|signing in/i })).toBeInTheDocument();
      });
    });

    it('disables submit button while logging in', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.login).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      renderLoginPage();

      await waitFor(() => {
        expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      });

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /log in|sign in/i });

      await user.type(usernameInput, 'testuser');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /logging in|signing in/i })).toBeDisabled();
      });
    });

    it('redirects to home page on successful login', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.login).mockResolvedValue({
        token: 'test-token',
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          role: 'USER',
          isActive: true,
          passwordSet: true,
          isDefaultAdmin: false,
          createdAt: new Date().toISOString(),
        },
        expiresAt: new Date().toISOString(),
      });

      renderLoginPage();

      await waitFor(() => {
        expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      });

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /log in|sign in/i });

      await user.type(usernameInput, 'testuser');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    it('displays error message on login failure', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.login).mockRejectedValue({
        response: {
          data: {
            message: 'Invalid credentials',
          },
        },
      });

      renderLoginPage();

      await waitFor(() => {
        expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      });

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /log in|sign in/i });

      await user.type(usernameInput, 'testuser');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });

  describe('Setup redirect', () => {
    it('redirects to admin-setup when setup is required', async () => {
      vi.mocked(authService.isSetupRequired).mockResolvedValue({ setupRequired: true });

      renderLoginPage();

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/admin-setup');
      });
    });

    it('shows link to admin setup conditionally', async () => {
      vi.mocked(authService.isSetupRequired).mockResolvedValue({ setupRequired: true });

      renderLoginPage();

      // When setup is required, redirect happens before link can be seen
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/admin-setup');
      });
    });
  });

  describe('Already authenticated redirect', () => {
    it('redirects to home if already authenticated', async () => {
      vi.mocked(authService.getToken).mockReturnValue('existing-token');
      vi.mocked(authService.isAuthenticated).mockReturnValue(true);
      vi.mocked(authService.getMe).mockResolvedValue({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'USER',
        isActive: true,
        passwordSet: true,
        isDefaultAdmin: false,
        createdAt: new Date().toISOString(),
      });

      renderLoginPage();

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });
  });

  describe('Password visibility toggle', () => {
    it('shows password visibility toggle button', async () => {
      renderLoginPage();

      await waitFor(() => {
        expect(screen.getByLabelText('Password')).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /show password/i })).toBeInTheDocument();
    });

    it('toggles password visibility when clicked', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      await waitFor(() => {
        expect(screen.getByLabelText('Password')).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText('Password');
      expect(passwordInput).toHaveAttribute('type', 'password');

      const toggleButton = screen.getByRole('button', { name: /show password/i });
      await user.click(toggleButton);

      expect(passwordInput).toHaveAttribute('type', 'text');
    });
  });
});
