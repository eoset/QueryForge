import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useTabsStore } from '../../stores/tabs-store';
import { RowContextMenu } from './RowContextMenu';
import { CanvasTable } from './CanvasTable';
import type { QueryTab } from '../../../shared/types/query';
import './QueryResults.css';

const ROWS_PER_PAGE = 200;

export const QueryResults: React.FC = () => {
  // Use separate selectors to ensure reactivity for each property
  const activeTabId = useTabsStore((state) => state.activeTabId);
  const activeTab = useTabsStore((state) => {
    if (!activeTabId) return null;
    return state.tabs.find((t) => t.id === activeTabId) || null;
  });
  
  const results = activeTab?.results || null;
  const error = activeTab?.error;
  const executionStatus: QueryTab['executionStatus'] = activeTab?.executionStatus || 'idle';
  
  // All hooks must be called before any conditional returns
  const [columnWidths, setColumnWidths] = useState<{ [key: number]: number }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    rowIndex?: number;
    columnIndex?: number;
  } | null>(null);

  // Reset column widths when results change (use jobId as stable identifier)
  const resultsJobId = results?.jobId;
  const resultsColumnCount = results?.columns?.length;
  
  useEffect(() => {
    if (resultsJobId !== undefined) {
      setColumnWidths({});
      setCurrentPage(1); // Reset to first page when results change
    }
  }, [resultsJobId, activeTab?.id, resultsColumnCount]);

  const handleColumnResize = useCallback((columnIndex: number, width: number) => {
    setColumnWidths((prev) => ({
      ...prev,
      [columnIndex]: width,
    }));
  }, []);

  const handleRowContextMenu = useCallback((e: React.MouseEvent, rowIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      rowIndex,
    });
  }, []);

  const formatValue = useCallback((value: any, columnType?: string): string => {
    if (value === null || value === undefined) {
      return 'NULL';
    }

    // Handle Date objects
    if (value instanceof Date) {
      // Format based on column type
      if (columnType === 'DATE') {
        return value.toISOString().split('T')[0]; // YYYY-MM-DD
      } else if (columnType === 'TIME') {
        return value.toTimeString().split(' ')[0]; // HH:mm:ss
      } else if (columnType === 'DATETIME') {
        return value.toISOString().replace('T', ' ').slice(0, 19); // YYYY-MM-DD HH:mm:ss
      } else {
        // TIMESTAMP - show full datetime with timezone
        return value.toISOString();
      }
    }

    // Handle date-related types
    if (columnType && ['DATE', 'DATETIME', 'TIMESTAMP', 'TIME'].includes(columnType)) {
      // BigQuery might return date values as strings in various formats
      if (typeof value === 'string') {
        // If it's already in a good format, return as-is (for DATE which is YYYY-MM-DD)
        if (columnType === 'DATE' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
          return value;
        }
        // Try to parse and format
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          if (columnType === 'DATE') {
            return date.toISOString().split('T')[0];
          } else if (columnType === 'TIME') {
            // TIME format: HH:mm:ss
            const hours = String(date.getUTCHours()).padStart(2, '0');
            const minutes = String(date.getUTCMinutes()).padStart(2, '0');
            const seconds = String(date.getUTCSeconds()).padStart(2, '0');
            return `${hours}:${minutes}:${seconds}`;
          } else if (columnType === 'DATETIME') {
            // DATETIME format: YYYY-MM-DD HH:mm:ss
            return date.toISOString().replace('T', ' ').slice(0, 19);
          } else {
            // TIMESTAMP - show full datetime with timezone
            return date.toISOString();
          }
        }
        // If parsing failed, return the string as-is
        return value;
      }
      // Handle numeric timestamps (milliseconds since epoch)
      if (typeof value === 'number') {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          if (columnType === 'DATE') {
            return date.toISOString().split('T')[0];
          } else if (columnType === 'TIME') {
            const hours = String(date.getUTCHours()).padStart(2, '0');
            const minutes = String(date.getUTCMinutes()).padStart(2, '0');
            const seconds = String(date.getUTCSeconds()).padStart(2, '0');
            return `${hours}:${minutes}:${seconds}`;
          } else if (columnType === 'DATETIME') {
            return date.toISOString().replace('T', ' ').slice(0, 19);
          } else {
            return date.toISOString();
          }
        }
      }
    }

    // Handle objects (arrays, records, etc.)
    if (typeof value === 'object' && !(value instanceof Date)) {
      if (Array.isArray(value)) {
        return JSON.stringify(value);
      }
      // Check if it's a BigQuery date object with a value property
      if (value.value !== undefined) {
        // Recursively format the inner value (but avoid infinite recursion)
        const innerValue = value.value;
        if (innerValue !== value) {
          return formatValue(innerValue, columnType);
        }
      }
      // For other objects, try JSON.stringify
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }

    return String(value);
  }, []);

  const formatCSVValue = useCallback((val: any, columnType?: string): string => {
    const formatted = formatValue(val, columnType);
    // Escape commas, quotes, and newlines in values
    if (formatted.includes(',') || formatted.includes('"') || formatted.includes('\n')) {
      return `"${formatted.replace(/"/g, '""')}"`;
    }
    return formatted;
  }, [formatValue]);

  const handleCopyRowValues = useCallback(() => {
    if (!results || !contextMenu || contextMenu.rowIndex === undefined) return;

    // Calculate pagination to get the correct row
    const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
    const paginatedRows = results.rows?.slice(startIndex, startIndex + ROWS_PER_PAGE) || [];
    const rowIndex = contextMenu.rowIndex;
    const row = paginatedRows[rowIndex];
    
    if (!row) return;

    const headers = results.columns.map(col => formatCSVValue(col.name));
    const values = row.values.map((val, idx) => formatCSVValue(val, results.columns[idx]?.type));

    // Format: header1,header2,header3\nvalue1,value2,value3
    const csvText = [headers.join(','), values.join(',')].join('\n');
    
    // Copy to clipboard
    navigator.clipboard.writeText(csvText).catch((err) => {
      console.error('Failed to copy to clipboard:', err);
    });
  }, [results, contextMenu, currentPage, formatCSVValue]);

  const handleCopyColumnValues = useCallback(() => {
    if (!results || !contextMenu || contextMenu.columnIndex === undefined) return;

    const columnIndex = contextMenu.columnIndex;
    const column = results.columns[columnIndex];
    
    if (!column) return;

    // Calculate pagination to get rows for current page
    const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
    const paginatedRows = results.rows?.slice(startIndex, startIndex + ROWS_PER_PAGE) || [];

    // Get header
    const header = formatCSVValue(column.name);
    
    // Get all values for this column in current page
    const values = paginatedRows.map(row => formatCSVValue(row.values[columnIndex], column.type));

    // Format: header\nvalue1\nvalue2\nvalue3...
    const csvText = [header, ...values].join('\n');
    
    // Copy to clipboard
    navigator.clipboard.writeText(csvText).catch((err) => {
      console.error('Failed to copy to clipboard:', err);
    });
  }, [results, contextMenu, currentPage, formatCSVValue]);

  const handleColumnContextMenu = useCallback((e: React.MouseEvent, columnIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      columnIndex,
    });
  }, []);

  // Pagination calculations
  const totalRows = results?.rows?.length || 0;
  const totalPages = Math.ceil(totalRows / ROWS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const endIndex = Math.min(startIndex + ROWS_PER_PAGE, totalRows);
  const paginatedRows = results?.rows?.slice(startIndex, endIndex) || [];

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Now we can do conditional returns after all hooks
  if (error) {
    return (
      <div className="query-results">
        <div className="error-results">
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  if (!results) {
    // Show "Executing query..." when status is running, otherwise show default message
    const message = executionStatus === 'running' 
      ? 'Executing query...' 
      : 'Execute a query to see results here.';
    
    return (
      <div className="query-results">
        <div className="no-results">
          <div>{message}</div>
          {executionStatus === 'running' && (
            <div className="query-spinner-container">
              <div className="query-spinner"></div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Check if we have columns and rows to display
  const hasColumns = results.columns && results.columns.length > 0;
  const hasRows = results.rows && results.rows.length > 0;

  if (!hasColumns && !hasRows) {
    return (
      <div className="query-results">
        <div className="results-header">
          <div className="results-info">
            <span>{results.rowsReturned.toLocaleString()} rows</span>
            {results.totalRows > results.rowsReturned && (
              <span> of {results.totalRows.toLocaleString()} total</span>
            )}
            <span> • {results.executionTimeMs}ms</span>
            {results.bytesProcessed && (
              <span> • {(results.bytesProcessed / 1024 / 1024).toFixed(2)} MB processed</span>
            )}
          </div>
        </div>
        <div className="no-results">No data to display (empty result set).</div>
      </div>
    );
  }

  if (!hasColumns) {
    return (
      <div className="query-results">
        <div className="results-header">
          <div className="results-info">
            <span>{results.rowsReturned.toLocaleString()} rows</span>
            {results.totalRows > results.rowsReturned && (
              <span> of {results.totalRows.toLocaleString()} total</span>
            )}
            <span> • {results.executionTimeMs}ms</span>
            {results.bytesProcessed && (
              <span> • {(results.bytesProcessed / 1024 / 1024).toFixed(2)} MB processed</span>
            )}
          </div>
        </div>
        <div className="no-results">Error: No column information available.</div>
      </div>
    );
  }

  return (
    <div className="query-results">
      <div className="results-header">
        <div className="results-info">
          <span>{results.rowsReturned.toLocaleString()} rows</span>
          {results.totalRows > results.rowsReturned && (
            <span> of {results.totalRows.toLocaleString()} total</span>
          )}
          <span> • {results.executionTimeMs}ms</span>
          {results.bytesProcessed && (
            <span> • {(results.bytesProcessed / 1024 / 1024).toFixed(2)} MB processed</span>
          )}
        </div>
      </div>
      <div className="results-table-container">
        {hasRows ? (
          <CanvasTable
            results={results}
            columnWidths={columnWidths}
            onColumnResize={handleColumnResize}
            onRowContextMenu={handleRowContextMenu}
            onColumnContextMenu={handleColumnContextMenu}
            formatValue={formatValue}
            currentPage={currentPage}
            rowsPerPage={ROWS_PER_PAGE}
          />
        ) : (
          <div className="no-rows-message">No rows returned</div>
        )}
      </div>
      {hasRows && totalPages > 1 && (
        <div className="results-pagination">
          <button
            className="pagination-button"
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            title="Previous page"
          >
            ‹
          </button>
          <span className="pagination-info">
            {startIndex + 1}-{endIndex} of {totalRows.toLocaleString()}
          </span>
          <button
            className="pagination-button"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            title="Next page"
          >
            ›
          </button>
        </div>
      )}
      {contextMenu && (
        <RowContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onCopyValues={contextMenu.columnIndex !== undefined ? handleCopyColumnValues : handleCopyRowValues}
          menuLabel={contextMenu.columnIndex !== undefined ? 'Copy column values (with header)' : 'Copy values (with headers)'}
        />
      )}
    </div>
  );
};

