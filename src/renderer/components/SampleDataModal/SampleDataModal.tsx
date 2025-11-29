import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useBigQuery } from '../../hooks/useBigQuery';
import { CanvasTable } from '../QueryResults/CanvasTable';
import type { QueryResult } from '../../../shared/types/query';
import { formatBigQueryValue } from '../../utils/bigquery-formatter';
import './SampleDataModal.css';

interface SampleDataModalProps {
  projectId: string;
  datasetId: string;
  tableId: string;
  onClose: () => void;
}

const ROWS_PER_PAGE = 200;

export const SampleDataModal: React.FC<SampleDataModalProps> = ({
  projectId,
  datasetId,
  tableId,
  onClose,
}) => {
  const { executeQuery, isConnected } = useBigQuery();
  const [results, setResults] = useState<QueryResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [columnWidths, setColumnWidths] = useState<{ [key: number]: number }>({});
  const [sortColumn, setSortColumn] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);

  useEffect(() => {
    const loadSampleData = async () => {
      if (!isConnected) {
        setError('Not connected to BigQuery');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const tableRef = `\`${projectId}.${datasetId}.${tableId}\``;
        const queryText = `SELECT * FROM ${tableRef} LIMIT 1000`;
        const result = await executeQuery(queryText);
        setResults(result);
      } catch (err: any) {
        setError(err.message || 'Failed to load sample data');
        console.error('Failed to load sample data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSampleData();
  }, [projectId, datasetId, tableId, executeQuery, isConnected]);

  const handleColumnResize = useCallback((columnIndex: number, width: number) => {
    setColumnWidths((prev) => ({
      ...prev,
      [columnIndex]: width,
    }));
  }, []);

  const handleRowContextMenu = useCallback((e: React.MouseEvent, _rowIndex: number) => {
    // No-op for sample data modal - could be extended in the future
    e.preventDefault();
  }, []);

  const handleColumnContextMenu = useCallback((e: React.MouseEvent, _columnIndex: number) => {
    // No-op for sample data modal - could be extended in the future
    e.preventDefault();
  }, []);

  const handleSortColumn = useCallback((columnIndex: number, direction: 'asc' | 'desc') => {
    setSortColumn(columnIndex);
    setSortDirection(direction);
  }, []);

  const formatValue = useCallback((value: any, columnType?: string, columnName?: string): string => {
    return formatBigQueryValue(value, columnType, columnName);
  }, []);

  // Sort rows based on selected column and direction
  const sortedRows = useMemo(() => {
    if (!results?.rows || sortColumn === null || sortDirection === null) {
      return results?.rows || [];
    }

    const sorted = [...results.rows].sort((a, b) => {
      const aValue = a.values[sortColumn];
      const bValue = b.values[sortColumn];
      const column = results.columns[sortColumn];
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
  }, [results?.rows, results?.columns, sortColumn, sortDirection]);

  // Pagination calculations
  const totalRows = sortedRows.length;
  const totalPages = Math.ceil(totalRows / ROWS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const endIndex = Math.min(startIndex + ROWS_PER_PAGE, totalRows);
  const paginatedRows = sortedRows.slice(startIndex, endIndex);

  // Create a QueryResult-like object for the CanvasTable with paginated rows
  const paginatedResults: QueryResult | null = results
    ? {
        ...results,
        rows: paginatedRows,
      }
    : null;

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

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div className="sample-data-modal-overlay" onClick={onClose}>
      <div className="sample-data-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sample-data-modal-header">
          <h2>Sample Data: {datasetId}.{tableId}</h2>
          <button className="sample-data-modal-close" onClick={onClose} title="Close">
            ×
          </button>
        </div>
        
        <div className="sample-data-modal-content">
          {isLoading && (
            <div className="sample-data-loading">
              <div className="loading-progress-bar">
                <div className="loading-progress-bar-fill"></div>
              </div>
              <div className="loading-text">Loading sample data...</div>
            </div>
          )}
          
          {error && (
            <div className="sample-data-error">
              <strong>Error:</strong> {error}
            </div>
          )}
          
          {!isLoading && !error && results && (
            <>
              <div className="sample-data-info">
                <span>{results.rowsReturned.toLocaleString()} rows</span>
                {results.totalRows > results.rowsReturned && (
                  <span> of {results.totalRows.toLocaleString()} total</span>
                )}
                <span> • {results.executionTimeMs}ms</span>
                {results.bytesProcessed && (
                  <span> • {(results.bytesProcessed / 1024 / 1024).toFixed(2)} MB processed</span>
                )}
              </div>
              
              {paginatedResults && paginatedResults.rows.length > 0 ? (
                <>
                  <div className="sample-data-canvas-container">
                    <CanvasTable
                      results={paginatedResults}
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
                    />
                  </div>
                  
                  {totalPages > 1 && (
                    <div className="sample-data-pagination">
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
                </>
              ) : (
                <div className="sample-data-empty">No data available</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

