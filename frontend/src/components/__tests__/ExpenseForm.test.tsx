import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExpenseForm from '../ExpenseForm';
import { Expense } from '../../types/expense';
import { Category } from '../../types/category';

// Mock categoryService
vi.mock('../../services/categoryService', () => ({
  categoryService: {
    getAllCategories: vi.fn(),
    createCategory: vi.fn(),
  },
}));

// Mock expenseService
vi.mock('../../services/expenseService', () => ({
  expenseService: {
    getDescriptionSuggestions: vi.fn(),
    getCategoryHint: vi.fn(),
  },
}));

// Mock Modal and CategoryForm components
vi.mock('../Modal', () => ({
  default: ({ isOpen, onClose, title, children }: any) => {
    if (!isOpen) return null;
    return (
      <div data-testid="modal">
        {title && <h2>{title}</h2>}
        <button onClick={onClose} aria-label="Close modal">×</button>
        {children}
      </div>
    );
  },
}));

vi.mock('../CategoryForm', () => ({
  default: ({ onSubmit, onCancel }: any) => (
    <div data-testid="category-form">
      <input aria-label="Category name" />
      <textarea aria-label="Category description" />
      <button onClick={() => onSubmit({ name: 'New Category', description: '' })}>
        Add Category
      </button>
      {onCancel && <button onClick={onCancel}>Cancel</button>}
    </div>
  ),
}));

import { categoryService } from '../../services/categoryService';
import { expenseService } from '../../services/expenseService';

