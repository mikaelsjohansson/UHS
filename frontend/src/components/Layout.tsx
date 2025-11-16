import { Outlet, Link, useLocation } from 'react-router-dom';
import './Layout.css';

function Layout() {
  const location = useLocation();

  return (
    <div className="layout">
      <aside className="sidebar">
        <nav className="sidebar-nav">
          <Link 
            to="/" 
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            Home
          </Link>
          <Link 
            to="/expenses" 
            className={`nav-link ${location.pathname === '/expenses' ? 'active' : ''}`}
          >
            Expenses
          </Link>
        </nav>
      </aside>
      <main className="layout-main">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;

