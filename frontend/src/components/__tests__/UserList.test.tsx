import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserList from '../UserList';
import { UserDto } from '../../types/user';

describe('UserList', () => {
  const mockOnDelete = vi.fn();
  const mockOnGenerateToken = vi.fn();

  const mockUsers: UserDto[] = [
    {
      id: 1,
      username: 'admin',
      email: 'admin@example.com',
      role: 'ADMIN',
      isActive: true,
      passwordSet: true,
      isDefaultAdmin: true,
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 2,
      username: 'johndoe',
      email: 'john@example.com',
      role: 'USER',
      isActive: true,
      passwordSet: true,
      isDefaultAdmin: false,
      createdAt: '2024-01-02T00:00:00Z',
    },
    {
      id: 3,
      username: 'inactive_user',
      email: 'inactive@example.com',
      role: 'USER',
      isActive: false,
      passwordSet: false,
      isDefaultAdmin: false,
      createdAt: '2024-01-03T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders empty state when no users', () => {
      render(
        <UserList
          users={[]}
          onDelete={mockOnDelete}
          onGenerateToken={mockOnGenerateToken}
          isLoading={false}
          currentUserId={1}
        />
      );

      expect(screen.getByText(/no users found/i)).toBeInTheDocument();
    });

    it('renders loading state', () => {
      render(
        <UserList
          users={[]}
          onDelete={mockOnDelete}
          onGenerateToken={mockOnGenerateToken}
          isLoading={true}
          currentUserId={1}
        />
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('renders user table with correct columns', () => {
      render(
        <UserList
          users={mockUsers}
          onDelete={mockOnDelete}
          onGenerateToken={mockOnGenerateToken}
          isLoading={false}
          currentUserId={1}
        />
      );

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /username/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /email/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /role/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /status/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /actions/i })).toBeInTheDocument();
    });

    it('displays all user information correctly', () => {
      render(
        <UserList
          users={mockUsers}
          onDelete={mockOnDelete}
          onGenerateToken={mockOnGenerateToken}
          isLoading={false}
          currentUserId={2}
        />
      );

      // Check first user (admin)
      expect(screen.getByText('admin')).toBeInTheDocument();
      expect(screen.getByText('admin@example.com')).toBeInTheDocument();

      // Check second user (johndoe)
      expect(screen.getByText('johndoe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();

      // Check third user (inactive_user)
      expect(screen.getByText('inactive_user')).toBeInTheDocument();
      expect(screen.getByText('inactive@example.com')).toBeInTheDocument();
    });

    it('highlights current user in the list', () => {
      render(
        <UserList
          users={mockUsers}
          onDelete={mockOnDelete}
          onGenerateToken={mockOnGenerateToken}
          isLoading={false}
          currentUserId={2}
        />
      );

      // johndoe (id=2) should be highlighted
      const currentUserRow = screen.getByText('johndoe').closest('tr');
      expect(currentUserRow).toHaveClass('current-user');
    });

    it('displays role badges with correct styling', () => {
      render(
        <UserList
          users={mockUsers}
          onDelete={mockOnDelete}
          onGenerateToken={mockOnGenerateToken}
          isLoading={false}
          currentUserId={1}
        />
      );

      const adminBadges = screen.getAllByText('ADMIN');
      const userBadges = screen.getAllByText('USER');

      expect(adminBadges[0]).toHaveClass('role-badge', 'role-admin');
      expect(userBadges[0]).toHaveClass('role-badge', 'role-user');
    });

    it('displays status badges with correct styling', () => {
      render(
        <UserList
          users={mockUsers}
          onDelete={mockOnDelete}
          onGenerateToken={mockOnGenerateToken}
          isLoading={false}
          currentUserId={1}
        />
      );

      const activeBadges = screen.getAllByText('Active');
      const inactiveBadges = screen.getAllByText('Inactive');

      expect(activeBadges[0]).toHaveClass('status-badge', 'status-active');
      expect(inactiveBadges[0]).toHaveClass('status-badge', 'status-inactive');
    });
  });

  describe('Actions', () => {
    it('calls onGenerateToken when generate token button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <UserList
          users={mockUsers}
          onDelete={mockOnDelete}
          onGenerateToken={mockOnGenerateToken}
          isLoading={false}
          currentUserId={1}
        />
      );

      const generateTokenButtons = screen.getAllByRole('button', { name: /generate token/i });
      await user.click(generateTokenButtons[1]); // Click for johndoe

      expect(mockOnGenerateToken).toHaveBeenCalledWith(2);
    });

    it('calls onDelete when delete button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <UserList
          users={mockUsers}
          onDelete={mockOnDelete}
          onGenerateToken={mockOnGenerateToken}
          isLoading={false}
          currentUserId={1}
        />
      );

      // Get delete button for johndoe (not default admin)
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      // First delete button should be for admin (disabled), second for johndoe
      await user.click(deleteButtons[1]); // Click for johndoe

      expect(mockOnDelete).toHaveBeenCalledWith(2);
    });

    it('disables delete button for default admin user', () => {
      render(
        <UserList
          users={mockUsers}
          onDelete={mockOnDelete}
          onGenerateToken={mockOnGenerateToken}
          isLoading={false}
          currentUserId={2}
        />
      );

      // Find the row with admin and check its delete button
      const adminRow = screen.getByText('admin').closest('tr');
      const deleteButton = adminRow?.querySelector('button[aria-label*="Delete"]');

      expect(deleteButton).toBeDisabled();
    });

    it('shows tooltip for disabled delete button on default admin', () => {
      render(
        <UserList
          users={mockUsers}
          onDelete={mockOnDelete}
          onGenerateToken={mockOnGenerateToken}
          isLoading={false}
          currentUserId={2}
        />
      );

      const adminRow = screen.getByText('admin').closest('tr');
      const deleteButton = adminRow?.querySelector('button[aria-label*="Delete"]');

      expect(deleteButton).toHaveAttribute('title', 'Cannot delete default admin');
    });

    it('disables all actions when loading', () => {
      render(
        <UserList
          users={mockUsers}
          onDelete={mockOnDelete}
          onGenerateToken={mockOnGenerateToken}
          isLoading={true}
          currentUserId={1}
        />
      );

      const generateTokenButtons = screen.queryAllByRole('button', { name: /generate token/i });
      const deleteButtons = screen.queryAllByRole('button', { name: /delete/i });

      generateTokenButtons.forEach((button) => {
        expect(button).toBeDisabled();
      });

      deleteButtons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe('Password status', () => {
    it('shows password not set indicator for users without password', () => {
      render(
        <UserList
          users={mockUsers}
          onDelete={mockOnDelete}
          onGenerateToken={mockOnGenerateToken}
          isLoading={false}
          currentUserId={1}
        />
      );

      // inactive_user has passwordSet: false
      const inactiveUserRow = screen.getByText('inactive_user').closest('tr');
      expect(inactiveUserRow?.querySelector('.password-not-set')).toBeInTheDocument();
    });
  });
});
