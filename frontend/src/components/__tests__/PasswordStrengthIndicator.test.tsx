import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PasswordStrengthIndicator, { validatePassword } from '../PasswordStrengthIndicator';

describe('PasswordStrengthIndicator', () => {
  describe('validatePassword utility', () => {
    it('returns all errors for empty password', () => {
      const result = validatePassword('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(5);
      expect(result.errors).toContain('At least 12 characters');
      expect(result.errors).toContain('At least 1 uppercase letter');
      expect(result.errors).toContain('At least 1 lowercase letter');
      expect(result.errors).toContain('At least 1 digit');
      expect(result.errors).toContain('At least 1 special character');
    });

    it('validates minimum length requirement (12 characters)', () => {
      const shortPassword = validatePassword('Short1!aB');
      expect(shortPassword.requirements.minLength).toBe(false);

      const longPassword = validatePassword('LongEnough12!');
      expect(longPassword.requirements.minLength).toBe(true);
    });

    it('validates uppercase letter requirement', () => {
      const noUppercase = validatePassword('lowercase123!a');
      expect(noUppercase.requirements.hasUppercase).toBe(false);

      const withUppercase = validatePassword('Uppercase123!a');
      expect(withUppercase.requirements.hasUppercase).toBe(true);
    });

    it('validates lowercase letter requirement', () => {
      const noLowercase = validatePassword('UPPERCASE123!A');
      expect(noLowercase.requirements.hasLowercase).toBe(false);

      const withLowercase = validatePassword('UPPERCASEa123!');
      expect(withLowercase.requirements.hasLowercase).toBe(true);
    });

    it('validates digit requirement', () => {
      const noDigit = validatePassword('NoDigitsHere!a');
      expect(noDigit.requirements.hasDigit).toBe(false);

      const withDigit = validatePassword('HasDigit1Here!');
      expect(withDigit.requirements.hasDigit).toBe(true);
    });

    it('validates special character requirement', () => {
      const noSpecial = validatePassword('NoSpecialChar1a');
      expect(noSpecial.requirements.hasSpecialChar).toBe(false);

      const withSpecial = validatePassword('HasSpecial!1aB');
      expect(withSpecial.requirements.hasSpecialChar).toBe(true);
    });

    it('returns isValid true when all requirements are met', () => {
      const validPassword = validatePassword('ValidPass123!');
      expect(validPassword.isValid).toBe(true);
      expect(validPassword.errors).toHaveLength(0);
    });

    it('calculates strength score correctly', () => {
      // 0 requirements met
      const weakest = validatePassword('');
      expect(weakest.strength).toBe(0);

      // 5 requirements met (all)
      const strongest = validatePassword('ValidPass123!');
      expect(strongest.strength).toBe(5);

      // Partial requirements (3 out of 5)
      const partial = validatePassword('abc');
      // Only lowercase is met
      expect(partial.strength).toBe(1);
    });
  });

  describe('Component rendering', () => {
    it('renders requirements checklist', () => {
      render(<PasswordStrengthIndicator password="" />);

      expect(screen.getByText(/at least 12 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/at least 1 uppercase letter/i)).toBeInTheDocument();
      expect(screen.getByText(/at least 1 lowercase letter/i)).toBeInTheDocument();
      expect(screen.getByText(/at least 1 digit/i)).toBeInTheDocument();
      expect(screen.getByText(/at least 1 special character/i)).toBeInTheDocument();
    });

    it('shows unmet requirements with X indicator', () => {
      render(<PasswordStrengthIndicator password="" />);

      const requirements = screen.getAllByRole('listitem');
      requirements.forEach((req) => {
        expect(req).toHaveClass('requirement-unmet');
      });
    });

    it('shows met requirements with checkmark indicator', () => {
      render(<PasswordStrengthIndicator password="ValidPass123!" />);

      const requirements = screen.getAllByRole('listitem');
      requirements.forEach((req) => {
        expect(req).toHaveClass('requirement-met');
      });
    });

    it('updates requirement status as password changes', () => {
      const { rerender } = render(<PasswordStrengthIndicator password="ab" />);

      // Only lowercase should be met
      const lowercaseReq = screen.getByText(/at least 1 lowercase letter/i).closest('li');
      expect(lowercaseReq).toHaveClass('requirement-met');

      const uppercaseReq = screen.getByText(/at least 1 uppercase letter/i).closest('li');
      expect(uppercaseReq).toHaveClass('requirement-unmet');

      // Add uppercase
      rerender(<PasswordStrengthIndicator password="abA" />);
      expect(screen.getByText(/at least 1 uppercase letter/i).closest('li')).toHaveClass('requirement-met');
    });
  });

  describe('Strength bar', () => {
    it('renders strength bar', () => {
      render(<PasswordStrengthIndicator password="" />);
      expect(screen.getByTestId('strength-bar')).toBeInTheDocument();
    });

    it('shows red color for weak passwords (0-1 requirements)', () => {
      render(<PasswordStrengthIndicator password="" />);
      const strengthBar = screen.getByTestId('strength-bar-fill');
      expect(strengthBar).toHaveClass('strength-weak');
    });

    it('shows orange color for fair passwords (2 requirements)', () => {
      render(<PasswordStrengthIndicator password="aB" />);
      const strengthBar = screen.getByTestId('strength-bar-fill');
      expect(strengthBar).toHaveClass('strength-fair');
    });

    it('shows yellow color for good passwords (3-4 requirements)', () => {
      render(<PasswordStrengthIndicator password="aB1" />);
      const strengthBar = screen.getByTestId('strength-bar-fill');
      expect(strengthBar).toHaveClass('strength-good');
    });

    it('shows green color for strong passwords (5 requirements)', () => {
      render(<PasswordStrengthIndicator password="ValidPass123!" />);
      const strengthBar = screen.getByTestId('strength-bar-fill');
      expect(strengthBar).toHaveClass('strength-strong');
    });

    it('updates strength bar width based on requirements met', () => {
      const { rerender } = render(<PasswordStrengthIndicator password="" />);
      let strengthBar = screen.getByTestId('strength-bar-fill');
      expect(strengthBar).toHaveStyle({ width: '0%' });

      rerender(<PasswordStrengthIndicator password="ValidPass123!" />);
      strengthBar = screen.getByTestId('strength-bar-fill');
      expect(strengthBar).toHaveStyle({ width: '100%' });
    });
  });

  describe('onValidation callback', () => {
    it('calls onValidation with validation result when password changes', () => {
      const mockOnValidation = vi.fn();
      const { rerender } = render(
        <PasswordStrengthIndicator password="" onValidation={mockOnValidation} />
      );

      expect(mockOnValidation).toHaveBeenCalledWith(
        expect.objectContaining({
          isValid: false,
          strength: 0,
        })
      );

      rerender(
        <PasswordStrengthIndicator password="ValidPass123!" onValidation={mockOnValidation} />
      );

      expect(mockOnValidation).toHaveBeenCalledWith(
        expect.objectContaining({
          isValid: true,
          strength: 5,
        })
      );
    });
  });
});

// Need to import vi for mock functions
import { vi } from 'vitest';
