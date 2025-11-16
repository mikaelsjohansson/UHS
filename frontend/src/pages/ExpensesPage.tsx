import { useState, useEffect } from 'react';
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

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await expenseService.getAllExpenses();
      setExpenses(data);
    } catch (err) {
      setError('Failed to load expenses. Please try again.');
      console.error('Error loading expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExpense = async (expenseData: Omit<Expense, 'id'>) => {
    try {
      const newExpense = await expenseService.createExpense(expenseData);
      setExpenses([...expenses, newExpense]);
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
      const updatedExpense = await expenseService.updateExpense(id, expenseData);
      setExpenses(expenses.map(exp => exp.id === id ? updatedExpense : exp));
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
      setExpenses(expenses.filter(exp => exp.id !== id));
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
            <button
              className="btn-add-expense"
              onClick={handleAddClick}
              aria-label="Add new expense"
            >
              Add Expense
            </button>
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

