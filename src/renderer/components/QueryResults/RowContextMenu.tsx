import React, { useEffect, useRef } from 'react';
import './RowContextMenu.css';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onCopyValues: () => void;
  menuLabel?: string;
}

export const RowContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  onClose,
  onCopyValues,
  menuLabel = 'Copy values (with headers)',
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

  return (
    <div
      ref={menuRef}
      className="row-context-menu"
      style={{ left: `${x}px`, top: `${y}px` }}
    >
      <button
        className="context-menu-item"
        onClick={() => {
          onCopyValues();
          onClose();
        }}
      >
        {menuLabel}
      </button>
    </div>
  );
};

