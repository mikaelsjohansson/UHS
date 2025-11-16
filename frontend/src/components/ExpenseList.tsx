import { Expense } from '../types/expense';
import './ExpenseList.css';

interface ExpenseListProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
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
            <h3 className="expense-description">{expense.description}</h3>
            <div className="expense-details">
              <span className="expense-date">{formatDate(expense.expenseDate)}</span>
              {expense.category && (
                <span className="expense-category">{expense.category}</span>
              )}
            </div>
          </div>
          <div className="expense-right">
            <span className="expense-amount">{formatAmount(expense.amount)}</span>
            <div className="expense-actions">
              <button
                onClick={() => onEdit(expense)}
                className="btn-edit"
                aria-label={`Edit expense: ${expense.description}`}
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(expense)}
                className="btn-delete"
                aria-label={`Delete expense: ${expense.description}`}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ExpenseList;

