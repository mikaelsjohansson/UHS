import { Outlet } from 'react-router-dom';
import { FaMoon, FaSun } from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';
import Navigation from './Navigation';
import './Layout.css';

function Layout() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="layout">
      <header className="app-header">
        <Navigation />
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

      <footer className="app-footer">
        <p>&copy; 2025 UHS - Personal Expense Tracker</p>
      </footer>
    </div>
  );
}

export default Layout;
