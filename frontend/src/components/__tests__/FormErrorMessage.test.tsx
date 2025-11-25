import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import FormErrorMessage from '../FormErrorMessage';

describe('FormErrorMessage', () => {
  describe('With string message', () => {
    it('renders single error message', () => {
      render(<FormErrorMessage message="Something went wrong" />);

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('has role="alert" for accessibility', () => {
      render(<FormErrorMessage message="Error occurred" />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('applies error styling', () => {
      render(<FormErrorMessage message="Error" />);

      expect(screen.getByRole('alert')).toHaveClass('form-error-message');
    });
  });

  describe('With array of messages', () => {
    it('renders multiple error messages as a list', () => {
      const messages = ['Error 1', 'Error 2', 'Error 3'];
      render(<FormErrorMessage message={messages} />);

      expect(screen.getByText('Error 1')).toBeInTheDocument();
      expect(screen.getByText('Error 2')).toBeInTheDocument();
      expect(screen.getByText('Error 3')).toBeInTheDocument();
    });

    it('renders list items for multiple messages', () => {
      const messages = ['Error 1', 'Error 2'];
      render(<FormErrorMessage message={messages} />);

      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(2);
    });
  });

  describe('Empty message handling', () => {
    it('returns null for empty string', () => {
      const { container } = render(<FormErrorMessage message="" />);

      expect(container.firstChild).toBeNull();
    });

    it('returns null for empty array', () => {
      const { container } = render(<FormErrorMessage message={[]} />);

      expect(container.firstChild).toBeNull();
    });

    it('returns null for null message', () => {
      const { container } = render(<FormErrorMessage message={null as unknown as string} />);

      expect(container.firstChild).toBeNull();
    });

    it('returns null for undefined message', () => {
      const { container } = render(<FormErrorMessage message={undefined as unknown as string} />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Custom className', () => {
    it('accepts additional className', () => {
      render(<FormErrorMessage message="Error" className="custom-class" />);

      expect(screen.getByRole('alert')).toHaveClass('form-error-message', 'custom-class');
    });
  });
});
