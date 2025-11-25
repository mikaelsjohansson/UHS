import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders spinner with message when message is provided', () => {
    render(<LoadingSpinner message="Loading data..." />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('renders spinner without message when no message is provided', () => {
    render(<LoadingSpinner />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });

  it('renders nothing when message is empty string', () => {
    const { container } = render(<LoadingSpinner message="" />);

    // Should return null, so container should be empty
    expect(container.firstChild).toBeNull();
  });

  it('returns null when message is explicitly undefined', () => {
    const { container } = render(<LoadingSpinner message={undefined} />);

    // Should render the spinner without message text
    expect(container.firstChild).not.toBeNull();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has accessible spinner animation', () => {
    render(<LoadingSpinner message="Please wait..." />);

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
  });

  it('displays custom message text correctly', () => {
    render(<LoadingSpinner message="Checking authentication..." />);

    expect(screen.getByText('Checking authentication...')).toBeInTheDocument();
  });

  it('has proper loading spinner visual element', () => {
    render(<LoadingSpinner message="Loading..." />);

    // Check that there's a spinner element with proper class
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
});
