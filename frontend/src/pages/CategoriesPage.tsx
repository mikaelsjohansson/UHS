import { useState, useEffect } from 'react';
import { Category } from '../types/category';
import { categoryService } from '../services/categoryService';
import CategoryList from '../components/CategoryList';
import CategoryForm from '../components/CategoryForm';
import Modal from '../components/Modal';
import CategoryDeleteConfirmationModal from '../components/CategoryDeleteConfirmationModal';
import './CategoriesPage.css';

function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await categoryService.getAllCategories();
      setCategories(data);
    } catch (err) {
      setError('Failed to load categories. Please try again.');
      console.error('Error loading categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (categoryData: Omit<Category, 'id'>) => {
    try {
      const newCategory = await categoryService.createCategory(categoryData);
      setCategories([...categories, newCategory]);
      setError(null);
      setIsAddModalOpen(false);
    } catch (err) {
      setError('Failed to create category. Please try again.');
      console.error('Error creating category:', err);
      throw err;
    }
  };

  const handleUpdateCategory = async (id: number, categoryData: Omit<Category, 'id'>) => {
    try {
      const updatedCategory = await categoryService.updateCategory(id, categoryData);
      setCategories(categories.map(cat => cat.id === id ? updatedCategory : cat));
      setEditingCategory(null);
      setError(null);
    } catch (err) {
      setError('Failed to update category. Please try again.');
      console.error('Error updating category:', err);
      throw err;
    }
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      await categoryService.deleteCategory(id);
      setCategories(categories.filter(cat => cat.id !== id));
      setError(null);
      setIsDeleteModalOpen(false);
      setDeleteCategory(null);
    } catch (err) {
      setError('Failed to delete category. Please try again.');
      console.error('Error deleting category:', err);
    }
  };

  const handleEditClick = (category: Category) => {
    setEditingCategory(category);
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
  };

  const handleAddClick = () => {
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleDeleteClick = (category: Category) => {
    setDeleteCategory(category);
    setIsDeleteModalOpen(true);
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setDeleteCategory(null);
  };

  const handleConfirmDelete = () => {
    if (deleteCategory?.id) {
      handleDeleteCategory(deleteCategory.id);
    }
  };

  return (
    <div className="categories-page">
      <div className="page-content">
        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        <section className="list-section">
          <div className="list-header">
            <h2>Categories</h2>
            <button
              className="btn-add-category"
              onClick={handleAddClick}
              aria-label="Add new category"
            >
              Add Category
            </button>
          </div>
          {loading ? (
            <div className="loading">Loading categories...</div>
          ) : (
            <CategoryList
              categories={categories}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />
          )}
        </section>

        <Modal
          isOpen={isAddModalOpen}
          onClose={handleCloseAddModal}
          title="Add New Category"
        >
          <CategoryForm
            category={null}
            onSubmit={handleCreateCategory}
            onCancel={handleCloseAddModal}
          />
        </Modal>

        <Modal
          isOpen={editingCategory !== null}
          onClose={handleCancelEdit}
          title="Edit Category"
        >
          <CategoryForm
            category={editingCategory}
            onSubmit={editingCategory 
              ? (data) => handleUpdateCategory(editingCategory.id!, data)
              : handleCreateCategory
            }
            onCancel={handleCancelEdit}
          />
        </Modal>

        <CategoryDeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          category={deleteCategory}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      </div>
    </div>
  );
}

export default CategoriesPage;

