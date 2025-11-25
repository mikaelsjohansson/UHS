import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import PasswordInputField from '../components/PasswordInputField';
import FormErrorMessage from '../components/FormErrorMessage';
import { PasswordValidationResult } from '../components/PasswordStrengthIndicator';
import './AdminSetupPage.css';

interface FormErrors {
  password?: string;
  confirmPassword?: string;
}

function AdminSetupPage() {
  const navigate = useNavigate();
  const { setupAdmin, isAuthenticated, isLoading: authLoading } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidationResult | null>(null);

  // Check setup status and authentication on mount
  useEffect(() => {
    const checkSetupAndAuth = async () => {
      try {
        // Check if already authenticated
        if (isAuthenticated) {
          navigate('/');
          return;
        }

        // Check if setup is required
        const setupStatus = await authService.isSetupRequired();
        if (!setupStatus.setupRequired) {
          navigate('/login');
          return;
        }
      } catch (error) {
        console.error('Error checking setup status:', error);
      } finally {
        setIsCheckingSetup(false);
      }
    };

    checkSetupAndAuth();
  }, [navigate, isAuthenticated]);

  const handlePasswordValidation = (result: PasswordValidationResult) => {
    setPasswordValidation(result);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Check password complexity
    if (!passwordValidation?.isValid) {
      newErrors.password = 'Password does not meet complexity requirements';
    }

    // Check passwords match
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: undefined }));
    }
    if (generalError) {
      setGeneralError(null);
    }
  };

  const handleConfirmPasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    if (errors.confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
    }
    if (generalError) {
      setGeneralError(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await setupAdmin(password);
      navigate('/login');
    } catch (error: unknown) {
      let errorMessage = 'Setup failed. Please try again.';

      if (error && typeof error === 'object') {
        if ('response' in error && error.response && typeof error.response === 'object') {
          const response = error.response as { data?: { message?: string } };
          if (response.data?.message) {
            errorMessage = response.data.message;
          }
        } else if ('message' in error && typeof error.message === 'string') {
          errorMessage = error.message;
        }
      }

      setGeneralError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading while checking setup/auth status
  if (isCheckingSetup || authLoading) {
    return (
      <div className="admin-setup-page">
        <div className="admin-setup-container">
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-setup-page">
      <div className="admin-setup-container">
        <div className="admin-setup-header">
          <h1>Admin Setup</h1>
          <p className="admin-setup-info">
            This is a first-time setup. Please create a secure password for the admin account.
            This password will be used to log in and manage the expense tracker.
          </p>
        </div>

        <FormErrorMessage message={generalError} />

        <form onSubmit={handleSubmit} className="admin-setup-form">
          <PasswordInputField
            label="Password"
            id="password"
            value={password}
            onChange={handlePasswordChange}
            placeholder="Enter a secure password"
            disabled={isSubmitting}
            error={errors.password}
            showStrength
            onValidation={handlePasswordValidation}
          />

          <PasswordInputField
            label="Confirm Password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
            placeholder="Confirm your password"
            disabled={isSubmitting}
            error={errors.confirmPassword}
          />

          <button
            type="submit"
            className="btn btn-primary setup-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Setting up...' : 'Set Admin Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminSetupPage;
