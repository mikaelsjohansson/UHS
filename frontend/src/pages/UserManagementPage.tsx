import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';
import { UserDto, CreateUserRequestDto } from '../types/user';
import UserList from '../components/UserList';
import UserForm from '../components/UserForm';
import Modal from '../components/Modal';
import GenerateTokenModal from '../components/GenerateTokenModal';
import DeleteUserModal from '../components/DeleteUserModal';
import './UserManagementPage.css';

function UserManagementPage() {
  const { currentUser } = useAuth();

  // State
  const [users, setUsers] = useState<UserDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isGenerateTokenModalOpen, setIsGenerateTokenModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<UserDto | null>(null);
  const [setupUrl, setSetupUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | undefined>(undefined);

  // Load users
  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await userService.getAll();
      setUsers(data);
    } catch {
      setError('Failed to load users. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Handle create user
  const handleCreateUser = async (data: CreateUserRequestDto) => {
    try {
      setIsSubmitting(true);
      setCreateError(undefined);
      const response = await userService.create(data);
      setIsCreateModalOpen(false);
      setSetupUrl(response.setupUrl);
      setSelectedUser(response.user);
      setIsGenerateTokenModalOpen(true);
      await loadUsers();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const errorMessage = error.response?.data?.message || 'Failed to create user. Please try again.';
      setCreateError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete user
  const handleDeleteClick = (id: number) => {
    const user = users.find((u) => u.id === id);
    if (user) {
      setSelectedUser(user);
      setIsDeleteModalOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;

    try {
      setIsSubmitting(true);
      await userService.delete(selectedUser.id);
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
      await loadUsers();
    } catch {
      setError('Failed to delete user. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setSelectedUser(null);
  };

  // Handle generate token
  const handleGenerateToken = async (id: number) => {
    const user = users.find((u) => u.id === id);
    if (!user) return;

    try {
      setIsSubmitting(true);
      const response = await userService.generateToken(id);
      setSelectedUser(user);
      setSetupUrl(response.setupUrl);
      setIsGenerateTokenModalOpen(true);
    } catch {
      setError('Failed to generate token. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseTokenModal = () => {
    setIsGenerateTokenModalOpen(false);
    setSelectedUser(null);
    setSetupUrl('');
  };

  // Modal controls
  const handleOpenCreateModal = () => {
    setCreateError(undefined);
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setCreateError(undefined);
  };

  return (
    <div className="user-management-page">
      <div className="page-header">
        <button
          className="btn btn-primary btn-add-user"
          onClick={handleOpenCreateModal}
          title="Add a new user"
        >
          <span className="plus-icon">+</span>
          Add User
        </button>
        <h2>User Management</h2>
      </div>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      <UserList
        users={users}
        onDelete={handleDeleteClick}
        onGenerateToken={handleGenerateToken}
        isLoading={isLoading || isSubmitting}
        currentUserId={currentUser?.id ?? 0}
      />

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        title="Create New User"
      >
        <UserForm
          onSubmit={handleCreateUser}
          onCancel={handleCloseCreateModal}
          isLoading={isSubmitting}
          error={createError}
          mode="create"
        />
      </Modal>

      {/* Generate Token Modal */}
      <GenerateTokenModal
        isOpen={isGenerateTokenModalOpen}
        onClose={handleCloseTokenModal}
        username={selectedUser?.username ?? ''}
        setupUrl={setupUrl}
      />

      {/* Delete User Modal */}
      <DeleteUserModal
        isOpen={isDeleteModalOpen}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        username={selectedUser?.username ?? ''}
        isLoading={isSubmitting}
      />
    </div>
  );
}

export default UserManagementPage;
