import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useConnectionStore } from './stores/connection-store';
import { useTabsStore, initializeTabsStore } from './stores/tabs-store';
import { useThemeStore } from './stores/theme-store';
import { useLLMStore } from './stores/llm-store';
import { ConnectionDialog } from './components/ConnectionDialog/ConnectionDialog';
import { SavedQueries } from './components/SavedQueries/SavedQueries';
import { HelpDialog } from './components/HelpDialog/HelpDialog';
import { AboutDialog } from './components/AboutDialog/AboutDialog';
import { ThemeSettingsDialog } from './components/ThemeSettingsDialog/ThemeSettingsDialog';
import { TabBar } from './components/TabBar/TabBar';
import { SplitEditorContainer } from './components/SplitEditorContainer/SplitEditorContainer';
import { DatasetTree } from './components/DatasetTree/DatasetTree';
import { SavedQueriesTree } from './components/SavedQueriesTree/SavedQueriesTree';
import { QueryHistory } from './components/QueryHistory/QueryHistory';
import { SchemaSidebar } from './components/SchemaSidebar/SchemaSidebar';
import { SidebarSwitcher, type SidebarView } from './components/SidebarSwitcher/SidebarSwitcher';
import { SidebarHeader } from './components/SidebarHeader/SidebarHeader';
import { SchemaSearchModal } from './components/SchemaSearchModal/SchemaSearchModal';
import { AIChatSidebar } from './components/AIChatSidebar/AIChatSidebar';
import { LLMSettingsDialog } from './components/LLMSettingsDialog/LLMSettingsDialog';
import './themes.css';
import './App.css';

