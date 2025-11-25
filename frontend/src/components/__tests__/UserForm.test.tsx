import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserForm from '../UserForm';
import { CreateUserRequestDto } from '../../types/user';

describe('UserForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders form with all required fields', () => {
      render(
        <UserForm
          onSubmit={mockOnSubmit}
          isLoading={false}
          mode="create"
        />
      );

      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create user/i })).toBeInTheDocument();
    });

    it('renders role dropdown with USER and ADMIN options', () => {
      render(
        <UserForm
          onSubmit={mockOnSubmit}
          isLoading={false}
          mode="create"
        />
      );

      const roleSelect = screen.getByLabelText(/role/i);
      expect(roleSelect).toBeInTheDocument();

      // Check options are available
      expect(screen.getByRole('option', { name: /user/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /admin/i })).toBeInTheDocument();
    });

    it('renders cancel button when onCancel is provided', () => {
      render(
        <UserForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isLoading={false}
          mode="create"
        />
      );

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('does not render cancel button when onCancel is not provided', () => {
      render(
        <UserForm
          onSubmit={mockOnSubmit}
          isLoading={false}
          mode="create"
        />
      );

      expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
    });

    it('displays error message when error prop is provided', () => {
      render(
        <UserForm
          onSubmit={mockOnSubmit}
          isLoading={false}
          error="Username already exists"
          mode="create"
        />
      );

      expect(screen.getByRole('alert')).toHaveTextContent('Username already exists');
    });
  });

  describe('Form Validation', () => {
    it('shows error when submitting with empty username', async () => {
      const user = userEvent.setup();
      render(
        <UserForm
          onSubmit={mockOnSubmit}
          isLoading={false}
          mode="create"
        />
      );

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'test@example.com');

      // Submit button should be disabled because username is empty
      const submitButton = screen.getByRole('button', { name: /create user/i });
      expect(submitButton).toBeDisabled();

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('shows error when username is too short', async () => {
      const user = userEvent.setup();
      render(
        <UserForm
          onSubmit={mockOnSubmit}
          isLoading={false}
          mode="create"
        />
      );

      const usernameInput = screen.getByLabelText(/username/i);
      await user.type(usernameInput, 'ab');

      // Error should appear immediately due to real-time validation
      await waitFor(() => {
        expect(screen.getByText(/username must be at least 3 characters/i)).toBeInTheDocument();
      });

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /create user/i });
      expect(submitButton).toBeDisabled();

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('shows error when submitting with empty email', async () => {
      const user = userEvent.setup();
      render(
        <UserForm
          onSubmit={mockOnSubmit}
          isLoading={false}
          mode="create"
        />
      );

      const usernameInput = screen.getByLabelText(/username/i);
      await user.type(usernameInput, 'testuser');

      // Submit button should still be disabled because email is empty
      const submitButton = screen.getByRole('button', { name: /create user/i });
      expect(submitButton).toBeDisabled();

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('shows error when email format is invalid', async () => {
      const user = userEvent.setup();
      render(
        <UserForm
          onSubmit={mockOnSubmit}
          isLoading={false}
          mode="create"
        />
      );

      const usernameInput = screen.getByLabelText(/username/i);
      await user.type(usernameInput, 'testuser');

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'invalid-email');

      const submitButton = screen.getByRole('button', { name: /create user/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('clears field error when user starts typing', async () => {
      const user = userEvent.setup();
      render(
        <UserForm
          onSubmit={mockOnSubmit}
          isLoading={false}
          mode="create"
        />
      );

      const usernameInput = screen.getByLabelText(/username/i);

      // Type 'a' which is too short (error shows immediately with real-time validation)
      await user.type(usernameInput, 'a');

      await waitFor(() => {
        expect(screen.getByText(/username must be at least 3 characters/i)).toBeInTheDocument();
      });

      // Type more characters to fix the error
      await user.type(usernameInput, 'bc');

      // Error should clear once username is valid length
      await waitFor(() => {
        expect(screen.queryByText(/username must be at least 3 characters/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('calls onSubmit with correct data when form is valid', async () => {
      const user = userEvent.setup();
      render(
        <UserForm
          onSubmit={mockOnSubmit}
          isLoading={false}
          mode="create"
        />
      );

      const usernameInput = screen.getByLabelText(/username/i);
      await user.type(usernameInput, 'newuser');

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'newuser@example.com');

      const roleSelect = screen.getByLabelText(/role/i);
      await user.selectOptions(roleSelect, 'ADMIN');

      const submitButton = screen.getByRole('button', { name: /create user/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          username: 'newuser',
          email: 'newuser@example.com',
          role: 'ADMIN',
        } as CreateUserRequestDto);
      });
    });

    it('defaults role to USER', async () => {
      const user = userEvent.setup();
      render(
        <UserForm
          onSubmit={mockOnSubmit}
          isLoading={false}
          mode="create"
        />
      );

      const usernameInput = screen.getByLabelText(/username/i);
      await user.type(usernameInput, 'newuser');

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'newuser@example.com');

      const submitButton = screen.getByRole('button', { name: /create user/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            role: 'USER',
          })
        );
      });
    });

    it('trims whitespace from username and email', async () => {
      const user = userEvent.setup();
      render(
        <UserForm
          onSubmit={mockOnSubmit}
          isLoading={false}
          mode="create"
        />
      );

      const usernameInput = screen.getByLabelText(/username/i);
      await user.type(usernameInput, '  newuser  ');

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, '  newuser@example.com  ');

      const submitButton = screen.getByRole('button', { name: /create user/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          username: 'newuser',
          email: 'newuser@example.com',
          role: 'USER',
        });
      });
    });
  });

  describe('Loading State', () => {
    it('shows loading state on submit button', () => {
      render(
        <UserForm
          onSubmit={mockOnSubmit}
          isLoading={true}
          mode="create"
        />
      );

      expect(screen.getByRole('button', { name: /creating/i })).toBeInTheDocument();
    });

    it('disables submit button when loading', () => {
      render(
        <UserForm
          onSubmit={mockOnSubmit}
          isLoading={true}
          mode="create"
        />
      );

      expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled();
    });

    it('disables all form fields when loading', () => {
      render(
        <UserForm
          onSubmit={mockOnSubmit}
          isLoading={true}
          mode="create"
        />
      );

      expect(screen.getByLabelText(/username/i)).toBeDisabled();
      expect(screen.getByLabelText(/email/i)).toBeDisabled();
      expect(screen.getByLabelText(/role/i)).toBeDisabled();
    });

    it('disables cancel button when loading', () => {
      render(
        <UserForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isLoading={true}
          mode="create"
        />
      );

      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
    });
  });

  describe('Cancel Action', () => {
    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <UserForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isLoading={false}
          mode="create"
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });
});
