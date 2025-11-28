import React, { useState, useRef, useEffect } from 'react';
import { useTabsStore } from '../../stores/tabs-store';
import './TabBar.css';

export const TabBar: React.FC = () => {
  const { tabs, activeTabId, setActiveTab, closeTab, createTab, reorderTabs } = useTabsStore();
  const [draggedTabIndex, setDraggedTabIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
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

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
  };

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    const tab = tabs.find((t) => t.id === tabId);
    
    // Don't allow closing Explorer tab
    if (tab?.type === 'explorer') {
      return;
    }
    
    if (tab?.isModified) {
      const confirmed = window.confirm(
        'This tab has unsaved changes. Are you sure you want to close it?'
      );
      if (!confirmed) return;
    }
    closeTab(tabId);
  };

  const handleNewTab = () => {
    createTab();
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    // Don't start drag if clicking on the close button
    const target = e.target as HTMLElement;
    if (target.closest('.tab-close')) {
      e.preventDefault();
      return;
    }
    
    // Don't allow dragging Explorer tab
    const tab = tabs[index];
    if (tab?.type === 'explorer') {
      e.preventDefault();
      return;
    }
    
    setDraggedTabIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', ''); // Set data to enable drag
    
    // Use a transparent canvas as drag image to prevent default browser drag image (globe icon)
    if (dragImageRef.current) {
      e.dataTransfer.setDragImage(dragImageRef.current, 0, 0);
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    
    // Don't allow dropping at index 0 (Explorer tab position)
    if (index === 0) {
      e.dataTransfer.dropEffect = 'none';
      return;
    }
    
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
    
    // Don't allow dropping on Explorer tab or at position 0
    const dropTab = tabs[dropIndex];
    if (dropTab?.type === 'explorer' || dropIndex === 0) {
      setDraggedTabIndex(null);
      setDragOverIndex(null);
      return;
    }
    
    if (draggedTabIndex !== null && draggedTabIndex !== dropIndex) {
      reorderTabs(draggedTabIndex, dropIndex);
    }
    setDraggedTabIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedTabIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="tab-bar">
      <div className="tabs-container">
        {tabs.map((tab, index) => (
          <div
            key={tab.id}
            draggable={tab.type !== 'explorer'}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`tab ${tab.id === activeTabId ? 'active' : ''} ${tab.isModified ? 'modified' : ''} ${
              draggedTabIndex === index ? 'dragging' : ''
            } ${dragOverIndex === index ? 'drag-over' : ''} ${tab.type === 'explorer' ? 'explorer-tab' : ''}`}
            onClick={() => handleTabClick(tab.id)}
          >
            <span className="tab-title">{tab.title}</span>
            {tab.isModified && tab.type !== 'explorer' && <span className="modified-indicator">●</span>}
            {tab.type !== 'explorer' && (
              <button
                className="tab-close"
                onClick={(e) => handleCloseTab(e, tab.id)}
                onMouseDown={(e) => e.stopPropagation()}
                disabled={tabs.filter(t => t.type !== 'explorer').length === 1}
              >
                ×
              </button>
            )}
          </div>
        ))}
        <button className="new-tab-button" onClick={handleNewTab} title="New Tab">
          +
        </button>
      </div>
    </div>
  );
};

