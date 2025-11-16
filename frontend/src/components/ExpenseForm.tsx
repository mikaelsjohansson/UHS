import { useState, useEffect, useRef } from 'react';
import { Expense, ExpenseFormData } from '../types/expense';
import { categoryService } from '../services/categoryService';
import { expenseService } from '../services/expenseService';
import { Category } from '../types/category';
import Modal from './Modal';
import CategoryForm from './CategoryForm';
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
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number>(-1);
  const [isCreateCategoryModalOpen, setIsCreateCategoryModalOpen] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLSelectElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Update form when expense prop changes (for editing)
  useEffect(() => {
    if (expense) {
      setFormData({
        description: expense.description,
        amount: expense.amount.toString(),
        expenseDate: expense.expenseDate.split('T')[0],
        category: expense.category,
      });
      // Set selected category when editing
      const category = categories.find(cat => cat.name === expense.category);
      setSelectedCategory(category || null);
    }
    // Note: We don't reset form when expense is null to preserve user input
    // Form is only reset when expense prop actually changes from a value to null
  }, [expense]);

  // Update selected category when categories list changes (e.g., after creating new category)
  useEffect(() => {
    if (formData.category && categories.length > 0) {
      const category = categories.find(cat => cat.name === formData.category);
      setSelectedCategory(category || null);
    }
  }, [categories, formData.category]);

  // Auto-focus description field when creating new expense
  useEffect(() => {
    if (!expense && !loadingCategories && inputRef.current) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [expense, loadingCategories]);

  // Auto-open date picker when date field receives focus
  useEffect(() => {
    const dateInput = dateRef.current;
    if (!dateInput) return;

    const handleFocus = () => {
      // Open date picker if supported
      if (typeof dateInput.showPicker === 'function') {
        // Small delay to ensure focus is set first
        setTimeout(() => {
          dateInput.showPicker();
        }, 0);
      }
    };

    dateInput.addEventListener('focus', handleFocus);
    return () => {
      dateInput.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Update selected category when category select changes
    if (name === 'category') {
      const category = categories.find(cat => cat.name === value);
      setSelectedCategory(category || null);
    }
    
    // Move focus to category after date is selected
    if (name === 'expenseDate' && value) {
      setTimeout(() => {
        categoryRef.current?.focus();
      }, 0);
    }
    
    // Handle description changes for autocomplete
    if (name === 'description') {
      // Clear previous debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      // If description is empty, hide suggestions
      if (value.trim().length === 0) {
        setSuggestions([]);
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        return;
      }
      
      // Reset selected index when typing
      setSelectedSuggestionIndex(-1);
      
      // Debounce API call
      debounceTimerRef.current = setTimeout(async () => {
        if (value.trim().length > 0) {
          setIsLoadingSuggestions(true);
          try {
            const suggestionsList = await expenseService.getDescriptionSuggestions(value);
            setSuggestions(suggestionsList);
            setShowSuggestions(suggestionsList.length > 0);
            setSelectedSuggestionIndex(-1); // Reset selection when new suggestions arrive
          } catch (err) {
            console.error('Error loading suggestions:', err);
            setSuggestions([]);
            setShowSuggestions(false);
            setSelectedSuggestionIndex(-1);
          } finally {
            setIsLoadingSuggestions(false);
          }
        }
      }, 300); // 300ms debounce
    }
  };

  const handleSuggestionClick = async (suggestion: string) => {
    setFormData(prev => ({ ...prev, description: suggestion }));
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedSuggestionIndex(-1);
    
    // Fetch category hint for the selected suggestion
    try {
      const categoryHint = await expenseService.getCategoryHint(suggestion);
      if (categoryHint) {
        setFormData(prev => ({ ...prev, category: categoryHint }));
        const category = categories.find(cat => cat.name === categoryHint);
        setSelectedCategory(category || null);
      }
    } catch (err) {
      console.error('Error loading category hint:', err);
    }
    
    // Move focus to amount field after selecting suggestion
    setTimeout(() => {
      amountRef.current?.focus();
    }, 0);
  };

  const handleDescriptionKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    // If suggestions are visible, handle autocomplete navigation
    if (showSuggestions && suggestions.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedSuggestionIndex(prev => 
            prev < suggestions.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedSuggestionIndex(prev => (prev > 0 ? prev - 1 : -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < suggestions.length) {
            await handleSuggestionClick(suggestions[selectedSuggestionIndex]);
          } else if (suggestions.length > 0) {
            // If no selection, use first suggestion
            await handleSuggestionClick(suggestions[0]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setShowSuggestions(false);
          setSelectedSuggestionIndex(-1);
          break;
      }
      return;
    }

    // If no suggestions are visible, handle Enter to move to next field
    if (e.key === 'Enter') {
      e.preventDefault();
      amountRef.current?.focus();
    }
  };

  const handleAmountKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      dateRef.current?.focus();
    }
  };

  const handleDateKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Move focus to category field instead of submitting form
      setTimeout(() => {
        categoryRef.current?.focus();
      }, 0);
    }
  };

  const handleCategoryKeyDown = (e: React.KeyboardEvent<HTMLSelectElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Submit form if Enter is pressed in category field
      const submitButton = e.currentTarget.form?.querySelector('button[type="submit"]') as HTMLButtonElement;
      if (submitButton && !submitButton.disabled) {
        submitButton.click();
      }
    }
  };

  const handleCreateCategory = async (categoryData: Omit<Category, 'id'>) => {
    try {
      const newCategory = await categoryService.createCategory(categoryData);
      // Refresh category list
      const updatedCategories = await categoryService.getAllCategories();
      // Find the newly created category in the updated list
      const category = updatedCategories.find(cat => cat.id === newCategory.id);
      
      // Update categories first, then select the new category
      setCategories(updatedCategories);
      
      // Use setTimeout to ensure categories are updated before selecting
      setTimeout(() => {
        if (category) {
          setFormData(prev => ({ ...prev, category: category.name }));
          setSelectedCategory(category);
        }
      }, 0);
      
      // Close modal
      setIsCreateCategoryModalOpen(false);
    } catch (err) {
      console.error('Error creating category:', err);
      throw err;
    }
  };

  const handleCloseCreateCategoryModal = () => {
    setIsCreateCategoryModalOpen(false);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description.trim() || !formData.amount || !formData.category.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        description: formData.description.trim(),
        amount: parseFloat(formData.amount),
        expenseDate: new Date(formData.expenseDate).toISOString(),
        category: formData.category.trim(),
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
    <>
    <form onSubmit={handleSubmit} className="expense-form">
      <div className="form-group">
        <label htmlFor="description">Description *</label>
        <div className="autocomplete-wrapper">
          <input
            ref={inputRef}
            type="text"
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            onKeyDown={handleDescriptionKeyDown}
            onFocus={() => {
              if (suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            required
            placeholder="Enter expense description"
            autoComplete="off"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div ref={suggestionsRef} className="suggestions-dropdown">
              {isLoadingSuggestions ? (
                <div className="suggestion-item">Loading...</div>
              ) : (
                suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className={`suggestion-item ${index === selectedSuggestionIndex ? 'selected' : ''}`}
                    onClick={() => handleSuggestionClick(suggestion)}
                    onMouseEnter={() => setSelectedSuggestionIndex(index)}
                  >
                    {suggestion}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="amount">Amount *</label>
        <input
          ref={amountRef}
          type="number"
          id="amount"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          onKeyDown={handleAmountKeyDown}
          required
          min="0.01"
          step="0.01"
          placeholder="0.00"
        />
      </div>

      <div className="form-group">
        <label htmlFor="expenseDate">Date *</label>
        <input
          ref={dateRef}
          type="date"
          id="expenseDate"
          name="expenseDate"
          value={formData.expenseDate}
          onChange={handleChange}
          onKeyDown={handleDateKeyDown}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="category">Category *</label>
        <div className="category-input-wrapper">
          <select
            ref={categoryRef}
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            onKeyDown={handleCategoryKeyDown}
            disabled={loadingCategories}
            required
          >
            <option value="">Select a category</option>
            {categories.map(category => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn-create-category"
            onClick={() => setIsCreateCategoryModalOpen(true)}
            aria-label="Add new category"
            disabled={loadingCategories}
          >
            +
          </button>
        </div>
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

    <Modal
      isOpen={isCreateCategoryModalOpen}
      onClose={handleCloseCreateCategoryModal}
      title="Create New Category"
    >
      <CategoryForm
        onSubmit={handleCreateCategory}
        onCancel={handleCloseCreateCategoryModal}
      />
    </Modal>
    </>
  );
};

export default ExpenseForm;