const App: React.FC = () => {
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [showSavedQueries, setShowSavedQueries] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [showAboutDialog, setShowAboutDialog] = useState(false);
  const [showSchemaSearch, setShowSchemaSearch] = useState(false);
  const [showThemeSettings, setShowThemeSettings] = useState(false);
  const [showLLMSettings, setShowLLMSettings] = useState(false);
  const [showAIChatSidebar, setShowAIChatSidebar] = useState(false);
  
  // Theme store
  const { initialize: initializeTheme, activeTheme } = useThemeStore();
  const theme = activeTheme.type;
  const [editorHeight, setEditorHeight] = useState(350);
  const [isResizingLeftSidebar, setIsResizingLeftSidebar] = useState(false);
  const [isResizingRightSidebar, setIsResizingRightSidebar] = useState(false);
  const [isResizingAISidebar, setIsResizingAISidebar] = useState(false);
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(268);
  const [rightSidebarWidth, setRightSidebarWidth] = useState(300);
  const [aiSidebarWidth, setAiSidebarWidth] = useState(380);
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const savedLeftSidebarWidthRef = useRef(268); // Store the width before collapse
  const resizeStartXLeftRef = useRef(0);
  const resizeStartWidthLeftRef = useRef(250);
  const resizeStartXRightRef = useRef(0);
  const resizeStartWidthRightRef = useRef(300);
  const resizeStartXAIRef = useRef(0);
  const resizeStartWidthAIRef = useRef(380);
  const editorResultsRef = useRef<HTMLDivElement>(null);
  const connection = useConnectionStore((state) => state.connection);
  const { tabs, setActiveTab, activeTabId, isSplitView } = useTabsStore();
  const { loadSettings: loadLLMSettings } = useLLMStore();
  const activeTab = tabs.find(t => t.id === activeTabId);
  const [sidebarView, setSidebarView] = useState<SidebarView>('explorer');
  const sidebarRefreshFnRef = useRef<(() => void) | null>(null);
  const [sidebarIsLoading, setSidebarIsLoading] = useState(false);
  const insertQueryRef = useRef<((query: string) => void) | null>(null);

  // Reset refresh function when switching views
  useEffect(() => {
    sidebarRefreshFnRef.current = null;
    setSidebarIsLoading(false);
  }, [sidebarView]);

  // Load LLM settings on mount
  useEffect(() => {
    loadLLMSettings();
  }, [loadLLMSettings]);

  // Stable callback that invokes the current refresh function
  const handleSidebarRefresh = useCallback(() => {
    if (sidebarRefreshFnRef.current) {
      sidebarRefreshFnRef.current();
    }
  }, []);
  const [schemaSidebar, setSchemaSidebar] = useState<{
    projectId: string;
    datasetId: string;
    tableId: string;
  } | null>(null);

  useEffect(() => {
    // Load saved sidebar widths on mount
    if (window.electronAPI) {
      window.electronAPI.uiSettings.getLeftSidebarWidth().then((width) => {
        // Ensure minimum width of 268px
        const validWidth = Math.max(268, width);
        setLeftSidebarWidth(validWidth);
        resizeStartWidthLeftRef.current = validWidth;
        savedLeftSidebarWidthRef.current = validWidth;
      });
      window.electronAPI.uiSettings.getRightSidebarWidth().then((width) => {
        setRightSidebarWidth(width);
        resizeStartWidthRightRef.current = width;
      });
    }
    // Initialize theme store (handles loading saved theme)
    initializeTheme();
  }, [initializeTheme]);

  // Handle sidebar collapse/expand
  const handleLeftSidebarToggle = useCallback(() => {
    if (leftSidebarCollapsed) {
      // Expanding - restore saved width, ensuring minimum of 268px
      setLeftSidebarCollapsed(false);
      const restoredWidth = Math.max(268, savedLeftSidebarWidthRef.current);
      setLeftSidebarWidth(restoredWidth);
      savedLeftSidebarWidthRef.current = restoredWidth;
    } else {
      // Collapsing - save current width and set to 0
      savedLeftSidebarWidthRef.current = Math.max(268, leftSidebarWidth);
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
      const removeSearchSchemaListener = window.electronAPI.menu.onSearchSchema(() => {
        setShowSchemaSearch(true);
      });
      const removeThemeSettingsListener = window.electronAPI.menu.onShowThemeSettings(() => {
        setShowThemeSettings(true);
      });
      const removeToggleAIAssistantListener = window.electronAPI.menu.onToggleAIAssistant?.(() => {
        setShowAIChatSidebar((prev) => !prev);
      });

      return () => {
        removeHelpListener();
        removeAboutListener();
        removeNewTabListener();
        removeSearchSchemaListener();
        removeThemeSettingsListener();
        removeToggleAIAssistantListener?.();
      };
    }
  }, []);

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
      const newWidth = Math.max(268, Math.min(600, resizeStartWidthLeftRef.current + diff)); // Min 268px, max 600px
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

  // AI Sidebar resize handler
  const handleAISidebarResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizingAISidebar(true);
    resizeStartXAIRef.current = e.clientX;
    resizeStartWidthAIRef.current = aiSidebarWidth;
  }, [aiSidebarWidth]);

  useEffect(() => {
    if (!isResizingAISidebar) return;

    let currentWidth = resizeStartWidthAIRef.current;

    const handleMouseMove = (e: MouseEvent) => {
      const diff = resizeStartXAIRef.current - e.clientX; // Inverted because we're resizing from the right
      currentWidth = Math.max(300, Math.min(700, resizeStartWidthAIRef.current + diff)); // Min 300px, max 700px
      setAiSidebarWidth(currentWidth);
    };

    const handleMouseUp = () => {
      setIsResizingAISidebar(false);
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
  }, [isResizingAISidebar]);

  // Handle inserting a query from AI chat
  const handleInsertQueryFromAI = useCallback((query: string) => {
    if (insertQueryRef.current) {
      insertQueryRef.current(query);
    }
  }, []);

  useEffect(() => {
    // Handle keyboard shortcuts for tab navigation (CMD/CTRL + 1-9) and schema search (CMD/CTRL + P)
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if CMD (Mac) or CTRL (Windows/Linux) is pressed
      const isModifierPressed = e.metaKey || e.ctrlKey;
      
      // Schema search: CMD/CTRL + P
      if (isModifierPressed && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setShowSchemaSearch(true);
        return;
      }
      
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
        
        // Only switch to query tabs (filter out Explorer/Saved Queries)
        const queryTabs = tabs.filter(tab => tab.type === 'query');
        if (tabIndex >= 0 && tabIndex < queryTabs.length) {
          setActiveTab(queryTabs[tabIndex].id);
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
          <button onClick={() => setShowConnectionDialog(true)}>Configure Connection</button>
        </div>
      </header>
      <main className="app-main">
        {!isSplitView && <TabBar />}
        <div className="app-content">
          <div style={{ width: leftSidebarCollapsed ? '30px' : `${leftSidebarWidth}px`, flexShrink: 0, minWidth: 0, transition: isResizingLeftSidebar ? 'none' : 'width 0.2s ease', display: 'flex', flexDirection: 'column' }}>
            <SidebarHeader
              collapsed={leftSidebarCollapsed}
              onToggleCollapse={handleLeftSidebarToggle}
              onRefresh={sidebarRefreshFnRef.current ? handleSidebarRefresh : undefined}
              isLoading={sidebarIsLoading}
            />
            <SidebarSwitcher
              currentView={sidebarView}
              onViewChange={setSidebarView}
              collapsed={leftSidebarCollapsed}
            />
            {sidebarView === 'saved-queries' ? (
              <SavedQueriesTree 
                collapsed={leftSidebarCollapsed}
                onToggleCollapse={handleLeftSidebarToggle}
                onRefreshReady={(refreshFn, isLoading) => {
                  sidebarRefreshFnRef.current = refreshFn;
                  setSidebarIsLoading(isLoading);
                }}
              />
            ) : sidebarView === 'history' ? (
              <QueryHistory 
                collapsed={leftSidebarCollapsed}
                onToggleCollapse={handleLeftSidebarToggle}
                onRefreshReady={(refreshFn, isLoading) => {
                  sidebarRefreshFnRef.current = refreshFn;
                  setSidebarIsLoading(isLoading);
                }}
              />
            ) : (
              <DatasetTree 
                collapsed={leftSidebarCollapsed}
                onToggleCollapse={handleLeftSidebarToggle}
                onShowSchema={handleShowSchema}
                onRefreshReady={(refreshFn, isLoading) => {
                  sidebarRefreshFnRef.current = refreshFn;
                  setSidebarIsLoading(isLoading);
                }}
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
            <SplitEditorContainer 
              editorHeight={editorHeight}
              onEditorResize={setEditorHeight}
              theme={theme}
            />
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
          {showAIChatSidebar && (
            <>
              <div
                className="resize-handle-vertical"
                onMouseDown={handleAISidebarResizeStart}
              />
              <div style={{ width: `${aiSidebarWidth}px`, flexShrink: 0, minWidth: 0 }}>
                <AIChatSidebar
                  onClose={() => setShowAIChatSidebar(false)}
                  onOpenSettings={() => setShowLLMSettings(true)}
                  onInsertQuery={handleInsertQueryFromAI}
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
      {showSchemaSearch && (
        <SchemaSearchModal
          onClose={() => setShowSchemaSearch(false)}
          onShowSchema={handleShowSchema}
        />
      )}
      {showThemeSettings && (
        <ThemeSettingsDialog onClose={() => setShowThemeSettings(false)} />
      )}
      {showLLMSettings && (
        <LLMSettingsDialog onClose={() => setShowLLMSettings(false)} />
      )}
    </div>
  );
};

export default App;
