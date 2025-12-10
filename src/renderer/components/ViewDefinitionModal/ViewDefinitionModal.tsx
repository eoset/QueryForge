import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { useThemeStore } from '../../stores/theme-store';
import { getMonacoThemeName, registerAllThemes } from '../../themes/built-in-themes';
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
  const [originalDefinition, setOriginalDefinition] = useState<string>('');
  const [definition, setDefinition] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  const editorRef = useRef<any>(null);
  
  // Get theme from store
  const { activeTheme, isInitialized: themeInitialized } = useThemeStore();
  const monacoThemeName = themeInitialized ? getMonacoThemeName(activeTheme) : 'vs-dark';

  // Check if definition has been modified
  const isModified = definition !== originalDefinition;

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
        setOriginalDefinition(result.definition);
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
        if (isEditMode && isModified) {
          // Don't close if there are unsaved changes - let user confirm
          const confirmClose = window.confirm('You have unsaved changes. Are you sure you want to close?');
          if (!confirmClose) return;
        }
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose, isEditMode, isModified]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      if (isEditMode && isModified) {
        const confirmClose = window.confirm('You have unsaved changes. Are you sure you want to close?');
        if (!confirmClose) return;
      }
      onClose();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(definition);
  };

  const handleEdit = () => {
    setIsEditMode(true);
    setSaveError(null);
    setSaveSuccess(null);
  };

  const handleCancelEdit = () => {
    if (isModified) {
      const confirmCancel = window.confirm('You have unsaved changes. Are you sure you want to cancel?');
      if (!confirmCancel) return;
    }
    setDefinition(originalDefinition);
    setIsEditMode(false);
    setSaveError(null);
    setSaveSuccess(null);
  };

  const handleSave = async () => {
    if (!window.electronAPI || !isModified) return;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      await window.electronAPI.bigquery.updateView(datasetId, tableId, definition);
      setOriginalDefinition(definition);
      setIsEditMode(false);
      setSaveSuccess('View definition updated successfully');
      setTimeout(() => setSaveSuccess(null), 5000);
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to update view';
      setSaveError(errorMessage.replace(/^Error invoking remote method '[^']+': /, '').replace(/^Error: /, ''));
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    setDefinition(value || '');
  };

  return (
    <div className="view-definition-modal-overlay" onClick={handleOverlayClick}>
      <div className="view-definition-modal-dialog">
        <div className="view-definition-modal-header">
          <h2>
            View Definition: {datasetId}.{tableId}
            {isEditMode && <span className="edit-mode-badge">Editing</span>}
            {isModified && <span className="modified-badge">Modified</span>}
          </h2>
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
                {!isEditMode ? (
                  <>
                    <button onClick={handleCopy} className="view-definition-button secondary">
                      Copy to Clipboard
                    </button>
                    <button onClick={handleEdit} className="view-definition-button primary">
                      Edit Definition
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={handleCancelEdit} 
                      className="view-definition-button secondary"
                      disabled={isSaving}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSave} 
                      className="view-definition-button primary"
                      disabled={!isModified || isSaving}
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </>
                )}
              </div>
              
              {saveError && (
                <div className="view-definition-save-error">
                  {saveError}
                </div>
              )}
              
              {saveSuccess && (
                <div className="view-definition-save-success">
                  {saveSuccess}
                </div>
              )}
              
              <div className="view-definition-editor">
                <Editor
                  height="400px"
                  language="sql"
                  value={definition}
                  theme={monacoThemeName}
                  onChange={isEditMode ? handleEditorChange : undefined}
                  onMount={(editor) => {
                    editorRef.current = editor;
                  }}
                  beforeMount={(monaco) => {
                    // Register all built-in themes from monaco-themes package
                    registerAllThemes(monaco as typeof import('monaco-editor'));
                    
                    // Register custom theme if it has editor configuration (user-imported themes)
                    if (activeTheme.editor && !activeTheme.isBuiltIn) {
                      monaco.editor.defineTheme(activeTheme.id, {
                        base: activeTheme.editor.base,
                        inherit: activeTheme.editor.inherit,
                        rules: activeTheme.editor.rules,
                        colors: activeTheme.editor.colors,
                      });
                    }
                  }}
                  options={{
                    readOnly: !isEditMode,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 13,
                    lineNumbers: 'on',
                    folding: true,
                    wordWrap: 'on',
                    automaticLayout: true,
                    renderLineHighlight: isEditMode ? 'line' : 'none',
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
