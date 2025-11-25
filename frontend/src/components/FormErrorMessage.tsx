import './FormErrorMessage.css';

interface FormErrorMessageProps {
  message: string | string[] | null | undefined;
  className?: string;
}

function FormErrorMessage({ message, className = '' }: FormErrorMessageProps) {
  // Return null for empty/null/undefined messages
  if (!message || (Array.isArray(message) && message.length === 0) || message === '') {
    return null;
  }

  const combinedClassName = `form-error-message ${className}`.trim();

  // Render array of messages as a list
  if (Array.isArray(message)) {
    return (
      <div className={combinedClassName} role="alert">
        <ul className="error-list">
          {message.map((msg, index) => (
            <li key={index}>{msg}</li>
          ))}
        </ul>
      </div>
    );
  }

  // Render single message
  return (
    <div className={combinedClassName} role="alert">
      {message}
    </div>
  );
}

export default FormErrorMessage;
