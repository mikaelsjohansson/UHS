import { Link } from 'react-router-dom';
import './Welcome.css';

function Welcome() {
  return (
    <div className="welcome-container">
      <div className="welcome-content">
        <h1>Welcome to UHS</h1>
        <p className="welcome-subtitle">Personal Expense Tracker</p>
        <p className="welcome-description">
          Manage your expenses efficiently and keep track of your spending.
        </p>
        <div className="welcome-features">
          <Link to="/expenses" className="feature-card feature-card-link">
            <h3>Track Expenses</h3>
            <p>Add, edit, and delete your expenses with ease.</p>
          </Link>
          <Link to="/categories" className="feature-card feature-card-link">
            <h3>Manage Categories</h3>
            <p>Create and manage your expense categories.</p>
          </Link>
          <Link to="/analytics" className="feature-card feature-card-link">
            <h3>Analytics</h3>
            <p>View visual reports and track spending by category over time.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Welcome;

