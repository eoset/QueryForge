import React, { useEffect, useState } from 'react';
import './AboutDialog.css';

interface AboutDialogProps {
  onClose: () => void;
}

export const AboutDialog: React.FC<AboutDialogProps> = ({ onClose }) => {
  const [version, setVersion] = useState<string>('');

  useEffect(() => {
    // Get version from main process via IPC
    if (window.electronAPI?.app) {
      window.electronAPI.app.getVersion()
        .then(ver => setVersion(ver))
        .catch(() => {
          setVersion('1.0.2'); // Fallback version
        });
    } else {
      setVersion('1.0.2'); // Fallback version
    }
  }, []);

  // Close dialog on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Prevent closing when clicking inside the dialog
  const handleDialogClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="about-dialog-overlay" onClick={onClose}>
      <div className="about-dialog" onClick={handleDialogClick}>
        <h2>About QueryForge</h2>
        <div className="about-content">
          <div className="about-info">
            <p className="app-name">QueryForge</p>
            <p className="app-description">
              A desktop application for browsing and querying Google Cloud Platform BigQuery data.
            </p>
            {version && (
              <p className="app-version">Version {version}</p>
            )}
          </div>
        </div>
        <div className="dialog-actions">
          <a
            href="https://www.paypal.com/donate/?business=3MKGEKEWEHWPS&no_recurring=0&item_name=Inspire+development+of+BigQuery+Desktop+app&currency_code=SEK"
            target="_blank"
            rel="noopener noreferrer"
            className="donation-button"
            onClick={(e) => e.stopPropagation()}
          >
            Donate
          </a>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

