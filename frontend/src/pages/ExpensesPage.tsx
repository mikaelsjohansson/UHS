import { useState, useEffect, useCallback } from 'react';
import { Expense } from '../types/expense';
import { expenseService } from '../services/expenseService';
import ExpenseList from '../components/ExpenseList';
import ExpenseForm from '../components/ExpenseForm';
import Modal from '../components/Modal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import './ExpensesPage.css';

function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteExpense, setDeleteExpense] = useState<Expense | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  
  // Get current month as default
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);

  const loadExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await expenseService.getExpensesByMonth(selectedYear, selectedMonth);
      setExpenses(data);
    } catch (err) {
      setError('Failed to load expenses. Please try again.');
      console.error('Error loading expenses:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const handleCreateExpense = async (expenseData: Omit<Expense, 'id'>) => {
    try {
      const newExpense = await expenseService.createExpense(expenseData);
      // Reload expenses to ensure we show the correct month's expenses
      await loadExpenses();
      setError(null);
      setIsAddModalOpen(false);
    } catch (err) {
      setError('Failed to create expense. Please try again.');
      console.error('Error creating expense:', err);
      throw err;
    }
  };

  const handleUpdateExpense = async (id: number, expenseData: Omit<Expense, 'id'>) => {
    try {
      await expenseService.updateExpense(id, expenseData);
      // Reload expenses to ensure we show the correct month's expenses
      await loadExpenses();
      setEditingExpense(null);
      setError(null);
    } catch (err) {
      setError('Failed to update expense. Please try again.');
      console.error('Error updating expense:', err);
      throw err;
    }
  };

  const handleDeleteExpense = async (id: number) => {
    try {
      await expenseService.deleteExpense(id);
      // Reload expenses to ensure we show the correct month's expenses
      await loadExpenses();
      setError(null);
      setIsDeleteModalOpen(false);
      setDeleteExpense(null);
    } catch (err) {
      setError('Failed to delete expense. Please try again.');
      console.error('Error deleting expense:', err);
    }
  };

  const handleEditClick = (expense: Expense) => {
    setEditingExpense(expense);
  };

  const handleCancelEdit = () => {
    setEditingExpense(null);
  };

  const handleAddClick = () => {
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleDeleteClick = (expense: Expense) => {
    setDeleteExpense(expense);
    setIsDeleteModalOpen(true);
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setDeleteExpense(null);
  };

  const handleConfirmDelete = () => {
    if (deleteExpense?.id) {
      handleDeleteExpense(deleteExpense.id);
    }
  };

  return (
    <div className="expenses-page">
      <div className="page-content">
        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        <section className="list-section">
          <div className="list-header">
            <h2>Expenses</h2>
            <div className="header-controls">
              <div className="month-selector">
                <label htmlFor="month-select" className="month-select-label">
                  Month:
                </label>
                <input
                  id="month-select"
                  type="month"
                  value={`${selectedYear}-${String(selectedMonth).padStart(2, '0')}`}
                  onChange={(e) => {
                    const [year, month] = e.target.value.split('-').map(Number);
                    setSelectedYear(year);
                    setSelectedMonth(month);
                  }}
                  className="month-input"
                />
              </div>
              <button
                className="btn-add-expense"
                onClick={handleAddClick}
                aria-label="Add new expense"
              >
                Add Expense
              </button>
            </div>
          </div>
          {loading ? (
            <div className="loading">Loading expenses...</div>
          ) : (
            <ExpenseList
              expenses={expenses}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />
          )}
        </section>

        <Modal
          isOpen={isAddModalOpen}
          onClose={handleCloseAddModal}
          title="Add New Expense"
        >
          <ExpenseForm
            expense={null}
            onSubmit={handleCreateExpense}
            onCancel={handleCloseAddModal}
          />
        </Modal>

        <Modal
          isOpen={editingExpense !== null}
          onClose={handleCancelEdit}
          title="Edit Expense"
        >
          <ExpenseForm
            expense={editingExpense}
            onSubmit={editingExpense 
              ? (data) => handleUpdateExpense(editingExpense.id!, data)
              : handleCreateExpense
            }
            onCancel={handleCancelEdit}
          />
        </Modal>

        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          expense={deleteExpense}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      </div>
    </div>
  );
}

export default ExpensesPage;

