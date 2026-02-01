import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DiffEditor } from '@monaco-editor/react';
import { useTabsStore } from '../../stores/tabs-store';
import { useQueriesStore } from '../../stores/queries-store';
import { useThemeStore } from '../../stores/theme-store';
import { getMonacoThemeName } from '../../themes/built-in-themes';
import './QueryDiffModal.css';

interface QueryDiffModalProps {
  onClose: () => void;
  initialLeft?: {
    type: 'tab' | 'saved' | 'clipboard';
    id?: string;
    content?: string;
  };
  initialRight?: {
    type: 'tab' | 'saved' | 'clipboard';
    id?: string;
    content?: string;
  };
}

type QuerySource = {
  type: 'tab' | 'saved' | 'clipboard';
  id?: string;
  content?: string;
};

export const QueryDiffModal: React.FC<QueryDiffModalProps> = ({
  onClose,
  initialLeft,
  initialRight,
}) => {
  // State
  const [leftSource, setLeftSource] = useState<QuerySource>(
    initialLeft || { type: 'tab' }
  );
  const [rightSource, setRightSource] = useState<QuerySource>(
    initialRight || { type: 'tab' }
  );
  const [viewMode, setViewMode] = useState<'side-by-side' | 'inline'>('side-by-side');
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);

  // Stores
  const { tabs, activeTabId } = useTabsStore();
  const { queries } = useQueriesStore();
  const { activeTheme } = useThemeStore();
  const monacoThemeName = getMonacoThemeName(activeTheme);

  // Filter to query tabs only
  const queryTabs = useMemo(() => tabs.filter((t) => t.type === 'query'), [tabs]);

  // Get query text for left side
  const leftContent = useMemo(() => {
    if (leftSource.content) return leftSource.content;
    if (leftSource.type === 'tab' && leftSource.id) {
      const tab = queryTabs.find((t) => t.id === leftSource.id);
      return tab?.queryText || '';
    }
    if (leftSource.type === 'saved' && leftSource.id) {
      const query = queries.find((q) => q.id === leftSource.id);
      return query?.sqlText || '';
    }
    if (leftSource.type === 'clipboard') {
      return leftSource.content || '';
    }
    // Default to active tab
    const activeTab = queryTabs.find((t) => t.id === activeTabId);
    return activeTab?.queryText || '';
  }, [leftSource, queryTabs, queries, activeTabId]);

  // Get query text for right side
  const rightContent = useMemo(() => {
    if (rightSource.content) return rightSource.content;
    if (rightSource.type === 'tab' && rightSource.id) {
      const tab = queryTabs.find((t) => t.id === rightSource.id);
      return tab?.queryText || '';
    }
    if (rightSource.type === 'saved' && rightSource.id) {
      const query = queries.find((q) => q.id === rightSource.id);
      return query?.sqlText || '';
    }
    if (rightSource.type === 'clipboard') {
      return rightSource.content || '';
    }
    // Default to empty
    return '';
  }, [rightSource, queryTabs, queries]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Handle swap sides
  const handleSwapSides = useCallback(() => {
    const tempLeft = leftSource;
    setLeftSource(rightSource);
    setRightSource(tempLeft);
  }, [leftSource, rightSource]);

  // Handle copy to new tab
  const handleCopyToNewTab = useCallback(
    (side: 'left' | 'right') => {
      const content = side === 'left' ? leftContent : rightContent;
      const { createTab, setTabQuery } = useTabsStore.getState();
      const newTabId = createTab();
      setTabQuery(newTabId, content);
      onClose();
    },
    [leftContent, rightContent, onClose]
  );

  // Handle paste from clipboard
  const handlePasteFromClipboard = async (side: 'left' | 'right') => {
    try {
      const text = await navigator.clipboard.readText();
      if (side === 'left') {
        setLeftSource({ type: 'clipboard', content: text });
      } else {
        setRightSource({ type: 'clipboard', content: text });
      }
    } catch (error) {
      console.error('Failed to read clipboard:', error);
    }
  };

  // Handle left source type change
  const handleLeftTypeChange = (type: 'tab' | 'saved' | 'clipboard') => {
    if (type === 'clipboard') {
      handlePasteFromClipboard('left');
    } else if (type === 'tab') {
      setLeftSource({ type, id: activeTabId || queryTabs[0]?.id });
    } else if (type === 'saved') {
      setLeftSource({ type, id: queries[0]?.id });
    }
  };

  // Handle right source type change
  const handleRightTypeChange = (type: 'tab' | 'saved' | 'clipboard') => {
    if (type === 'clipboard') {
      handlePasteFromClipboard('right');
    } else if (type === 'tab') {
      setRightSource({ type, id: queryTabs[0]?.id });
    } else if (type === 'saved') {
      setRightSource({ type, id: queries[0]?.id });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog query-diff-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Compare Queries</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="query-diff-controls">
          <div className="query-diff-sources">
            <div className="query-diff-source">
              <label>Left:</label>
              <select
                value={leftSource.type}
                onChange={(e) =>
                  handleLeftTypeChange(e.target.value as 'tab' | 'saved' | 'clipboard')
                }
              >
                <option value="tab">Tab</option>
                <option value="saved">Saved Query</option>
                <option value="clipboard">Clipboard</option>
              </select>
              {leftSource.type === 'tab' && (
                <select
                  value={leftSource.id || ''}
                  onChange={(e) =>
                    setLeftSource({ ...leftSource, id: e.target.value })
                  }
                >
                  {queryTabs.map((tab) => (
                    <option key={tab.id} value={tab.id}>
                      {tab.title}
                    </option>
                  ))}
                </select>
              )}
              {leftSource.type === 'saved' && (
                <select
                  value={leftSource.id || ''}
                  onChange={(e) =>
                    setLeftSource({ ...leftSource, id: e.target.value })
                  }
                >
                  {queries.map((query) => (
                    <option key={query.id} value={query.id}>
                      {query.name}
                    </option>
                  ))}
                </select>
              )}
              {leftSource.type === 'clipboard' && (
                <button
                  className="btn-secondary"
                  onClick={() => handlePasteFromClipboard('left')}
                >
                  Refresh from Clipboard
                </button>
              )}
            </div>

            <button
              className="btn-icon"
              onClick={handleSwapSides}
              title="Swap sides"
            >
              ⇄
            </button>

            <div className="query-diff-source">
              <label>Right:</label>
              <select
                value={rightSource.type}
                onChange={(e) =>
                  handleRightTypeChange(e.target.value as 'tab' | 'saved' | 'clipboard')
                }
              >
                <option value="tab">Tab</option>
                <option value="saved">Saved Query</option>
                <option value="clipboard">Clipboard</option>
              </select>
              {rightSource.type === 'tab' && (
                <select
                  value={rightSource.id || ''}
                  onChange={(e) =>
                    setRightSource({ ...rightSource, id: e.target.value })
                  }
                >
                  {queryTabs.map((tab) => (
                    <option key={tab.id} value={tab.id}>
                      {tab.title}
                    </option>
                  ))}
                </select>
              )}
              {rightSource.type === 'saved' && (
                <select
                  value={rightSource.id || ''}
                  onChange={(e) =>
                    setRightSource({ ...rightSource, id: e.target.value })
                  }
                >
                  {queries.map((query) => (
                    <option key={query.id} value={query.id}>
                      {query.name}
                    </option>
                  ))}
                </select>
              )}
              {rightSource.type === 'clipboard' && (
                <button
                  className="btn-secondary"
                  onClick={() => handlePasteFromClipboard('right')}
                >
                  Refresh from Clipboard
                </button>
              )}
            </div>
          </div>

          <div className="query-diff-options">
            <div className="query-diff-actions">
              <button
                className="btn-secondary"
                onClick={() => handleCopyToNewTab('left')}
              >
                Copy Left to New Tab
              </button>
              <button
                className="btn-secondary"
                onClick={() => handleCopyToNewTab('right')}
              >
                Copy Right to New Tab
              </button>
            </div>
            <div className="query-diff-toggles">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={viewMode === 'inline'}
                  onChange={(e) =>
                    setViewMode(e.target.checked ? 'inline' : 'side-by-side')
                  }
                />
                Inline View
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={ignoreWhitespace}
                  onChange={(e) => setIgnoreWhitespace(e.target.checked)}
                />
                Ignore Whitespace
              </label>
            </div>
          </div>
        </div>

        <div className="query-diff-editor-container">
          <DiffEditor
            height="600px"
            language="sql"
            original={leftContent}
            modified={rightContent}
            theme={monacoThemeName}
            options={{
              readOnly: true,
              renderSideBySide: viewMode === 'side-by-side',
              ignoreTrimWhitespace: ignoreWhitespace,
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: 'on',
              automaticLayout: true,
            }}
          />
        </div>
      </div>
    </div>
  );
};
