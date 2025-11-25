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
import AdminRoute from '../AdminRoute';

// Test component to render inside admin route
function AdminContent() {
  return <div data-testid="admin-content">Admin Content</div>;
}

// Helper to verify redirect
function RedirectCheck({ expectedPath }: { expectedPath: string }) {
  return <div data-testid="redirect-target">Redirected to {expectedPath}</div>;
}

describe('AdminRoute', () => {
  const mockAdminUser = {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    role: 'ADMIN' as const,
    isActive: true,
    passwordSet: true,
    isDefaultAdmin: true,
    createdAt: '2024-01-01T00:00:00Z',
  };

  const mockRegularUser = {
    id: 2,
    username: 'user',
    email: 'user@example.com',
    role: 'USER' as const,
    isActive: true,
    passwordSet: true,
    isDefaultAdmin: false,
    createdAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthService.getToken.mockReturnValue(null);
    mockAuthService.isAuthenticated.mockReturnValue(false);
    mockAuthService.getMe.mockResolvedValue(null);
    mockAuthService.isSetupRequired.mockResolvedValue({ setupRequired: false });
  });

  const renderWithRouter = (initialRoute: string = '/admin') => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<RedirectCheck expectedPath="/login" />} />
            <Route path="/" element={<RedirectCheck expectedPath="/" />} />
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminContent />} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );
  };

  it('renders Outlet when user is authenticated and has admin role', async () => {
    mockAuthService.getToken.mockReturnValue('valid-token');
    mockAuthService.isAuthenticated.mockReturnValue(true);
    mockAuthService.getMe.mockResolvedValue(mockAdminUser);

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByTestId('admin-content')).toBeInTheDocument();
    });
  });

  it('redirects to / when user is authenticated but not an admin', async () => {
    mockAuthService.getToken.mockReturnValue('valid-token');
    mockAuthService.isAuthenticated.mockReturnValue(true);
    mockAuthService.getMe.mockResolvedValue(mockRegularUser);

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByTestId('redirect-target')).toHaveTextContent('Redirected to /');
    });
  });

  it('redirects to /login when user is not authenticated', async () => {
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
      () => new Promise((resolve) => setTimeout(() => resolve(mockAdminUser), 100))
    );

    renderWithRouter();

    // Should show loading initially
    expect(screen.getByRole('status')).toBeInTheDocument();

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('admin-content')).toBeInTheDocument();
    });
  });

  it('redirects non-admin user to home even if authenticated', async () => {
    mockAuthService.getToken.mockReturnValue('valid-token');
    mockAuthService.isAuthenticated.mockReturnValue(true);
    mockAuthService.getMe.mockResolvedValue(mockRegularUser);

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByTestId('redirect-target')).toHaveTextContent('Redirected to /');
    });

    // Should not show admin content
    expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
  });
});
