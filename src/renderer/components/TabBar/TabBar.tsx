import React, { useState, useRef, useEffect } from 'react';
import { useTabsStore } from '../../stores/tabs-store';
import type { SplitSide } from '../../../shared/types/query';
import './TabBar.css';

interface TabBarProps {
  side?: SplitSide; // If provided, only show tabs for this side
}

export const TabBar: React.FC<TabBarProps> = ({ side }) => {
  const { 
    tabs, 
    activeTabId, 
    setActiveTab, 
    closeTab, 
    createTab, 
    reorderTabs,
    isSplitView,
    activeLeftTabId,
    activeRightTabId,
    splitTabToRight,
    setActiveSideTab,
  } = useTabsStore();
  
  // Filter tabs based on side (when in split view) or show all (when not split)
  const queryTabs = tabs.filter(tab => {
    if (tab.type !== 'query') return false;
    if (!isSplitView) return true;
    if (side === 'right') return tab.splitSide === 'right';
    return !tab.splitSide || tab.splitSide === 'left';
  });
  
  // Determine active tab for this side
  const sideActiveTabId = side === 'right' ? activeRightTabId : (side === 'left' ? activeLeftTabId : activeTabId);
  
  const [draggedTabIndex, setDraggedTabIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dropdownTabId, setDropdownTabId] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dragImageRef = useRef<HTMLCanvasElement | null>(null);

  // Create a transparent drag image canvas once
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, 1, 1);
    }
    dragImageRef.current = canvas;
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownTabId(null);
      }
    };
    
    if (dropdownTabId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [dropdownTabId]);

  const handleTabClick = (tabId: string) => {
    if (side && isSplitView) {
      setActiveSideTab(side, tabId);
    } else {
      setActiveTab(tabId);
    }
  };

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    const tab = queryTabs.find((t) => t.id === tabId);
    
    if (tab?.isModified) {
      const confirmed = window.confirm(
        'This tab has unsaved changes. Are you sure you want to close it?'
      );
      if (!confirmed) return;
    }
    closeTab(tabId);
  };

  const handleNewTab = () => {
    createTab(side);
  };

  const handleDropdownClick = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    if (dropdownTabId === tabId) {
      setDropdownTabId(null);
      setDropdownPosition(null);
    } else {
      // Calculate position for fixed dropdown
      const button = e.currentTarget as HTMLElement;
      const rect = button.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 2,
        left: rect.left,
      });
      setDropdownTabId(tabId);
    }
  };

  const handleSplitToRight = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    setDropdownTabId(null);
    setDropdownPosition(null);
    splitTabToRight(tabId);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    // Don't start drag if clicking on the close button or dropdown
    const target = e.target as HTMLElement;
    if (target.closest('.tab-close') || target.closest('.tab-dropdown')) {
      e.preventDefault();
      return;
    }
    
    setDraggedTabIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
    
    if (dragImageRef.current) {
      e.dataTransfer.setDragImage(dragImageRef.current, 0, 0);
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedTabIndex !== null && draggedTabIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    const dropTab = queryTabs[dropIndex];
    if (!dropTab) {
      setDraggedTabIndex(null);
      setDragOverIndex(null);
      return;
    }
    
    const actualDropIndex = tabs.findIndex(t => t.id === dropTab.id);
    const actualDragIndex = draggedTabIndex !== null ? tabs.findIndex(t => t.id === queryTabs[draggedTabIndex]?.id) : null;
    
    if (actualDragIndex !== null && actualDragIndex !== -1 && actualDropIndex !== -1 && actualDragIndex !== actualDropIndex) {
      reorderTabs(actualDragIndex, actualDropIndex);
    }
    setDraggedTabIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedTabIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className={`tab-bar ${side ? `tab-bar-${side}` : ''}`}>
      <div className="tabs-container">
        {queryTabs.map((tab, index) => (
          <div
            key={tab.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`tab ${tab.id === sideActiveTabId ? 'active' : ''} ${tab.isModified ? 'modified' : ''} ${
              draggedTabIndex === index ? 'dragging' : ''
            } ${dragOverIndex === index ? 'drag-over' : ''}`}
            onClick={() => handleTabClick(tab.id)}
            title={tab.title}
          >
            <span className="tab-title">{tab.title}</span>
            {tab.isModified && <span className="modified-indicator">●</span>}
            
            {/* Dropdown button - only show if not already in split view or on left side */}
            {(!isSplitView || side === 'left' || !side) && (
              <div className="tab-dropdown-container" ref={dropdownTabId === tab.id ? dropdownRef : null}>
                <button
                  className="tab-dropdown"
                  onClick={(e) => handleDropdownClick(e, tab.id)}
                  onMouseDown={(e) => e.stopPropagation()}
                  title="Tab options"
                >
                  <span className="dropdown-arrow">▾</span>
                </button>
                {dropdownTabId === tab.id && dropdownPosition && (
                  <div 
                    className="tab-dropdown-menu"
                    style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
                  >
                    <button 
                      className="tab-dropdown-item"
                      onClick={(e) => handleSplitToRight(e, tab.id)}
                    >
                      Split to Right
                    </button>
                  </div>
                )}
              </div>
            )}
            
            <button
              className="tab-close"
              onClick={(e) => handleCloseTab(e, tab.id)}
              onMouseDown={(e) => e.stopPropagation()}
            >
              ×
            </button>
          </div>
        ))}
        <button className="new-tab-button" onClick={handleNewTab} title="New Tab">
          +
        </button>
      </div>
    </div>
  );
};

