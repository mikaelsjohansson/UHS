import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CategoryList from '../CategoryList';
import { Category } from '../../types/category';

describe('CategoryList', () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  it('renders empty state when no categories', () => {
    render(<CategoryList categories={[]} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    expect(screen.getByText(/no categories yet/i)).toBeInTheDocument();
  });

  it('renders list of categories', () => {
    const categories: Category[] = [
      { id: 1, name: 'Food' },
      { id: 2, name: 'Transport' },
    ];

    render(<CategoryList categories={categories} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('Transport')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', async () => {
    const user = userEvent.setup();
    const categories: Category[] = [
      { id: 1, name: 'Food' },
    ];

    render(<CategoryList categories={categories} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    const editButton = screen.getByRole('button', { name: /edit.*food/i });
    await user.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(categories[0]);
  });

  it('calls onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    const categories: Category[] = [
      { id: 1, name: 'Food' },
    ];

    render(<CategoryList categories={categories} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    const deleteButton = screen.getByRole('button', { name: /delete.*food/i });
    await user.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith(categories[0]);
  });
});

