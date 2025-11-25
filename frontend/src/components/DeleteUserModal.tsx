import Modal from './Modal';
import './DeleteUserModal.css';

interface DeleteUserModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  username: string;
  isLoading: boolean;
}

const DeleteUserModal = ({
  isOpen,
  onConfirm,
  onCancel,
  username,
  isLoading,
}: DeleteUserModalProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title="Delete User">
      <div className="delete-user-modal" role="dialog" aria-modal="true">
        <div className="warning-icon">!</div>
        <p className="warning-message">
          Delete user '{username}'? This cannot be undone.
        </p>
        <div className="modal-actions">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="btn btn-danger"
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteUserModal;
