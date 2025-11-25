import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import WelcomePage from '../WelcomePage';
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

const mockExpenseService = vi.hoisted(() => ({
  getAllExpenses: vi.fn(),
  getExpenseById: vi.fn(),
  createExpense: vi.fn(),
  updateExpense: vi.fn(),
  deleteExpense: vi.fn(),
  getExpensesByYearMonth: vi.fn(),
  getCategoryTrend: vi.fn(),
  getDescriptionSuggestions: vi.fn(),
  getCategoryHint: vi.fn(),
  getExpensesByMonth: vi.fn(),
  getMultiCategoryTrend: vi.fn(),
}));

const mockCategoryService = vi.hoisted(() => ({
  getAllCategories: vi.fn(),
  getCategoryById: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
}));

vi.mock('../../services/authService', () => ({
  authService: mockAuthService,
  AUTH_TOKEN_KEY: 'auth_token',
}));

vi.mock('../../services/expenseService', () => ({
  expenseService: mockExpenseService,
}));

vi.mock('../../services/categoryService', () => ({
  categoryService: mockCategoryService,
}));

// Mock currency utility
vi.mock('../../utils/currency', () => ({
  formatCurrency: vi.fn((value: number) => `SEK ${value.toFixed(2)}`),
  initializeCurrency: vi.fn(),
  getCurrency: vi.fn(() => 'SEK'),
  setCurrency: vi.fn(),
  resetCurrency: vi.fn(),
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

describe('WelcomePage', () => {
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

  const mockExpenses = [
    { id: 1, description: 'Groceries', amount: 150.00, expenseDate: '2024-01-15', category: 'Food' },
    { id: 2, description: 'Gas', amount: 75.50, expenseDate: '2024-01-14', category: 'Transportation' },
    { id: 3, description: 'Coffee', amount: 25.00, expenseDate: '2024-01-13', category: 'Food' },
    { id: 4, description: 'Dinner', amount: 95.00, expenseDate: '2024-01-12', category: 'Food' },
    { id: 5, description: 'Bus ticket', amount: 35.00, expenseDate: '2024-01-11', category: 'Transportation' },
    { id: 6, description: 'Movie', amount: 120.00, expenseDate: '2024-01-10', category: 'Entertainment' },
  ];

  const mockCategories = [
    { id: 1, name: 'Food', isActive: true },
    { id: 2, name: 'Transportation', isActive: true },
    { id: 3, name: 'Entertainment', isActive: true },
  ];

  const renderWelcomePage = () => {
    return render(
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <WelcomePage />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    );
  };

  describe('Page Load and Stats', () => {
    beforeEach(() => {
      mockAuthService.getToken.mockReturnValue('valid-token');
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockAuthService.getMe.mockResolvedValue(mockRegularUser);
      mockExpenseService.getAllExpenses.mockResolvedValue(mockExpenses);
      mockCategoryService.getAllCategories.mockResolvedValue(mockCategories);
    });

    it('displays greeting with username', async () => {
      renderWelcomePage();

      await waitFor(() => {
        expect(screen.getByText(/Welcome, regularuser!/i)).toBeInTheDocument();
      });
    });

    it('displays greeting with admin username', async () => {
      mockAuthService.getMe.mockResolvedValue(mockAdminUser);
      renderWelcomePage();

      await waitFor(() => {
        expect(screen.getByText(/Welcome, admin!/i)).toBeInTheDocument();
      });
    });

    it('fetches and displays total expenses count', async () => {
      renderWelcomePage();

      await waitFor(() => {
        expect(screen.getByText('Total Expenses')).toBeInTheDocument();
        expect(screen.getByText('6')).toBeInTheDocument();
      });
    });

    it('fetches and displays total spending', async () => {
      renderWelcomePage();

      // Total: 150 + 75.5 + 25 + 95 + 35 + 120 = 500.50
      await waitFor(() => {
        expect(screen.getByText('Total Spending')).toBeInTheDocument();
        expect(screen.getByText('SEK 500.50')).toBeInTheDocument();
      });
    });

    it('fetches and displays categories count', async () => {
      renderWelcomePage();

      await waitFor(() => {
        expect(screen.getByText('Categories')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
      });
    });

    it('shows loading state while fetching data', () => {
      // Delay the resolution of the promises
      mockExpenseService.getAllExpenses.mockImplementation(() => new Promise(() => {}));
      mockCategoryService.getAllCategories.mockImplementation(() => new Promise(() => {}));

      renderWelcomePage();

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  describe('Quick Actions', () => {
    beforeEach(() => {
      mockAuthService.getToken.mockReturnValue('valid-token');
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockAuthService.getMe.mockResolvedValue(mockRegularUser);
      mockExpenseService.getAllExpenses.mockResolvedValue(mockExpenses);
      mockCategoryService.getAllCategories.mockResolvedValue(mockCategories);
    });

    it('displays View Expenses quick action link', async () => {
      renderWelcomePage();

      await waitFor(() => {
        const expensesLink = screen.getByRole('link', { name: /view expenses/i });
        expect(expensesLink).toBeInTheDocument();
        expect(expensesLink).toHaveAttribute('href', '/expenses');
      });
    });

    it('displays View Analytics quick action link', async () => {
      renderWelcomePage();

      await waitFor(() => {
        const analyticsLink = screen.getByRole('link', { name: /view analytics/i });
        expect(analyticsLink).toBeInTheDocument();
        expect(analyticsLink).toHaveAttribute('href', '/analytics');
      });
    });

    it('displays Manage Categories quick action link', async () => {
      renderWelcomePage();

      await waitFor(() => {
        const categoriesLink = screen.getByRole('link', { name: /manage categories/i });
        expect(categoriesLink).toBeInTheDocument();
        expect(categoriesLink).toHaveAttribute('href', '/categories');
      });
    });

    it('displays Manage Users quick action for admin', async () => {
      mockAuthService.getMe.mockResolvedValue(mockAdminUser);
      renderWelcomePage();

      await waitFor(() => {
        const usersLink = screen.getByRole('link', { name: /manage users/i });
        expect(usersLink).toBeInTheDocument();
        expect(usersLink).toHaveAttribute('href', '/users');
      });
    });

    it('does not display Manage Users for regular user', async () => {
      renderWelcomePage();

      await waitFor(() => {
        expect(screen.getByText(/Welcome, regularuser!/i)).toBeInTheDocument();
      });

      expect(screen.queryByRole('link', { name: /manage users/i })).not.toBeInTheDocument();
    });
  });

  describe('Recent Expenses', () => {
    beforeEach(() => {
      mockAuthService.getToken.mockReturnValue('valid-token');
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockAuthService.getMe.mockResolvedValue(mockRegularUser);
      mockExpenseService.getAllExpenses.mockResolvedValue(mockExpenses);
      mockCategoryService.getAllCategories.mockResolvedValue(mockCategories);
    });

    it('displays Recent Expenses section header', async () => {
      renderWelcomePage();

      await waitFor(() => {
        expect(screen.getByText('Recent Expenses')).toBeInTheDocument();
      });
    });

    it('displays up to 5 recent expenses', async () => {
      renderWelcomePage();

      await waitFor(() => {
        expect(screen.getByText('Groceries')).toBeInTheDocument();
        expect(screen.getByText('Gas')).toBeInTheDocument();
        expect(screen.getByText('Coffee')).toBeInTheDocument();
        expect(screen.getByText('Dinner')).toBeInTheDocument();
        expect(screen.getByText('Bus ticket')).toBeInTheDocument();
      });

      // The 6th expense should NOT be displayed
      expect(screen.queryByText('Movie')).not.toBeInTheDocument();
    });

    it('displays message when no expenses exist', async () => {
      mockExpenseService.getAllExpenses.mockResolvedValue([]);
      renderWelcomePage();

      await waitFor(() => {
        expect(screen.getByText(/no expenses yet/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockAuthService.getToken.mockReturnValue('valid-token');
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockAuthService.getMe.mockResolvedValue(mockRegularUser);
    });

    it('displays error message when fetching expenses fails', async () => {
      mockExpenseService.getAllExpenses.mockRejectedValue(new Error('Failed to fetch expenses'));
      mockCategoryService.getAllCategories.mockResolvedValue(mockCategories);

      renderWelcomePage();

      await waitFor(() => {
        expect(screen.getByText(/failed to load data/i)).toBeInTheDocument();
      });
    });

    it('displays error message when fetching categories fails', async () => {
      mockExpenseService.getAllExpenses.mockResolvedValue(mockExpenses);
      mockCategoryService.getAllCategories.mockRejectedValue(new Error('Failed to fetch categories'));

      renderWelcomePage();

      await waitFor(() => {
        expect(screen.getByText(/failed to load data/i)).toBeInTheDocument();
      });
    });
  });

  describe('Stat Cards', () => {
    beforeEach(() => {
      mockAuthService.getToken.mockReturnValue('valid-token');
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockAuthService.getMe.mockResolvedValue(mockRegularUser);
      mockExpenseService.getAllExpenses.mockResolvedValue(mockExpenses);
      mockCategoryService.getAllCategories.mockResolvedValue(mockCategories);
    });

    it('renders stat cards with correct structure', async () => {
      renderWelcomePage();

      await waitFor(() => {
        // Check that stat cards exist
        const statsSection = screen.getByTestId('stats-section');
        expect(statsSection).toBeInTheDocument();
      });
    });
  });
});
