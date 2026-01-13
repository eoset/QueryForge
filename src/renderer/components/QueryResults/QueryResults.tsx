import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useTabsStore } from '../../stores/tabs-store';
import { RowContextMenu } from './RowContextMenu';
import { ExportMenu, type ExportFormat } from './ExportMenu';
import { CanvasTable } from './CanvasTable';
import { ResultsSearch } from './ResultsSearch';
import type { QueryTab, QueryResult, ColumnMetadata, Row, ExecutionStatus } from '../../../shared/types/query';
import { formatBigQueryValue } from '../../utils/bigquery-formatter';
import { resultsToCSV, resultsToJSON } from '../../utils/export-utils';
import './QueryResults.css';
import './ExportMenu.css';
import './ResultsSearch.css';

const ROWS_PER_PAGE = 200;

interface QueryResultsProps {
  tabId?: string; // If provided, override the active tab
}

export const QueryResults: React.FC<QueryResultsProps> = ({ tabId: propTabId }) => {
  // Use separate selectors to ensure reactivity for each property
  const activeTabId = useTabsStore((state) => propTabId || state.activeTabId);
  const activeTab = useTabsStore((state) => {
    const targetId = propTabId || state.activeTabId;
    if (!targetId) return null;
    return state.tabs.find((t) => t.id === targetId) || null;
  });
  
  // Get error, execution status, and jobId from the tab
  const error = activeTab?.error;
  const executionStatus: ExecutionStatus = activeTab?.executionStatus || 'idle';
  const jobId = activeTab?.jobId;
  
  // Cache key uses tab ID
  const cacheKey = activeTabId;
  
  // All hooks must be called before any conditional returns
  const [columnWidths, setColumnWidths] = useState<{ [key: number]: number }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    rowIndex?: number;
    columnIndex?: number;
    isRowNumberColumn?: boolean;
  } | null>(null);
  const [exportMenu, setExportMenu] = useState<{ x: number; y: number } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [sortColumn, setSortColumn] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchColumn, setSearchColumn] = useState<number | null>(null);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  
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
  const [isBackgroundFetching, setIsBackgroundFetching] = useState(false);
  
  // Listen for progress events during query execution AND background fetching
  useEffect(() => {
    if (!window.electronAPI?.bigquery?.onProgress) return;
    
    const unsubscribe = window.electronAPI.bigquery.onProgress((data) => {
      // Show progress during initial execution or background page fetching
      if (data.jobId === jobId) {
        setProgressMessage(data.message);
        setIsBackgroundFetching(!data.isComplete);
      }
    });
    
    return unsubscribe;
  }, [jobId]);
  
  // Clear progress when execution status changes to idle or error
  useEffect(() => {
    if (executionStatus === 'idle' || executionStatus === 'error') {
      setProgressMessage(null);
      setIsBackgroundFetching(false);
    }
  }, [executionStatus]);
  
  // Listen for rows updates (background fetching of additional pages)
  // Data is saved directly to SQLite by the main process - we just reload from cache
  useEffect(() => {
    if (!window.electronAPI?.bigquery?.onRowsUpdate || !cacheKey) return;
    
    const unsubscribe = window.electronAPI.bigquery.onRowsUpdate(async (data) => {
      // Only process updates for the current job
      if (data.jobId !== jobId) return;
      
      // Data is already in SQLite cache - just reload metadata and current page
      if (window.electronAPI?.resultsCache) {
        // Reload metadata to reflect final row count
        const metadata = await window.electronAPI.resultsCache.getMetadata(cacheKey);
        if (metadata) {
          setResultsMetadata(metadata);
        }
        
        // Reload current page to ensure we have latest data
        const pageRows = await window.electronAPI.resultsCache.getPage(cacheKey, currentPage);
        if (pageRows) {
          setCurrentPageRows(pageRows);
        }
        
        // Clear loading indicators
        setProgressMessage(null);
        setIsBackgroundFetching(false);
      }
    });
    
    return unsubscribe;
  }, [cacheKey, jobId, currentPage]);
  
  // Load metadata from cache when tab changes or when execution completes
  useEffect(() => {
    if (!cacheKey || !window.electronAPI?.resultsCache) {
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
      .getMetadata(cacheKey)
      .then((metadata: {
        columns: ColumnMetadata[];
        totalRows: number;
        rowsReturned: number;
        executionTimeMs: number;
        bytesProcessed?: number;
        jobId: string;
        hasMore: boolean;
      } | null) => {
        if (metadata) {
          setResultsMetadata(metadata);
          setIsLoadingCache(false);
        } else {
          setResultsMetadata(null);
          setCurrentPageRows([]);
          setIsLoadingCache(false);
        }
      })
      .catch((err: unknown) => {
        console.error('Failed to load results metadata from cache:', err);
        setResultsMetadata(null);
        setCurrentPageRows([]);
        setIsLoadingCache(false);
      });
  }, [cacheKey, executionStatus]);
  
  // Load current page from cache when metadata or page changes
  useEffect(() => {
    if (!cacheKey || !resultsMetadata || !window.electronAPI?.resultsCache) {
      setCurrentPageRows([]);
      return;
    }
    
    setIsLoadingPage(true);
    window.electronAPI.resultsCache
      .getPage(cacheKey, currentPage)
      .then((pageRows: Row[] | null) => {
        if (pageRows) {
          setCurrentPageRows(pageRows);
        } else {
          setCurrentPageRows([]);
        }
        setIsLoadingPage(false);
      })
      .catch((err: unknown) => {
        console.error('Failed to load page from cache:', err);
        setCurrentPageRows([]);
        setIsLoadingPage(false);
      });
  }, [cacheKey, currentPage, resultsMetadata]);
  
  // Prefetch adjacent pages for smoother navigation
  useEffect(() => {
    if (!cacheKey || !resultsMetadata || !window.electronAPI?.resultsCache) {
      return;
    }
    
    const totalPages = Math.ceil(resultsMetadata.rowsReturned / ROWS_PER_PAGE);
    
    // Prefetch next page if available
    if (currentPage < totalPages) {
      window.electronAPI.resultsCache.getPage(cacheKey, currentPage + 1).catch(() => {
        // Silently fail prefetch
      });
    }
    
    // Prefetch previous page if available
    if (currentPage > 1) {
      window.electronAPI.resultsCache.getPage(cacheKey, currentPage - 1).catch(() => {
        // Silently fail prefetch
      });
    }
  }, [cacheKey, currentPage, resultsMetadata]);
  
  // Reset column widths when results change (use jobId as stable identifier)
  const resultsJobId = resultsMetadata?.jobId;
  const resultsColumnCount = resultsMetadata?.columns?.length;
  
  useEffect(() => {
    if (resultsJobId !== undefined) {
      setColumnWidths({});
      setCurrentPage(1); // Reset to first page when results change
      setSortColumn(null); // Reset sorting when results change
      setSortDirection(null);
      setSearchTerm(''); // Reset search when results change
      setSearchColumn(null);
      setCurrentMatchIndex(0);
    }
  }, [resultsJobId, activeTab?.id, resultsColumnCount]);

  // Sort rows based on selected column and direction
  const sortedRows = React.useMemo(() => {
    if (sortColumn === null || sortDirection === null || !currentPageRows.length) {
      return currentPageRows;
    }

    const sorted = [...currentPageRows].sort((a, b) => {
      const aValue = a.values[sortColumn];
      const bValue = b.values[sortColumn];
      const column = resultsMetadata?.columns[sortColumn];
      const columnType = (column?.type || '').toUpperCase();

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) {
        return bValue === null || bValue === undefined ? 0 : 1;
      }
      if (bValue === null || bValue === undefined) {
        return -1;
      }

      let comparison = 0;

      // Compare based on column type
      if (columnType === 'INTEGER' || columnType === 'INT' || columnType.includes('INT')) {
        comparison = Number(aValue) - Number(bValue);
      } else if (columnType === 'FLOAT' || columnType === 'NUMERIC' || columnType === 'BIGNUMERIC') {
        comparison = Number(aValue) - Number(bValue);
      } else if (columnType === 'BOOLEAN' || columnType === 'BOOL') {
        comparison = (aValue ? 1 : 0) - (bValue ? 1 : 0);
      } else if (columnType === 'DATE' || columnType === 'DATETIME' || columnType === 'TIMESTAMP') {
        const aDate = new Date(aValue).getTime();
        const bDate = new Date(bValue).getTime();
        comparison = aDate - bDate;
      } else {
        // String comparison (case-insensitive)
        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();
        comparison = aStr.localeCompare(bStr);
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [currentPageRows, sortColumn, sortDirection, resultsMetadata?.columns]);

  // Search matching logic - find cells that match the search term (including column headers)
  const searchMatches = useMemo(() => {
    if (!searchTerm || !resultsMetadata?.columns) {
      return [];
    }

    const matches: Array<{ rowIndex: number; columnIndex: number }> = [];
    const searchLower = searchTerm.toLowerCase();

    // Search column headers first (rowIndex = -1 represents headers)
    resultsMetadata.columns.forEach((column, colIdx) => {
      // If a specific column is selected, only search that column
      if (searchColumn !== null && searchColumn !== colIdx) {
        return;
      }

      if (column.name.toLowerCase().includes(searchLower)) {
        matches.push({ rowIndex: -1, columnIndex: colIdx });
      }
    });

    // Search data rows
    sortedRows.forEach((row, rowIdx) => {
      row.values.forEach((value: unknown, colIdx: number) => {
        // If a specific column is selected, only search that column
        if (searchColumn !== null && searchColumn !== colIdx) {
          return;
        }

        const column = resultsMetadata.columns[colIdx];
        const formattedValue = formatBigQueryValue(value, column?.type, column?.name);
        
        if (formattedValue.toLowerCase().includes(searchLower)) {
          matches.push({ rowIndex: rowIdx, columnIndex: colIdx });
        }
      });
    });

    return matches;
  }, [searchTerm, searchColumn, sortedRows, resultsMetadata?.columns]);

  // Handle search changes
  const handleSearch = useCallback((term: string, columnIndex: number | null) => {
    setSearchTerm(term);
    setSearchColumn(columnIndex);
    setCurrentMatchIndex(0);
  }, []);

  // Navigate to next/previous match
  const handleNavigateMatch = useCallback((direction: 'prev' | 'next') => {
    if (searchMatches.length === 0) return;

    setCurrentMatchIndex((prev) => {
      if (direction === 'next') {
        return (prev + 1) % searchMatches.length;
      } else {
        return prev === 0 ? searchMatches.length - 1 : prev - 1;
      }
    });
  }, [searchMatches.length]);

  // Get current match for highlighting
  const currentMatch = searchMatches.length > 0 ? searchMatches[currentMatchIndex] : null;

  // Create a QueryResult-like object for compatibility with existing code
  const results: QueryResult | null = resultsMetadata
    ? {
        columns: resultsMetadata.columns,
        rows: sortedRows, // Use sorted rows instead of currentPageRows
        totalRows: resultsMetadata.totalRows,
        rowsReturned: resultsMetadata.rowsReturned,
        executionTimeMs: resultsMetadata.executionTimeMs,
        bytesProcessed: resultsMetadata.bytesProcessed,
        jobId: resultsMetadata.jobId,
        hasMore: resultsMetadata.hasMore,
      }
    : null;

  const handleColumnResize = useCallback((columnIndex: number, width: number) => {
    setColumnWidths((prev) => ({
      ...prev,
      [columnIndex]: width,
    }));
  }, []);

  const handleRowContextMenu = useCallback((e: React.MouseEvent, rowIndex: number, isRowNumberColumn?: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      rowIndex,
      isRowNumberColumn,
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

    // Use sorted rows from results (which matches what's displayed)
    const rowIndex = contextMenu.rowIndex;
    const row = results.rows[rowIndex];
    
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
  }, [results, contextMenu, formatCSVValue]);

  const handleCopyColumnValues = useCallback(() => {
    if (!results || !contextMenu || contextMenu.columnIndex === undefined) return;

    const columnIndex = contextMenu.columnIndex;
    const column = results.columns[columnIndex];
    
    if (!column) return;

    // Get header
    const header = formatCSVValue(column.name);
    
    // Get all values for this column from sorted rows (matches what's displayed)
    const values = results.rows.map(row => formatCSVValue(row.values[columnIndex], column.type, column.name));

    // Format: header\nvalue1\nvalue2\nvalue3...
    const csvText = [header, ...values].join('\n');
    
    // Copy to clipboard
    navigator.clipboard.writeText(csvText).catch((err) => {
      console.error('Failed to copy to clipboard:', err);
    });
  }, [results, contextMenu, formatCSVValue]);

  const handleColumnContextMenu = useCallback((e: React.MouseEvent, columnIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      columnIndex,
    });
  }, []);

  const handleSortColumn = useCallback((columnIndex: number, direction: 'asc' | 'desc') => {
    setSortColumn(columnIndex);
    setSortDirection(direction);
  }, []);

  // Export button click handler
  const handleExportClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setExportMenu({
      x: rect.left,
      y: rect.bottom + 4,
    });
  }, []);

  // Handle export action - fetches all rows from cache
  const handleExport = useCallback(async (format: ExportFormat) => {
    if (!cacheKey || !resultsMetadata || isExporting) return;

    setIsExporting(true);
    setExportMenu(null);

    try {
      // Fetch all rows from cache for export
      const allResults = await window.electronAPI?.resultsCache?.get(cacheKey);
      
      if (!allResults) {
        console.error('Failed to fetch results for export');
        return;
      }

      const columns = allResults.columns;
      const rows = allResults.rows;

      if (format === 'csv') {
        const csvContent = resultsToCSV(columns, rows);
        const result = await window.electronAPI.export.saveFile(csvContent, {
          format: 'csv',
          defaultFilename: `query-results-${new Date().toISOString().slice(0, 10)}`,
        });
        if (result.error) {
          console.error('Export failed:', result.error);
        }
      } else if (format === 'json') {
        const jsonContent = resultsToJSON(columns, rows);
        const result = await window.electronAPI.export.saveFile(jsonContent, {
          format: 'json',
          defaultFilename: `query-results-${new Date().toISOString().slice(0, 10)}`,
        });
        if (result.error) {
          console.error('Export failed:', result.error);
        }
      } else if (format === 'clipboard-csv') {
        const csvContent = resultsToCSV(columns, rows);
        await navigator.clipboard.writeText(csvContent);
      } else if (format === 'clipboard-json') {
        const jsonContent = resultsToJSON(columns, rows);
        await navigator.clipboard.writeText(jsonContent);
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  }, [cacheKey, resultsMetadata, isExporting]);

  // Pagination calculations - use metadata for total rows, current page rows are already loaded
  const totalRows = resultsMetadata?.rowsReturned || 0;
  const totalPages = Math.ceil(totalRows / ROWS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const endIndex = Math.min(startIndex + currentPageRows.length, totalRows);

  const handleFirstPage = () => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

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

  const handleLastPage = () => {
    if (currentPage !== totalPages) {
      setCurrentPage(totalPages);
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
    // Show progress message if available, otherwise show default messages
    const message = executionStatus === 'running' 
      ? (progressMessage || 'Executing query...')
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

  // Determine how to display row count
  // - If totalRows === rowsReturned, we have all rows (or hit our limit exactly)
  // - If totalRows > rowsReturned, show "X of Y rows" to indicate we're limited
  // - hasMore indicates if there are more rows beyond our limit
  const displayRowCount = () => {
    if (resultsMetadata.totalRows > resultsMetadata.rowsReturned) {
      // We hit the limit - show how many we have of the total
      return `${resultsMetadata.rowsReturned.toLocaleString()} of ${resultsMetadata.totalRows.toLocaleString()} rows`;
    } else if (resultsMetadata.hasMore) {
      // Still loading more rows
      return `${resultsMetadata.totalRows.toLocaleString()} rows`;
    } else {
      // We have all rows
      return `${resultsMetadata.totalRows.toLocaleString()} rows`;
    }
  };

  if (!hasColumns && !hasRows) {
    return (
      <div className="query-results">
        <div className="results-header">
          <div className="results-info">
            <span>{displayRowCount()}</span>
            <span> • {resultsMetadata.executionTimeMs}ms</span>
            {resultsMetadata.bytesProcessed && (
              <span> • {(resultsMetadata.bytesProcessed / 1024 / 1024).toFixed(2)} MB processed</span>
            )}
            {progressMessage && (
              <span className="loading-indicator"> • {progressMessage}</span>
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
            <span>{displayRowCount()}</span>
            <span> • {resultsMetadata.executionTimeMs}ms</span>
            {resultsMetadata.bytesProcessed && (
              <span> • {(resultsMetadata.bytesProcessed / 1024 / 1024).toFixed(2)} MB processed</span>
            )}
            {progressMessage && (
              <span className="loading-indicator"> • {progressMessage}</span>
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
          <span>{displayRowCount()}</span>
          <span> • {resultsMetadata.executionTimeMs}ms</span>
          {resultsMetadata.bytesProcessed && (
            <span> • {(resultsMetadata.bytesProcessed / 1024 / 1024).toFixed(2)} MB processed</span>
          )}
          {progressMessage && (
            <span className="loading-indicator"> • {progressMessage}</span>
          )}
        </div>
        <div className="results-header-actions">
          <ResultsSearch
            columns={resultsMetadata.columns}
            onSearch={handleSearch}
            matchCount={searchMatches.length}
            currentMatchIndex={currentMatchIndex}
            onNavigateMatch={handleNavigateMatch}
            disabled={!hasRows}
          />
          <button
            className="export-button"
            onClick={handleExportClick}
            disabled={isExporting || !hasRows}
            title="Export results"
          >
            <span className="export-button-icon">⬇</span>
            <span className="export-button-text">Export</span>
          </button>
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
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSortColumn={handleSortColumn}
            searchTerm={searchTerm}
            searchMatches={searchMatches}
            currentMatch={currentMatch}
          />
        ) : (
          <div className="no-rows-message">No rows returned</div>
        )}
      </div>
      {hasRows && totalPages > 1 && (
        <div className="results-pagination">
          <button
            className="pagination-button"
            onClick={handleFirstPage}
            disabled={currentPage === 1}
            title="First page"
          >
            ‹‹
          </button>
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
          <button
            className="pagination-button"
            onClick={handleLastPage}
            disabled={currentPage === totalPages}
            title="Last page"
          >
            ››
          </button>
        </div>
      )}
      {contextMenu && (
        <RowContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onCopyValues={contextMenu.columnIndex !== undefined ? handleCopyColumnValues : handleCopyRowValues}
          menuLabel={
            contextMenu.columnIndex !== undefined 
              ? 'Copy column values (with header)' 
              : contextMenu.isRowNumberColumn 
                ? 'Copy row as CSV' 
                : 'Copy values (with headers)'
          }
        />
      )}
      {exportMenu && (
        <ExportMenu
          x={exportMenu.x}
          y={exportMenu.y}
          onClose={() => setExportMenu(null)}
          onExport={handleExport}
          isExporting={isExporting}
        />
      )}
    </div>
  );
};

