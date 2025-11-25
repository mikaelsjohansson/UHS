import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

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

vi.mock('../services/authService', () => ({
  authService: mockAuthService,
  AUTH_TOKEN_KEY: 'auth_token',
}));

// Mock the expense service to avoid API calls
vi.mock('../services/expenseService', () => ({
  expenseService: {
    getAllExpenses: vi.fn().mockResolvedValue([]),
    getExpenseById: vi.fn(),
    createExpense: vi.fn(),
    updateExpense: vi.fn(),
    deleteExpense: vi.fn(),
    getExpensesByYearMonth: vi.fn().mockResolvedValue([]),
    getCategoryTrend: vi.fn().mockResolvedValue([]),
    getDescriptionSuggestions: vi.fn().mockResolvedValue([]),
    getCategoryHint: vi.fn().mockResolvedValue(null),
    getExpensesByMonth: vi.fn().mockResolvedValue([]),
    getMultiCategoryTrend: vi.fn().mockResolvedValue([]),
  },
}));

// Mock the category service
vi.mock('../services/categoryService', () => ({
  categoryService: {
    getAllCategories: vi.fn().mockResolvedValue([]),
    getCategoryById: vi.fn(),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
  },
}));

// Mock the config service
vi.mock('../services/configService', () => ({
  configService: {
    getConfig: vi.fn().mockResolvedValue({ currency: 'USD' }),
  },
}));

// Mock currency utility
vi.mock('../utils/currency', () => ({
  formatCurrency: vi.fn((value: number) => `SEK ${value.toFixed(2)}`),
  initializeCurrency: vi.fn(),
  getCurrency: vi.fn(() => 'SEK'),
  setCurrency: vi.fn(),
  resetCurrency: vi.fn(),
}));

import App from '../App';

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

describe('App', () => {
  let mockLocalStorage: ReturnType<typeof createMockLocalStorage>;

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

    // Create and setup mock localStorage
    mockLocalStorage = createMockLocalStorage();
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
      configurable: true,
    });

    // Mock matchMedia
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as unknown as typeof window.matchMedia;

    // Default mock implementations
    mockAuthService.getToken.mockReturnValue(null);
    mockAuthService.isAuthenticated.mockReturnValue(false);
    mockAuthService.getMe.mockResolvedValue(null);
    mockAuthService.isSetupRequired.mockResolvedValue({ setupRequired: false });
  });

  describe('Route structure with authenticated user', () => {
    it('renders home page (WelcomePage) for authenticated user at root', async () => {
      mockAuthService.getToken.mockReturnValue('valid-token');
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockAuthService.getMe.mockResolvedValue(mockRegularUser);

      render(<App />);

      await waitFor(() => {
        // Check that the WelcomePage greeting is shown
        expect(screen.getByText(/Welcome, user!/i)).toBeInTheDocument();
      });
    });

    it('shows Layout with user info for authenticated user', async () => {
      mockAuthService.getToken.mockReturnValue('valid-token');
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockAuthService.getMe.mockResolvedValue(mockRegularUser);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('user')).toBeInTheDocument();
      });
    });

    it('shows navigation component for authenticated user', async () => {
      mockAuthService.getToken.mockReturnValue('valid-token');
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockAuthService.getMe.mockResolvedValue(mockRegularUser);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByRole('navigation')).toBeInTheDocument();
      });
    });

    it('shows footer for authenticated user', async () => {
      mockAuthService.getToken.mockReturnValue('valid-token');
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockAuthService.getMe.mockResolvedValue(mockRegularUser);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/2025 UHS - Personal Expense Tracker/i)).toBeInTheDocument();
      });
    });
  });

  describe('Route structure with unauthenticated user', () => {
    it('redirects to login when accessing protected route and not authenticated', async () => {
      mockAuthService.getToken.mockReturnValue(null);
      mockAuthService.isAuthenticated.mockReturnValue(false);
      mockAuthService.getMe.mockResolvedValue(null);
      mockAuthService.isSetupRequired.mockResolvedValue({ setupRequired: false });

      render(<App />);

      await waitFor(() => {
        // Should redirect to login page - the heading says "Log In"
        expect(screen.getByRole('heading', { name: /log in/i })).toBeInTheDocument();
      });
    });

    it('redirects to admin-setup when setup is required', async () => {
      mockAuthService.getToken.mockReturnValue(null);
      mockAuthService.isAuthenticated.mockReturnValue(false);
      mockAuthService.getMe.mockResolvedValue(null);
      mockAuthService.isSetupRequired.mockResolvedValue({ setupRequired: true });

      render(<App />);

      await waitFor(() => {
        // Should redirect to admin setup page - the heading says "Admin Setup"
        expect(screen.getByRole('heading', { name: /admin setup/i })).toBeInTheDocument();
      });
    });
  });

  describe('Admin routes', () => {
    it('admin can access user management page', async () => {
      mockAuthService.getToken.mockReturnValue('valid-token');
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockAuthService.getMe.mockResolvedValue(mockAdminUser);

      // Need to render at /users route to test admin route
      window.history.pushState({}, '', '/users');

      render(<App />);

      await waitFor(() => {
        // Should show user management page for admin
        expect(screen.getByRole('heading', { name: /user management/i })).toBeInTheDocument();
      });
    });

    it('regular user is redirected from admin routes to home', async () => {
      mockAuthService.getToken.mockReturnValue('valid-token');
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockAuthService.getMe.mockResolvedValue(mockRegularUser);

      // Navigate to /users route
      window.history.pushState({}, '', '/users');

      render(<App />);

      await waitFor(() => {
        // Should NOT show user management heading since regular user
        expect(screen.queryByRole('heading', { name: /user management/i })).not.toBeInTheDocument();
      });

      // Should be redirected, showing the WelcomePage content
      await waitFor(() => {
        expect(screen.getByText(/Welcome, user!/i)).toBeInTheDocument();
      });
    });
  });

  describe('Public routes', () => {
    it('login page is accessible without authentication', async () => {
      mockAuthService.getToken.mockReturnValue(null);
      mockAuthService.isAuthenticated.mockReturnValue(false);

      window.history.pushState({}, '', '/login');

      render(<App />);

      await waitFor(() => {
        // The heading says "Log In"
        expect(screen.getByRole('heading', { name: /log in/i })).toBeInTheDocument();
      });
    });

    it('admin setup page is accessible without authentication when setup is required', async () => {
      mockAuthService.getToken.mockReturnValue(null);
      mockAuthService.isAuthenticated.mockReturnValue(false);
      mockAuthService.isSetupRequired.mockResolvedValue({ setupRequired: true });

      window.history.pushState({}, '', '/admin-setup');

      render(<App />);

      await waitFor(() => {
        // The heading says "Admin Setup"
        expect(screen.getByRole('heading', { name: /admin setup/i })).toBeInTheDocument();
      });
    });
  });
});
