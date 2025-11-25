import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaReceipt, FaChartLine, FaTags, FaUsers, FaWallet, FaListAlt, FaFolderOpen } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { expenseService } from '../services/expenseService';
import { categoryService } from '../services/categoryService';
import { Expense } from '../types/expense';
import { formatCurrency } from '../utils/currency';
import LoadingSpinner from '../components/LoadingSpinner';
import './WelcomePage.css';

interface Stats {
  totalExpenses: number;
  totalSpending: number;
  categoriesCount: number;
}

function WelcomePage() {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState<Stats>({ totalExpenses: 0, totalSpending: 0, categoriesCount: 0 });
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'ADMIN';

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [expenses, categories] = await Promise.all([
          expenseService.getAllExpenses(),
          categoryService.getAllCategories(),
        ]);

        // Calculate stats
        const totalSpending = expenses.reduce((sum: number, exp: Expense) => sum + exp.amount, 0);

        setStats({
          totalExpenses: expenses.length,
          totalSpending,
          categoriesCount: categories.length,
        });

        // Get 5 most recent expenses (sorted by date descending)
        const sortedExpenses = [...expenses].sort((a, b) => {
          return new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime();
        });
        setRecentExpenses(sortedExpenses.slice(0, 5));
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="welcome-page">
        <div className="loading-container">
          <LoadingSpinner />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="welcome-page">
      <header className="welcome-header">
        <h1>Welcome, {currentUser?.username}!</h1>
        <p className="welcome-subtitle">Here's an overview of your expenses</p>
      </header>

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      <section className="stats-section" data-testid="stats-section">
        <div className="stat-card">
          <div className="stat-icon">
            <FaListAlt />
          </div>
          <div className="stat-content">
            <h3>Total Expenses</h3>
            <p className="stat-value">{stats.totalExpenses}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FaWallet />
          </div>
          <div className="stat-content">
            <h3>Total Spending</h3>
            <p className="stat-value">{formatCurrency(stats.totalSpending)}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FaFolderOpen />
          </div>
          <div className="stat-content">
            <h3>Categories</h3>
            <p className="stat-value">{stats.categoriesCount}</p>
          </div>
        </div>
      </section>

      <section className="quick-actions-section">
        <h2>Quick Actions</h2>
        <div className="quick-actions">
          <Link to="/expenses" className="action-card">
            <FaReceipt className="action-icon" />
            <span>View Expenses</span>
          </Link>

          <Link to="/analytics" className="action-card">
            <FaChartLine className="action-icon" />
            <span>View Analytics</span>
          </Link>

          <Link to="/categories" className="action-card">
            <FaTags className="action-icon" />
            <span>Manage Categories</span>
          </Link>

          {isAdmin && (
            <Link to="/users" className="action-card admin-action">
              <FaUsers className="action-icon" />
              <span>Manage Users</span>
            </Link>
          )}
        </div>
      </section>

      <section className="recent-expenses-section">
        <h2>Recent Expenses</h2>
        {recentExpenses.length === 0 ? (
          <div className="no-expenses">
            <p>No expenses yet. Start tracking your spending!</p>
            <Link to="/expenses" className="add-expense-link">
              Add your first expense
            </Link>
          </div>
        ) : (
          <div className="recent-expenses-list">
            {recentExpenses.map((expense) => (
              <div key={expense.id} className="expense-preview-card">
                <div className="expense-preview-info">
                  <span className="expense-description">{expense.description}</span>
                  <span className="expense-category">{expense.category}</span>
                </div>
                <div className="expense-preview-meta">
                  <span className="expense-amount">{formatCurrency(expense.amount)}</span>
                  <span className="expense-date">{expense.expenseDate}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default WelcomePage;
