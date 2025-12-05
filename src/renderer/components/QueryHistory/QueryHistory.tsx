import React, { useState, useEffect, useRef, memo, useMemo } from 'react';
import { useQueryHistoryStore } from '../../stores/query-history-store';
import { useTabsStore } from '../../stores/tabs-store';
import type { QueryHistoryEntry } from '../../../shared/types/query';
import './QueryHistory.css';

interface QueryHistoryProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onRefreshReady?: (refreshFn: () => void, isLoading: boolean) => void;
}

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes: number | undefined): string {
  if (bytes === undefined || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Format execution time to human readable string
 */
function formatExecutionTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

/**
 * Format relative time (e.g., "2 minutes ago")
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  
  return date.toLocaleDateString();
}

/**
 * Get date group label for history entries
 */
function getDateGroup(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const entryDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (entryDate.getTime() === today.getTime()) return 'Today';
  if (entryDate.getTime() === yesterday.getTime()) return 'Yesterday';
  if (now.getTime() - entryDate.getTime() < 7 * 24 * 60 * 60 * 1000) return 'This Week';
  if (now.getTime() - entryDate.getTime() < 30 * 24 * 60 * 60 * 1000) return 'This Month';
  return 'Older';
}

/**
 * Truncate query text for display
 */
function truncateQuery(query: string, maxLength: number = 100): string {
  const singleLine = query.replace(/\s+/g, ' ').trim();
  if (singleLine.length <= maxLength) return singleLine;
  return singleLine.substring(0, maxLength) + '...';
}

const QueryHistoryComponent: React.FC<QueryHistoryProps> = ({ 
  collapsed = false, 
  onToggleCollapse, 
  onRefreshReady 
}) => {
  const { entries, isLoading, loadHistory, deleteEntry, clearHistory, setSearchTerm: setStoreSearchTerm, getFilteredEntries } = useQueryHistoryStore();
  const { createTab, setTabQuery, updateTab } = useTabsStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    entry: QueryHistoryEntry;
  } | null>(null);
  const [hoveredEntry, setHoveredEntry] = useState<{
    entry: QueryHistoryEntry;
    x: number;
    y: number;
  } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    setStoreSearchTerm(searchTerm);
  }, [searchTerm, setStoreSearchTerm]);

  // Expose refresh function and loading state to parent
  useEffect(() => {
    if (onRefreshReady) {
      onRefreshReady(loadHistory, isLoading);
    }
  }, [onRefreshReady, loadHistory, isLoading]);

  const handleEntryContextMenu = (event: React.MouseEvent, entry: QueryHistoryEntry) => {
    event.preventDefault();
    event.stopPropagation();
    
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      entry,
    });
  };

  const handleEntryMouseEnter = (event: React.MouseEvent, entry: QueryHistoryEntry) => {
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
      setHoveredEntry({
        entry,
        x: rect.right + 8,
        y: rect.top,
      });
    }, 300);
  };

  const handleEntryMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    // Delay hiding to allow cursor to move into tooltip
    hideTimeoutRef.current = setTimeout(() => {
      setHoveredEntry(null);
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
    setHoveredEntry(null);
  };

  const handleOpenInNewTab = () => {
    if (!contextMenu) return;
    
    const { entry } = contextMenu;
    
    const newTabId = createTab();
    setTabQuery(newTabId, entry.queryText);
    updateTab(newTabId, {
      title: `Query ${new Date(entry.executedAt).toLocaleTimeString()}`,
      isModified: false,
    });
    
    setContextMenu(null);
  };

  const handleCopyQuery = () => {
    if (!contextMenu) return;
    navigator.clipboard.writeText(contextMenu.entry.queryText);
    setContextMenu(null);
  };

  const handleDeleteEntry = () => {
    if (!contextMenu) return;
    deleteEntry(contextMenu.entry.id);
    setContextMenu(null);
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all query history? This cannot be undone.')) {
      clearHistory();
    }
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

  // Filter and group entries
  const filteredEntries = useMemo(() => {
    if (!searchTerm.trim()) {
      return entries;
    }
    return getFilteredEntries();
  }, [entries, searchTerm, getFilteredEntries]);

  // Group entries by date
  const groupedEntries = useMemo(() => {
    const groups: { label: string; entries: QueryHistoryEntry[] }[] = [];
    let currentGroup: string | null = null;

    for (const entry of filteredEntries) {
      const group = getDateGroup(entry.executedAt);
      if (group !== currentGroup) {
        groups.push({ label: group, entries: [entry] });
        currentGroup = group;
      } else {
        groups[groups.length - 1].entries.push(entry);
      }
    }

    return groups;
  }, [filteredEntries]);

  const getStatusIcon = (status: QueryHistoryEntry['status']) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'error':
        return '✕';
      case 'cancelled':
        return '◯';
      default:
        return '•';
    }
  };

  return (
    <div className={`query-history ${collapsed ? 'collapsed' : ''}`}>
      {!collapsed && (
        <>
          <div className="query-history-search">
            <input
              type="text"
              className="query-history-search-input"
              placeholder="Search history..."
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
                className="query-history-search-clear"
                onClick={() => setSearchTerm('')}
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>
          <div className="query-history-content">
            {isLoading && entries.length === 0 && (
              <div className="query-history-loading">Loading history...</div>
            )}
            {filteredEntries.length === 0 && !isLoading && (
              <div className="query-history-empty">
                {searchTerm ? 'No matching queries found' : 'No query history yet'}
              </div>
            )}
            {groupedEntries.map((group, groupIndex) => (
              <React.Fragment key={group.label}>
                <div className="query-history-date-separator">{group.label}</div>
                {group.entries.map((entry) => (
                  <div
                    key={entry.id}
                    className={`query-history-item status-${entry.status}`}
                    onContextMenu={(e) => handleEntryContextMenu(e, entry)}
                    onMouseEnter={(e) => handleEntryMouseEnter(e, entry)}
                    onMouseLeave={handleEntryMouseLeave}
                  >
                    <div className="query-history-item-header">
                      <div className="query-history-item-status">
                        <span className={`query-history-status-icon ${entry.status}`}>
                          {getStatusIcon(entry.status)}
                        </span>
                      </div>
                      <span className="query-history-item-time">
                        {formatRelativeTime(entry.executedAt)}
                      </span>
                    </div>
                    <div className="query-history-item-query">
                      {truncateQuery(entry.queryText)}
                    </div>
                    <div className="query-history-item-meta">
                      <span className="query-history-meta-item">
                        <span className="query-history-meta-icon">⏱</span>
                        {formatExecutionTime(entry.executionTimeMs)}
                      </span>
                      {entry.bytesProcessed !== undefined && (
                        <span className="query-history-meta-item">
                          
                          {formatBytes(entry.bytesProcessed)}
                        </span>
                      )}
                      {entry.totalRows !== undefined && (
                        <span className="query-history-meta-item">
                          <span className="query-history-meta-icon">↔</span>
                          {entry.totalRows.toLocaleString()} rows
                        </span>
                      )}
                    </div>
                    {entry.status === 'error' && entry.errorMessage && (
                      <div className="query-history-error-message">
                        {entry.errorMessage}
                      </div>
                    )}
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
          {filteredEntries.length > 0 && (
            <div className="query-history-footer">
              <button 
                className="query-history-clear-btn"
                onClick={handleClearHistory}
                title="Clear all history"
              >
                Clear History
              </button>
            </div>
          )}
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
          <div className="context-menu-item" onClick={handleOpenInNewTab}>
            Open in new tab
          </div>
          <div className="context-menu-item" onClick={handleCopyQuery}>
            Copy query
          </div>
          <div className="context-menu-separator" />
          <div className="context-menu-item danger" onClick={handleDeleteEntry}>
            Delete
          </div>
        </div>
      )}
      {hoveredEntry && (
        <div
          className="query-history-tooltip"
          style={{
            position: 'fixed',
            left: `${hoveredEntry.x}px`,
            top: `${hoveredEntry.y}px`,
          }}
          onMouseEnter={handleTooltipMouseEnter}
          onMouseLeave={handleTooltipMouseLeave}
        >
          <pre className="query-history-tooltip-code">{hoveredEntry.entry.queryText}</pre>
        </div>
      )}
    </div>
  );
};

export const QueryHistory = memo(QueryHistoryComponent, (prevProps, nextProps) => {
  return (
    prevProps.collapsed === nextProps.collapsed &&
    prevProps.onToggleCollapse === nextProps.onToggleCollapse
  );
});
