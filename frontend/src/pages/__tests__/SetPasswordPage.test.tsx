import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SetPasswordPage from '../SetPasswordPage';
import { AuthProvider } from '../../context/AuthContext';
import { authService } from '../../services/authService';

// Mock authService
vi.mock('../../services/authService', () => ({
  authService: {
    validateToken: vi.fn(),
    setPassword: vi.fn(),
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

const renderSetPasswordPage = (token = 'valid-token') => {
  return render(
    <MemoryRouter initialEntries={[`/setup-password/${token}`]}>
      <AuthProvider>
        <Routes>
          <Route path="/setup-password/:token" element={<SetPasswordPage />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('SetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authService.getToken).mockReturnValue(null);
    vi.mocked(authService.isAuthenticated).mockReturnValue(false);
    vi.mocked(authService.getMe).mockResolvedValue(null);
  });

  describe('Token validation on mount', () => {
    it('validates token and shows form for valid token', async () => {
      vi.mocked(authService.validateToken).mockResolvedValue({
        valid: true,
        username: 'testuser',
        expiresAt: new Date(Date.now() + 86400000).toISOString(), // 24 hours from now
      });

      renderSetPasswordPage();

      await waitFor(() => {
        expect(authService.validateToken).toHaveBeenCalledWith('valid-token');
      });

      await waitFor(() => {
        expect(screen.getByLabelText('Password')).toBeInTheDocument();
      });
    });

    it('displays username from token validation', async () => {
      vi.mocked(authService.validateToken).mockResolvedValue({
        valid: true,
        username: 'john.doe',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      });

      renderSetPasswordPage();

      await waitFor(() => {
        expect(screen.getByText(/john\.doe/i)).toBeInTheDocument();
      });
    });

    it('shows expired message for expired token', async () => {
      vi.mocked(authService.validateToken).mockResolvedValue({
        valid: false,
        username: '',
        expiresAt: new Date(Date.now() - 86400000).toISOString(), // 24 hours ago
      });

      renderSetPasswordPage('expired-token');

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /expired/i })).toBeInTheDocument();
      });

      // Form should not be visible
      expect(screen.queryByLabelText('Password')).not.toBeInTheDocument();
    });

    it('shows invalid message for invalid token', async () => {
      vi.mocked(authService.validateToken).mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Token not found' },
        },
      });

      renderSetPasswordPage('invalid-token');

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /invalid/i })).toBeInTheDocument();
      });
    });

    it('shows loading state while validating token', async () => {
      vi.mocked(authService.validateToken).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      renderSetPasswordPage();

      expect(screen.getByText(/loading|validating/i)).toBeInTheDocument();
    });
  });

  describe('Form rendering for valid token', () => {
    beforeEach(() => {
      vi.mocked(authService.validateToken).mockResolvedValue({
        valid: true,
        username: 'testuser',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      });
    });

    it('renders password and confirm password fields', async () => {
      renderSetPasswordPage();

      await waitFor(() => {
        expect(screen.getByLabelText('Password')).toBeInTheDocument();
        expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      });
    });

    it('renders password strength indicator', async () => {
      renderSetPasswordPage();

      await waitFor(() => {
        expect(screen.getByTestId('strength-bar')).toBeInTheDocument();
      });
    });

    it('renders submit button', async () => {
      renderSetPasswordPage();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /set.*password|create.*password/i })).toBeInTheDocument();
      });
    });
  });

  describe('Form validation', () => {
    beforeEach(() => {
      vi.mocked(authService.validateToken).mockResolvedValue({
        valid: true,
        username: 'testuser',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      });
    });

    it('shows error when passwords do not match', async () => {
      const user = userEvent.setup();
      renderSetPasswordPage();

      await waitFor(() => {
        expect(screen.getByLabelText('Password')).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText('Password');
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /set.*password|create.*password/i });

      await user.type(passwordInput, 'ValidPass123!');
      await user.type(confirmInput, 'DifferentPass123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/passwords.*match|do not match/i)).toBeInTheDocument();
      });
    });

    it('shows error when password does not meet complexity requirements', async () => {
      const user = userEvent.setup();
      renderSetPasswordPage();

      await waitFor(() => {
        expect(screen.getByLabelText('Password')).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText('Password');
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /set.*password|create.*password/i });

      await user.type(passwordInput, 'weak');
      await user.type(confirmInput, 'weak');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });

  describe('Password set flow', () => {
    beforeEach(() => {
      vi.mocked(authService.validateToken).mockResolvedValue({
        valid: true,
        username: 'testuser',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      });
    });

    it('calls authService.setPassword with token and password on successful submit', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.setPassword).mockResolvedValue(undefined);

      renderSetPasswordPage('my-token');

      await waitFor(() => {
        expect(screen.getByLabelText('Password')).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText('Password');
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /set.*password|create.*password/i });

      await user.type(passwordInput, 'ValidPass123!');
      await user.type(confirmInput, 'ValidPass123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(authService.setPassword).toHaveBeenCalledWith('my-token', 'ValidPass123!');
      });
    });

    it('shows loading state while setting password', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.setPassword).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      renderSetPasswordPage();

      await waitFor(() => {
        expect(screen.getByLabelText('Password')).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText('Password');
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /set.*password|create.*password/i });

      await user.type(passwordInput, 'ValidPass123!');
      await user.type(confirmInput, 'ValidPass123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /setting|creating/i })).toBeInTheDocument();
      });
    });

    it('redirects to login on successful password set', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.setPassword).mockResolvedValue(undefined);

      renderSetPasswordPage();

      await waitFor(() => {
        expect(screen.getByLabelText('Password')).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText('Password');
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /set.*password|create.*password/i });

      await user.type(passwordInput, 'ValidPass123!');
      await user.type(confirmInput, 'ValidPass123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });

    it('displays error message on password set failure', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.setPassword).mockRejectedValue({
        response: {
          data: {
            message: 'Failed to set password',
          },
        },
      });

      renderSetPasswordPage();

      await waitFor(() => {
        expect(screen.getByLabelText('Password')).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText('Password');
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /set.*password|create.*password/i });

      await user.type(passwordInput, 'ValidPass123!');
      await user.type(confirmInput, 'ValidPass123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });

  describe('Token expiry information', () => {
    it('shows remaining time for token validity', async () => {
      const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour from now
      vi.mocked(authService.validateToken).mockResolvedValue({
        valid: true,
        username: 'testuser',
        expiresAt,
      });

      renderSetPasswordPage();

      await waitFor(() => {
        expect(screen.getByLabelText('Password')).toBeInTheDocument();
      });

      // Should show some indication of remaining time
      expect(screen.getByText(/expire|valid/i)).toBeInTheDocument();
    });
  });
});
