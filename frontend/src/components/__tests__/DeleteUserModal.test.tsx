import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DeleteUserModal from '../DeleteUserModal';

describe('DeleteUserModal', () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();

  const defaultProps = {
    isOpen: true,
    onConfirm: mockOnConfirm,
    onCancel: mockOnCancel,
    username: 'testuser',
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('does not render when isOpen is false', () => {
      render(<DeleteUserModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders modal when isOpen is true', () => {
      render(<DeleteUserModal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('displays warning message with username', () => {
      render(<DeleteUserModal {...defaultProps} />);

      expect(
        screen.getByText(/delete user 'testuser'/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument();
    });

    it('displays confirm button', () => {
      render(<DeleteUserModal {...defaultProps} />);

      expect(
        screen.getByRole('button', { name: /confirm|delete/i })
      ).toBeInTheDocument();
    });

    it('displays cancel button', () => {
      render(<DeleteUserModal {...defaultProps} />);

      expect(
        screen.getByRole('button', { name: /cancel/i })
      ).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('calls onConfirm when confirm button is clicked', async () => {
      const user = userEvent.setup();

      render(<DeleteUserModal {...defaultProps} />);

      const confirmButton = screen.getByRole('button', { name: /confirm|delete/i });
      await user.click(confirmButton);

      expect(mockOnConfirm).toHaveBeenCalled();
    });

    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();

      render(<DeleteUserModal {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('disables confirm button when loading', () => {
      render(<DeleteUserModal {...defaultProps} isLoading={true} />);

      const confirmButton = screen.getByRole('button', { name: /confirm|delete|deleting/i });
      expect(confirmButton).toBeDisabled();
    });

    it('shows loading state text on confirm button', () => {
      render(<DeleteUserModal {...defaultProps} isLoading={true} />);

      expect(
        screen.getByRole('button', { name: /deleting/i })
      ).toBeInTheDocument();
    });

    it('disables cancel button when loading', () => {
      render(<DeleteUserModal {...defaultProps} isLoading={true} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toBeDisabled();
    });
  });

  describe('Different usernames', () => {
    it('displays different username correctly', () => {
      render(<DeleteUserModal {...defaultProps} username="johndoe" />);

      expect(
        screen.getByText(/delete user 'johndoe'/i)
      ).toBeInTheDocument();
    });
  });
});
