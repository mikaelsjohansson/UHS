import { useState, useEffect } from 'react';
import { Expense, ExpenseFormData } from '../types/expense';
import { categoryService } from '../services/categoryService';
import { Category } from '../types/category';
import './ExpenseForm.css';

interface ExpenseFormProps {
  expense?: Expense | null;
  onSubmit: (data: Omit<Expense, 'id'>) => Promise<void>;
  onCancel?: () => void;
}

const ExpenseForm = ({ expense, onSubmit, onCancel }: ExpenseFormProps) => {
  const [formData, setFormData] = useState<ExpenseFormData>({
    description: '',
    amount: '',
    expenseDate: new Date().toISOString().split('T')[0],
    category: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCategories(true);
        const data = await categoryService.getAllCategories();
        setCategories(data);
      } catch (err) {
        console.error('Error loading categories:', err);
        // Fallback to empty array if API fails
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    if (expense) {
      setFormData({
        description: expense.description,
        amount: expense.amount.toString(),
        expenseDate: expense.expenseDate.split('T')[0],
        category: expense.category || '',
      });
      // Set selected category when editing
      if (expense.category) {
        const category = categories.find(cat => cat.name === expense.category);
        setSelectedCategory(category || null);
      }
    } else {
      setFormData({
        description: '',
        amount: '',
        expenseDate: new Date().toISOString().split('T')[0],
        category: '',
      });
      setSelectedCategory(null);
    }
  }, [expense, categories]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Update selected category when category select changes
    if (name === 'category') {
      const category = categories.find(cat => cat.name === value);
      setSelectedCategory(category || null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description.trim() || !formData.amount) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        description: formData.description.trim(),
        amount: parseFloat(formData.amount),
        expenseDate: new Date(formData.expenseDate).toISOString(),
        category: formData.category || undefined,
      });
      
      if (!expense) {
        setFormData({
          description: '',
          amount: '',
          expenseDate: new Date().toISOString().split('T')[0],
          category: '',
        });
      }
    } catch (err) {
      // Error handling is done in parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="expense-form">
      <div className="form-group">
        <label htmlFor="description">Description *</label>
        <input
          type="text"
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          placeholder="Enter expense description"
        />
      </div>

      <div className="form-group">
        <label htmlFor="amount">Amount *</label>
        <input
          type="number"
          id="amount"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          required
          min="0.01"
          step="0.01"
          placeholder="0.00"
        />
      </div>

      <div className="form-group">
        <label htmlFor="expenseDate">Date *</label>
        <input
          type="date"
          id="expenseDate"
          name="expenseDate"
          value={formData.expenseDate}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="category">Category</label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          disabled={loadingCategories}
        >
          <option value="">Select a category</option>
          {categories.map(category => (
            <option key={category.id} value={category.name}>
              {category.name}
            </option>
          ))}
        </select>
        {selectedCategory?.description && (
          <div className="category-description">
            {selectedCategory.description}
          </div>
        )}
      </div>

      <div className="form-actions">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : expense ? 'Update' : 'Add Expense'}
        </button>
      </div>
    </form>
  );
};

export default ExpenseForm;

