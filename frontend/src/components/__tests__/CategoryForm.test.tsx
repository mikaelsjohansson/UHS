import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CategoryForm from '../CategoryForm';
import { Category } from '../../types/category';

describe('CategoryForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form field correctly', () => {
    render(<CategoryForm onSubmit={mockOnSubmit} />);

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add category/i })).toBeInTheDocument();
  });

  it('pre-fills form when editing a category', () => {
    const category: Category = {
      id: 1,
      name: 'Food',
      description: 'Food and dining expenses',
    };

    render(<CategoryForm category={category} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    expect(screen.getByDisplayValue('Food')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Food and dining expenses')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument();
  });

  it('calls onSubmit with correct data when form is submitted', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockResolvedValue(undefined);

    render(<CategoryForm onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText(/name/i), 'New Category');
    await user.type(screen.getByLabelText(/description/i), 'New category description');
    await user.click(screen.getByRole('button', { name: /add category/i }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'New Category',
        description: 'New category description',
      });
    });
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const category: Category = {
      id: 1,
      name: 'Food',
    };

    render(<CategoryForm category={category} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('does not submit if name is empty', async () => {
    const user = userEvent.setup();

    render(<CategoryForm onSubmit={mockOnSubmit} />);

    const submitButton = screen.getByRole('button', { name: /add category/i });
    await user.click(submitButton);

    // Form validation should prevent submission
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('auto-focuses name field when creating new category', async () => {
    render(<CategoryForm onSubmit={mockOnSubmit} />);

    const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;

    // Verify name field has focus when creating new category
    await waitFor(() => {
      expect(document.activeElement).toBe(nameInput);
    });
  });

  it('does not auto-focus name field when editing a category', async () => {
    const category: Category = {
      id: 1,
      name: 'Food',
      description: 'Food and dining expenses',
    };

    render(<CategoryForm category={category} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;

    // Verify name field does NOT have focus when editing
    expect(document.activeElement).not.toBe(nameInput);
  });
});

