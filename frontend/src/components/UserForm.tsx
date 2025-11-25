import { useState } from 'react';
import { CreateUserRequestDto, UserRole } from '../types/user';
import './UserForm.css';

interface UserFormProps {
  onSubmit: (data: CreateUserRequestDto) => void;
  onCancel?: () => void;
  isLoading: boolean;
  error?: string;
  mode: 'create';
}

interface FormData {
  username: string;
  email: string;
  role: UserRole;
}

interface FormErrors {
  username?: string;
  email?: string;
}

const UserForm = ({
  onSubmit,
  onCancel,
  isLoading,
  error,
  mode,
}: UserFormProps) => {
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    role: 'USER',
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    const trimmedUsername = formData.username.trim();
    const trimmedEmail = formData.email.trim();

    if (!trimmedUsername) {
      errors.username = 'Username is required';
    } else if (trimmedUsername.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }

    if (!trimmedEmail) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateField = (name: string, value: string): string | undefined => {
    if (name === 'username') {
      if (!value.trim()) return 'Username is required';
      if (value.trim().length < 3) return 'Username must be at least 3 characters';
      return undefined;
    }
    if (name === 'email') {
      if (!value.trim()) return 'Email is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))
        return 'Please enter a valid email address';
      return undefined;
    }
    return undefined;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Real-time validation for current field
    const fieldName = name as keyof FormErrors;
    const error = validateField(name, value);
    setFormErrors((prev) => ({
      ...prev,
      [fieldName]: error,
    }));
  };

  const isFormValid = (): boolean => {
    return (
      formData.username.trim().length >= 3 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSubmit({
      username: formData.username.trim(),
      email: formData.email.trim(),
      role: formData.role,
    });
  };

  const getSubmitButtonText = () => {
    if (isLoading) {
      return mode === 'create' ? 'Creating...' : 'Updating...';
    }
    return mode === 'create' ? 'Create User' : 'Update User';
  };

  return (
    <form onSubmit={handleSubmit} className="user-form">
      {error && (
        <div className="form-error-message" role="alert">
          {error}
        </div>
      )}

      <div className="form-group">
        <div className="label-with-feedback">
          <label htmlFor="username">Username *</label>
          {formData.username && !formErrors.username && (
            <span className="validation-success">✓</span>
          )}
        </div>
        <input
          type="text"
          id="username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          disabled={isLoading}
          placeholder="Enter username"
          aria-invalid={!!formErrors.username}
          aria-describedby={formErrors.username ? 'username-error' : undefined}
          className={
            formData.username && !formErrors.username ? 'input-valid' : ''
          }
        />
        {formErrors.username && (
          <span id="username-error" className="field-error">
            {formErrors.username}
          </span>
        )}
      </div>

      <div className="form-group">
        <div className="label-with-feedback">
          <label htmlFor="email">Email *</label>
          {formData.email && !formErrors.email && (
            <span className="validation-success">✓</span>
          )}
        </div>
        <input
          type="text"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          disabled={isLoading}
          placeholder="Enter email address"
          aria-invalid={!!formErrors.email}
          aria-describedby={formErrors.email ? 'email-error' : undefined}
          className={
            formData.email && !formErrors.email ? 'input-valid' : ''
          }
        />
        {formErrors.email && (
          <span id="email-error" className="field-error">
            {formErrors.email}
          </span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="role">Role *</label>
        <select
          id="role"
          name="role"
          value={formData.role}
          onChange={handleChange}
          disabled={isLoading}
        >
          <option value="USER">User</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      <div className="form-actions">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading || !isFormValid()}
          className="btn btn-primary"
          title={!isFormValid() ? 'Please fill in all required fields correctly' : ''}
        >
          {getSubmitButtonText()}
        </button>
      </div>
    </form>
  );
};

export default UserForm;
