import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSchemaCacheStore, type SchemaSearchResult } from '../../stores/schema-cache-store';
import { useConnectionStore } from '../../stores/connection-store';
import { useTabsStore } from '../../stores/tabs-store';
import { indexSchemasInBackground, isSchemaIndexingInProgress } from '../../utils/schema-indexer';
import './SchemaSearchModal.css';

// Datasets to exclude from schema search - kept for reference but no longer used in this file
// const FILTERED_DATASETS = ['airbyte_internal', 'Auditlogs'];

interface SchemaSearchModalProps {
  onClose: () => void;
  onShowSchema?: (projectId: string, datasetId: string, tableId: string) => void;
}

export const SchemaSearchModal: React.FC<SchemaSearchModalProps> = ({ onClose, onShowSchema }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [results, setResults] = useState<SchemaSearchResult[]>([]);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; result: SchemaSearchResult } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  
  const connection = useConnectionStore((state) => state.connection);
  const { search, isLoading, loadingProgress } = useSchemaCacheStore();
  const { createTab, setTabQuery, updateTab } = useTabsStore();

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Trigger background indexing if not already running and no schemas loaded
  useEffect(() => {
    if (!connection) return;
    
    // Check if schemas need to be loaded
    const { schemas } = useSchemaCacheStore.getState();
    if (schemas.size === 0 && !isSchemaIndexingInProgress()) {
      // No schemas in memory, trigger background indexing
      indexSchemasInBackground(connection.projectId);
    }
  }, [connection]);

  // Search when query changes
  useEffect(() => {
    const searchResults = search(searchQuery);
    setResults(searchResults);
    setSelectedIndex(0);
  }, [searchQuery, search]);

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current && results.length > 0) {
      const selectedElement = resultsRef.current.querySelector('.schema-search-result-item.selected');
      selectedElement?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex, results.length]);

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelectResult(results[selectedIndex]);
        }
        break;
      case 'Tab':
        e.preventDefault();
        if (e.shiftKey) {
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
        } else {
          setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
        }
        break;
    }
  }, [results, selectedIndex]);

  const handleSelectResult = useCallback((result: SchemaSearchResult) => {
    if (!connection) return;

    if (result.type === 'table') {
      // Open schema sidebar for the table
      if (onShowSchema) {
        onShowSchema(connection.projectId, result.datasetId, result.tableId);
      }
    } else {
      // Insert column reference into editor
      const tableRef = `\`${connection.projectId}.${result.datasetId}.${result.tableId}\``;
      const columnRef = result.columnPath || result.columnName;
      
      // Create a SELECT query with this column
      const selectStatement = `SELECT ${columnRef}\nFROM ${tableRef}`;
      
      // Create new tab with the query
      const newTabId = createTab();
      setTabQuery(newTabId, selectStatement);
      updateTab(newTabId, {
        title: `${result.tableId}.${result.columnName}`,
      });
    }

    onClose();
  }, [connection, onShowSchema, createTab, setTabQuery, updateTab, onClose]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleContextMenu = useCallback((e: React.MouseEvent, result: SchemaSearchResult) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, result });
  }, []);

  const handleViewSchema = useCallback(() => {
    if (!connection || !contextMenu) return;
    
    if (onShowSchema) {
      onShowSchema(connection.projectId, contextMenu.result.datasetId, contextMenu.result.tableId);
    }
    setContextMenu(null);
    onClose();
  }, [connection, contextMenu, onShowSchema, onClose]);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const getResultIcon = (result: SchemaSearchResult): string => {
    if (result.type === 'table') {
      return '🗄';
    }
    // Column type icons
    switch (result.columnType?.toUpperCase()) {
      case 'STRING':
        return 'Aa';
      case 'INTEGER':
      case 'INT64':
      case 'NUMERIC':
      case 'BIGNUMERIC':
      case 'FLOAT':
      case 'FLOAT64':
        return '#';
      case 'BOOLEAN':
      case 'BOOL':
        return '☐';
      case 'DATE':
      case 'DATETIME':
      case 'TIMESTAMP':
      case 'TIME':
        return '📅';
      case 'BYTES':
        return '⬡';
      case 'RECORD':
      case 'STRUCT':
        return '{}';
      case 'ARRAY':
        return '[]';
      case 'GEOGRAPHY':
        return '🌍';
      case 'JSON':
        return '{ }';
      default:
        return '○';
    }
  };

  const highlightMatch = (text: string, query: string): React.ReactNode => {
    if (!query.trim()) return text;
    
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);
    
    if (index === -1) return text;
    
    return (
      <>
        {text.slice(0, index)}
        <mark className="schema-search-highlight">{text.slice(index, index + query.length)}</mark>
        {text.slice(index + query.length)}
      </>
    );
  };

  return (
    <div className="schema-search-modal-overlay" onClick={handleOverlayClick}>
      <div className="schema-search-modal">
        <div className="schema-search-input-wrapper">
          <span className="schema-search-icon">🔍</span>
          <input
            ref={inputRef}
            type="text"
            className="schema-search-input"
            placeholder="Search tables and columns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {isLoading && (
            <div className="schema-search-loading">
              <span className="schema-search-loading-text">
                Loading schemas ({loadingProgress.loaded}/{loadingProgress.total})
              </span>
            </div>
          )}
        </div>
        <div className="schema-search-results" ref={resultsRef}>
          {!searchQuery && !isLoading && (
            <div className="schema-search-empty">
              Type to search across all tables and columns
            </div>
          )}
          {searchQuery && results.length === 0 && !isLoading && (
            <div className="schema-search-empty">
              No results found for "{searchQuery}"
            </div>
          )}
          {results.map((result, index) => (
            <div
              key={`${result.datasetId}.${result.tableId}.${result.columnPath || ''}`}
              className={`schema-search-result-item ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => handleSelectResult(result)}
              onMouseEnter={() => setSelectedIndex(index)}
              onContextMenu={(e) => handleContextMenu(e, result)}
            >
              <span className={`schema-search-result-icon ${result.type === 'table' ? 'table-icon' : 'column-icon'}`}>
                {getResultIcon(result)}
              </span>
              <div className="schema-search-result-content">
                <div className="schema-search-result-name">
                  {result.type === 'table' ? (
                    highlightMatch(result.tableId, searchQuery)
                  ) : (
                    <>
                      {highlightMatch(result.columnPath || result.columnName || '', searchQuery)}
                      <span className="schema-search-result-type">{result.columnType}</span>
                    </>
                  )}
                </div>
                <div className="schema-search-result-path">
                  {result.datasetId}.{result.tableId}
                </div>
              </div>
              <span className="schema-search-result-badge">
                {result.type === 'table' ? 'Table' : 'Column'}
              </span>
            </div>
          ))}
        </div>
        <div className="schema-search-footer">
          <span className="schema-search-shortcut">↑↓ Navigate</span>
          <span className="schema-search-shortcut">↵ Select</span>
          <span className="schema-search-shortcut">Esc Close</span>
        </div>
      </div>
      
      {/* Context Menu */}
      {contextMenu && (
        <>
          <div className="schema-search-context-overlay" onClick={closeContextMenu} />
          <div 
            className="schema-search-context-menu"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <button className="schema-search-context-item" onClick={handleViewSchema}>
              <span className="schema-search-context-icon">📋</span>
              View Table Schema
            </button>
          </div>
        </>
      )}
    </div>
  );
};
