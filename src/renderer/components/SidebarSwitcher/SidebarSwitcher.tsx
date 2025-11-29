import React from 'react';
import './SidebarSwitcher.css';

export type SidebarView = 'explorer' | 'saved-queries';

interface SidebarSwitcherProps {
  currentView: SidebarView;
  onViewChange: (view: SidebarView) => void;
  collapsed?: boolean;
}

export const SidebarSwitcher: React.FC<SidebarSwitcherProps> = ({
  currentView,
  onViewChange,
  collapsed = false,
}) => {
  if (collapsed) {
    return null;
  }

  return (
    <div className="sidebar-switcher">
      <button
        className={`sidebar-switcher-button ${currentView === 'explorer' ? 'active' : ''}`}
        onClick={() => onViewChange('explorer')}
        title="Explorer"
      >
        EXPLORER
      </button>
      <button
        className={`sidebar-switcher-button ${currentView === 'saved-queries' ? 'active' : ''}`}
        onClick={() => onViewChange('saved-queries')}
        title="Saved Queries"
      >
        SAVED QUERIES
      </button>
    </div>
  );
};

