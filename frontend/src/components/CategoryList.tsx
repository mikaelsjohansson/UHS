import { Category } from '../types/category';
import './CategoryList.css';

interface CategoryListProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

const CategoryList = ({ categories, onEdit, onDelete }: CategoryListProps) => {
  if (categories.length === 0) {
    return (
      <div className="empty-state">
        <p>No categories yet. Add your first category to get started!</p>
      </div>
    );
  }

  return (
    <div className="category-list">
      {categories.map(category => (
        <div key={category.id} className="category-item">
          <div className="category-info">
            <h3 className="category-name">{category.name}</h3>
          </div>
          <div className="category-actions">
            <button
              onClick={() => onEdit(category)}
              className="btn-edit"
              aria-label={`Edit category: ${category.name}`}
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(category)}
              className="btn-delete"
              aria-label={`Delete category: ${category.name}`}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CategoryList;


