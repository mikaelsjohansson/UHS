import { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import LoadingSpinner from './LoadingSpinner';

function ProtectedRoute() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [setupRequired, setSetupRequired] = useState<boolean | null>(null);
  const [checkingSetup, setCheckingSetup] = useState(false);

  useEffect(() => {
    // Only check setup status if not authenticated and auth check is done
    if (!authLoading && !isAuthenticated) {
      setCheckingSetup(true);
      authService
        .isSetupRequired()
        .then((status) => {
          setSetupRequired(status.setupRequired);
        })
        .catch(() => {
          // On error, default to setup not required (redirect to login)
          setSetupRequired(false);
        })
        .finally(() => {
          setCheckingSetup(false);
        });
    }
  }, [authLoading, isAuthenticated]);

  // Show loading while checking auth status
  if (authLoading) {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  // If authenticated, render the protected content
  if (isAuthenticated) {
    return <Outlet />;
  }

  // If checking setup status, show loading
  if (checkingSetup || setupRequired === null) {
    return <LoadingSpinner message="Checking setup status..." />;
  }

  // If setup is required, redirect to admin setup
  if (setupRequired) {
    return <Navigate to="/admin-setup" replace />;
  }

  // Otherwise, redirect to login
  return <Navigate to="/login" replace />;
}

export default ProtectedRoute;
