import React, { useEffect, useRef } from 'react';
import './ColumnSortMenu.css';

interface ColumnSortMenuProps {
  x: number;
  y: number;
  columnIndex: number;
  currentSortColumn: number | null;
  currentSortDirection: 'asc' | 'desc' | null;
  onClose: () => void;
  onSort: (columnIndex: number, direction: 'asc' | 'desc') => void;
}

export const ColumnSortMenu: React.FC<ColumnSortMenuProps> = ({
  x,
  y,
  columnIndex,
  currentSortColumn,
  currentSortDirection,
  onClose,
  onSort,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  useEffect(() => {
    // Position menu to stay within viewport
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = x;
      let adjustedY = y;

      if (x + rect.width > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10;
      }
      if (y + rect.height > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10;
      }

      menuRef.current.style.left = `${adjustedX}px`;
      menuRef.current.style.top = `${adjustedY}px`;
    }
  }, [x, y]);

  const handleSort = (direction: 'asc' | 'desc') => {
    onSort(columnIndex, direction);
    onClose();
  };

  const isAscActive = currentSortColumn === columnIndex && currentSortDirection === 'asc';
  const isDescActive = currentSortColumn === columnIndex && currentSortDirection === 'desc';

  return (
    <div
      ref={menuRef}
      className="column-sort-menu"
      style={{ left: `${x}px`, top: `${y}px` }}
    >
      <button
        className={`sort-menu-item ${isAscActive ? 'active' : ''}`}
        onClick={() => handleSort('asc')}
      >
        <span className="sort-icon">↑</span>
        Ascending
      </button>
      <button
        className={`sort-menu-item ${isDescActive ? 'active' : ''}`}
        onClick={() => handleSort('desc')}
      >
        <span className="sort-icon">↓</span>
        Descending
      </button>
    </div>
  );
};

