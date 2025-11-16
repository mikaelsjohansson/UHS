import { Expense } from '../types/expense';
import { formatCurrency } from '../utils/currency';
import Modal from './Modal';
import './DeleteConfirmationModal.css';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  expense: Expense | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmationModal = ({
  isOpen,
  expense,
  onConfirm,
  onCancel,
}: DeleteConfirmationModalProps) => {
  if (!expense) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title="Delete Expense">
      <div className="delete-confirmation">
        <p className="confirmation-message">
          Are you sure you want to delete this expense?
        </p>
        <div className="expense-preview">
          <div className="preview-item">
            <span className="preview-label">Description:</span>
            <span className="preview-value">{expense.description}</span>
          </div>
          <div className="preview-item">
            <span className="preview-label">Amount:</span>
            <span className="preview-value">{formatCurrency(expense.amount)}</span>
          </div>
          {expense.category && (
            <div className="preview-item">
              <span className="preview-label">Category:</span>
              <span className="preview-value">{expense.category}</span>
            </div>
          )}
        </div>
        <div className="confirmation-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="btn btn-danger"
          >
            Delete
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteConfirmationModal;

