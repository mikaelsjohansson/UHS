import { useState } from 'react';
import Modal from './Modal';
import './GenerateTokenModal.css';

interface GenerateTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  setupUrl: string;
  onCopy?: () => void;
}

const GenerateTokenModal = ({
  isOpen,
  onClose,
  username,
  setupUrl,
  onCopy,
}: GenerateTokenModalProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(setupUrl);
      setCopied(true);
      if (onCopy) {
        onCopy();
      }
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleOpenInNewTab = () => {
    window.open(setupUrl, '_blank', 'noopener,noreferrer');
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Setup Token for ${username}`}
    >
      <div className="generate-token-modal" role="dialog" aria-modal="true">
        <div className="token-info">
          <p className="token-description">
            Share this URL with the user to allow them to set their password:
          </p>
          <div className="url-container">
            <a
              href={setupUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="setup-url"
            >
              {setupUrl}
            </a>
          </div>
        </div>

        <div className="token-actions">
          <button
            onClick={handleCopyToClipboard}
            className="btn btn-secondary"
            type="button"
          >
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
          <button
            onClick={handleOpenInNewTab}
            className="btn btn-secondary"
            type="button"
          >
            Open in New Tab
          </button>
        </div>

        <div className="token-expiry-info">
          <span className="expiry-icon">!</span>
          <p>
            This token will expire in <strong>15 minutes</strong>. After
            expiration, you will need to generate a new token.
          </p>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-primary" type="button">
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default GenerateTokenModal;
