import { Outlet, Link } from 'react-router-dom';
import './Layout.css';

function Layout() {
  return (
    <div className="layout">
      <header className="app-header">
        <Link to="/" className="app-title">
          <h1>UHS - Personal Expense Tracker</h1>
        </Link>
      </header>
      <main className="layout-main">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;

