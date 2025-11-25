import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import PasswordInputField from '../components/PasswordInputField';
import FormErrorMessage from '../components/FormErrorMessage';
import { PasswordValidationResult } from '../components/PasswordStrengthIndicator';
import './SetPasswordPage.css';

interface FormErrors {
  password?: string;
  confirmPassword?: string;
}

type TokenStatus = 'loading' | 'valid' | 'expired' | 'invalid';

function SetPasswordPage() {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const { setPassword: authSetPassword } = useAuth();

  const [password, setPasswordValue] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<TokenStatus>('loading');
  const [username, setUsername] = useState('');
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidationResult | null>(null);

  // Validate token on mount
  useEffect(() => {
    const validateTokenOnMount = async () => {
      if (!token) {
        setTokenStatus('invalid');
        return;
      }

      try {
        const response = await authService.validateToken(token);
        if (response.valid) {
          setTokenStatus('valid');
          setUsername(response.username);
          setExpiresAt(new Date(response.expiresAt));
        } else {
          setTokenStatus('expired');
        }
      } catch (error: unknown) {
        // Check if it's a 404 or similar error
        if (error && typeof error === 'object' && 'response' in error) {
          const response = error.response as { status?: number };
          if (response.status === 404) {
            setTokenStatus('invalid');
          } else {
            setTokenStatus('expired');
          }
        } else {
          setTokenStatus('invalid');
        }
      }
    };

    validateTokenOnMount();
  }, [token]);

  const handlePasswordValidation = (result: PasswordValidationResult) => {
    setPasswordValidation(result);
  };

  const formatRemainingTime = (): string => {
    if (!expiresAt) return '';

    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();

    if (diff <= 0) return 'This link has expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `Link valid for ${hours} hour${hours > 1 ? 's' : ''} and ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    return `Link expires in ${minutes} minute${minutes !== 1 ? 's' : ''}`;
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
    setPasswordValue(e.target.value);
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

    if (!validateForm() || !token) {
      return;
    }

    setIsSubmitting(true);

    try {
      await authSetPassword(token, password);
      navigate('/login');
    } catch (error: unknown) {
      let errorMessage = 'Failed to set password. Please try again.';

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

  // Loading state
  if (tokenStatus === 'loading') {
    return (
      <div className="set-password-page">
        <div className="set-password-container">
          <div className="loading">Validating link...</div>
        </div>
      </div>
    );
  }

  // Expired token
  if (tokenStatus === 'expired') {
    return (
      <div className="set-password-page">
        <div className="set-password-container">
          <div className="set-password-header">
            <h1>Link Expired</h1>
          </div>
          <div className="token-message error">
            <p>This password setup link has expired.</p>
            <p>Please contact your administrator to request a new link.</p>
          </div>
        </div>
      </div>
    );
  }

  // Invalid token
  if (tokenStatus === 'invalid') {
    return (
      <div className="set-password-page">
        <div className="set-password-container">
          <div className="set-password-header">
            <h1>Invalid Link</h1>
          </div>
          <div className="token-message error">
            <p>This password setup link is invalid or not found.</p>
            <p>Please check the link or contact your administrator.</p>
          </div>
        </div>
      </div>
    );
  }

  // Valid token - show form
  return (
    <div className="set-password-page">
      <div className="set-password-container">
        <div className="set-password-header">
          <h1>Set Your Password</h1>
          <p className="set-password-info">
            Welcome, <strong>{username}</strong>! Please create a secure password for your account.
          </p>
          {expiresAt && (
            <p className="token-validity">{formatRemainingTime()}</p>
          )}
        </div>

        <FormErrorMessage message={generalError} />

        <form onSubmit={handleSubmit} className="set-password-form">
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
            className="btn btn-primary set-password-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Setting password...' : 'Set Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default SetPasswordPage;
