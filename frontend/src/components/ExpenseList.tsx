import { Expense } from '../types/expense';
import './ExpenseList.css';

interface ExpenseListProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: number) => void;
}

const ExpenseList = ({ expenses, onEdit, onDelete }: ExpenseListProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (expenses.length === 0) {
    return (
      <div className="empty-state">
        <p>No expenses yet. Add your first expense to get started!</p>
      </div>
    );
  }

  return (
    <div className="expense-list">
      {expenses.map(expense => (
        <div key={expense.id} className="expense-item">
          <div className="expense-info">
            <div className="expense-header">
              <h3 className="expense-description">{expense.description}</h3>
              <span className="expense-amount">{formatAmount(expense.amount)}</span>
            </div>
            <div className="expense-details">
              <span className="expense-date">{formatDate(expense.expenseDate)}</span>
              {expense.category && (
                <span className="expense-category">{expense.category}</span>
              )}
            </div>
          </div>
          <div className="expense-actions">
            <button
              onClick={() => onEdit(expense)}
              className="btn-edit"
              aria-label={`Edit expense: ${expense.description}`}
            >
              Edit
            </button>
            <button
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete "${expense.description}"?`)) {
                  onDelete(expense.id!);
                }
              }}
              className="btn-delete"
              aria-label={`Delete expense: ${expense.description}`}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ExpenseList;

