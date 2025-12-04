import React, { useEffect, useRef } from 'react';
import './ExportMenu.css';

export type ExportFormat = 'csv' | 'json' | 'clipboard-csv' | 'clipboard-json';

interface ExportMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onExport: (format: ExportFormat) => void;
  isExporting?: boolean;
}

export const ExportMenu: React.FC<ExportMenuProps> = ({
  x,
  y,
  onClose,
  onExport,
  isExporting = false,
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

  const handleExport = (format: ExportFormat) => {
    if (!isExporting) {
      onExport(format);
    }
  };

  return (
    <div
      ref={menuRef}
      className="export-menu"
      style={{ left: `${x}px`, top: `${y}px` }}
    >
      <div className="export-menu-section">
        <div className="export-menu-header">Export to File</div>
        <button
          className="export-menu-item"
          onClick={() => handleExport('csv')}
          disabled={isExporting}
        >
          <span className="export-menu-icon">📄</span>
          Export as CSV
        </button>
        <button
          className="export-menu-item"
          onClick={() => handleExport('json')}
          disabled={isExporting}
        >
          <span className="export-menu-icon">📋</span>
          Export as JSON
        </button>
      </div>
      <div className="export-menu-divider" />
      <div className="export-menu-section">
        <div className="export-menu-header">Copy to Clipboard</div>
        <button
          className="export-menu-item"
          onClick={() => handleExport('clipboard-csv')}
          disabled={isExporting}
        >
          <span className="export-menu-icon">📝</span>
          Copy all as CSV
        </button>
        <button
          className="export-menu-item"
          onClick={() => handleExport('clipboard-json')}
          disabled={isExporting}
        >
          <span className="export-menu-icon">📝</span>
          Copy all as JSON
        </button>
      </div>
    </div>
  );
};
