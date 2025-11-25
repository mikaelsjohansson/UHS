import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Layout from '../Layout';
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

describe('Layout', () => {
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

  const renderLayout = () => {
    return render(
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <Layout />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    );
  };

  describe('Structure', () => {
    it('renders navigation component', () => {
      renderLayout();
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    it('renders footer with copyright', () => {
      renderLayout();
      expect(screen.getByText(/2025 UHS - Personal Expense Tracker/i)).toBeInTheDocument();
    });

    it('renders UHS brand in navigation', () => {
      renderLayout();
      expect(screen.getByText('UHS')).toBeInTheDocument();
    });
  });

  describe('Dark Mode Toggle', () => {
    it('renders a theme toggle button', () => {
      renderLayout();
      const toggleButton = screen.getByRole('button', { name: /toggle theme/i });
      expect(toggleButton).toBeInTheDocument();
    });

    it('shows moon icon when in light mode', () => {
      mockLocalStorage.setItem('theme', 'light');
      renderLayout();

      // The moon icon should be visible in light mode (to switch to dark)
      const moonIcon = screen.getByTestId('theme-icon-moon');
      expect(moonIcon).toBeInTheDocument();
    });

    it('shows sun icon when in dark mode', () => {
      mockLocalStorage.setItem('theme', 'dark');
      renderLayout();

      // The sun icon should be visible in dark mode (to switch to light)
      const sunIcon = screen.getByTestId('theme-icon-sun');
      expect(sunIcon).toBeInTheDocument();
    });

    it('toggles theme from light to dark when button is clicked', async () => {
      const user = userEvent.setup();
      mockLocalStorage.setItem('theme', 'light');
      renderLayout();

      expect(document.documentElement.getAttribute('data-theme')).toBe('light');

      const toggleButton = screen.getByRole('button', { name: /toggle theme/i });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      });
    });

    it('toggles theme from dark to light when button is clicked', async () => {
      const user = userEvent.setup();
      mockLocalStorage.setItem('theme', 'dark');
      renderLayout();

      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

      const toggleButton = screen.getByRole('button', { name: /toggle theme/i });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      });
    });

    it('toggle button is accessible with proper aria-label', () => {
      renderLayout();
      const toggleButton = screen.getByRole('button', { name: /toggle theme/i });
      expect(toggleButton).toHaveAttribute('aria-label');
    });
  });

  describe('User Info Display (via Navigation)', () => {
    it('displays username when user is authenticated', async () => {
      mockAuthService.getToken.mockReturnValue('valid-token');
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockAuthService.getMe.mockResolvedValue(mockAdminUser);

      renderLayout();

      await waitFor(() => {
        expect(screen.getByText('admin')).toBeInTheDocument();
      });
    });

    it('displays user role when user is authenticated', async () => {
      mockAuthService.getToken.mockReturnValue('valid-token');
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockAuthService.getMe.mockResolvedValue(mockAdminUser);

      renderLayout();

      await waitFor(() => {
        expect(screen.getByText('ADMIN')).toBeInTheDocument();
      });
    });

  });

  describe('Logout Button (via Navigation)', () => {
    it('renders logout button when user is authenticated', async () => {
      mockAuthService.getToken.mockReturnValue('valid-token');
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockAuthService.getMe.mockResolvedValue(mockRegularUser);

      renderLayout();

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

      renderLayout();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /logout/i }));

      await waitFor(() => {
        expect(mockAuthService.logout).toHaveBeenCalled();
      });
    });
  });
});
