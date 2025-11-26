import React, { useState, useEffect } from 'react';
import { useConnectionStore } from '../../stores/connection-store';
import { validateConnectionConfig } from '../../../shared/utils/connection-validation';
import type { ConnectionConfig } from '../../../shared/types/connection';
import './ConnectionDialog.css';

interface ConnectionDialogProps {
  onClose: () => void;
}

export const ConnectionDialog: React.FC<ConnectionDialogProps> = ({ onClose }) => {
  const [projectId, setProjectId] = useState('');
  const [authType, setAuthType] = useState<'service-account' | 'application-default'>(
    'service-account'
  );
  const [serviceAccountKeyPath, setServiceAccountKeyPath] = useState('');
  const [serviceAccountKey, setServiceAccountKey] = useState('');
  const [location, setLocation] = useState('EU');
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const { setConnection, setConnecting, setConnectionError } = useConnectionStore();

  // Load saved connection settings when dialog opens
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.connection.getSaved().then((saved) => {
        if (saved) {
          setProjectId(saved.projectId);
          setAuthType(saved.authType);
          setServiceAccountKeyPath(saved.serviceAccountKeyPath || '');
          setLocation(saved.location || 'EU');
          // Note: We don't load the service account key content for security reasons
          // User needs to re-enter it or use the file path
        }
      }).catch((err) => {
        console.error('Failed to load saved connection:', err);
      });
    }
  }, []);

  const handleConnect = async () => {
    setError(null);
    setIsConnecting(true);
    setConnecting(true);

    const config: ConnectionConfig = {
      projectId: projectId.trim(),
      authType,
      serviceAccountKeyPath: serviceAccountKeyPath.trim() || undefined,
      serviceAccountKey: serviceAccountKey.trim() || undefined,
      location: location.trim() || 'EU',
    };

    // Validate configuration
    const validation = validateConnectionConfig(config);
    if (!validation.valid) {
      setError(validation.error || 'Invalid configuration');
      setIsConnecting(false);
      setConnecting(false);
      return;
    }

    try {
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }

      // Test connection first
      const isValid = await window.electronAPI.connection.test(config);
      if (!isValid) {
        throw new Error('Connection test failed. Please check your credentials.');
      }

      // Configure connection
      await window.electronAPI.connection.configure(config);

      // Get active connection
      const activeConnection = await window.electronAPI.connection.getActive();
      if (activeConnection) {
        setConnection(activeConnection);
        onClose();
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to connect to BigQuery';
      setError(errorMessage);
      setConnectionError(errorMessage);
    } finally {
      setIsConnecting(false);
      setConnecting(false);
    }
  };

  return (
    <div className="connection-dialog-overlay" onClick={onClose}>
      <div className="connection-dialog" onClick={(e) => e.stopPropagation()}>
        <h2>Connect to BigQuery</h2>

        <div className="form-group">
          <label htmlFor="projectId">Project ID *</label>
          <input
            id="projectId"
            type="text"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            placeholder="my-project-id"
            disabled={isConnecting}
          />
        </div>

        <div className="form-group">
          <label htmlFor="location">Location *</label>
          <select
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            disabled={isConnecting}
          >
            <option value="EU">EU</option>
            <option value="US">US</option>
            <option value="asia-northeast1">Asia (Tokyo)</option>
            <option value="asia-south1">Asia (Mumbai)</option>
            <option value="asia-southeast1">Asia (Singapore)</option>
            <option value="australia-southeast1">Australia (Sydney)</option>
            <option value="europe-west1">Europe (Belgium)</option>
            <option value="europe-west2">Europe (London)</option>
            <option value="europe-west3">Europe (Frankfurt)</option>
            <option value="europe-west4">Europe (Netherlands)</option>
            <option value="europe-west6">Europe (Zurich)</option>
            <option value="northamerica-northeast1">North America (Montreal)</option>
            <option value="southamerica-east1">South America (São Paulo)</option>
            <option value="us-central1">US (Iowa)</option>
            <option value="us-east1">US (South Carolina)</option>
            <option value="us-east4">US (Northern Virginia)</option>
            <option value="us-west1">US (Oregon)</option>
            <option value="us-west2">US (Los Angeles)</option>
            <option value="us-west3">US (Salt Lake City)</option>
            <option value="us-west4">US (Las Vegas)</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="authType">Authentication Method *</label>
          <select
            id="authType"
            value={authType}
            onChange={(e) =>
              setAuthType(e.target.value as 'service-account' | 'application-default')
            }
            disabled={isConnecting}
          >
            <option value="service-account">Service Account Key</option>
            <option value="application-default">Application Default Credentials</option>
          </select>
        </div>

        {authType === 'service-account' && (
          <>
            <div className="form-group">
              <label htmlFor="keyPath">Service Account Key File Path</label>
              <input
                id="keyPath"
                type="text"
                value={serviceAccountKeyPath}
                onChange={(e) => setServiceAccountKeyPath(e.target.value)}
                placeholder="/path/to/key.json"
                disabled={isConnecting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="keyContent">Or Paste Service Account Key JSON</label>
              <textarea
                id="keyContent"
                value={serviceAccountKey}
                onChange={(e) => setServiceAccountKey(e.target.value)}
                placeholder='{"type": "service_account", ...}'
                rows={5}
                disabled={isConnecting}
              />
            </div>
          </>
        )}

        {error && <div className="error-message">{error}</div>}

        <div className="dialog-actions">
          <button onClick={onClose} disabled={isConnecting}>
            Cancel
          </button>
          <button onClick={handleConnect} disabled={isConnecting || !projectId.trim()}>
            {isConnecting ? 'Connecting...' : 'Connect'}
          </button>
        </div>
      </div>
    </div>
  );
};

