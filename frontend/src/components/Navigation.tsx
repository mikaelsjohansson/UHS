import { Link } from 'react-router-dom';
import { FaSignOutAlt, FaUser } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import './Navigation.css';

function Navigation() {
  const { currentUser, logout, isAuthenticated } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <nav className="navigation" role="navigation">
      <div className="nav-brand">
        <Link to="/" className="brand-link">
          <h1>UHS</h1>
        </Link>
      </div>

      {isAuthenticated && currentUser && (
        <div className="user-section">
          <div className="user-info">
            <FaUser className="user-icon" />
            <span className="username">{currentUser.username}</span>
            <span className={`role-badge ${currentUser.role === 'ADMIN' ? 'role-badge-admin' : 'role-badge-user'}`}>
              {currentUser.role}
            </span>
          </div>
          <button
            className="logout-btn"
            onClick={handleLogout}
            aria-label="Logout"
          >
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </div>
      )}
    </nav>
  );
}

export default Navigation;
