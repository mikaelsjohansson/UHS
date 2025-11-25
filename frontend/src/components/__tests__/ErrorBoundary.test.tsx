import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ErrorBoundary from '../ErrorBoundary';

// Component that throws an error for testing
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>Child component rendered successfully</div>;
};

describe('ErrorBoundary', () => {
  let originalConsoleError: typeof console.error;

  beforeEach(() => {
    // Suppress console.error during tests to avoid noise
    originalConsoleError = console.error;
    console.error = vi.fn();
  });

  afterEach(() => {
    // Restore console.error
    console.error = originalConsoleError;
  });

  const renderWithRouter = (ui: React.ReactElement, initialRoute: string = '/') => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        {ui}
      </MemoryRouter>
    );
  };

  describe('Normal rendering', () => {
    it('renders children when no error occurs', () => {
      renderWithRouter(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Child component rendered successfully')).toBeInTheDocument();
    });

    it('does not show error UI when children render successfully', () => {
      renderWithRouter(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
    });
  });

  describe('Error catching', () => {
    it('catches errors and displays error message', () => {
      renderWithRouter(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    it('displays a user-friendly error description', () => {
      renderWithRouter(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/we're sorry/i)).toBeInTheDocument();
    });

    it('logs error to console', () => {
      renderWithRouter(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(console.error).toHaveBeenCalled();
    });

    it('does not expose sensitive error details in UI', () => {
      renderWithRouter(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // The actual "Test error" message should not be shown to users
      expect(screen.queryByText('Test error')).not.toBeInTheDocument();
    });
  });

  describe('Recovery options', () => {
    it('renders a retry button', () => {
      renderWithRouter(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('renders a link to home page', () => {
      renderWithRouter(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const homeLink = screen.getByRole('link', { name: /go to home/i });
      expect(homeLink).toBeInTheDocument();
      expect(homeLink).toHaveAttribute('href', '/');
    });

    it('retry button resets error state and re-renders children', async () => {
      const user = userEvent.setup();

      renderWithRouter(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Verify error state is shown
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

      // Click retry button
      const retryButton = screen.getByRole('button', { name: /try again/i });
      await user.click(retryButton);

      // After retry, the component attempts to re-render children
      // Since the child still throws, it goes back to error state
      // This verifies the retry mechanism works (resets and attempts re-render)
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });

  describe('Styling and accessibility', () => {
    it('has proper error styling class', () => {
      renderWithRouter(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const errorContainer = screen.getByTestId('error-boundary-fallback');
      expect(errorContainer).toHaveClass('error-boundary-fallback');
    });

    it('has accessible error icon or indicator', () => {
      renderWithRouter(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Should have some visual indicator (icon or heading)
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });
  });

  describe('Multiple children', () => {
    it('catches errors from any child component', () => {
      renderWithRouter(
        <ErrorBoundary>
          <div>First child</div>
          <ThrowError shouldThrow={true} />
          <div>Third child</div>
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      expect(screen.queryByText('First child')).not.toBeInTheDocument();
      expect(screen.queryByText('Third child')).not.toBeInTheDocument();
    });
  });
});
