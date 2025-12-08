import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { ColumnMetadata } from '../../../shared/types/query';
import './ResultsSearch.css';

interface ResultsSearchProps {
  columns: ColumnMetadata[];
  onSearch: (searchTerm: string, columnIndex: number | null) => void;
  matchCount: number;
  currentMatchIndex: number;
  onNavigateMatch: (direction: 'prev' | 'next') => void;
  disabled?: boolean;
}

export const ResultsSearch: React.FC<ResultsSearchProps> = ({
  columns,
  onSearch,
  matchCount,
  currentMatchIndex,
  onNavigateMatch,
  disabled = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedColumn, setSelectedColumn] = useState<number | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Trigger search on term or column change
  useEffect(() => {
    onSearch(searchTerm, selectedColumn);
  }, [searchTerm, selectedColumn, onSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        onNavigateMatch('prev');
      } else {
        onNavigateMatch('next');
      }
    } else if (e.key === 'Escape') {
      setSearchTerm('');
      inputRef.current?.blur();
    }
  };

  const handleColumnSelect = (columnIndex: number | null) => {
    setSelectedColumn(columnIndex);
    setIsDropdownOpen(false);
  };

  const handleClear = () => {
    setSearchTerm('');
    setSelectedColumn(null);
    inputRef.current?.focus();
  };

  const getColumnLabel = () => {
    if (selectedColumn === null) {
      return 'All columns';
    }
    return columns[selectedColumn]?.name || 'Unknown';
  };

  return (
    <div className={`results-search ${disabled ? 'disabled' : ''}`}>
      <div className="search-input-container">
        <span className="search-icon">🔍</span>
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder="Search results..."
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />
        {searchTerm && (
          <button
            className="search-clear-btn"
            onClick={handleClear}
            title="Clear search"
            disabled={disabled}
          >
            ×
          </button>
        )}
      </div>

      <div className="column-filter-container" ref={dropdownRef}>
        <button
          className="column-filter-btn"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          disabled={disabled}
          title="Filter by column"
        >
          <span className="column-filter-label">{getColumnLabel()}</span>
          <span className="column-filter-arrow">▼</span>
        </button>

        {isDropdownOpen && (
          <div className="column-filter-dropdown">
            <div
              className={`column-filter-option ${selectedColumn === null ? 'selected' : ''}`}
              onClick={() => handleColumnSelect(null)}
            >
              All columns
            </div>
            {columns.map((col, idx) => (
              <div
                key={idx}
                className={`column-filter-option ${selectedColumn === idx ? 'selected' : ''}`}
                onClick={() => handleColumnSelect(idx)}
              >
                {col.name}
              </div>
            ))}
          </div>
        )}
      </div>

      {searchTerm && (
        <div className="search-results-info">
          {matchCount > 0 ? (
            <>
              <span className="match-count">
                {currentMatchIndex + 1} of {matchCount}
              </span>
              <div className="search-nav-buttons">
                <button
                  className="search-nav-btn"
                  onClick={() => onNavigateMatch('prev')}
                  disabled={matchCount === 0}
                  title="Previous match (Shift+Enter)"
                >
                  ↑
                </button>
                <button
                  className="search-nav-btn"
                  onClick={() => onNavigateMatch('next')}
                  disabled={matchCount === 0}
                  title="Next match (Enter)"
                >
                  ↓
                </button>
              </div>
            </>
          ) : (
            <span className="no-matches">No matches</span>
          )}
        </div>
      )}
    </div>
  );
};
