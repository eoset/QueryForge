import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import './ViewDefinitionModal.css';

interface ViewDefinitionModalProps {
  projectId: string;
  datasetId: string;
  tableId: string;
  onClose: () => void;
}

export const ViewDefinitionModal: React.FC<ViewDefinitionModalProps> = ({
  projectId,
  datasetId,
  tableId,
  onClose,
}) => {
  const [definition, setDefinition] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editorTheme, setEditorTheme] = useState<string>('vs-dark');

  // Listen for theme changes
  useEffect(() => {
    const updateTheme = () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      setEditorTheme(currentTheme === 'light' ? 'light' : 'vs-dark');
    };
    
    // Initial theme
    updateTheme();
    
    // Watch for attribute changes
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const loadViewDefinition = async () => {
      if (!window.electronAPI) {
        setError('Electron API not available');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await window.electronAPI.bigquery.getViewDefinition(datasetId, tableId);
        setDefinition(result.definition);
      } catch (err: any) {
        setError(err.message || 'Failed to load view definition');
      } finally {
        setIsLoading(false);
      }
    };

    loadViewDefinition();
  }, [datasetId, tableId]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(definition);
  };

  return (
    <div className="view-definition-modal-overlay" onClick={handleOverlayClick}>
      <div className="view-definition-modal-dialog">
        <div className="view-definition-modal-header">
          <h2>View Definition: {projectId}.{datasetId}.{tableId}</h2>
          <button className="view-definition-modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="view-definition-modal-content">
          {isLoading && (
            <div className="view-definition-loading">
              <div className="view-definition-spinner"></div>
              <div>Loading view definition...</div>
            </div>
          )}
          {error && (
            <div className="view-definition-error">
              <strong>Error:</strong> {error}
            </div>
          )}
          {!isLoading && !error && definition && (
            <>
              <div className="view-definition-actions">
                <button onClick={handleCopy} className="view-definition-copy-button">
                  Copy to Clipboard
                </button>
              </div>
              <div className="view-definition-editor">
                <Editor
                  height="400px"
                  language="sql"
                  value={definition}
                  theme={editorTheme}
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 13,
                    lineNumbers: 'on',
                    folding: true,
                    wordWrap: 'on',
                    automaticLayout: true,
                    renderLineHighlight: 'none',
                    scrollbar: {
                      vertical: 'auto',
                      horizontal: 'auto',
                    },
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

