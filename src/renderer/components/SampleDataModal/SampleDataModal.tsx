import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useBigQuery } from '../../hooks/useBigQuery';
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
  const [resizingColumn, setResizingColumn] = useState<number | null>(null);
  const resizeStartXRef = useRef(0);
  const resizeStartWidthRef = useRef(0);
  const tableRef = useRef<HTMLTableElement>(null);
  const columnWidthsRef = useRef(columnWidths);

  useEffect(() => {
    columnWidthsRef.current = columnWidths;
  }, [columnWidths]);

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

  const handleMouseDown = useCallback((e: React.MouseEvent, columnIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    let currentWidth: number;
    const storedWidth = columnWidthsRef.current[columnIndex];
    
    if (storedWidth) {
      currentWidth = storedWidth;
    } else {
      const th = tableRef.current?.querySelector(`th:nth-child(${columnIndex + 1})`) as HTMLElement;
      currentWidth = th?.offsetWidth || 100;
    }
    
    resizeStartXRef.current = e.clientX;
    resizeStartWidthRef.current = currentWidth;
    setResizingColumn(columnIndex);
  }, []);

  useEffect(() => {
    if (resizingColumn === null) return;

    const columnIndex = resizingColumn;
    const startX = resizeStartXRef.current;
    const startWidth = resizeStartWidthRef.current;
    
    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const diff = e.clientX - startX;
      const newWidth = Math.max(50, startWidth + diff);
      
      setColumnWidths((prev) => ({
        ...prev,
        [columnIndex]: newWidth,
      }));
    };

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      setResizingColumn(null);
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: false });
    document.addEventListener('mouseup', handleMouseUp, { passive: false });
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [resizingColumn]);

  const getColumnWidth = (columnIndex: number): number | undefined => {
    return columnWidths[columnIndex];
  };

  const formatValue = useCallback((value: any, columnType?: string, columnName?: string): string => {
    return formatBigQueryValue(value, columnType, columnName);
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
              
              {results.rows && results.rows.length > 0 ? (
                <>
                  <div className="sample-data-table-container">
                    <table className="sample-data-table" ref={tableRef}>
                      <thead>
                        <tr>
                          {results.columns.map((col, idx) => {
                            const width = getColumnWidth(idx);
                            return (
                              <th
                                key={idx}
                                style={{ width: width ? `${width}px` : undefined }}
                                title={`${col.type}${col.mode ? ` (${col.mode})` : ''}`}
                              >
                                <div className="th-content">
                                  {col.name}
                                  <div
                                    className="resize-handle"
                                    onMouseDown={(e) => handleMouseDown(e, idx)}
                                  />
                                </div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedRows.map((row, rowIdx) => (
                          <tr key={startIndex + rowIdx}>
                            {row.values.map((value, colIdx) => {
                              const width = getColumnWidth(colIdx);
                              const column = results.columns[colIdx];
                              return (
                                <td
                                  key={colIdx}
                                  style={{ width: width ? `${width}px` : undefined }}
                                >
                                  {formatValue(value, column?.type, column?.name)}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
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

