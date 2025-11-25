import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  message?: string;
}

function LoadingSpinner({ message }: LoadingSpinnerProps) {
  // Return null when message is empty string (falsy but explicitly set)
  if (message === '') {
    return null;
  }

  return (
    <div
      className="loading-spinner-container"
      role="status"
      aria-live="polite"
    >
      <div className="loading-spinner" data-testid="loading-spinner" />
      {message && <p className="loading-spinner-message">{message}</p>}
    </div>
  );
}

export default LoadingSpinner;
