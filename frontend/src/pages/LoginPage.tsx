import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import PasswordInputField from '../components/PasswordInputField';
import FormErrorMessage from '../components/FormErrorMessage';
import './LoginPage.css';

interface FormErrors {
  username?: string;
  password?: string;
}

function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);

  // Check setup status and authentication on mount
  useEffect(() => {
    const checkSetupAndAuth = async () => {
      try {
        // Check if setup is required
        const setupStatus = await authService.isSetupRequired();
        if (setupStatus.setupRequired) {
          navigate('/admin-setup');
          return;
        }

        // Check if already authenticated
        if (isAuthenticated) {
          navigate('/');
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

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUsernameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    if (errors.username) {
      setErrors((prev) => ({ ...prev, username: undefined }));
    }
    if (generalError) {
      setGeneralError(null);
    }
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await login(username, password);
      navigate('/');
    } catch (error: unknown) {
      let errorMessage = 'Login failed. Please try again.';

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
      <div className="login-page">
        <div className="login-container">
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>Log In</h1>
          <p className="login-subtitle">Sign in to access your expense tracker</p>
        </div>

        <FormErrorMessage message={generalError} />

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={handleUsernameChange}
              placeholder="Enter your username"
              disabled={isSubmitting}
              autoComplete="username"
              autoFocus
            />
            {errors.username && (
              <div className="field-error">{errors.username}</div>
            )}
          </div>

          <PasswordInputField
            label="Password"
            id="password"
            value={password}
            onChange={handlePasswordChange}
            placeholder="Enter your password"
            disabled={isSubmitting}
            error={errors.password}
          />

          <button
            type="submit"
            className="btn btn-primary login-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Logging in...' : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