describe('ExpenseForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock categories API response
    const mockCategories: Category[] = [
      { id: 1, name: 'Food', description: 'Food and dining expenses' },
      { id: 2, name: 'Transport', description: 'Transportation expenses' },
      { id: 3, name: 'Shopping', description: 'Shopping expenses' },
    ];
    vi.mocked(categoryService.getAllCategories).mockResolvedValue(mockCategories);
  });

  it('renders form fields correctly', () => {
    render(<ExpenseForm onSubmit={mockOnSubmit} />);

    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /category/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add expense/i })).toBeInTheDocument();
  });

  it('auto-focuses description field when creating new expense', async () => {
    render(<ExpenseForm onSubmit={mockOnSubmit} />);

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /category/i })).toBeInTheDocument();
    });

    const descriptionInput = screen.getByLabelText(/description/i) as HTMLInputElement;
    
    // Verify description field has focus
    await waitFor(() => {
      expect(document.activeElement).toBe(descriptionInput);
    });
  });

  it('does not auto-focus description when editing expense', async () => {
    const expense: Expense = {
      id: 1,
      description: 'Test Expense',
      amount: 100.50,
      expenseDate: '2024-01-15T10:00:00',
      category: 'Food',
    };

    render(<ExpenseForm expense={expense} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /category/i })).toBeInTheDocument();
    });

    const descriptionInput = screen.getByLabelText(/description/i) as HTMLInputElement;
    
    // Verify description field does NOT have focus when editing
    expect(document.activeElement).not.toBe(descriptionInput);
  });

  it('pre-fills form when editing an expense', async () => {
    const expense: Expense = {
      id: 1,
      description: 'Test Expense',
      amount: 100.50,
      expenseDate: '2024-01-15T10:00:00',
      category: 'Food',
    };

    render(<ExpenseForm expense={expense} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    expect(screen.getByDisplayValue('Test Expense')).toBeInTheDocument();
    expect(screen.getByDisplayValue('100.5')).toBeInTheDocument();
    
    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('Food')).toBeInTheDocument();
    });
    
    expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument();
  });

  it('calls onSubmit with correct data when form is submitted', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockResolvedValue(undefined);

    render(<ExpenseForm onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText(/description/i), 'New Expense');
    await user.type(screen.getByLabelText(/amount/i), '50.75');
    await user.selectOptions(screen.getByRole('combobox', { name: /category/i }), 'Food');

    await user.click(screen.getByRole('button', { name: /add expense/i }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        description: 'New Expense',
        amount: 50.75,
        expenseDate: expect.any(String),
        category: 'Food',
      });
    });
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const expense: Expense = {
      id: 1,
      description: 'Test Expense',
      amount: 100,
      expenseDate: '2024-01-15T10:00:00',
      category: 'Food',
    };

    render(<ExpenseForm expense={expense} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('does not submit if required fields are empty', async () => {
    const user = userEvent.setup();

    render(<ExpenseForm onSubmit={mockOnSubmit} />);

    const submitButton = screen.getByRole('button', { name: /add expense/i });
    await user.click(submitButton);

    // Form validation should prevent submission
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('displays category description when a category is selected', async () => {
    const user = userEvent.setup();

    render(<ExpenseForm onSubmit={mockOnSubmit} />);

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /category/i })).toBeInTheDocument();
    });

    // Select a category
    await user.selectOptions(screen.getByRole('combobox', { name: /category/i }), 'Food');

    // Verify description is displayed
    await waitFor(() => {
      expect(screen.getByText('Food and dining expenses')).toBeInTheDocument();
    });
  });

  it('shows autocomplete suggestions when typing in description field', async () => {
    const user = userEvent.setup();
    const mockSuggestions = ['Skånetrafiken', 'Skåne Express', 'Skåne Resor'];
    
    vi.mocked(expenseService.getDescriptionSuggestions).mockResolvedValue(mockSuggestions);

    render(<ExpenseForm onSubmit={mockOnSubmit} />);

    const descriptionInput = screen.getByLabelText(/description/i);
    await user.type(descriptionInput, 'skåne');

    // Wait for debounce and API call
    await waitFor(() => {
      expect(expenseService.getDescriptionSuggestions).toHaveBeenCalledWith('skåne');
    }, { timeout: 1000 });

    // Wait for suggestions to appear
    await waitFor(() => {
      expect(screen.getByText('Skånetrafiken')).toBeInTheDocument();
      expect(screen.getByText('Skåne Express')).toBeInTheDocument();
    });
  });

  it('fills description and category when suggestion is clicked', async () => {
    const user = userEvent.setup();
    const mockSuggestions = ['Skånetrafiken'];
    const mockCategoryHint = 'Transport';
    
    vi.mocked(expenseService.getDescriptionSuggestions).mockResolvedValue(mockSuggestions);
    vi.mocked(expenseService.getCategoryHint).mockResolvedValue(mockCategoryHint);

    render(<ExpenseForm onSubmit={mockOnSubmit} />);

    const descriptionInput = screen.getByLabelText(/description/i);
    await user.type(descriptionInput, 'skåne');

    // Wait for suggestions to appear
    await waitFor(() => {
      expect(screen.getByText('Skånetrafiken')).toBeInTheDocument();
    });

    // Click on suggestion
    await user.click(screen.getByText('Skånetrafiken'));

    // Verify description is filled
    await waitFor(() => {
      expect(descriptionInput).toHaveValue('Skånetrafiken');
    });

    // Verify category hint was fetched and category is set
    await waitFor(() => {
      expect(expenseService.getCategoryHint).toHaveBeenCalledWith('Skånetrafiken');
    });

    // Wait for categories to load and verify category is selected
    await waitFor(() => {
      const categorySelect = screen.getByRole('combobox', { name: /category/i }) as HTMLSelectElement;
      expect(categorySelect.value).toBe('Transport');
    });
  });

  it('hides suggestions when clicking outside', async () => {
    const user = userEvent.setup();
    const mockSuggestions = ['Skånetrafiken'];
    
    vi.mocked(expenseService.getDescriptionSuggestions).mockResolvedValue(mockSuggestions);

    render(<ExpenseForm onSubmit={mockOnSubmit} />);

    const descriptionInput = screen.getByLabelText(/description/i);
    await user.type(descriptionInput, 'skåne');

    // Wait for suggestions to appear
    await waitFor(() => {
      expect(screen.getByText('Skånetrafiken')).toBeInTheDocument();
    });

    // Click outside (on the form)
    await user.click(document.body);

    // Verify suggestions are hidden
    await waitFor(() => {
      expect(screen.queryByText('Skånetrafiken')).not.toBeInTheDocument();
    });
  });

  it('does not show suggestions for empty description', async () => {
    const user = userEvent.setup();
    
    render(<ExpenseForm onSubmit={mockOnSubmit} />);

    const descriptionInput = screen.getByLabelText(/description/i);
    await user.type(descriptionInput, 'test');
    await user.clear(descriptionInput);

    // Wait a bit to ensure debounce completes
    await waitFor(() => {
      expect(expenseService.getDescriptionSuggestions).not.toHaveBeenCalled();
    }, { timeout: 500 });
  });

  it('selects suggestion with Enter key', async () => {
    const user = userEvent.setup();
    const mockSuggestions = ['Skånetrafiken', 'Skåne Express'];
    const mockCategoryHint = 'Transport';
    
    vi.mocked(expenseService.getDescriptionSuggestions).mockResolvedValue(mockSuggestions);
    vi.mocked(expenseService.getCategoryHint).mockResolvedValue(mockCategoryHint);

    render(<ExpenseForm onSubmit={mockOnSubmit} />);

    const descriptionInput = screen.getByLabelText(/description/i);
    await user.type(descriptionInput, 'skåne');

    // Wait for suggestions to appear
    await waitFor(() => {
      expect(screen.getByText('Skånetrafiken')).toBeInTheDocument();
    });

    // Press Enter to select first suggestion
    await user.keyboard('{Enter}');

    // Verify description is filled
    await waitFor(() => {
      expect(descriptionInput).toHaveValue('Skånetrafiken');
    });

    // Verify category hint was fetched
    await waitFor(() => {
      expect(expenseService.getCategoryHint).toHaveBeenCalledWith('Skånetrafiken');
    });
  });

  it('navigates suggestions with arrow keys and selects with Enter', async () => {
    const user = userEvent.setup();
    const mockSuggestions = ['Skånetrafiken', 'Skåne Express', 'Skåne Resor'];
    
    vi.mocked(expenseService.getDescriptionSuggestions).mockResolvedValue(mockSuggestions);

    render(<ExpenseForm onSubmit={mockOnSubmit} />);

    const descriptionInput = screen.getByLabelText(/description/i);
    await user.type(descriptionInput, 'skåne');

    // Wait for suggestions to appear
    await waitFor(() => {
      expect(screen.getByText('Skånetrafiken')).toBeInTheDocument();
    });

    // Navigate down with arrow key
    await user.keyboard('{ArrowDown}');
    
    // Navigate down again
    await user.keyboard('{ArrowDown}');

    // Press Enter to select
    await user.keyboard('{Enter}');

    // Verify second suggestion was selected
    await waitFor(() => {
      expect(descriptionInput).toHaveValue('Skåne Express');
    });
  });

  it('closes suggestions with Escape key', async () => {
    const user = userEvent.setup();
    const mockSuggestions = ['Skånetrafiken'];
    
    vi.mocked(expenseService.getDescriptionSuggestions).mockResolvedValue(mockSuggestions);

    render(<ExpenseForm onSubmit={mockOnSubmit} />);

    const descriptionInput = screen.getByLabelText(/description/i);
    await user.type(descriptionInput, 'skåne');

    // Wait for suggestions to appear
    await waitFor(() => {
      expect(screen.getByText('Skånetrafiken')).toBeInTheDocument();
    });

    // Press Escape to close
    await user.keyboard('{Escape}');

    // Verify suggestions are hidden
    await waitFor(() => {
      expect(screen.queryByText('Skånetrafiken')).not.toBeInTheDocument();
    });
  });

  describe('Enter key navigation', () => {
    it('moves from description to amount when Enter is pressed and no suggestions are visible', async () => {
      const user = userEvent.setup();
      
      render(<ExpenseForm onSubmit={mockOnSubmit} />);

      const descriptionInput = screen.getByLabelText(/description/i) as HTMLInputElement;
      const amountInput = screen.getByLabelText(/amount/i) as HTMLInputElement;

      // Type in description without triggering suggestions
      await user.type(descriptionInput, 'Test expense');
      
      // Ensure no suggestions are visible
      await waitFor(() => {
        expect(screen.queryByText(/skåne/i)).not.toBeInTheDocument();
      });

      // Press Enter
      await user.keyboard('{Enter}');

      // Verify focus moved to amount field
      await waitFor(() => {
        expect(document.activeElement).toBe(amountInput);
      });
    });

    it('moves from amount to date when Enter is pressed', async () => {
      const user = userEvent.setup();
      
      render(<ExpenseForm onSubmit={mockOnSubmit} />);

      const amountInput = screen.getByLabelText(/amount/i) as HTMLInputElement;
      const dateInput = screen.getByLabelText(/date/i) as HTMLInputElement;

      // Focus and type in amount
      await user.type(amountInput, '100.50');

      // Press Enter
      await user.keyboard('{Enter}');

      // Verify focus moved to date field
      await waitFor(() => {
        expect(document.activeElement).toBe(dateInput);
      });
    });

    it('opens date picker automatically when date field receives focus', async () => {
      render(<ExpenseForm onSubmit={mockOnSubmit} />);

      // Wait for categories to load
      await waitFor(() => {
        expect(screen.getByRole('combobox', { name: /category/i })).toBeInTheDocument();
      });

      const dateInput = screen.getByLabelText(/date/i) as HTMLInputElement;
      
      // Mock showPicker method (it may not exist in test environment)
      const showPickerMock = vi.fn();
      Object.defineProperty(dateInput, 'showPicker', {
        value: showPickerMock,
        writable: true,
        configurable: true,
      });

      // Move focus to date input (simulating Enter from amount field)
      dateInput.focus();

      // Wait a bit for the focus effect to trigger
      await waitFor(() => {
        expect(showPickerMock).toHaveBeenCalledTimes(1);
      });
    });

    it('moves focus to category after date is selected', async () => {
      const user = userEvent.setup();
      
      render(<ExpenseForm onSubmit={mockOnSubmit} />);

      // Wait for categories to load
      await waitFor(() => {
        expect(screen.getByRole('combobox', { name: /category/i })).toBeInTheDocument();
      });

      const dateInput = screen.getByLabelText(/date/i) as HTMLInputElement;
      const categorySelect = screen.getByRole('combobox', { name: /category/i }) as HTMLSelectElement;

      // Focus on date input
      await user.click(dateInput);

      // Change the date value (simulating user selecting a date)
      await user.clear(dateInput);
      await user.type(dateInput, '2024-12-25');

      // Verify focus moved to category field after date change
      await waitFor(() => {
        expect(document.activeElement).toBe(categorySelect);
      });
    });

    it('moves from date to category when Enter is pressed', async () => {
      const user = userEvent.setup();
      
      render(<ExpenseForm onSubmit={mockOnSubmit} />);

      // Wait for categories to load
      await waitFor(() => {
        expect(screen.getByRole('combobox', { name: /category/i })).toBeInTheDocument();
      });

      const dateInput = screen.getByLabelText(/date/i) as HTMLInputElement;
      const categorySelect = screen.getByRole('combobox', { name: /category/i }) as HTMLSelectElement;

      // Focus on date input
      await user.click(dateInput);

      // Press Enter
      await user.keyboard('{Enter}');

      // Verify focus moved to category field (not submitting form)
      await waitFor(() => {
        expect(document.activeElement).toBe(categorySelect);
      });

      // Verify form was NOT submitted
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('submits form when Enter is pressed in category field', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);
      
      render(<ExpenseForm onSubmit={mockOnSubmit} />);

      // Wait for categories to load
      await waitFor(() => {
        expect(screen.getByRole('combobox', { name: /category/i })).toBeInTheDocument();
      });

      // Fill required fields
      await user.type(screen.getByLabelText(/description/i), 'Test expense');
      await user.type(screen.getByLabelText(/amount/i), '100.50');
      
      const categorySelect = screen.getByRole('combobox', { name: /category/i }) as HTMLSelectElement;
      
      // Focus on category and select one
      await user.selectOptions(categorySelect, 'Food');

      // Press Enter
      await user.keyboard('{Enter}');

      // Verify form was submitted
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });

    it('selects autocomplete suggestion when Enter is pressed in description with visible suggestions', async () => {
      const user = userEvent.setup();
      const mockSuggestions = ['Skånetrafiken'];
      const mockCategoryHint = 'Transport';
      
      vi.mocked(expenseService.getDescriptionSuggestions).mockResolvedValue(mockSuggestions);
      vi.mocked(expenseService.getCategoryHint).mockResolvedValue(mockCategoryHint);

      render(<ExpenseForm onSubmit={mockOnSubmit} />);

      const descriptionInput = screen.getByLabelText(/description/i) as HTMLInputElement;
      await user.type(descriptionInput, 'skåne');

      // Wait for suggestions to appear
      await waitFor(() => {
        expect(screen.getByText('Skånetrafiken')).toBeInTheDocument();
      });

      // Press Enter - should select suggestion, not move to next field
      await user.keyboard('{Enter}');

      // Verify suggestion was selected (description filled)
      await waitFor(() => {
        expect(descriptionInput).toHaveValue('Skånetrafiken');
      });

      // Verify focus moved to amount after suggestion selection
      const amountInput = screen.getByLabelText(/amount/i) as HTMLInputElement;
      await waitFor(() => {
        expect(document.activeElement).toBe(amountInput);
      });
    });

    it('moves to amount after selecting autocomplete suggestion', async () => {
      const user = userEvent.setup();
      const mockSuggestions = ['Skånetrafiken'];
      const mockCategoryHint = 'Transport';
      
      vi.mocked(expenseService.getDescriptionSuggestions).mockResolvedValue(mockSuggestions);
      vi.mocked(expenseService.getCategoryHint).mockResolvedValue(mockCategoryHint);

      render(<ExpenseForm onSubmit={mockOnSubmit} />);

      const descriptionInput = screen.getByLabelText(/description/i) as HTMLInputElement;
      const amountInput = screen.getByLabelText(/amount/i) as HTMLInputElement;

      // Type to show suggestions
      await user.type(descriptionInput, 'skåne');

      // Wait for suggestions to appear
      await waitFor(() => {
        expect(screen.getByText('Skånetrafiken')).toBeInTheDocument();
      });

      // Click on suggestion
      await user.click(screen.getByText('Skånetrafiken'));

      // Verify focus moved to amount field after selection
      await waitFor(() => {
        expect(document.activeElement).toBe(amountInput);
      });
    });
  });

  describe('Create category from expense form', () => {
    it('displays a create category button with + icon', async () => {
      render(<ExpenseForm onSubmit={mockOnSubmit} />);

      // Wait for categories to load
      await waitFor(() => {
        expect(screen.getByRole('combobox', { name: /category/i })).toBeInTheDocument();
      });

      // Find the create category button by aria-label
      const createButton = screen.getByRole('button', { name: /add new category/i });
      expect(createButton).toBeInTheDocument();
    });

    it('opens modal with CategoryForm when create category button is clicked', async () => {
      const user = userEvent.setup();
      render(<ExpenseForm onSubmit={mockOnSubmit} />);

      // Wait for categories to load
      await waitFor(() => {
        expect(screen.getByRole('combobox', { name: /category/i })).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /add new category/i });
      await user.click(createButton);

      // Verify modal is open with CategoryForm
      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
        expect(screen.getByTestId('category-form')).toBeInTheDocument();
      });
    });

    it('creates category and updates category list when category form is submitted', async () => {
      const user = userEvent.setup();
      const newCategory: Category = {
        id: 4,
        name: 'New Category',
        description: '',
      };

      const initialCategories: Category[] = [
        { id: 1, name: 'Food', description: 'Food and dining expenses' },
        { id: 2, name: 'Transport', description: 'Transportation expenses' },
        { id: 3, name: 'Shopping', description: 'Shopping expenses' },
      ];

      const updatedCategories: Category[] = [...initialCategories, newCategory];

      vi.mocked(categoryService.createCategory).mockResolvedValue(newCategory);
      
      render(<ExpenseForm onSubmit={mockOnSubmit} />);

      // Wait for initial categories to load
      await waitFor(() => {
        expect(screen.getByRole('combobox', { name: /category/i })).toBeInTheDocument();
      });

      // Now set up the mock for the refresh call
      vi.mocked(categoryService.getAllCategories).mockResolvedValue(updatedCategories);

      // Open create category modal
      const createButton = screen.getByRole('button', { name: /add new category/i });
      await user.click(createButton);

      // Wait for modal to open
      await waitFor(() => {
        expect(screen.getByTestId('category-form')).toBeInTheDocument();
      });

      // Submit category form
      const addCategoryButton = screen.getByRole('button', { name: /add category/i });
      await user.click(addCategoryButton);

      // Verify category was created
      await waitFor(() => {
        expect(categoryService.createCategory).toHaveBeenCalledWith({
          name: 'New Category',
          description: '',
        });
      });

      // Verify category list was refreshed
      await waitFor(() => {
        expect(categoryService.getAllCategories).toHaveBeenCalledTimes(2); // Initial load + refresh
      });

      // Verify modal is closed
      await waitFor(() => {
        expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
      });

      // Verify new category is selected in the dropdown
      await waitFor(() => {
        const categorySelect = screen.getByRole('combobox', { name: /category/i }) as HTMLSelectElement;
        expect(categorySelect.value).toBe('New Category');
      }, { timeout: 3000 });
    });

    it('closes modal when cancel is clicked in category form', async () => {
      const user = userEvent.setup();
      render(<ExpenseForm onSubmit={mockOnSubmit} />);

      // Wait for categories to load
      await waitFor(() => {
        expect(screen.getByRole('combobox', { name: /category/i })).toBeInTheDocument();
      });

      // Open create category modal
      const createButton = screen.getByRole('button', { name: /add new category/i });
      await user.click(createButton);

      // Wait for modal to open
      await waitFor(() => {
        expect(screen.getByTestId('category-form')).toBeInTheDocument();
      });

      // Click cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Verify modal is closed
      await waitFor(() => {
        expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
      });

      // Verify category was not created
      expect(categoryService.createCategory).not.toHaveBeenCalled();
    });

    it('preserves form values when category modal is opened and closed', async () => {
      const user = userEvent.setup();
      render(<ExpenseForm onSubmit={mockOnSubmit} />);

      // Wait for categories to load
      await waitFor(() => {
        expect(screen.getByRole('combobox', { name: /category/i })).toBeInTheDocument();
      });

      // Fill in form fields
      const descriptionInput = screen.getByLabelText(/description/i) as HTMLInputElement;
      const amountInput = screen.getByLabelText(/amount/i) as HTMLInputElement;
      const dateInput = screen.getByLabelText(/date/i) as HTMLInputElement;

      await user.type(descriptionInput, 'Test Expense');
      await user.type(amountInput, '100.50');
      await user.clear(dateInput);
      await user.type(dateInput, '2024-12-25');

      // Verify values are set
      expect(descriptionInput.value).toBe('Test Expense');
      expect(amountInput.value).toBe('100.5'); // Number input normalizes trailing zeros
      expect(dateInput.value).toBe('2024-12-25');

      // Open create category modal
      const createButton = screen.getByRole('button', { name: /add new category/i });
      await user.click(createButton);

      // Wait for modal to open
      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
      });

      // Verify form values are still preserved
      expect(descriptionInput.value).toBe('Test Expense');
      expect(amountInput.value).toBe('100.5'); // Number input normalizes trailing zeros
      expect(dateInput.value).toBe('2024-12-25');

      // Close modal by clicking cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Wait for modal to close
      await waitFor(() => {
        expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
      });

      // Verify form values are still preserved after closing modal
      expect(descriptionInput.value).toBe('Test Expense');
      expect(amountInput.value).toBe('100.5'); // Number input normalizes trailing zeros
      expect(dateInput.value).toBe('2024-12-25');
    });
  });
});

