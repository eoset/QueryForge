import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useTabsStore } from '../../stores/tabs-store';
import { RowContextMenu } from './RowContextMenu';
import { CanvasTable } from './CanvasTable';
import type { QueryTab, QueryResult } from '../../../shared/types/query';
import { formatBigQueryValue } from '../../utils/bigquery-formatter';
import './QueryResults.css';

const ROWS_PER_PAGE = 200;

export const QueryResults: React.FC = () => {
  // Use separate selectors to ensure reactivity for each property
  const activeTabId = useTabsStore((state) => state.activeTabId);
  const activeTab = useTabsStore((state) => {
    if (!activeTabId) return null;
    return state.tabs.find((t) => t.id === activeTabId) || null;
  });
  
  // All hooks must be called before any conditional returns
  const [columnWidths, setColumnWidths] = useState<{ [key: number]: number }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    rowIndex?: number;
    columnIndex?: number;
  } | null>(null);
  
  // Store metadata and current page separately for efficient cache access
  const [resultsMetadata, setResultsMetadata] = useState<{
    columns: any[];
    totalRows: number;
    rowsReturned: number;
    executionTimeMs: number;
    bytesProcessed?: number;
    jobId: string;
    hasMore: boolean;
  } | null>(null);
  const [currentPageRows, setCurrentPageRows] = useState<any[]>([]);
  const [isLoadingCache, setIsLoadingCache] = useState(false);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const error = activeTab?.error;
  const executionStatus: QueryTab['executionStatus'] = activeTab?.executionStatus || 'idle';
  
  // Load metadata from cache when tab changes or when execution completes
  useEffect(() => {
    if (!activeTabId || !window.electronAPI?.resultsCache) {
      setResultsMetadata(null);
      setCurrentPageRows([]);
      return;
    }
    
    // If query is running, don't load from cache (wait for new results)
    if (executionStatus === 'running') {
      setResultsMetadata(null);
      setCurrentPageRows([]);
      return;
    }
    
    // Load metadata from cache
    setIsLoadingCache(true);
    window.electronAPI.resultsCache
      .getMetadata(activeTabId)
      .then((metadata) => {
        if (metadata) {
          setResultsMetadata(metadata);
          setIsLoadingCache(false);
        } else {
          setResultsMetadata(null);
          setCurrentPageRows([]);
          setIsLoadingCache(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load results metadata from cache:', err);
        setResultsMetadata(null);
        setCurrentPageRows([]);
        setIsLoadingCache(false);
      });
  }, [activeTabId, executionStatus]);
  
  // Load current page from cache when metadata or page changes
  useEffect(() => {
    if (!activeTabId || !resultsMetadata || !window.electronAPI?.resultsCache) {
      setCurrentPageRows([]);
      return;
    }
    
    setIsLoadingPage(true);
    window.electronAPI.resultsCache
      .getPage(activeTabId, currentPage)
      .then((pageRows) => {
        // DEBUG: Log when loading from cache
        if (pageRows && pageRows.length > 0) {
          console.log(`🔍 [CACHE] Loaded page ${currentPage} from cache, ${pageRows.length} rows`);
          const firstRow = pageRows[0];
          if (firstRow && firstRow.values) {
            console.log(`🔍 [CACHE] First row has ${firstRow.values.length} values`);
            console.log(`🔍 [CACHE] Columns:`, resultsMetadata?.columns?.map(c => `${c.name} (${c.type})`));
            firstRow.values.forEach((val: any, idx: number) => {
              const col = resultsMetadata?.columns?.[idx];
              console.log(`🔍 [CACHE] Value ${idx} (${col?.name || 'unknown'}, ${col?.type || 'unknown'}):`, val, `type: ${typeof val}`);
              
              // Check if column name suggests it's a date/time even if type is wrong
              const colNameLower = (col?.name || '').toLowerCase();
              const mightBeDate = col && (
                col.type === 'DATE' || col.type === 'TIME' || col.type === 'DATETIME' || col.type === 'TIMESTAMP' ||
                colNameLower.includes('date') || colNameLower.includes('time') || colNameLower.includes('timestamp')
              );
              
              if (mightBeDate) {
                console.log(`\n========== CACHE DATE/TIME DEBUG ==========`);
                console.log(`[CACHE] Column: ${col.name}, Type: ${col.type}`);
                console.log(`[CACHE] Value:`, val);
                console.log(`[CACHE] Value type: ${typeof val}`);
                if (typeof val === 'string' && val === '[object Object]') {
                  console.error(`❌ [CACHE] ERROR: Value is "[object Object]" string! This is the bug!`);
                }
                if (typeof val === 'object' && val !== null) {
                  console.log(`[CACHE] Object keys:`, Object.keys(val));
                  console.log(`[CACHE] Is Date?:`, val instanceof Date);
                  console.log(`[CACHE] String(val):`, String(val));
                }
                console.log('===========================================\n');
              }
            });
          }
        }
        if (pageRows) {
          setCurrentPageRows(pageRows);
        } else {
          setCurrentPageRows([]);
        }
        setIsLoadingPage(false);
      })
      .catch((err) => {
        console.error('Failed to load page from cache:', err);
        setCurrentPageRows([]);
        setIsLoadingPage(false);
      });
  }, [activeTabId, currentPage, resultsMetadata]);
  
  // Prefetch adjacent pages for smoother navigation
  useEffect(() => {
    if (!activeTabId || !resultsMetadata || !window.electronAPI?.resultsCache) {
      return;
    }
    
    const totalPages = Math.ceil(resultsMetadata.rowsReturned / ROWS_PER_PAGE);
    
    // Prefetch next page if available
    if (currentPage < totalPages) {
      window.electronAPI.resultsCache.getPage(activeTabId, currentPage + 1).catch(() => {
        // Silently fail prefetch
      });
    }
    
    // Prefetch previous page if available
    if (currentPage > 1) {
      window.electronAPI.resultsCache.getPage(activeTabId, currentPage - 1).catch(() => {
        // Silently fail prefetch
      });
    }
  }, [activeTabId, currentPage, resultsMetadata]);
  
  // Create a QueryResult-like object for compatibility with existing code
  const results: QueryResult | null = resultsMetadata
    ? {
        columns: resultsMetadata.columns,
        rows: currentPageRows,
        totalRows: resultsMetadata.totalRows,
        rowsReturned: resultsMetadata.rowsReturned,
        executionTimeMs: resultsMetadata.executionTimeMs,
        bytesProcessed: resultsMetadata.bytesProcessed,
        jobId: resultsMetadata.jobId,
        hasMore: resultsMetadata.hasMore,
      }
    : null;

  // Reset column widths when results change (use jobId as stable identifier)
  const resultsJobId = resultsMetadata?.jobId;
  const resultsColumnCount = resultsMetadata?.columns?.length;
  
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

  const formatValue = useCallback((value: any, columnType?: string, columnName?: string): string => {
    // Pass both type and name to formatter for better date detection
    return formatBigQueryValue(value, columnType, columnName);
  }, []);

  const formatCSVValue = useCallback((val: any, columnType?: string, columnName?: string): string => {
    const formatted = formatValue(val, columnType, columnName);
    // Escape commas, quotes, and newlines in values
    if (formatted.includes(',') || formatted.includes('"') || formatted.includes('\n')) {
      return `"${formatted.replace(/"/g, '""')}"`;
    }
    return formatted;
  }, [formatValue]);

  const handleCopyRowValues = useCallback(() => {
    if (!results || !contextMenu || contextMenu.rowIndex === undefined) return;

    // Current page rows are already loaded
    const rowIndex = contextMenu.rowIndex;
    const row = currentPageRows[rowIndex];
    
    if (!row) return;

    const headers = results.columns.map((col: any) => formatCSVValue(col.name));
    const values = row.values.map((val: any, idx: number) => {
      const col = results.columns[idx];
      return formatCSVValue(val, col?.type, col?.name);
    });

    // Format: header1,header2,header3\nvalue1,value2,value3
    const csvText = [headers.join(','), values.join(',')].join('\n');
    
    // Copy to clipboard
    navigator.clipboard.writeText(csvText).catch((err) => {
      console.error('Failed to copy to clipboard:', err);
    });
  }, [results, contextMenu, currentPageRows, formatCSVValue]);

  const handleCopyColumnValues = useCallback(() => {
    if (!results || !contextMenu || contextMenu.columnIndex === undefined) return;

    const columnIndex = contextMenu.columnIndex;
    const column = results.columns[columnIndex];
    
    if (!column) return;

    // Get header
    const header = formatCSVValue(column.name);
    
    // Get all values for this column in current page (already loaded)
    const values = currentPageRows.map(row => formatCSVValue(row.values[columnIndex], column.type, column.name));

    // Format: header\nvalue1\nvalue2\nvalue3...
    const csvText = [header, ...values].join('\n');
    
    // Copy to clipboard
    navigator.clipboard.writeText(csvText).catch((err) => {
      console.error('Failed to copy to clipboard:', err);
    });
  }, [results, contextMenu, currentPageRows, formatCSVValue]);

  const handleColumnContextMenu = useCallback((e: React.MouseEvent, columnIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      columnIndex,
    });
  }, []);

  // Pagination calculations - use metadata for total rows, current page rows are already loaded
  const totalRows = resultsMetadata?.rowsReturned || 0;
  const totalPages = Math.ceil(totalRows / ROWS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const endIndex = Math.min(startIndex + currentPageRows.length, totalRows);

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

  if (!resultsMetadata) {
    // Show "Executing query..." when status is running, otherwise show default message
    const message = executionStatus === 'running' 
      ? 'Executing query...' 
      : isLoadingCache
      ? 'Loading results...'
      : 'Execute a query to see results here.';
    
    return (
      <div className="query-results">
        <div className="no-results">
          <div>{message}</div>
          {(executionStatus === 'running' || isLoadingCache) && (
            <div className="query-spinner-container">
              <div className="query-spinner"></div>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Show loading indicator while page is loading
  if (isLoadingPage && currentPageRows.length === 0) {
    return (
      <div className="query-results">
        <div className="no-results">
          <div>Loading page {currentPage}...</div>
          <div className="query-spinner-container">
            <div className="query-spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  // Check if we have columns and rows to display
  const hasColumns = resultsMetadata.columns && resultsMetadata.columns.length > 0;
  const hasRows = currentPageRows && currentPageRows.length > 0;

  if (!hasColumns && !hasRows) {
    return (
      <div className="query-results">
        <div className="results-header">
          <div className="results-info">
            <span>{resultsMetadata.rowsReturned.toLocaleString()} rows</span>
            {resultsMetadata.totalRows > resultsMetadata.rowsReturned && (
              <span> of {resultsMetadata.totalRows.toLocaleString()} total</span>
            )}
            <span> • {resultsMetadata.executionTimeMs}ms</span>
            {resultsMetadata.bytesProcessed && (
              <span> • {(resultsMetadata.bytesProcessed / 1024 / 1024).toFixed(2)} MB processed</span>
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
            <span>{resultsMetadata.rowsReturned.toLocaleString()} rows</span>
            {resultsMetadata.totalRows > resultsMetadata.rowsReturned && (
              <span> of {resultsMetadata.totalRows.toLocaleString()} total</span>
            )}
            <span> • {resultsMetadata.executionTimeMs}ms</span>
            {resultsMetadata.bytesProcessed && (
              <span> • {(resultsMetadata.bytesProcessed / 1024 / 1024).toFixed(2)} MB processed</span>
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
          <span>{resultsMetadata.rowsReturned.toLocaleString()} rows</span>
          {resultsMetadata.totalRows > resultsMetadata.rowsReturned && (
            <span> of {resultsMetadata.totalRows.toLocaleString()} total</span>
          )}
          <span> • {resultsMetadata.executionTimeMs}ms</span>
          {resultsMetadata.bytesProcessed && (
            <span> • {(resultsMetadata.bytesProcessed / 1024 / 1024).toFixed(2)} MB processed</span>
          )}
        </div>
      </div>
      <div className="results-table-container">
        {hasRows && results ? (
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

