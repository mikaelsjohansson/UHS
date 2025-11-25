import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PasswordInputField from '../PasswordInputField';

describe('PasswordInputField', () => {
  const defaultProps = {
    label: 'Password',
    value: '',
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic rendering', () => {
    it('renders input with label', () => {
      render(<PasswordInputField {...defaultProps} />);

      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
    });

    it('renders with provided value', () => {
      render(<PasswordInputField {...defaultProps} value="mypassword" />);

      expect(screen.getByLabelText('Password')).toHaveValue('mypassword');
    });

    it('renders with custom id', () => {
      render(<PasswordInputField {...defaultProps} id="custom-id" />);

      expect(screen.getByLabelText('Password')).toHaveAttribute('id', 'custom-id');
    });

    it('renders with placeholder', () => {
      render(<PasswordInputField {...defaultProps} placeholder="Enter password" />);

      expect(screen.getByPlaceholderText('Enter password')).toBeInTheDocument();
    });

    it('renders as required field when required prop is true', () => {
      render(<PasswordInputField {...defaultProps} required />);

      expect(screen.getByLabelText('Password')).toBeRequired();
    });
  });

  describe('Password visibility toggle', () => {
    it('renders show/hide password toggle button', () => {
      render(<PasswordInputField {...defaultProps} />);

      expect(screen.getByRole('button', { name: /show password/i })).toBeInTheDocument();
    });

    it('toggles password visibility when button is clicked', async () => {
      const user = userEvent.setup();
      render(<PasswordInputField {...defaultProps} value="secret" />);

      const input = screen.getByLabelText('Password');
      const toggleButton = screen.getByRole('button', { name: /show password/i });

      // Initially password type
      expect(input).toHaveAttribute('type', 'password');

      // Click to show
      await user.click(toggleButton);
      expect(input).toHaveAttribute('type', 'text');
      expect(screen.getByRole('button', { name: /hide password/i })).toBeInTheDocument();

      // Click to hide
      await user.click(screen.getByRole('button', { name: /hide password/i }));
      expect(input).toHaveAttribute('type', 'password');
    });
  });

  describe('onChange callback', () => {
    it('calls onChange when input value changes', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<PasswordInputField {...defaultProps} onChange={handleChange} />);

      const input = screen.getByLabelText('Password');
      await user.type(input, 'test');

      expect(handleChange).toHaveBeenCalledTimes(4); // Once per character
    });

    it('passes the new value to onChange', async () => {
      const user = userEvent.setup();
      let capturedValue = '';
      const handleChange = vi.fn((e) => {
        capturedValue = e.target.value;
      });
      render(<PasswordInputField {...defaultProps} onChange={handleChange} />);

      const input = screen.getByLabelText('Password');
      await user.type(input, 'a');

      expect(capturedValue).toBe('a');
    });
  });

  describe('Error display', () => {
    it('displays error message when error prop is provided', () => {
      render(<PasswordInputField {...defaultProps} error="Password is required" />);

      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });

    it('applies error styling to input when error is present', () => {
      render(<PasswordInputField {...defaultProps} error="Error message" />);

      const input = screen.getByLabelText('Password');
      expect(input).toHaveClass('input-error');
    });

    it('does not show error message when error prop is empty', () => {
      render(<PasswordInputField {...defaultProps} error="" />);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Password strength indicator integration', () => {
    it('does not show strength indicator by default', () => {
      render(<PasswordInputField {...defaultProps} value="test" />);

      expect(screen.queryByTestId('strength-bar')).not.toBeInTheDocument();
    });

    it('shows strength indicator when showStrength is true', () => {
      render(<PasswordInputField {...defaultProps} value="test" showStrength />);

      expect(screen.getByTestId('strength-bar')).toBeInTheDocument();
    });

    it('calls onValidation callback with validation result', () => {
      const handleValidation = vi.fn();
      render(
        <PasswordInputField
          {...defaultProps}
          value="ValidPass123!"
          showStrength
          onValidation={handleValidation}
        />
      );

      expect(handleValidation).toHaveBeenCalledWith(
        expect.objectContaining({
          isValid: true,
          strength: 5,
        })
      );
    });

    it('updates strength indicator when password changes', () => {
      const { rerender } = render(
        <PasswordInputField {...defaultProps} value="" showStrength />
      );

      let strengthBar = screen.getByTestId('strength-bar-fill');
      expect(strengthBar).toHaveStyle({ width: '0%' });

      rerender(<PasswordInputField {...defaultProps} value="ValidPass123!" showStrength />);
      strengthBar = screen.getByTestId('strength-bar-fill');
      expect(strengthBar).toHaveStyle({ width: '100%' });
    });
  });

  describe('Accessibility', () => {
    it('has proper aria-describedby for error', () => {
      render(<PasswordInputField {...defaultProps} id="test-pw" error="Error message" />);

      const input = screen.getByLabelText('Password');
      expect(input).toHaveAttribute('aria-describedby', 'test-pw-error');
      expect(screen.getByText('Error message')).toHaveAttribute('id', 'test-pw-error');
    });

    it('has aria-invalid when there is an error', () => {
      render(<PasswordInputField {...defaultProps} error="Error" />);

      expect(screen.getByLabelText('Password')).toHaveAttribute('aria-invalid', 'true');
    });

    it('toggle button has proper aria-pressed state', async () => {
      const user = userEvent.setup();
      render(<PasswordInputField {...defaultProps} />);

      const toggleButton = screen.getByRole('button', { name: /show password/i });
      expect(toggleButton).toHaveAttribute('aria-pressed', 'false');

      await user.click(toggleButton);
      expect(screen.getByRole('button', { name: /hide password/i })).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Disabled state', () => {
    it('disables input when disabled prop is true', () => {
      render(<PasswordInputField {...defaultProps} disabled />);

      expect(screen.getByLabelText('Password')).toBeDisabled();
    });

    it('disables toggle button when disabled prop is true', () => {
      render(<PasswordInputField {...defaultProps} disabled />);

      expect(screen.getByRole('button', { name: /show password/i })).toBeDisabled();
    });
  });
});
