import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

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

import { AuthProvider } from '../../context/AuthContext';
import ProtectedRoute from '../ProtectedRoute';

// Test component to render inside protected route
function ProtectedContent() {
  return <div data-testid="protected-content">Protected Content</div>;
}

// Helper to verify redirect
function RedirectCheck({ expectedPath }: { expectedPath: string }) {
  return <div data-testid="redirect-target">Redirected to {expectedPath}</div>;
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthService.getToken.mockReturnValue(null);
    mockAuthService.isAuthenticated.mockReturnValue(false);
    mockAuthService.getMe.mockResolvedValue(null);
    mockAuthService.isSetupRequired.mockResolvedValue({ setupRequired: false });
  });

  const renderWithRouter = (initialRoute: string = '/protected') => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<RedirectCheck expectedPath="/login" />} />
            <Route path="/admin-setup" element={<RedirectCheck expectedPath="/admin-setup" />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/protected" element={<ProtectedContent />} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );
  };

  it('renders Outlet when user is authenticated', async () => {
    mockAuthService.getToken.mockReturnValue('valid-token');
    mockAuthService.isAuthenticated.mockReturnValue(true);
    mockAuthService.getMe.mockResolvedValue({
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      role: 'USER',
      isActive: true,
      passwordSet: true,
      isDefaultAdmin: false,
      createdAt: '2024-01-01T00:00:00Z',
    });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  it('redirects to /admin-setup when not authenticated and setup is required', async () => {
    mockAuthService.getToken.mockReturnValue(null);
    mockAuthService.isAuthenticated.mockReturnValue(false);
    mockAuthService.getMe.mockResolvedValue(null);
    mockAuthService.isSetupRequired.mockResolvedValue({ setupRequired: true });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByTestId('redirect-target')).toHaveTextContent('Redirected to /admin-setup');
    });
  });

  it('redirects to /login when not authenticated and setup is complete', async () => {
    mockAuthService.getToken.mockReturnValue(null);
    mockAuthService.isAuthenticated.mockReturnValue(false);
    mockAuthService.getMe.mockResolvedValue(null);
    mockAuthService.isSetupRequired.mockResolvedValue({ setupRequired: false });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByTestId('redirect-target')).toHaveTextContent('Redirected to /login');
    });
  });

  it('shows loading spinner while checking auth status', async () => {
    mockAuthService.getToken.mockReturnValue('valid-token');
    mockAuthService.isAuthenticated.mockReturnValue(true);
    // Delay the getMe response to see loading state
    mockAuthService.getMe.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'USER',
        isActive: true,
        passwordSet: true,
        isDefaultAdmin: false,
        createdAt: '2024-01-01T00:00:00Z',
      }), 100))
    );

    renderWithRouter();

    // Should show loading initially
    expect(screen.getByRole('status')).toBeInTheDocument();

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  it('handles error during setup status check gracefully', async () => {
    mockAuthService.getToken.mockReturnValue(null);
    mockAuthService.isAuthenticated.mockReturnValue(false);
    mockAuthService.getMe.mockResolvedValue(null);
    mockAuthService.isSetupRequired.mockRejectedValue(new Error('Network error'));

    renderWithRouter();

    // Should redirect to login on error (safe fallback)
    await waitFor(() => {
      expect(screen.getByTestId('redirect-target')).toHaveTextContent('Redirected to /login');
    });
  });
});
