import { Component, ErrorInfo, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { FaExclamationTriangle, FaRedo, FaHome } from 'react-icons/fa';
import './ErrorBoundary.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-fallback" data-testid="error-boundary-fallback">
          <div className="error-content">
            <div className="error-icon">
              <FaExclamationTriangle />
            </div>
            <h1>Something Went Wrong</h1>
            <p className="error-description">
              We're sorry, but something unexpected happened. Please try again or return to the home page.
            </p>
            <div className="error-actions">
              <button
                className="retry-btn"
                onClick={this.handleRetry}
                aria-label="Try again"
              >
                <FaRedo />
                <span>Try Again</span>
              </button>
              <Link to="/" className="home-link" aria-label="Go to home">
                <FaHome />
                <span>Go to Home</span>
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
