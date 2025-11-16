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
  },
}));

import { categoryService } from '../../services/categoryService';

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
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add expense/i })).toBeInTheDocument();
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
    await user.selectOptions(screen.getByLabelText(/category/i), 'Food');

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
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    });

    // Select a category
    await user.selectOptions(screen.getByLabelText(/category/i), 'Food');

    // Verify description is displayed
    await waitFor(() => {
      expect(screen.getByText('Food and dining expenses')).toBeInTheDocument();
    });
  });
});

