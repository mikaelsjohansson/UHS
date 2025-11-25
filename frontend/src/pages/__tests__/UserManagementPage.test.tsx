import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import UserManagementPage from '../UserManagementPage';
import { AuthProvider } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { authService } from '../../services/authService';
import { UserDto } from '../../types/user';

// Mock userService
vi.mock('../../services/userService', () => ({
  userService: {
    getAll: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    generateToken: vi.fn(),
  },
}));

// Mock authService
vi.mock('../../services/authService', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    getToken: vi.fn(),
    isAuthenticated: vi.fn(),
    getMe: vi.fn(),
    setPassword: vi.fn(),
    setupAdmin: vi.fn(),
    isSetupRequired: vi.fn(),
  },
  AUTH_TOKEN_KEY: 'auth_token',
}));

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
];

const mockCurrentUser: UserDto = {
  id: 1,
  username: 'admin',
  email: 'admin@example.com',
  role: 'ADMIN',
  isActive: true,
  passwordSet: true,
  isDefaultAdmin: true,
  createdAt: '2024-01-01T00:00:00Z',
};

const renderUserManagementPage = () => {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <UserManagementPage />
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('UserManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(userService.getAll).mockResolvedValue(mockUsers);
    vi.mocked(authService.getToken).mockReturnValue('test-token');
    vi.mocked(authService.isAuthenticated).mockReturnValue(true);
    vi.mocked(authService.getMe).mockResolvedValue(mockCurrentUser);
  });

  describe('Initial Load', () => {
    it('renders page title', async () => {
      renderUserManagementPage();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /user management/i })).toBeInTheDocument();
      });
    });

    it('displays Add User button', async () => {
      renderUserManagementPage();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add user/i })).toBeInTheDocument();
      });
    });

    it('loads and displays users on mount', async () => {
      renderUserManagementPage();

      await waitFor(() => {
        expect(userService.getAll).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByText('admin')).toBeInTheDocument();
        expect(screen.getByText('johndoe')).toBeInTheDocument();
      });
    });

    it('shows loading state while fetching users', async () => {
      vi.mocked(userService.getAll).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockUsers), 1000))
      );

      renderUserManagementPage();

      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument();
      });
    });

    it('displays error message when loading fails', async () => {
      vi.mocked(userService.getAll).mockRejectedValue(new Error('Failed to load'));

      renderUserManagementPage();

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/failed to load users/i)).toBeInTheDocument();
      });
    });
  });

  describe('Create User Flow', () => {
    it('opens create user modal when Add User button is clicked', async () => {
      const user = userEvent.setup();
      renderUserManagementPage();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add user/i })).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add user/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
      });
    });

    it('creates user and shows token modal on successful creation', async () => {
      const user = userEvent.setup();
      const setupUrl = 'http://localhost:5173/set-password?token=newtoken123';

      vi.mocked(userService.create).mockResolvedValue({
        user: {
          id: 3,
          username: 'newuser',
          email: 'newuser@example.com',
          role: 'USER',
          isActive: true,
          passwordSet: false,
          isDefaultAdmin: false,
          createdAt: new Date().toISOString(),
        },
        setupUrl,
      });

      renderUserManagementPage();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add user/i })).toBeInTheDocument();
      });

      // Open create modal
      const addButton = screen.getByRole('button', { name: /add user/i });
      await user.click(addButton);

      // Fill form
      const usernameInput = screen.getByLabelText(/username/i);
      const emailInput = screen.getByLabelText(/email/i);
      await user.type(usernameInput, 'newuser');
      await user.type(emailInput, 'newuser@example.com');

      // Submit
      const submitButton = screen.getByRole('button', { name: /create user/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(userService.create).toHaveBeenCalledWith({
          username: 'newuser',
          email: 'newuser@example.com',
          role: 'USER',
        });
      });

      // Token modal should appear
      await waitFor(() => {
        expect(screen.getByText(setupUrl)).toBeInTheDocument();
      });
    });

    it('refreshes user list after creating a user', async () => {
      const user = userEvent.setup();

      vi.mocked(userService.create).mockResolvedValue({
        user: {
          id: 3,
          username: 'newuser',
          email: 'newuser@example.com',
          role: 'USER',
          isActive: true,
          passwordSet: false,
          isDefaultAdmin: false,
          createdAt: new Date().toISOString(),
        },
        setupUrl: 'http://localhost:5173/set-password?token=abc',
      });

      renderUserManagementPage();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add user/i })).toBeInTheDocument();
      });

      // Open create modal
      const addButton = screen.getByRole('button', { name: /add user/i });
      await user.click(addButton);

      // Fill form
      const usernameInput = screen.getByLabelText(/username/i);
      const emailInput = screen.getByLabelText(/email/i);
      await user.type(usernameInput, 'newuser');
      await user.type(emailInput, 'newuser@example.com');

      // Submit
      const submitButton = screen.getByRole('button', { name: /create user/i });
      await user.click(submitButton);

      await waitFor(() => {
        // getAll should be called twice: on mount and after create
        expect(userService.getAll).toHaveBeenCalledTimes(2);
      });
    });

    it('displays error when user creation fails', async () => {
      const user = userEvent.setup();
      vi.mocked(userService.create).mockRejectedValue({
        response: { data: { message: 'Username already exists' } },
      });

      renderUserManagementPage();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add user/i })).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add user/i });
      await user.click(addButton);

      const usernameInput = screen.getByLabelText(/username/i);
      const emailInput = screen.getByLabelText(/email/i);
      await user.type(usernameInput, 'existinguser');
      await user.type(emailInput, 'existing@example.com');

      const submitButton = screen.getByRole('button', { name: /create user/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });

  describe('Delete User Flow', () => {
    it('opens delete confirmation modal when delete is clicked', async () => {
      const user = userEvent.setup();
      renderUserManagementPage();

      await waitFor(() => {
        expect(screen.getByText('johndoe')).toBeInTheDocument();
      });

      // Find delete button for johndoe (non-default-admin user)
      const johndoeRow = screen.getByText('johndoe').closest('tr');
      const deleteButton = within(johndoeRow!).getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/delete user 'johndoe'/i)).toBeInTheDocument();
      });
    });

    it('deletes user when confirmed', async () => {
      const user = userEvent.setup();
      vi.mocked(userService.delete).mockResolvedValue(undefined);

      renderUserManagementPage();

      await waitFor(() => {
        expect(screen.getByText('johndoe')).toBeInTheDocument();
      });

      // Click delete for johndoe
      const johndoeRow = screen.getByText('johndoe').closest('tr');
      const deleteButton = within(johndoeRow!).getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      // Confirm deletion
      await waitFor(() => {
        expect(screen.getByText(/delete user 'johndoe'/i)).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /^delete$/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(userService.delete).toHaveBeenCalledWith(2);
      });
    });

    it('refreshes user list after deleting a user', async () => {
      const user = userEvent.setup();
      vi.mocked(userService.delete).mockResolvedValue(undefined);

      renderUserManagementPage();

      await waitFor(() => {
        expect(screen.getByText('johndoe')).toBeInTheDocument();
      });

      // Click delete for johndoe
      const johndoeRow = screen.getByText('johndoe').closest('tr');
      const deleteButton = within(johndoeRow!).getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      // Confirm deletion
      const confirmButton = await screen.findByRole('button', { name: /^delete$/i });
      await user.click(confirmButton);

      await waitFor(() => {
        // getAll should be called twice: on mount and after delete
        expect(userService.getAll).toHaveBeenCalledTimes(2);
      });
    });

    it('closes modal when cancel is clicked', async () => {
      const user = userEvent.setup();
      renderUserManagementPage();

      await waitFor(() => {
        expect(screen.getByText('johndoe')).toBeInTheDocument();
      });

      // Click delete for johndoe
      const johndoeRow = screen.getByText('johndoe').closest('tr');
      const deleteButton = within(johndoeRow!).getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/delete user 'johndoe'/i)).toBeInTheDocument();
      });

      // Cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText(/delete user 'johndoe'/i)).not.toBeInTheDocument();
      });

      // User should not be deleted
      expect(userService.delete).not.toHaveBeenCalled();
    });
  });

  describe('Generate Token Flow', () => {
    it('opens token modal when generate token is clicked', async () => {
      const user = userEvent.setup();
      const setupUrl = 'http://localhost:5173/set-password?token=generated123';
      vi.mocked(userService.generateToken).mockResolvedValue({ setupUrl });

      renderUserManagementPage();

      await waitFor(() => {
        expect(screen.getByText('johndoe')).toBeInTheDocument();
      });

      // Click generate token for johndoe
      const johndoeRow = screen.getByText('johndoe').closest('tr');
      const generateButton = within(johndoeRow!).getByRole('button', { name: /generate token/i });
      await user.click(generateButton);

      await waitFor(() => {
        expect(userService.generateToken).toHaveBeenCalledWith(2);
      });

      await waitFor(() => {
        expect(screen.getByText(setupUrl)).toBeInTheDocument();
      });
    });

    it('displays error when token generation fails', async () => {
      const user = userEvent.setup();
      vi.mocked(userService.generateToken).mockRejectedValue(new Error('Failed to generate token'));

      renderUserManagementPage();

      await waitFor(() => {
        expect(screen.getByText('johndoe')).toBeInTheDocument();
      });

      // Click generate token for johndoe
      const johndoeRow = screen.getByText('johndoe').closest('tr');
      const generateButton = within(johndoeRow!).getByRole('button', { name: /generate token/i });
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error and allows retry when delete fails', async () => {
      const user = userEvent.setup();
      vi.mocked(userService.delete).mockRejectedValue(new Error('Network error'));

      renderUserManagementPage();

      await waitFor(() => {
        expect(screen.getByText('johndoe')).toBeInTheDocument();
      });

      // Click delete for johndoe
      const johndoeRow = screen.getByText('johndoe').closest('tr');
      const deleteButton = within(johndoeRow!).getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      // Confirm deletion
      const confirmButton = await screen.findByRole('button', { name: /^delete$/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/failed to delete user/i)).toBeInTheDocument();
      });
    });
  });
});
