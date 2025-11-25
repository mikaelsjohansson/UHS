import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Navigation from '../Navigation';
import { ThemeProvider } from '../../context/ThemeContext';
import { AuthProvider } from '../../context/AuthContext';

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

// Create a mock localStorage
function createMockLocalStorage() {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
}

describe('Navigation', () => {
  let originalMatchMedia: typeof window.matchMedia;
  let mockMatchMedia: ReturnType<typeof vi.fn>;
  let mockLocalStorage: ReturnType<typeof createMockLocalStorage>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create and setup mock localStorage
    mockLocalStorage = createMockLocalStorage();
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
      configurable: true,
    });

    // Store original matchMedia
    originalMatchMedia = window.matchMedia;

    // Mock matchMedia for system preference detection
    mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    window.matchMedia = mockMatchMedia as unknown as typeof window.matchMedia;

    // Reset document.documentElement.dataset.theme
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    // Restore original matchMedia
    window.matchMedia = originalMatchMedia;
    // Clean up
    document.documentElement.removeAttribute('data-theme');
  });

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
    username: 'regularuser',
    email: 'user@example.com',
    role: 'USER' as const,
    isActive: true,
    passwordSet: true,
    isDefaultAdmin: false,
    createdAt: '2024-01-01T00:00:00Z',
  };

  const renderNavigation = () => {
    return render(
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <Navigation />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    );
  };

  describe('Basic Navigation', () => {
    beforeEach(() => {
      mockAuthService.getToken.mockReturnValue('valid-token');
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockAuthService.getMe.mockResolvedValue(mockRegularUser);
    });

    it('renders the app brand/logo', async () => {
      renderNavigation();

      await waitFor(() => {
        expect(screen.getByText('UHS')).toBeInTheDocument();
      });
    });

    it('renders navigation element with role', async () => {
      renderNavigation();

      await waitFor(() => {
        const nav = screen.getByRole('navigation');
        expect(nav).toBeInTheDocument();
      });
    });

    it('brand logo is clickable link to home', async () => {
      renderNavigation();

      await waitFor(() => {
        const brandLink = screen.getByRole('link', { name: /uhs/i });
        expect(brandLink).toBeInTheDocument();
        expect(brandLink).toHaveAttribute('href', '/');
      });
    });
  });

  describe('User Profile Section', () => {
    it('displays username when authenticated', async () => {
      mockAuthService.getToken.mockReturnValue('valid-token');
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockAuthService.getMe.mockResolvedValue(mockRegularUser);

      renderNavigation();

      await waitFor(() => {
        expect(screen.getByText('regularuser')).toBeInTheDocument();
      });
    });

    it('displays admin username when authenticated as admin', async () => {
      mockAuthService.getToken.mockReturnValue('valid-token');
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockAuthService.getMe.mockResolvedValue(mockAdminUser);

      renderNavigation();

      await waitFor(() => {
        expect(screen.getByText('admin')).toBeInTheDocument();
      });
    });

    it('displays user role badge', async () => {
      mockAuthService.getToken.mockReturnValue('valid-token');
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockAuthService.getMe.mockResolvedValue(mockRegularUser);

      renderNavigation();

      await waitFor(() => {
        expect(screen.getByText('USER')).toBeInTheDocument();
      });
    });

    it('displays admin role badge', async () => {
      mockAuthService.getToken.mockReturnValue('valid-token');
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockAuthService.getMe.mockResolvedValue(mockAdminUser);

      renderNavigation();

      await waitFor(() => {
        expect(screen.getByText('ADMIN')).toBeInTheDocument();
      });
    });

    it('renders role badge with appropriate styling class for USER', async () => {
      mockAuthService.getToken.mockReturnValue('valid-token');
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockAuthService.getMe.mockResolvedValue(mockRegularUser);

      renderNavigation();

      await waitFor(() => {
        const roleBadge = screen.getByText('USER');
        expect(roleBadge).toHaveClass('role-badge-user');
      });
    });

    it('renders role badge with appropriate styling class for ADMIN', async () => {
      mockAuthService.getToken.mockReturnValue('valid-token');
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockAuthService.getMe.mockResolvedValue(mockAdminUser);

      renderNavigation();

      await waitFor(() => {
        const roleBadge = screen.getByText('ADMIN');
        expect(roleBadge).toHaveClass('role-badge-admin');
      });
    });
  });

  describe('Logout Functionality', () => {
    it('renders logout button', async () => {
      mockAuthService.getToken.mockReturnValue('valid-token');
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockAuthService.getMe.mockResolvedValue(mockRegularUser);

      renderNavigation();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
      });
    });

    it('calls logout when logout button is clicked', async () => {
      const user = userEvent.setup();
      mockAuthService.getToken.mockReturnValue('valid-token');
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockAuthService.getMe.mockResolvedValue(mockRegularUser);
      mockAuthService.logout.mockResolvedValue(undefined);

      renderNavigation();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /logout/i }));

      await waitFor(() => {
        expect(mockAuthService.logout).toHaveBeenCalled();
      });
    });
  });

  describe('Unauthenticated State', () => {
    it('does not render user section when not authenticated', async () => {
      mockAuthService.getToken.mockReturnValue(null);
      mockAuthService.isAuthenticated.mockReturnValue(false);
      mockAuthService.getMe.mockResolvedValue(null);

      renderNavigation();

      // Should still show the navigation element
      await waitFor(() => {
        expect(screen.getByRole('navigation')).toBeInTheDocument();
      });

      // But no user section
      expect(screen.queryByRole('button', { name: /logout/i })).not.toBeInTheDocument();
    });
  });
});
