import React from 'react';
import './SidebarHeader.css';

interface SidebarHeaderProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  collapsed = false,
  onToggleCollapse,
  onRefresh,
  isLoading = false,
}) => {
  if (collapsed) {
    return (
      <div className="sidebar-header sidebar-header-collapsed">
        <button
          className="collapse-button"
          onClick={onToggleCollapse}
          title="Expand"
        >
          ▶
        </button>
      </div>
    );
  }

  return (
    <div className="sidebar-header">
      <button
        className="collapse-button"
        onClick={onToggleCollapse}
        title="Collapse"
      >
        ◀
      </button>
      {onRefresh && (
        <button
          className="refresh-button"
          onClick={onRefresh}
          title="Refresh"
          disabled={isLoading}
        >
          ↻
        </button>
      )}
    </div>
  );
};

