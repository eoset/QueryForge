import React, { useCallback, useRef, useEffect, useState } from 'react';
import { useTabsStore } from '../../stores/tabs-store';
import { SplitEditorPane } from '../SplitEditorPane/SplitEditorPane';
import { QueryEditor } from '../QueryEditor/QueryEditor';
import { QueryResults } from '../QueryResults/QueryResults';
import './SplitEditorContainer.css';

interface SplitEditorContainerProps {
  editorHeight: number;
  onEditorResize: (height: number) => void;
  theme: 'dark' | 'light';
}

export const SplitEditorContainer: React.FC<SplitEditorContainerProps> = ({
  editorHeight,
  onEditorResize,
  theme,
}) => {
  const activeTab = useTabsStore((state) => {
    const tab = state.tabs.find((t) => t.id === state.activeTabId);
    return tab || null;
  });
  
  const { setActiveSplitPane, setSplitRatio } = useTabsStore();
  
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
    resizeStartRatioRef.current = activeTab?.splitRatio || 0.5;
  }, [activeTab?.splitRatio]);

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
    if (!isResizingSplit || !activeTab?.isSplit || !containerRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;
      
      const newRatio = (e.clientX - containerRect.left) / containerRect.width;
      const clampedRatio = Math.max(0.2, Math.min(0.8, newRatio));
      setSplitRatio(activeTab.id, clampedRatio);
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
  }, [isResizingSplit, activeTab, setSplitRatio]);

  const handlePaneFocus = useCallback((paneId: string) => {
    if (activeTab) {
      setActiveSplitPane(activeTab.id, paneId);
    }
  }, [activeTab, setActiveSplitPane]);

  if (!activeTab) {
    return (
      <div className="split-editor-container">
        <div className="no-tab-message">No active tab</div>
      </div>
    );
  }

  // Render split view
  if (activeTab.isSplit && activeTab.splitPanes) {
    const [leftPane, rightPane] = activeTab.splitPanes;
    const splitRatio = activeTab.splitRatio || 0.5;

    return (
      <div className="split-editor-container split-mode" ref={containerRef}>
        <div 
          className="split-pane-container" 
          style={{ width: `calc(${splitRatio * 100}% - 2px)` }}
        >
          <SplitEditorPane
            key={leftPane.id}
            paneId={leftPane.id}
            tabId={activeTab.id}
            isActive={activeTab.activeSplitPaneId === leftPane.id}
            onFocus={() => handlePaneFocus(leftPane.id)}
            theme={theme}
          />
        </div>
        <div
          className="split-divider"
          onMouseDown={handleSplitResizeStart}
        />
        <div 
          className="split-pane-container" 
          style={{ width: `calc(${(1 - splitRatio) * 100}% - 2px)` }}
        >
          <SplitEditorPane
            key={rightPane.id}
            paneId={rightPane.id}
            tabId={activeTab.id}
            isActive={activeTab.activeSplitPaneId === rightPane.id}
            onFocus={() => handlePaneFocus(rightPane.id)}
            theme={theme}
          />
        </div>
      </div>
    );
  }

  // Render single view (original layout)
  return (
    <div className="split-editor-container single-mode">
      <div className="query-section" style={{ height: `${editorHeight}px` }}>
        <QueryEditor theme={theme} />
      </div>
      <div
        className="resize-handle-horizontal"
        onMouseDown={handleVerticalResizeStart}
      />
      <div className="results-section" style={{ height: `calc(100% - ${editorHeight}px - 4px)` }}>
        <QueryResults />
      </div>
    </div>
  );
};
