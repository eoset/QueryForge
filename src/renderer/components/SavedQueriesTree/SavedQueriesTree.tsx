import React, { useState, useEffect, useRef, memo } from 'react';
import { useQueriesStore } from '../../stores/queries-store';
import { useTabsStore } from '../../stores/tabs-store';
import type { SavedQuery } from '../../../shared/types/query';
import './SavedQueriesTree.css';

interface SavedQueriesTreeProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onRefreshReady?: (refreshFn: () => void, isLoading: boolean) => void;
  onCompare?: (queryId: string) => void;
}

const SavedQueriesTreeComponent: React.FC<SavedQueriesTreeProps> = ({ collapsed = false, onToggleCollapse, onRefreshReady, onCompare }) => {
  const { queries, isLoading, loadQueries, getFilteredQueries, setSearchTerm: setStoreSearchTerm } = useQueriesStore();
  const { createTab, setTabQuery, updateTab, tabs, activeTabId, setActiveTab } = useTabsStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    query: SavedQuery;
  } | null>(null);
  const [hoveredQuery, setHoveredQuery] = useState<{
    query: SavedQuery;
    x: number;
    y: number;
  } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadQueries();
  }, [loadQueries]);

  useEffect(() => {
    setStoreSearchTerm(searchTerm);
  }, [searchTerm, setStoreSearchTerm]);

  // Expose refresh function and loading state to parent
  useEffect(() => {
    if (onRefreshReady) {
      onRefreshReady(loadQueries, isLoading);
    }
  }, [onRefreshReady, loadQueries, isLoading]);

  const handleQueryContextMenu = (event: React.MouseEvent, query: SavedQuery) => {
    event.preventDefault();
    event.stopPropagation();
    
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      query,
    });
  };

  const handleQueryMouseEnter = (event: React.MouseEvent, query: SavedQuery) => {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    
    // Clear any existing timeouts
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    
    // Add a small delay before showing tooltip
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredQuery({
        query,
        x: rect.right + 8,
        y: rect.top,
      });
    }, 300);
  };

  const handleQueryMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    // Delay hiding to allow cursor to move into tooltip
    hideTimeoutRef.current = setTimeout(() => {
      setHoveredQuery(null);
    }, 100);
  };

  const handleTooltipMouseEnter = () => {
    // Cancel the hide timeout when entering tooltip
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  const handleTooltipMouseLeave = () => {
    // Hide tooltip when leaving it
    setHoveredQuery(null);
  };

  const handleLoadToNewTab = () => {
    if (!contextMenu) return;
    
    const { query } = contextMenu;
    
    const newTabId = createTab();
    setTabQuery(newTabId, query.sqlText);
    updateTab(newTabId, {
      title: query.name,
      savedQueryId: query.id,
      isModified: false,
    });
    
    setContextMenu(null);
  };

  const handleCompare = () => {
    if (!contextMenu || !onCompare) return;
    
    const { query } = contextMenu;
    onCompare(query.id);
    setContextMenu(null);
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null);
      }
    };

    if (contextMenu?.visible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [contextMenu?.visible]);

  // Close context menu on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && contextMenu?.visible) {
        setContextMenu(null);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [contextMenu?.visible]);

  // Filter queries based on search term
  const filteredQueries = React.useMemo(() => {
    if (!searchTerm.trim()) {
      return queries;
    }
    return getFilteredQueries();
  }, [queries, searchTerm, getFilteredQueries]);

  return (
    <div className={`saved-queries-tree ${collapsed ? 'collapsed' : ''}`}>
      {!collapsed && (
        <>
          <div className="saved-queries-tree-search">
            <input
              type="text"
              className="saved-queries-tree-search-input"
              placeholder="Search saved queries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setSearchTerm('');
                }
              }}
            />
            {searchTerm && (
              <button
                className="saved-queries-tree-search-clear"
                onClick={() => setSearchTerm('')}
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>
          <div className="saved-queries-tree-content">
            {isLoading && queries.length === 0 && (
              <div className="saved-queries-tree-loading">Loading saved queries...</div>
            )}
            {filteredQueries.length === 0 && !isLoading && (
              <div className="saved-queries-tree-empty">
                {searchTerm ? 'No matching queries found' : 'No saved queries yet'}
              </div>
            )}
            {filteredQueries.map((query) => (
              <div
                key={query.id}
                className="saved-query-item"
                onContextMenu={(e) => handleQueryContextMenu(e, query)}
                onMouseEnter={(e) => handleQueryMouseEnter(e, query)}
                onMouseLeave={handleQueryMouseLeave}
              >
                <span className="saved-query-icon">📝</span>
                <div className="saved-query-info">
                  <span className="saved-query-name">{query.name}</span>
                  {query.description && (
                    <span className="saved-query-description">{query.description}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {contextMenu?.visible && (
        <div
          ref={contextMenuRef}
          className="context-menu"
          style={{
            position: 'fixed',
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
          }}
        >
          <div className="context-menu-item" onClick={handleLoadToNewTab}>
            Open in new tab
          </div>
          {onCompare && (
            <div className="context-menu-item" onClick={handleCompare}>
              Compare with...
            </div>
          )}
        </div>
      )}
      {hoveredQuery && (
        <div
          className="saved-query-tooltip"
          style={{
            position: 'fixed',
            left: `${hoveredQuery.x}px`,
            top: `${hoveredQuery.y}px`,
          }}
          onMouseEnter={handleTooltipMouseEnter}
          onMouseLeave={handleTooltipMouseLeave}
        >
          <pre className="saved-query-tooltip-code">{hoveredQuery.query.sqlText}</pre>
        </div>
      )}
    </div>
  );
};

export const SavedQueriesTree = memo(SavedQueriesTreeComponent, (prevProps, nextProps) => {
  return (
    prevProps.collapsed === nextProps.collapsed &&
    prevProps.onToggleCollapse === nextProps.onToggleCollapse
  );
});
