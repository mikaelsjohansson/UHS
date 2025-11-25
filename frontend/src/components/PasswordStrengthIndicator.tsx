import { useEffect, useRef } from 'react';
import './PasswordStrengthIndicator.css';

export interface PasswordRequirements {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasDigit: boolean;
  hasSpecialChar: boolean;
}

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  requirements: PasswordRequirements;
  strength: number;
}

export function validatePassword(password: string): PasswordValidationResult {
  const requirements: PasswordRequirements = {
    minLength: password.length >= 12,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasDigit: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password),
  };

  const errors: string[] = [];

  if (!requirements.minLength) {
    errors.push('At least 12 characters');
  }
  if (!requirements.hasUppercase) {
    errors.push('At least 1 uppercase letter');
  }
  if (!requirements.hasLowercase) {
    errors.push('At least 1 lowercase letter');
  }
  if (!requirements.hasDigit) {
    errors.push('At least 1 digit');
  }
  if (!requirements.hasSpecialChar) {
    errors.push('At least 1 special character');
  }

  const strength = Object.values(requirements).filter(Boolean).length;

  return {
    isValid: errors.length === 0,
    errors,
    requirements,
    strength,
  };
}

interface PasswordStrengthIndicatorProps {
  password: string;
  onValidation?: (result: PasswordValidationResult) => void;
}

function PasswordStrengthIndicator({ password, onValidation }: PasswordStrengthIndicatorProps) {
  const validation = validatePassword(password);
  const prevPasswordRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    // Only call onValidation when password actually changes
    if (onValidation && prevPasswordRef.current !== password) {
      prevPasswordRef.current = password;
      onValidation(validation);
    }
  }, [password, onValidation, validation]);

  const getStrengthClass = (strength: number): string => {
    if (strength <= 1) return 'strength-weak';
    if (strength === 2) return 'strength-fair';
    if (strength <= 4) return 'strength-good';
    return 'strength-strong';
  };

  const strengthPercentage = (validation.strength / 5) * 100;

  return (
    <div className="password-strength-indicator">
      <ul className="requirements-list" aria-label="Password requirements">
        <li className={validation.requirements.minLength ? 'requirement-met' : 'requirement-unmet'}>
          <span className="requirement-icon" aria-hidden="true">
            {validation.requirements.minLength ? '✓' : '✗'}
          </span>
          At least 12 characters
        </li>
        <li className={validation.requirements.hasUppercase ? 'requirement-met' : 'requirement-unmet'}>
          <span className="requirement-icon" aria-hidden="true">
            {validation.requirements.hasUppercase ? '✓' : '✗'}
          </span>
          At least 1 uppercase letter
        </li>
        <li className={validation.requirements.hasLowercase ? 'requirement-met' : 'requirement-unmet'}>
          <span className="requirement-icon" aria-hidden="true">
            {validation.requirements.hasLowercase ? '✓' : '✗'}
          </span>
          At least 1 lowercase letter
        </li>
        <li className={validation.requirements.hasDigit ? 'requirement-met' : 'requirement-unmet'}>
          <span className="requirement-icon" aria-hidden="true">
            {validation.requirements.hasDigit ? '✓' : '✗'}
          </span>
          At least 1 digit
        </li>
        <li className={validation.requirements.hasSpecialChar ? 'requirement-met' : 'requirement-unmet'}>
          <span className="requirement-icon" aria-hidden="true">
            {validation.requirements.hasSpecialChar ? '✓' : '✗'}
          </span>
          At least 1 special character
        </li>
      </ul>

      <div className="strength-bar" data-testid="strength-bar" aria-label="Password strength">
        <div
          className={`strength-bar-fill ${getStrengthClass(validation.strength)}`}
          data-testid="strength-bar-fill"
          style={{ width: `${strengthPercentage}%` }}
          role="progressbar"
          aria-valuenow={validation.strength}
          aria-valuemin={0}
          aria-valuemax={5}
        />
      </div>
    </div>
  );
}

export default PasswordStrengthIndicator;
