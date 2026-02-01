import React, { useCallback, useRef, useEffect, useState } from 'react';
import { useTabsStore } from '../../stores/tabs-store';
import { TabBar } from '../TabBar/TabBar';
import { QueryEditor } from '../QueryEditor/QueryEditor';
import { QueryResults } from '../QueryResults/QueryResults';
import './SplitEditorContainer.css';

interface SplitEditorContainerProps {
  editorHeight: number;
  onEditorResize: (height: number) => void;
  theme: 'dark' | 'light';
  onCompareTab?: (tabId: string) => void;
}

export const SplitEditorContainer: React.FC<SplitEditorContainerProps> = ({
  editorHeight,
  onEditorResize,
  theme,
  onCompareTab,
}) => {
  const { 
    tabs,
    isSplitView, 
    splitRatio, 
    activeLeftTabId, 
    activeRightTabId,
    setSplitRatio,
    closeSplitView,
  } = useTabsStore();
  
  // Get the active tabs for each side
  const leftTab = tabs.find(t => t.id === activeLeftTabId);
  const rightTab = tabs.find(t => t.id === activeRightTabId);
  const activeTab = useTabsStore(state => state.tabs.find(t => t.id === state.activeTabId));
  
  const [isResizingVertical, setIsResizingVertical] = useState(false);
  const [isResizingSplit, setIsResizingSplit] = useState(false);
  const resizeStartYRef = useRef(0);
  const resizeStartHeightRef = useRef(350);
  const resizeStartXRef = useRef(0);
  const resizeStartRatioRef = useRef(0.5);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle vertical resize (editor/results divider)
  const handleVerticalResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingVertical(true);
    resizeStartYRef.current = e.clientY;
    resizeStartHeightRef.current = editorHeight;
  }, [editorHeight]);

  // Handle split divider resize
  const handleSplitResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingSplit(true);
    resizeStartXRef.current = e.clientX;
    resizeStartRatioRef.current = splitRatio;
  }, [splitRatio]);

  // Vertical resize effect
  useEffect(() => {
    if (!isResizingVertical) return;

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientY - resizeStartYRef.current;
      const newHeight = Math.max(200, Math.min(800, resizeStartHeightRef.current + diff));
      onEditorResize(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizingVertical(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizingVertical, onEditorResize]);

  // Split resize effect
  useEffect(() => {
    if (!isResizingSplit || !isSplitView || !containerRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;
      
      const newRatio = (e.clientX - containerRect.left) / containerRect.width;
      const clampedRatio = Math.max(0.2, Math.min(0.8, newRatio));
      setSplitRatio(clampedRatio);
    };

    const handleMouseUp = () => {
      setIsResizingSplit(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizingSplit, isSplitView, setSplitRatio]);

  // Render split view with tab bars above each editor
  if (isSplitView) {
    return (
      <div className="split-editor-container split-mode" ref={containerRef}>
        {/* Left side */}
        <div 
          className="split-pane-wrapper" 
          style={{ width: `calc(${splitRatio * 100}% - 2px)` }}
        >
          <TabBar side="left" onCompareTab={onCompareTab} />
          <div className="split-pane-content">
            {leftTab ? (
              <>
                <div className="query-section" style={{ height: `${editorHeight}px` }}>
                  <QueryEditor key={leftTab.id} theme={theme} tabId={leftTab.id} />
                </div>
                <div
                  className="resize-handle-horizontal"
                  onMouseDown={handleVerticalResizeStart}
                />
                <div className="results-section" style={{ height: `calc(100% - ${editorHeight}px - 4px)` }}>
                  <QueryResults tabId={leftTab.id} />
                </div>
              </>
            ) : (
              <div className="no-tab-message">No tab selected</div>
            )}
          </div>
        </div>
        
        {/* Split divider */}
        <div
          className="split-divider"
          onMouseDown={handleSplitResizeStart}
        >
          <button 
            className="close-split-button"
            onClick={closeSplitView}
            title="Close split view"
          >
            ×
          </button>
        </div>
        
        {/* Right side */}
        <div 
          className="split-pane-wrapper" 
          style={{ width: `calc(${(1 - splitRatio) * 100}% - 2px)` }}
        >
          <TabBar side="right" onCompareTab={onCompareTab} />
          <div className="split-pane-content">
            {rightTab ? (
              <>
                <div className="query-section" style={{ height: `${editorHeight}px` }}>
                  <QueryEditor key={rightTab.id} theme={theme} tabId={rightTab.id} />
                </div>
                <div
                  className="resize-handle-horizontal"
                  onMouseDown={handleVerticalResizeStart}
                />
                <div className="results-section" style={{ height: `calc(100% - ${editorHeight}px - 4px)` }}>
                  <QueryResults tabId={rightTab.id} />
                </div>
              </>
            ) : (
              <div className="no-tab-message">No tab selected</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render single view (original layout) - TabBar is rendered in App.tsx
  if (!activeTab) {
    return (
      <div className="split-editor-container single-mode">
        <div className="no-tab-message">No active tab</div>
      </div>
    );
  }

  return (
    <div className="split-editor-container single-mode">
      <div className="query-section" style={{ height: `${editorHeight}px` }}>
        <QueryEditor key={activeTab.id} theme={theme} tabId={activeTab.id} />
      </div>
      <div
        className="resize-handle-horizontal"
        onMouseDown={handleVerticalResizeStart}
      />
      <div className="results-section" style={{ height: `calc(100% - ${editorHeight}px - 4px)` }}>
        <QueryResults tabId={activeTab.id} />
      </div>
    </div>
  );
};
