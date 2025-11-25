import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import ErrorBoundary from './components/ErrorBoundary';
import WelcomePage from './pages/WelcomePage';
import ExpensesPage from './pages/ExpensesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import CategoriesPage from './pages/CategoriesPage';
import LoginPage from './pages/LoginPage';
import AdminSetupPage from './pages/AdminSetupPage';
import SetPasswordPage from './pages/SetPasswordPage';
import UserManagementPage from './pages/UserManagementPage';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public routes - outside Layout */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/admin-setup" element={<AdminSetupPage />} />
              <Route path="/setup-password/:token" element={<SetPasswordPage />} />

              {/* Protected routes - inside Layout */}
              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  {/* Home/Welcome page */}
                  <Route index element={<WelcomePage />} />

                  {/* Regular User routes */}
                  <Route path="expenses" element={<ExpensesPage />} />
                  <Route path="analytics" element={<AnalyticsPage />} />
                  <Route path="categories" element={<CategoriesPage />} />

                  {/* Admin-only routes */}
                  <Route element={<AdminRoute />}>
                    <Route path="users" element={<UserManagementPage />} />
                  </Route>
                </Route>
              </Route>

              {/* Catch-all - redirect to login instead of home */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
