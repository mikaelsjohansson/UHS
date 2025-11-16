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
        </div>
      </div>
    </div>
  );
}

export default Welcome;

