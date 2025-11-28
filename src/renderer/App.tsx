import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useConnectionStore } from './stores/connection-store';
import { useTabsStore, initializeTabsStore } from './stores/tabs-store';
import { ConnectionDialog } from './components/ConnectionDialog/ConnectionDialog';
import { SavedQueries } from './components/SavedQueries/SavedQueries';
import { HelpDialog } from './components/HelpDialog/HelpDialog';
import { AboutDialog } from './components/AboutDialog/AboutDialog';
import { TabBar } from './components/TabBar/TabBar';
import { QueryEditor } from './components/QueryEditor/QueryEditor';
import { QueryResults } from './components/QueryResults/QueryResults';
import { DatasetTree } from './components/DatasetTree/DatasetTree';
import { SavedQueriesTree } from './components/SavedQueriesTree/SavedQueriesTree';
import { SchemaSidebar } from './components/SchemaSidebar/SchemaSidebar';
import './App.css';

const App: React.FC = () => {
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [showSavedQueries, setShowSavedQueries] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [showAboutDialog, setShowAboutDialog] = useState(false);
  const [editorHeight, setEditorHeight] = useState(350);
  const [isResizing, setIsResizing] = useState(false);
  const [isResizingLeftSidebar, setIsResizingLeftSidebar] = useState(false);
  const [isResizingRightSidebar, setIsResizingRightSidebar] = useState(false);
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(250);
  const [rightSidebarWidth, setRightSidebarWidth] = useState(300);
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const savedLeftSidebarWidthRef = useRef(250); // Store the width before collapse
  const resizeStartYRef = useRef(0);
  const resizeStartHeightRef = useRef(350);
  const resizeStartXLeftRef = useRef(0);
  const resizeStartWidthLeftRef = useRef(250);
  const resizeStartXRightRef = useRef(0);
  const resizeStartWidthRightRef = useRef(300);
  const editorResultsRef = useRef<HTMLDivElement>(null);
  const connection = useConnectionStore((state) => state.connection);
  const { tabs, setActiveTab, activeTabId } = useTabsStore();
  const activeTab = tabs.find(t => t.id === activeTabId);
  const isExplorerTabActive = activeTab?.type === 'explorer';
  const isSavedQueriesTabActive = activeTab?.type === 'saved-queries';
  const [schemaSidebar, setSchemaSidebar] = useState<{
    projectId: string;
    datasetId: string;
    tableId: string;
  } | null>(null);

  useEffect(() => {
    // Load saved sidebar widths on mount
    if (window.electronAPI) {
      window.electronAPI.uiSettings.getLeftSidebarWidth().then((width) => {
        setLeftSidebarWidth(width);
        resizeStartWidthLeftRef.current = width;
        savedLeftSidebarWidthRef.current = width;
      });
      window.electronAPI.uiSettings.getRightSidebarWidth().then((width) => {
        setRightSidebarWidth(width);
        resizeStartWidthRightRef.current = width;
      });
    }
  }, []);

  // Handle sidebar collapse/expand
  const handleLeftSidebarToggle = useCallback(() => {
    if (leftSidebarCollapsed) {
      // Expanding - restore saved width
      setLeftSidebarCollapsed(false);
      setLeftSidebarWidth(savedLeftSidebarWidthRef.current);
    } else {
      // Collapsing - save current width and set to 0
      savedLeftSidebarWidthRef.current = leftSidebarWidth;
      setLeftSidebarCollapsed(true);
      setLeftSidebarWidth(0);
    }
  }, [leftSidebarCollapsed, leftSidebarWidth]);

  const handleShowSchema = useCallback((projectId: string, datasetId: string, tableId: string) => {
    setSchemaSidebar({ projectId, datasetId, tableId });
  }, []);

  useEffect(() => {
    // Initialize tabs store (load saved tabs)
    initializeTabsStore();
  }, []);

  useEffect(() => {
    // Try to restore saved connection on mount
    if (window.electronAPI) {
      // First check if there's an active connection
      window.electronAPI.connection.getActive().then((activeConnection) => {
        if (activeConnection) {
          useConnectionStore.getState().setConnection(activeConnection);
        } else {
          // Try to restore saved connection
          window.electronAPI.connection.restore().then((restoredConnection) => {
            if (restoredConnection) {
              useConnectionStore.getState().setConnection(restoredConnection);
            } else {
              // No saved connection, show dialog
              setShowConnectionDialog(true);
            }
          }).catch((error) => {
            // Failed to restore (e.g., invalid credentials), show dialog
            console.error('Failed to restore saved connection:', error);
            setShowConnectionDialog(true);
          });
        }
      });
    } else {
      setShowConnectionDialog(true);
    }
  }, []);

  useEffect(() => {
    // Listen for menu events
    if (window.electronAPI?.menu) {
      const removeHelpListener = window.electronAPI.menu.onShowHelp(() => {
        setShowHelpDialog(true);
      });
      const removeAboutListener = window.electronAPI.menu.onShowAbout(() => {
        setShowAboutDialog(true);
      });
      const removeNewTabListener = window.electronAPI.menu.onNewTab(() => {
        useTabsStore.getState().createTab();
      });

      return () => {
        removeHelpListener();
        removeAboutListener();
        removeNewTabListener();
      };
    }
  }, []);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartYRef.current = e.clientY;
    resizeStartHeightRef.current = editorHeight;
  }, [editorHeight]);

  const handleLeftSidebarResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizingLeftSidebar(true);
    resizeStartXLeftRef.current = e.clientX;
    resizeStartWidthLeftRef.current = leftSidebarWidth;
  }, [leftSidebarWidth]);

  const handleRightSidebarResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizingRightSidebar(true);
    resizeStartXRightRef.current = e.clientX;
    resizeStartWidthRightRef.current = rightSidebarWidth;
  }, [rightSidebarWidth]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientY - resizeStartYRef.current;
      const newHeight = Math.max(200, Math.min(800, resizeStartHeightRef.current + diff)); // Min 200px, max 800px
      setEditorHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
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
  }, [isResizing]);

  useEffect(() => {
    if (!isResizingLeftSidebar) return;

    let currentWidth = resizeStartWidthLeftRef.current;
    let rafId: number | null = null;
    let pendingWidth: number | null = null;

    const updateWidth = () => {
      if (pendingWidth !== null) {
        setLeftSidebarWidth(pendingWidth);
        pendingWidth = null;
      }
      rafId = null;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - resizeStartXLeftRef.current;
      const newWidth = Math.max(150, Math.min(600, resizeStartWidthLeftRef.current + diff)); // Min 150px, max 600px
      currentWidth = newWidth;
      pendingWidth = newWidth;
      
      // Throttle updates using requestAnimationFrame
      if (rafId === null) {
        rafId = requestAnimationFrame(updateWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizingLeftSidebar(false);
      // Ensure final width is set
      if (pendingWidth !== null) {
        setLeftSidebarWidth(pendingWidth);
      } else {
        setLeftSidebarWidth(currentWidth);
      }
      // Save the final width
      if (window.electronAPI) {
        window.electronAPI.uiSettings.setLeftSidebarWidth(currentWidth);
      }
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
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
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [isResizingLeftSidebar]);

  useEffect(() => {
    if (!isResizingRightSidebar) return;

    let currentWidth = resizeStartWidthRightRef.current;

    const handleMouseMove = (e: MouseEvent) => {
      const diff = resizeStartXRightRef.current - e.clientX; // Inverted because we're resizing from the right
      currentWidth = Math.max(150, Math.min(600, resizeStartWidthRightRef.current + diff)); // Min 150px, max 600px
      setRightSidebarWidth(currentWidth);
    };

    const handleMouseUp = () => {
      setIsResizingRightSidebar(false);
      // Save the final width
      if (window.electronAPI) {
        window.electronAPI.uiSettings.setRightSidebarWidth(currentWidth);
      }
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
  }, [isResizingRightSidebar]);

  useEffect(() => {
    // Handle keyboard shortcuts for tab navigation (CMD/CTRL + 1-9)
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if CMD (Mac) or CTRL (Windows/Linux) is pressed
      const isModifierPressed = e.metaKey || e.ctrlKey;
      
      // Check if the key is a number between 1-9
      const keyCode = e.key;
      const numberMatch = keyCode.match(/^[1-9]$/);
      
      if (isModifierPressed && numberMatch) {
        // Don't trigger if user is typing in an input field
        const target = e.target as HTMLElement;
        const isInputField = 
          target.tagName === 'INPUT' || 
          target.tagName === 'TEXTAREA' || 
          target.isContentEditable;
        
        if (isInputField) {
          return;
        }
        
        // Prevent default browser behavior (e.g., browser tab switching)
        e.preventDefault();
        
        // Convert key to index (1-9 -> 0-8)
        const tabIndex = parseInt(keyCode, 10) - 1;
        
        // Switch to the tab at the specified index if it exists
        if (tabIndex >= 0 && tabIndex < tabs.length) {
          setActiveTab(tabs[tabIndex].id);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [tabs, setActiveTab]);

  return (
    <div className="app">
      <header className="app-header">
        <h1></h1>
        <div className="header-actions">
          {connection && (
            <div className="connection-status">
              <span className="status-indicator connected"></span>
              <span>{connection.projectId}</span>
            </div>
          )}
          <button onClick={() => setShowSavedQueries(true)}>Saved Queries</button>
          <button onClick={() => setShowConnectionDialog(true)}>Configure Connection</button>
        </div>
      </header>
      <main className="app-main">
        <TabBar />
        <div className="app-content">
          <div style={{ width: leftSidebarCollapsed ? '30px' : `${leftSidebarWidth}px`, flexShrink: 0, minWidth: 0, transition: isResizingLeftSidebar ? 'none' : 'width 0.2s ease' }}>
            {isSavedQueriesTabActive ? (
              <SavedQueriesTree 
                collapsed={leftSidebarCollapsed}
                onToggleCollapse={handleLeftSidebarToggle}
              />
            ) : (
              <DatasetTree 
                collapsed={leftSidebarCollapsed}
                onToggleCollapse={handleLeftSidebarToggle}
                onShowSchema={handleShowSchema} 
              />
            )}
          </div>
          {!leftSidebarCollapsed && (
            <div
              className="resize-handle-vertical"
              onMouseDown={handleLeftSidebarResizeStart}
            />
          )}
          <div className="app-editor-results" ref={editorResultsRef}>
            <div className="query-section" style={{ height: `${editorHeight}px` }}>
              <QueryEditor />
            </div>
            <div
              className="resize-handle-horizontal"
              onMouseDown={handleResizeStart}
            />
            <div className="results-section" style={{ height: `calc(100% - ${editorHeight}px - 4px)` }}>
              <QueryResults />
            </div>
          </div>
          {schemaSidebar && (
            <>
              <div
                className="resize-handle-vertical"
                onMouseDown={handleRightSidebarResizeStart}
              />
              <div style={{ width: `${rightSidebarWidth}px`, flexShrink: 0, minWidth: 0 }}>
                <SchemaSidebar
                  projectId={schemaSidebar.projectId}
                  datasetId={schemaSidebar.datasetId}
                  tableId={schemaSidebar.tableId}
                  onClose={() => setSchemaSidebar(null)}
                />
              </div>
            </>
          )}
        </div>
      </main>
      {showConnectionDialog && (
        <ConnectionDialog onClose={() => setShowConnectionDialog(false)} />
      )}
      {showSavedQueries && (
        <SavedQueries onClose={() => setShowSavedQueries(false)} />
      )}
      {showHelpDialog && (
        <HelpDialog onClose={() => setShowHelpDialog(false)} />
      )}
      {showAboutDialog && (
        <AboutDialog onClose={() => setShowAboutDialog(false)} />
      )}
    </div>
  );
};

export default App;
