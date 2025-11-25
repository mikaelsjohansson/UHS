import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GenerateTokenModal from '../GenerateTokenModal';

describe('GenerateTokenModal', () => {
  const mockOnClose = vi.fn();
  const mockOnCopy = vi.fn();
  const mockWindowOpen = vi.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    username: 'testuser',
    setupUrl: 'http://localhost:5173/set-password?token=abc123',
  };

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnCopy.mockClear();
    mockWindowOpen.mockClear();
    mockWindowOpen.mockReturnValue(null);

    // Mock window.open
    vi.stubGlobal('open', mockWindowOpen);
  });

  describe('Rendering', () => {
    it('does not render when isOpen is false', () => {
      render(
        <GenerateTokenModal
          {...defaultProps}
          isOpen={false}
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders modal when isOpen is true', () => {
      render(<GenerateTokenModal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('displays username in the header', () => {
      render(<GenerateTokenModal {...defaultProps} />);

      expect(screen.getByText(/testuser/i)).toBeInTheDocument();
    });

    it('displays the setup URL', () => {
      render(<GenerateTokenModal {...defaultProps} />);

      expect(
        screen.getByText('http://localhost:5173/set-password?token=abc123')
      ).toBeInTheDocument();
    });

    it('displays copy to clipboard button', () => {
      render(<GenerateTokenModal {...defaultProps} />);

      expect(
        screen.getByRole('button', { name: /copy/i })
      ).toBeInTheDocument();
    });

    it('displays open in new tab button', () => {
      render(<GenerateTokenModal {...defaultProps} />);

      expect(
        screen.getByRole('button', { name: /open/i })
      ).toBeInTheDocument();
    });

    it('displays token expiry information', () => {
      render(<GenerateTokenModal {...defaultProps} />);

      expect(screen.getByText(/15 minutes/i)).toBeInTheDocument();
    });

    it('displays done button', () => {
      render(<GenerateTokenModal {...defaultProps} />);

      expect(
        screen.getByRole('button', { name: /^done$/i })
      ).toBeInTheDocument();
    });
  });

  describe('Copy to Clipboard', () => {
    it('shows copied message after clicking copy button', async () => {
      const user = userEvent.setup();

      render(<GenerateTokenModal {...defaultProps} />);

      const copyButton = screen.getByRole('button', { name: /copy to clipboard/i });
      await user.click(copyButton);

      // The button text should change to "Copied!" after successful copy
      await waitFor(() => {
        expect(screen.getByText(/copied/i)).toBeInTheDocument();
      });
    });

    it('calls onCopy callback when provided', async () => {
      const user = userEvent.setup();

      render(<GenerateTokenModal {...defaultProps} onCopy={mockOnCopy} />);

      const copyButton = screen.getByRole('button', { name: /copy to clipboard/i });
      await user.click(copyButton);

      await waitFor(() => {
        expect(mockOnCopy).toHaveBeenCalled();
      });
    });
  });

  describe('Open in New Tab', () => {
    it('opens URL in new window when open button is clicked', async () => {
      const user = userEvent.setup();

      render(<GenerateTokenModal {...defaultProps} />);

      const openButton = screen.getByRole('button', { name: /open/i });
      await user.click(openButton);

      expect(mockWindowOpen).toHaveBeenCalledWith(
        'http://localhost:5173/set-password?token=abc123',
        '_blank',
        'noopener,noreferrer'
      );
    });
  });

  describe('Close Modal', () => {
    it('calls onClose when done button is clicked', async () => {
      const user = userEvent.setup();

      render(<GenerateTokenModal {...defaultProps} />);

      const doneButton = screen.getByRole('button', { name: /^done$/i });
      await user.click(doneButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('URL Display', () => {
    it('renders setup URL as a clickable link', () => {
      render(<GenerateTokenModal {...defaultProps} />);

      const link = screen.getByRole('link', { name: /set-password/i });
      expect(link).toHaveAttribute(
        'href',
        'http://localhost:5173/set-password?token=abc123'
      );
      expect(link).toHaveAttribute('target', '_blank');
    });
  });
});
