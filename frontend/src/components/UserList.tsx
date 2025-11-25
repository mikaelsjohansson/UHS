import { useState } from 'react';
import { UserDto } from '../types/user';
import LoadingSpinner from './LoadingSpinner';
import './UserList.css';

interface UserListProps {
  users: UserDto[];
  onDelete: (id: number) => void;
  onGenerateToken: (id: number) => void;
  isLoading: boolean;
  currentUserId: number;
}

const UserList = ({
  users,
  onDelete,
  onGenerateToken,
  isLoading,
  currentUserId,
}: UserListProps) => {
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const handleMenuToggle = (userId: number) => {
    setOpenMenuId(openMenuId === userId ? null : userId);
  };

  const handleAction = (action: () => void) => {
    action();
    setOpenMenuId(null);
  };

  if (isLoading && users.length === 0) {
    return (
      <div className="user-list-loading">
        <LoadingSpinner message="Loading users..." />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="empty-state">
        <p>No users found. Add your first user to get started!</p>
      </div>
    );
  }

  return (
    <div className="user-list">
      <table className="user-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user.id}
              className={user.id === currentUserId ? 'current-user' : ''}
            >
              <td className="username-cell">
                <span className="username">{user.username}</span>
                {user.id === currentUserId && (
                  <span className="current-user-badge">(You)</span>
                )}
                {!user.passwordSet && (
                  <span className="password-not-set" title="Password not set">
                    Pending setup
                  </span>
                )}
              </td>
              <td>{user.email}</td>
              <td>
                <span
                  className={`role-badge ${
                    user.role === 'ADMIN' ? 'role-admin' : 'role-user'
                  }`}
                >
                  {user.role}
                </span>
              </td>
              <td>
                <span
                  className={`status-badge ${
                    user.isActive ? 'status-active' : 'status-inactive'
                  }`}
                >
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="actions-cell">
                <div className="actions-desktop">
                  <button
                    onClick={() => onGenerateToken(user.id)}
                    disabled={isLoading}
                    className="btn btn-secondary btn-small"
                    aria-label={`Generate token for ${user.username}`}
                  >
                    Generate Token
                  </button>
                  <button
                    onClick={() => onDelete(user.id)}
                    disabled={isLoading || user.isDefaultAdmin}
                    className="btn btn-danger btn-small"
                    aria-label={`Delete user ${user.username}`}
                    title={user.isDefaultAdmin ? 'Cannot delete default admin' : ''}
                  >
                    Delete
                  </button>
                </div>
                <div className="actions-mobile">
                  <button
                    onClick={() => handleMenuToggle(user.id)}
                    disabled={isLoading}
                    className="btn btn-menu"
                    aria-label={`Actions menu for ${user.username}`}
                    aria-expanded={openMenuId === user.id}
                  >
                    ⋯
                  </button>
                  {openMenuId === user.id && (
                    <div className="actions-dropdown">
                      <button
                        onClick={() =>
                          handleAction(() => onGenerateToken(user.id))
                        }
                        disabled={isLoading}
                        className="dropdown-item"
                      >
                        Generate Token
                      </button>
                      <button
                        onClick={() => handleAction(() => onDelete(user.id))}
                        disabled={isLoading || user.isDefaultAdmin}
                        className="dropdown-item dropdown-item-danger"
                        title={
                          user.isDefaultAdmin ? 'Cannot delete default admin' : ''
                        }
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserList;
