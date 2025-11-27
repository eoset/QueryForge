import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import type { QueryResult, ColumnMetadata } from '../../../shared/types/query';

interface CanvasTableProps {
  results: QueryResult;
  columnWidths: { [key: number]: number };
  onColumnResize: (columnIndex: number, width: number) => void;
  onRowContextMenu: (e: React.MouseEvent, rowIndex: number) => void;
  onColumnContextMenu: (e: React.MouseEvent, columnIndex: number) => void;
  formatValue: (value: any, columnType?: string) => string;
  currentPage: number;
  rowsPerPage: number;
}

const ROW_HEIGHT = 24;
const HEADER_HEIGHT = 28;
const ROW_NUMBER_COLUMN_WIDTH = 80;
const MIN_COLUMN_WIDTH = 50;
const CELL_PADDING = 8;
const RESIZE_HANDLE_WIDTH = 4;

export const CanvasTable: React.FC<CanvasTableProps> = ({
  results,
  columnWidths,
  onColumnResize,
  onRowContextMenu,
  onColumnContextMenu,
  formatValue,
  currentPage,
  rowsPerPage,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasOverlayRef = useRef<HTMLDivElement>(null);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [hoveredColumn, setHoveredColumn] = useState<number | null>(null);
  const [resizingColumn, setResizingColumn] = useState<number | null>(null);
  const resizeStartXRef = useRef(0);
  const resizeStartWidthRef = useRef(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  
  // Text selection state
  const [selectionStart, setSelectionStart] = useState<{ row: number; col: number; x: number; y: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ row: number; col: number; x: number; y: number } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const selectionOverlayRef = useRef<HTMLDivElement>(null);

  // Calculate pagination
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedRows = useMemo(() => {
    return results.rows?.slice(startIndex, startIndex + rowsPerPage) || [];
  }, [results.rows, startIndex, rowsPerPage]);

  // Calculate column widths
  const getColumnWidth = useCallback(
    (columnIndex: number): number => {
      if (columnIndex === -1) {
        return columnWidths[-1] || ROW_NUMBER_COLUMN_WIDTH;
      }
      return columnWidths[columnIndex] || 150;
    },
    [columnWidths]
  );

  // Calculate total width - ensure it's at least as wide as viewport to enable scrolling
  const totalWidth = useMemo(() => {
    let width = getColumnWidth(-1);
    results.columns.forEach((_, idx) => {
      width += getColumnWidth(idx);
    });
    // Ensure minimum width to enable horizontal scrolling when content is wide
    return Math.max(width, 100);
  }, [results.columns, getColumnWidth]);

  const totalHeight = HEADER_HEIGHT + paginatedRows.length * ROW_HEIGHT;

  // Track container dimensions to determine if scrolling is needed
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });

  // Update container dimensions when it changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateDimensions = () => {
      setContainerDimensions({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    };

    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  // Measure text width
  const measureText = useCallback((text: string, ctx: CanvasRenderingContext2D): number => {
    return ctx.measureText(text).width;
  }, []);

  // Convert viewport coordinates to cell position
  const getCellFromCoordinates = useCallback(
    (x: number, y: number): { row: number; col: number } | null => {
      // Don't allow selection in header
      if (y < HEADER_HEIGHT) return null;
      
      const row = Math.floor((y - HEADER_HEIGHT) / ROW_HEIGHT);
      if (row < 0 || row >= paginatedRows.length) return null;

      // Find column
      let currentX = 0;
      
      // Check row number column
      const rowNumWidth = getColumnWidth(-1);
      if (x >= currentX && x < currentX + rowNumWidth) {
        return { row, col: -1 };
      }
      currentX += rowNumWidth;

      // Check data columns
      for (let idx = 0; idx < results.columns.length; idx++) {
        const colWidth = getColumnWidth(idx);
        if (x >= currentX && x < currentX + colWidth) {
          return { row, col: idx };
        }
        currentX += colWidth;
      }

      return null;
    },
    [paginatedRows.length, getColumnWidth, results.columns]
  );

  // Draw cell text with ellipsis
  const drawCellText = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      text: string,
      x: number,
      y: number,
      width: number,
      color: string = '#cccccc'
    ) => {
      ctx.fillStyle = color;
      ctx.font = '0.75rem -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const textWidth = measureText(text, ctx);
      
      if (textWidth <= width - CELL_PADDING * 2) {
        ctx.fillText(text, x + CELL_PADDING, y + ROW_HEIGHT / 2 + 4);
      } else {
        // Truncate with ellipsis
        let truncated = text;
        let truncatedWidth = textWidth;
        const ellipsis = '...';
        const ellipsisWidth = measureText(ellipsis, ctx);
        
        while (truncatedWidth + ellipsisWidth > width - CELL_PADDING * 2 && truncated.length > 0) {
          truncated = truncated.slice(0, -1);
          truncatedWidth = measureText(truncated, ctx);
        }
        
        ctx.fillText(truncated + ellipsis, x + CELL_PADDING, y + ROW_HEIGHT / 2 + 4);
      }
    },
    [measureText]
  );

  // Render the canvas
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const container = containerRef.current;
    const wrapper = wrapperRef.current;
    if (!container || !wrapper) return;

    // Get viewport size from the scrolling container (accounts for scrollbars)
    // Use clientWidth/clientHeight which excludes scrollbar width
    const containerWidth = Math.max(1, container.clientWidth);
    const containerHeight = Math.max(1, container.clientHeight);
    
    // Early return if dimensions are invalid
    if (containerWidth <= 0 || containerHeight <= 0) {
      return;
    }

    // Always set canvas size to match viewport exactly
    const dpr = window.devicePixelRatio || 1;
    const canvasWidth = Math.ceil(containerWidth * dpr);
    const canvasHeight = Math.ceil(containerHeight * dpr);
    
    // Set canvas internal resolution and display size
    // Only update if size actually changed to avoid unnecessary redraws
    if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
    }
    canvas.style.width = `${containerWidth}px`;
    canvas.style.height = `${containerHeight}px`;
    
    // Update canvas overlay size to match canvas (excludes scrollbar area)
    const canvasOverlay = canvasOverlayRef.current;
    if (canvasOverlay) {
      canvasOverlay.style.width = `${containerWidth}px`;
      canvasOverlay.style.height = `${containerHeight}px`;
    }
    
    // Update selection overlay size to match container
    const selectionOverlay = selectionOverlayRef.current;
    if (selectionOverlay) {
      selectionOverlay.style.width = `${containerWidth}px`;
      selectionOverlay.style.height = `${containerHeight}px`;
    }
    
    // Reset transform and scale for high DPI
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    // Clear canvas and fill with background color
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, containerWidth, containerHeight);

    // Colors
    const bgColor = '#1e1e1e';
    const headerBgColor = '#252526';
    const borderColor = '#3e3e42';
    const textColor = '#cccccc';
    const headerTextColor = '#cccccc';
    const hoverColor = '#2a2d2e';
    const evenRowColor = '#252526';
    const oddRowColor = '#1e1e1e';

    // Calculate visible area - account for header height
    // Only rows that would be visible below the header should be considered
    const scrollableAreaHeight = containerHeight - HEADER_HEIGHT;
    const visibleStartRow = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT));
    const visibleEndRow = Math.min(
      visibleStartRow + Math.ceil(scrollableAreaHeight / ROW_HEIGHT) + 1,
      paginatedRows.length
    );

    // Calculate column positions (relative to scroll position)
    let currentX = 0;
    const columnPositions: { [key: number]: number } = {};
    
    // Row number column
    columnPositions[-1] = currentX - scrollLeft;
    currentX += getColumnWidth(-1);

    results.columns.forEach((_, idx) => {
      columnPositions[idx] = currentX - scrollLeft;
      currentX += getColumnWidth(idx);
    });

    // Draw rows first - ensure they never draw above the header
    for (let rowIdx = visibleStartRow; rowIdx < visibleEndRow; rowIdx++) {
      const row = paginatedRows[rowIdx];
      if (!row) continue;

      // Calculate row Y position relative to the canvas
      const rowY = HEADER_HEIGHT + rowIdx * ROW_HEIGHT - scrollTop;
      const actualRowNumber = startIndex + rowIdx + 1;
      
      // Skip rows that would be drawn above or overlapping the header
      if (rowY < HEADER_HEIGHT) continue;

      // Row background
      const isEven = rowIdx % 2 === 0;
      const isHovered = hoveredRow === rowIdx;
      ctx.fillStyle = isHovered ? hoverColor : isEven ? evenRowColor : oddRowColor;
      ctx.fillRect(0, rowY, containerWidth, ROW_HEIGHT);

      // Row number cell
      const rowNumX = columnPositions[-1];
      if (rowNumX + getColumnWidth(-1) > 0 && rowNumX < containerWidth) {
        ctx.strokeStyle = borderColor;
        ctx.beginPath();
        ctx.moveTo(rowNumX + getColumnWidth(-1), rowY);
        ctx.lineTo(rowNumX + getColumnWidth(-1), rowY + ROW_HEIGHT);
        ctx.stroke();

        ctx.fillStyle = textColor;
        drawCellText(
          ctx,
          actualRowNumber.toLocaleString(),
          rowNumX,
          rowY,
          getColumnWidth(-1),
          textColor
        );
      }

      // Data cells - draw all columns that are at least partially visible
      row.values.forEach((value, colIdx) => {
        const colX = columnPositions[colIdx];
        const colWidth = getColumnWidth(colIdx);

        // Column is visible if any part of it is in the viewport
        // Check if right edge is to the right of left edge of viewport AND
        // left edge is to the left of right edge of viewport
        if (colX + colWidth > 0 && colX < containerWidth) {
          // Calculate visible portion of column
          const visibleX = Math.max(0, colX);
          const visibleWidth = Math.min(colX + colWidth, containerWidth) - visibleX;
          
          // Draw vertical border on the right side of the cell
          ctx.strokeStyle = borderColor;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(colX + colWidth, rowY);
          ctx.lineTo(colX + colWidth, rowY + ROW_HEIGHT);
          ctx.stroke();

          // Draw left border if column starts off-screen
          if (colX < 0 && colIdx === 0) {
            ctx.beginPath();
            ctx.moveTo(0, rowY);
            ctx.lineTo(0, rowY + ROW_HEIGHT);
            ctx.stroke();
          }

          // Draw cell content
          const column = results.columns[colIdx];
          const formattedValue = formatValue(value, column?.type);
          ctx.fillStyle = textColor;
          drawCellText(ctx, formattedValue, colX, rowY, colWidth, textColor);
        }
      });

      // Draw bottom border
      ctx.strokeStyle = borderColor;
      ctx.beginPath();
      ctx.moveTo(0, rowY + ROW_HEIGHT);
      ctx.lineTo(containerWidth, rowY + ROW_HEIGHT);
      ctx.stroke();
    }

    // Draw selection highlights
    if (selectionStart && selectionEnd) {
      const startRow = Math.min(selectionStart.row, selectionEnd.row);
      const endRow = Math.max(selectionStart.row, selectionEnd.row);
      const startCol = Math.min(selectionStart.col, selectionEnd.col);
      const endCol = Math.max(selectionStart.col, selectionEnd.col);

      // Only draw selection for visible rows
      const visibleStart = Math.max(startRow, visibleStartRow);
      const visibleEnd = Math.min(endRow + 1, visibleEndRow);

      for (let rowIdx = visibleStart; rowIdx < visibleEnd; rowIdx++) {
        const rowY = HEADER_HEIGHT + rowIdx * ROW_HEIGHT - scrollTop;
        if (rowY < HEADER_HEIGHT) continue;

        // Draw selection for each selected column in this row
        for (let colIdx = startCol; colIdx <= endCol; colIdx++) {
          const colX = columnPositions[colIdx];
          const colWidth = getColumnWidth(colIdx);

          // Only draw if column is visible
          if (colX + colWidth > 0 && colX < containerWidth) {
            ctx.fillStyle = 'rgba(0, 122, 204, 0.3)';
            ctx.fillRect(colX, rowY, colWidth, ROW_HEIGHT);
          }
        }
      }
    }

    // Draw header last so it's always on top (fixed position)
    // Draw header background
    ctx.fillStyle = headerBgColor;
    ctx.fillRect(0, 0, containerWidth, HEADER_HEIGHT);

    // Draw header border
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, HEADER_HEIGHT);
    ctx.lineTo(containerWidth, HEADER_HEIGHT);
    ctx.stroke();

    // Draw header cells
    ctx.font = '600 0.75rem -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = headerTextColor;

    // Row number header
    const rowNumX = columnPositions[-1];
    const rowNumWidth = getColumnWidth(-1);
    // Check if column is visible (any part of it is in viewport)
    if (rowNumX + rowNumWidth > 0 && rowNumX < containerWidth) {
      ctx.fillStyle = headerTextColor;
      ctx.font = '600 0.75rem -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      // Draw header text at correct vertical position
      ctx.fillText('Row', rowNumX + CELL_PADDING, HEADER_HEIGHT / 2 + 4);
      
      // Draw resize handle
      if (resizingColumn === -1 || hoveredColumn === -1) {
        ctx.fillStyle = resizingColumn === -1 ? '#007acc' : '#007acc80';
        ctx.fillRect(
          rowNumX + rowNumWidth - RESIZE_HANDLE_WIDTH / 2,
          0,
          RESIZE_HANDLE_WIDTH,
          HEADER_HEIGHT
        );
      }
    }

    // Column headers - draw all columns that are at least partially visible
    results.columns.forEach((col, idx) => {
      const colX = columnPositions[idx];
      const colWidth = getColumnWidth(idx);

      // Column is visible if any part of it is in the viewport
      // Check if right edge is to the right of left edge of viewport AND
      // left edge is to the left of right edge of viewport
      if (colX + colWidth > 0 && colX < containerWidth) {
        // Calculate visible portion of column
        const visibleX = Math.max(0, colX);
        const visibleWidth = Math.min(colX + colWidth, containerWidth) - visibleX;
        
        // Draw vertical border on the right side of the header
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(colX + colWidth, 0);
        ctx.lineTo(colX + colWidth, HEADER_HEIGHT);
        ctx.stroke();

        // Draw left border if column starts off-screen
        if (colX < 0) {
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, HEADER_HEIGHT);
          ctx.stroke();
        }

        ctx.fillStyle = headerTextColor;
        ctx.font = '600 0.75rem -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        // Draw header text directly (don't use drawCellText as it sets its own font)
        const headerTextY = HEADER_HEIGHT / 2 + 4; // Same vertical position as row header
        const textWidth = measureText(col.name, ctx);
        
        if (textWidth <= colWidth - CELL_PADDING * 2) {
          ctx.fillText(col.name, colX + CELL_PADDING, headerTextY);
        } else {
          // Truncate with ellipsis
          let truncated = col.name;
          let truncatedWidth = textWidth;
          const ellipsis = '...';
          const ellipsisWidth = measureText(ellipsis, ctx);
          
          while (truncatedWidth + ellipsisWidth > colWidth - CELL_PADDING * 2 && truncated.length > 0) {
            truncated = truncated.slice(0, -1);
            truncatedWidth = measureText(truncated, ctx);
          }
          
          ctx.fillText(truncated + ellipsis, colX + CELL_PADDING, headerTextY);
        }

        // Draw resize handle
        if (resizingColumn === idx || hoveredColumn === idx) {
          ctx.fillStyle = resizingColumn === idx ? '#007acc' : '#007acc80';
          const handleX = Math.max(0, colX + colWidth - RESIZE_HANDLE_WIDTH / 2);
          ctx.fillRect(
            handleX,
            0,
            RESIZE_HANDLE_WIDTH,
            HEADER_HEIGHT
          );
        }
      }
    });
  }, [
    paginatedRows,
    results.columns,
    scrollTop,
    scrollLeft,
    hoveredRow,
    hoveredColumn,
    resizingColumn,
    getColumnWidth,
    formatValue,
    startIndex,
    drawCellText,
    selectionStart,
    selectionEnd,
  ]);

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
    setScrollLeft(e.currentTarget.scrollLeft);
  }, []);

  // Handle mouse move
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left + scrollLeft;
      const y = e.clientY - rect.top + scrollTop;

      // Check if over header
      if (y >= 0 && y < HEADER_HEIGHT) {
        // Check which column
        let currentX = 0;
        let foundColumn: number | null = null;

        // Check row number column
        const rowNumWidth = getColumnWidth(-1);
        if (x >= currentX && x < currentX + rowNumWidth) {
          foundColumn = -1;
        }
        currentX += rowNumWidth;

        // Check data columns
        if (foundColumn === null) {
          results.columns.forEach((_, idx) => {
            const colWidth = getColumnWidth(idx);
            if (x >= currentX && x < currentX + colWidth) {
              foundColumn = idx;
            }
            currentX += colWidth;
          });
        }

        setHoveredColumn(foundColumn);
        setHoveredRow(null);

        // Update cursor for resize
        if (foundColumn !== null) {
          let colX = 0;
          if (foundColumn === -1) {
            colX = 0;
          } else {
            colX = getColumnWidth(-1);
            for (let i = 0; i < foundColumn; i++) {
              colX += getColumnWidth(i);
            }
          }
          const colWidth = getColumnWidth(foundColumn);
          const handleX = colX + colWidth - RESIZE_HANDLE_WIDTH / 2;
          
          if (x >= handleX - 5 && x <= handleX + 5) {
            container.style.cursor = 'col-resize';
          } else {
            container.style.cursor = 'default';
          }
        } else {
          container.style.cursor = 'default';
        }
      } else if (y >= HEADER_HEIGHT) {
        // Check which row
        const rowIndex = Math.floor((y - HEADER_HEIGHT) / ROW_HEIGHT);
        if (rowIndex >= 0 && rowIndex < paginatedRows.length) {
          setHoveredRow(rowIndex);
        } else {
          setHoveredRow(null);
        }
        setHoveredColumn(null);
        container.style.cursor = 'default';
      }
    },
    [scrollTop, scrollLeft, getColumnWidth, results.columns, paginatedRows.length]
  );

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    setHoveredRow(null);
    setHoveredColumn(null);
    const container = containerRef.current;
    if (container) {
      container.style.cursor = 'default';
    }
  }, []);

  // Handle mouse down for resizing and selection
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left + scrollLeft;
      const y = e.clientY - rect.top + scrollTop;

      // Handle selection in data area (not header)
      if (y >= HEADER_HEIGHT) {
        // Check if this is a data cell click (not a scrollbar click)
        const cell = getCellFromCoordinates(x, y);
        if (cell) {
          setIsSelecting(true);
          const cellPos = { ...cell, x, y };
          setSelectionStart(cellPos);
          setSelectionEnd(cellPos);
          // Don't prevent default - allow normal behavior
          return;
        } else {
          // Click outside cells - clear selection
          setSelectionStart(null);
          setSelectionEnd(null);
          return;
        }
      }

      // Only handle resize in header

      // Check which column
      let currentX = 0;
      let foundColumn: number | null = null;

      // Check row number column
      const rowNumWidth = getColumnWidth(-1);
      if (x >= currentX && x < currentX + rowNumWidth) {
        const handleX = currentX + rowNumWidth - RESIZE_HANDLE_WIDTH / 2;
        if (x >= handleX - 5 && x <= handleX + 5) {
          foundColumn = -1;
        }
      }
      currentX += rowNumWidth;

      // Check data columns
      if (foundColumn === null) {
        results.columns.forEach((_, idx) => {
          const colWidth = getColumnWidth(idx);
          const handleX = currentX + colWidth - RESIZE_HANDLE_WIDTH / 2;
          if (x >= handleX - 5 && x <= handleX + 5) {
            foundColumn = idx;
          }
          currentX += colWidth;
        });
      }

      if (foundColumn !== null) {
        e.preventDefault();
        resizeStartXRef.current = e.clientX;
        resizeStartWidthRef.current = getColumnWidth(foundColumn);
        setResizingColumn(foundColumn);
        // Clear selection when starting resize
        setSelectionStart(null);
        setSelectionEnd(null);
        setIsSelecting(false);
      } else {
        // Click on header but not on resize handle - clear selection
        setSelectionStart(null);
        setSelectionEnd(null);
        setIsSelecting(false);
      }
    },
    [scrollLeft, getColumnWidth, results.columns, getCellFromCoordinates]
  );

  // Handle context menu
  const handleContextMenu = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left + scrollLeft;
      const y = e.clientY - rect.top + scrollTop;

      if (y >= 0 && y < HEADER_HEIGHT) {
        // Header context menu
        let currentX = 0;
        let foundColumn: number | null = null;

        const rowNumWidth = getColumnWidth(-1);
        if (x >= currentX && x < currentX + rowNumWidth) {
          // Row number column doesn't have context menu
          return;
        }
        currentX += rowNumWidth;

        results.columns.forEach((_, idx) => {
          const colWidth = getColumnWidth(idx);
          if (x >= currentX && x < currentX + colWidth) {
            foundColumn = idx;
          }
          currentX += colWidth;
        });

        if (foundColumn !== null) {
          onColumnContextMenu(e, foundColumn);
        }
      } else if (y >= HEADER_HEIGHT) {
        // Row context menu
        const rowIndex = Math.floor((y - HEADER_HEIGHT) / ROW_HEIGHT);
        if (rowIndex >= 0 && rowIndex < paginatedRows.length) {
          onRowContextMenu(e, rowIndex);
        }
      }
    },
    [scrollTop, scrollLeft, getColumnWidth, results.columns, paginatedRows.length, onRowContextMenu, onColumnContextMenu]
  );

  // Extract selected text
  const getSelectedText = useCallback((): string => {
    if (!selectionStart || !selectionEnd) return '';

    const startRow = Math.min(selectionStart.row, selectionEnd.row);
    const endRow = Math.max(selectionStart.row, selectionEnd.row);
    const startCol = Math.min(selectionStart.col, selectionEnd.col);
    const endCol = Math.max(selectionStart.col, selectionEnd.col);

    const selectedCells: string[] = [];

    for (let rowIdx = startRow; rowIdx <= endRow; rowIdx++) {
      const row = paginatedRows[rowIdx];
      if (!row) continue;

      const rowValues: string[] = [];
      for (let colIdx = startCol; colIdx <= endCol; colIdx++) {
        if (colIdx === -1) {
          // Row number
          const actualRowNumber = startIndex + rowIdx + 1;
          rowValues.push(actualRowNumber.toLocaleString());
        } else {
          const column = results.columns[colIdx];
          const value = row.values[colIdx];
          const formattedValue = formatValue(value, column?.type);
          rowValues.push(formattedValue);
        }
      }
      selectedCells.push(rowValues.join('\t'));
    }

    return selectedCells.join('\n');
  }, [selectionStart, selectionEnd, paginatedRows, results.columns, formatValue, startIndex]);

  // Handle copy to clipboard
  useEffect(() => {
    const handleCopy = (e: KeyboardEvent) => {
      // Check for Ctrl+C (Windows/Linux) or Cmd+C (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        if (selectionStart && selectionEnd) {
          // Check if user is trying to copy from an input field or Monaco editor
          const target = e.target as HTMLElement;
          const isInputField = 
            target.tagName === 'INPUT' || 
            target.tagName === 'TEXTAREA' || 
            target.isContentEditable ||
            // Check if Monaco editor is focused (Monaco editor uses a textarea internally)
            target.closest('.monaco-editor') !== null ||
            target.closest('.editor-container') !== null;
          
          // Only handle copy from canvas if not copying from an input/editor
          if (!isInputField) {
            const text = getSelectedText();
            if (text) {
              e.preventDefault();
              navigator.clipboard.writeText(text).catch((err) => {
                console.error('Failed to copy to clipboard:', err);
              });
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleCopy);
    return () => window.removeEventListener('keydown', handleCopy);
  }, [selectionStart, selectionEnd, getSelectedText]);


  // Handle selection mouse move
  const handleSelectionMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isSelecting || resizingColumn !== null) return;

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const viewportX = e.clientX - rect.left;
      const viewportY = e.clientY - rect.top;
      const x = viewportX + scrollLeft;
      const y = viewportY + scrollTop;

      // Allow scrolling when near edges (but don't prevent default to allow native scrolling)
      const edgeThreshold = 20;
      const isNearTop = viewportY < edgeThreshold;
      const isNearBottom = viewportY > rect.height - edgeThreshold;
      const isNearLeft = viewportX < edgeThreshold;
      const isNearRight = viewportX > rect.width - edgeThreshold;

      // Update selection if we can determine a cell
      const cell = getCellFromCoordinates(x, y);
      if (cell && selectionStart) {
        setSelectionEnd({ ...cell, x, y });
      } else if (selectionStart) {
        // If outside cells but still selecting, extend selection to edge
        // This allows selection to continue when dragging outside viewport
        const lastCell = selectionEnd || selectionStart;
        setSelectionEnd(lastCell);
      }
    },
    [isSelecting, resizingColumn, scrollLeft, scrollTop, getCellFromCoordinates, selectionStart, selectionEnd]
  );

  // Handle selection mouse up
  const handleSelectionMouseUp = useCallback(() => {
    setIsSelecting(false);
  }, []);

  // Handle mouse up at document level to ensure selection ends even if mouse leaves component
  useEffect(() => {
    if (!isSelecting) return;

    const handleDocumentMouseUp = () => {
      setIsSelecting(false);
    };

    document.addEventListener('mouseup', handleDocumentMouseUp);
    return () => document.removeEventListener('mouseup', handleDocumentMouseUp);
  }, [isSelecting]);

  // Handle selection mouse leave
  const handleSelectionMouseLeave = useCallback(() => {
    setIsSelecting(false);
  }, []);

  // Handle resize mouse move
  useEffect(() => {
    if (resizingColumn === null) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const diff = e.clientX - resizeStartXRef.current;
      const newWidth = Math.max(MIN_COLUMN_WIDTH, resizeStartWidthRef.current + diff);
      onColumnResize(resizingColumn, newWidth);
    };

    const handleMouseUp = () => {
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
  }, [resizingColumn, onColumnResize]);

  // Initial render when component mounts
  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      render();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Render on changes (including scroll)
  useEffect(() => {
    // Use requestAnimationFrame to ensure smooth rendering
    const rafId = requestAnimationFrame(() => {
      render();
    });
    return () => cancelAnimationFrame(rafId);
  }, [render, scrollTop, scrollLeft]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      render();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [render]);

  return (
    <div
      ref={wrapperRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Scrollable container - this handles all scrolling */}
      {/* Ensure scrollbars are always visible when content overflows */}
      <div
        ref={containerRef}
        className="canvas-table-container"
        onScroll={handleScroll}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onContextMenu={handleContextMenu}
        style={{
          width: '100%',
          height: '100%',
          overflowX: 'scroll',
          overflowY: 'scroll',
          position: 'relative',
          // Ensure scrollbars are always visible
          scrollbarWidth: 'thin',
          scrollbarColor: '#424242 #1e1e1e',
          // Force scrollbars to be visible (especially on macOS)
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Spacer div to create scrollable area - this scrolls */}
        <div
          style={{
            width: totalWidth,
            height: totalHeight,
            position: 'relative',
            pointerEvents: 'none',
          }}
        />
      </div>
      {/* Canvas overlay - positioned fixed to outer container, does NOT scroll */}
      {/* pointerEvents: 'none' allows scrolling and scrollbar interaction to work through it */}
      {/* Size matches container.clientWidth/Height to exclude scrollbar area */}
      <div
        ref={canvasOverlayRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            pointerEvents: 'none',
            width: '100%',
            height: '100%',
          }}
        />
      </div>
      {/* Selection overlay - captures mouse events for text selection */}
      {/* Only active when actively selecting to allow scrolling otherwise */}
      {/* Positioned to match canvas overlay (excludes scrollbar area) */}
      <div
        ref={selectionOverlayRef}
        onMouseMove={handleSelectionMouseMove}
        onMouseUp={handleSelectionMouseUp}
        onMouseLeave={handleSelectionMouseLeave}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: resizingColumn !== null || !isSelecting ? 'none' : 'auto',
          cursor: isSelecting ? 'text' : 'default',
          userSelect: 'none',
        }}
      />
    </div>
  );
};

