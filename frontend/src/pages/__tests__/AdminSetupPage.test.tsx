import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AdminSetupPage from '../AdminSetupPage';
import { AuthProvider } from '../../context/AuthContext';
import { authService } from '../../services/authService';

// Mock authService
vi.mock('../../services/authService', () => ({
  authService: {
    isSetupRequired: vi.fn(),
    setupAdmin: vi.fn(),
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

const renderAdminSetupPage = () => {
  return render(
    <MemoryRouter initialEntries={['/admin-setup']}>
      <AuthProvider>
        <AdminSetupPage />
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('AdminSetupPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authService.isSetupRequired).mockResolvedValue({ setupRequired: true });
    vi.mocked(authService.getToken).mockReturnValue(null);
    vi.mocked(authService.isAuthenticated).mockReturnValue(false);
    vi.mocked(authService.getMe).mockResolvedValue(null);
  });

  describe('Rendering', () => {
    it('renders setup form with password fields', async () => {
      renderAdminSetupPage();

      await waitFor(() => {
        expect(screen.getByLabelText('Password')).toBeInTheDocument();
        expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      });
    });

    it('renders page title explaining first-time setup', async () => {
      renderAdminSetupPage();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /admin setup|set.*admin.*password/i })).toBeInTheDocument();
      });
    });

    it('renders info text explaining one-time setup', async () => {
      renderAdminSetupPage();

      await waitFor(() => {
        expect(screen.getByText(/first.*time|initial|one.*time/i)).toBeInTheDocument();
      });
    });

    it('renders submit button', async () => {
      renderAdminSetupPage();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /set.*password|create.*admin|setup/i })).toBeInTheDocument();
      });
    });
  });

  describe('Password strength indicator', () => {
    it('shows password strength indicator for password field', async () => {
      renderAdminSetupPage();

      await waitFor(() => {
        expect(screen.getByTestId('strength-bar')).toBeInTheDocument();
      });
    });

    it('shows password requirements checklist', async () => {
      renderAdminSetupPage();

      await waitFor(() => {
        expect(screen.getByText(/at least 12 characters/i)).toBeInTheDocument();
      });
    });

    it('updates strength indicator as user types', async () => {
      const user = userEvent.setup();
      renderAdminSetupPage();

      await waitFor(() => {
        expect(screen.getByLabelText('Password')).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText('Password');
      await user.type(passwordInput, 'ValidPass123!');

      await waitFor(() => {
        const strengthBar = screen.getByTestId('strength-bar-fill');
        expect(strengthBar).toHaveClass('strength-strong');
      });
    });
  });

  describe('Form validation', () => {
    it('shows error when passwords do not match', async () => {
      const user = userEvent.setup();
      renderAdminSetupPage();

      await waitFor(() => {
        expect(screen.getByLabelText('Password')).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText('Password');
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /set.*password|create.*admin|setup/i });

      await user.type(passwordInput, 'ValidPass123!');
      await user.type(confirmInput, 'DifferentPass123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/passwords.*match|do not match/i)).toBeInTheDocument();
      });
    });

    it('shows error when password does not meet complexity requirements', async () => {
      const user = userEvent.setup();
      renderAdminSetupPage();

      await waitFor(() => {
        expect(screen.getByLabelText('Password')).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText('Password');
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /set.*password|create.*admin|setup/i });

      await user.type(passwordInput, 'weak');
      await user.type(confirmInput, 'weak');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });

    it('clears error when user starts typing', async () => {
      const user = userEvent.setup();
      renderAdminSetupPage();

      await waitFor(() => {
        expect(screen.getByLabelText('Password')).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText('Password');
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /set.*password|create.*admin|setup/i });

      await user.type(passwordInput, 'ValidPass123!');
      await user.type(confirmInput, 'DifferentPass!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/passwords.*match|do not match/i)).toBeInTheDocument();
      });

      await user.type(confirmInput, '123');

      await waitFor(() => {
        expect(screen.queryByText(/passwords.*match|do not match/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Setup flow', () => {
    it('calls authService.setupAdmin with password on successful submit', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.setupAdmin).mockResolvedValue(undefined);

      renderAdminSetupPage();

      await waitFor(() => {
        expect(screen.getByLabelText('Password')).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText('Password');
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /set.*password|create.*admin|setup/i });

      await user.type(passwordInput, 'ValidPass123!');
      await user.type(confirmInput, 'ValidPass123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(authService.setupAdmin).toHaveBeenCalledWith('ValidPass123!');
      });
    });

    it('shows loading state while setting up', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.setupAdmin).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      renderAdminSetupPage();

      await waitFor(() => {
        expect(screen.getByLabelText('Password')).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText('Password');
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /set.*password|create.*admin|setup/i });

      await user.type(passwordInput, 'ValidPass123!');
      await user.type(confirmInput, 'ValidPass123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /setting up|creating/i })).toBeInTheDocument();
      });
    });

    it('redirects to login page on successful setup', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.setupAdmin).mockResolvedValue(undefined);

      renderAdminSetupPage();

      await waitFor(() => {
        expect(screen.getByLabelText('Password')).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText('Password');
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /set.*password|create.*admin|setup/i });

      await user.type(passwordInput, 'ValidPass123!');
      await user.type(confirmInput, 'ValidPass123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });

    it('displays error message on setup failure', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.setupAdmin).mockRejectedValue({
        response: {
          data: {
            message: 'Setup failed',
          },
        },
      });

      renderAdminSetupPage();

      await waitFor(() => {
        expect(screen.getByLabelText('Password')).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText('Password');
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /set.*password|create.*admin|setup/i });

      await user.type(passwordInput, 'ValidPass123!');
      await user.type(confirmInput, 'ValidPass123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });

  describe('Redirects', () => {
    it('redirects to login if setup is not required', async () => {
      vi.mocked(authService.isSetupRequired).mockResolvedValue({ setupRequired: false });

      renderAdminSetupPage();

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });

    it('redirects to home if already authenticated', async () => {
      vi.mocked(authService.getToken).mockReturnValue('existing-token');
      vi.mocked(authService.isAuthenticated).mockReturnValue(true);
      vi.mocked(authService.getMe).mockResolvedValue({
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        role: 'ADMIN',
        isActive: true,
        passwordSet: true,
        isDefaultAdmin: true,
        createdAt: new Date().toISOString(),
      });

      renderAdminSetupPage();

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });
  });
});
