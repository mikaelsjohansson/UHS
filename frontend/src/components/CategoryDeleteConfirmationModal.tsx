import { Category } from '../types/category';
import Modal from './Modal';
import './DeleteConfirmationModal.css';

interface CategoryDeleteConfirmationModalProps {
  isOpen: boolean;
  category: Category | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const CategoryDeleteConfirmationModal = ({
  isOpen,
  category,
  onConfirm,
  onCancel,
}: CategoryDeleteConfirmationModalProps) => {
  if (!category) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title="Delete Category">
      <div className="delete-confirmation">
        <p className="confirmation-message">
          Are you sure you want to delete the category &quot;{category.name}&quot;?
        </p>
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

export default CategoryDeleteConfirmationModal;

