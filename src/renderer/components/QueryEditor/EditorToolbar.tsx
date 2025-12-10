import React, { useRef, useEffect } from 'react';
import './QueryEditor.css';

interface EditorToolbarProps {
  onExecute: () => void;
  onCancel: () => void;
  onFormat: () => void;
  onExpandSelectStar: () => void;
  onDbtify: () => void;
  onOpenSaveDialog: () => void;
  onOpenSaveAsViewDialog: () => void;
  onToggleSplit: () => void;
  isExecuting: boolean;
  isConnected: boolean;
  hasQuery: boolean;
  hasDbtSyntax: boolean;
  isQueryValid: boolean | null;
  enableDbtSupport: boolean;
  savedQueryId: string | null;
  isSplit: boolean;
  isSplitMode?: boolean; // Whether this toolbar is in a split pane
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  onExecute,
  onCancel,
  onFormat,
  onExpandSelectStar,
  onDbtify,
  onOpenSaveDialog,
  onOpenSaveAsViewDialog,
  onToggleSplit,
  isExecuting,
  isConnected,
  hasQuery,
  hasDbtSyntax,
  isQueryValid,
  enableDbtSupport,
  savedQueryId,
  isSplit,
  isSplitMode = false,
}) => {
  const [isToolsMenuOpen, setIsToolsMenuOpen] = React.useState(false);
  const toolsMenuRef = useRef<HTMLDivElement>(null);

  // Close tools menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (toolsMenuRef.current && target && !toolsMenuRef.current.contains(target)) {
        setIsToolsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToolAction = (action: () => void) => {
    action();
    setIsToolsMenuOpen(false);
  };

  const shouldDisableRunButton = isExecuting || !isConnected;

  return (
    <div className="query-editor-toolbar">
      <button
        onClick={onExecute}
        disabled={shouldDisableRunButton}
        className="run-button"
      >
        {isExecuting ? (
          'Executing...'
        ) : (
          <>
            Run <span className="arrow-icon">→</span>
          </>
        )}
      </button>
      
      {isExecuting && (
        <button onClick={onCancel} className="cancel-button">
          Cancel
        </button>
      )}
      
      <div className="tools-dropdown" ref={toolsMenuRef}>
        <button
          onClick={() => setIsToolsMenuOpen((prev) => !prev)}
          className={`tools-button${isToolsMenuOpen ? ' open' : ''}`}
          aria-haspopup="true"
          aria-expanded={isToolsMenuOpen}
        >
          Tools <span className="arrow-icon">▾</span>
        </button>
        
        {isToolsMenuOpen && (
          <div className="tools-menu">
            <button
              onClick={() => handleToolAction(onFormat)}
              disabled={!hasQuery}
              className="tools-menu-item"
              title="Format SQL query"
            >
              Format
            </button>
            <button
              onClick={() => handleToolAction(onExpandSelectStar)}
              disabled={!hasQuery || !isConnected}
              className="tools-menu-item"
              title="Expand SELECT * to columns (Cmd+B / Ctrl+B)"
            >
              Expand *
            </button>
            {enableDbtSupport && (
              <button
                onClick={() => handleToolAction(onDbtify)}
                disabled={!hasQuery || (!hasDbtSyntax && isQueryValid !== true)}
                className="tools-menu-item"
                title={
                  hasDbtSyntax
                    ? 'Convert dbt source/ref syntax back to BigQuery table references'
                    : 'Convert table references to dbt source syntax'
                }
              >
                {hasDbtSyntax ? 'de-dbtify' : 'dbtify'}
              </button>
            )}
            {!isSplitMode && (
              <button
                onClick={() => handleToolAction(onToggleSplit)}
                className="tools-menu-item"
                title={isSplit ? 'Close split view (Cmd+\\)' : 'Split editor (Cmd+\\)'}
              >
                {isSplit ? 'Close Split' : 'Split Editor'}
              </button>
            )}
            <div className="tools-menu-separator" />
            <button
              onClick={() => handleToolAction(onOpenSaveAsViewDialog)}
              disabled={!hasQuery || !isConnected || isQueryValid !== true}
              className="tools-menu-item"
              title={
                !isConnected
                  ? 'Connect to BigQuery first'
                  : isQueryValid !== true
                  ? 'Query must be valid to save as view'
                  : 'Save the current query as a view in BigQuery'
              }
            >
              Save as View
            </button>
          </div>
        )}
      </div>
      
      <button
        onClick={onOpenSaveDialog}
        disabled={!hasQuery}
        className="save-button"
      >
        {savedQueryId ? 'Update' : 'Save'}
      </button>
      
      {!isConnected && <span className="connection-warning">Not connected</span>}
    </div>
  );
};
