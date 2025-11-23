import { Outlet, Link } from 'react-router-dom';
import { FaMoon, FaSun } from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';
import './Layout.css';

function Layout() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="layout">
      <header className="app-header">
        <Link to="/" className="app-title">
          <h1>UHS - Personal Expense Tracker</h1>
        </Link>
        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? (
            <FaMoon data-testid="theme-icon-moon" />
          ) : (
            <FaSun data-testid="theme-icon-sun" />
          )}
        </button>
      </header>
      <main className="layout-main">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
