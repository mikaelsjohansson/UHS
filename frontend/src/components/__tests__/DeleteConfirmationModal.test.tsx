import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DeleteConfirmationModal from '../DeleteConfirmationModal';
import { Expense } from '../../types/expense';

describe('DeleteConfirmationModal', () => {
  const mockExpense: Expense = {
    id: 1,
    description: 'Test Expense',
    amount: 100.50,
    expenseDate: '2024-01-15T10:00:00',
    category: 'Food',
  };

  it('renders expense information when isOpen is true', () => {
    render(
      <DeleteConfirmationModal
        isOpen={true}
        expense={mockExpense}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    expect(screen.getByText('Test Expense')).toBeInTheDocument();
    expect(screen.getByText(/\$100\.50/)).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(
      <DeleteConfirmationModal
        isOpen={false}
        expense={mockExpense}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.queryByText(/are you sure/i)).not.toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnConfirm = vi.fn();

    render(
      <DeleteConfirmationModal
        isOpen={true}
        expense={mockExpense}
        onConfirm={mockOnConfirm}
        onCancel={vi.fn()}
      />
    );

    const confirmButton = screen.getByRole('button', { name: /delete/i });
    await user.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnCancel = vi.fn();

    render(
      <DeleteConfirmationModal
        isOpen={true}
        expense={mockExpense}
        onConfirm={vi.fn()}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when backdrop is clicked', async () => {
    const user = userEvent.setup();
    const mockOnCancel = vi.fn();

    render(
      <DeleteConfirmationModal
        isOpen={true}
        expense={mockExpense}
        onConfirm={vi.fn()}
        onCancel={mockOnCancel}
      />
    );

    const backdrop = screen.getByTestId('modal-backdrop');
    await user.click(backdrop);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });
});

