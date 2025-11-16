import { useState, useEffect } from 'react';
import { Expense } from '../types/expense';
import { expenseService } from '../services/expenseService';
import ExpenseList from '../components/ExpenseList';
import ExpenseForm from '../components/ExpenseForm';
import './ExpensesPage.css';

function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

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

  return (
    <div className="expenses-page">
      <header className="page-header">
        <h1>Expenses</h1>
      </header>
      
      <div className="page-content">
        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        <div className="content-container">
          <section className="form-section">
            <h2>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</h2>
            <ExpenseForm
              expense={editingExpense}
              onSubmit={editingExpense 
                ? (data) => handleUpdateExpense(editingExpense.id!, data)
                : handleCreateExpense
              }
              onCancel={editingExpense ? handleCancelEdit : undefined}
            />
          </section>

          <section className="list-section">
            <h2>Expenses</h2>
            {loading ? (
              <div className="loading">Loading expenses...</div>
            ) : (
              <ExpenseList
                expenses={expenses}
                onEdit={handleEditClick}
                onDelete={handleDeleteExpense}
              />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default ExpensesPage;

