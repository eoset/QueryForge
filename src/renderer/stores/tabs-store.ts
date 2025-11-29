import { create } from 'zustand';
import type { QueryTab, QueryResult, TabType } from '../../shared/types/query';

interface TabsState {
  tabs: QueryTab[];
  activeTabId: string | null;
  createTab: () => string;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  reorderTabs: (fromIndex: number, toIndex: number) => void;
  updateTab: (tabId: string, updates: Partial<QueryTab>) => void;
  setTabQuery: (tabId: string, queryText: string) => void;
  setTabResults: (tabId: string, results: QueryResult) => void;
  setTabError: (tabId: string, error: string) => void;
  setTabStatus: (tabId: string, status: QueryTab['executionStatus']) => void;
  loadTabs: () => Promise<void>;
  saveTabs: () => Promise<void>;
}

function generateTabId(): string {
  return `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Debounce function for saving tabs
let saveTimeout: NodeJS.Timeout | null = null;
const debouncedSave = (saveFn: () => Promise<void>, delay: number = 500) => {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  saveTimeout = setTimeout(() => {
    saveFn().catch((error) => {
      console.error('Failed to save tabs:', error);
    });
  }, delay);
};

// Explorer tab ID - constant so it can be referenced
export const EXPLORER_TAB_ID = 'explorer-tab';
// Saved Queries tab ID - constant so it can be referenced
export const SAVED_QUERIES_TAB_ID = 'saved-queries-tab';

// Helper function to create Explorer tab
function createExplorerTab(): QueryTab {
  return {
    id: EXPLORER_TAB_ID,
    title: 'Explorer',
    type: 'explorer',
    queryText: '',
    isModified: false,
    executionStatus: 'idle',
  };
}

// Helper function to create Saved Queries tab
function createSavedQueriesTab(): QueryTab {
  return {
    id: SAVED_QUERIES_TAB_ID,
    title: 'Saved Queries',
    type: 'saved-queries',
    queryText: '',
    isModified: false,
    executionStatus: 'idle',
  };
}

// Helper function to ensure Explorer tab is always first and Saved Queries tab is always second
function ensureStaticTabsFirst(tabs: QueryTab[]): QueryTab[] {
  const explorerTab = tabs.find(t => t.id === EXPLORER_TAB_ID) || createExplorerTab();
  const savedQueriesTab = tabs.find(t => t.id === SAVED_QUERIES_TAB_ID) || createSavedQueriesTab();
  const queryTabs = tabs.filter(t => t.id !== EXPLORER_TAB_ID && t.id !== SAVED_QUERIES_TAB_ID);
  return [explorerTab, savedQueriesTab, ...queryTabs];
}

export const useTabsStore = create<TabsState>((set, get) => {
  // Create static tabs
  const explorerTab = createExplorerTab();
  const savedQueriesTab = createSavedQueriesTab();

  return {
    tabs: [
      explorerTab,
      savedQueriesTab,
      {
        id: generateTabId(),
        title: 'Query 1',
        type: 'query',
        queryText: '',
        isModified: false,
        executionStatus: 'idle',
      },
      {
        id: generateTabId(),
        title: 'Query 2',
        type: 'query',
        queryText: '',
        isModified: false,
        executionStatus: 'idle',
      },
    ],
    activeTabId: null,

    loadTabs: async () => {
      if (!window.electronAPI?.tabs) {
        return;
      }
      try {
        const savedTabs = await window.electronAPI.tabs.getTabs();
        const savedActiveTabId = await window.electronAPI.tabs.getActiveTabId();
        
        // Ensure Explorer and Saved Queries tabs exist and are in correct positions
        let tabsWithStatic = savedTabs || [];
        tabsWithStatic = ensureStaticTabsFirst(tabsWithStatic);
        
        if (tabsWithStatic.length === 0) {
          // No saved tabs, use default tabs (which already include static tabs)
          tabsWithStatic = get().tabs;
        }
        
        if (tabsWithStatic.length > 0) {
          set({
            tabs: tabsWithStatic,
            activeTabId: savedActiveTabId || tabsWithStatic[0]?.id || null,
          });
        } else {
          // No saved tabs, use default
          const defaultTabId = get().tabs[0]?.id || null;
          set({ activeTabId: defaultTabId });
        }
      } catch (error) {
        console.error('Failed to load tabs:', error);
        // Use default tab if loading fails
        const defaultTabId = get().tabs[0]?.id || null;
        set({ activeTabId: defaultTabId });
      }
    },

    saveTabs: async () => {
      if (!window.electronAPI?.tabs) {
        return;
      }
      try {
        const { tabs, activeTabId } = get();
        await window.electronAPI.tabs.saveTabs(tabs, activeTabId);
      } catch (error) {
        console.error('Failed to save tabs:', error);
      }
    },

    createTab: () => {
      const tabs = get().tabs;
      // Count only query tabs (not static tabs)
      const queryTabs = tabs.filter(t => t.type === 'query');
      const newTabId = generateTabId();
      const newTab: QueryTab = {
        id: newTabId,
        title: `Query ${queryTabs.length + 1}`,
        type: 'query',
        queryText: '',
        isModified: false,
        executionStatus: 'idle',
      };
      // Add new tab after static tabs (Explorer and Saved Queries)
      const updatedTabs = ensureStaticTabsFirst([...tabs, newTab]);
      set({
        tabs: updatedTabs,
        activeTabId: newTabId,
      });
      return newTabId;
    },

    closeTab: (tabId: string) => {
      const { tabs, activeTabId } = get();
      const tab = tabs.find((t) => t.id === tabId);
      
      // Don't allow closing Explorer or Saved Queries tabs
      if (tab?.type === 'explorer' || tab?.type === 'saved-queries') {
        return;
      }
      
      const tabIndex = tabs.findIndex((t) => t.id === tabId);
      if (tabIndex === -1) return;

      const newTabs = tabs.filter((t) => t.id !== tabId);
      // Ensure static tabs remain in correct positions
      const updatedTabs = ensureStaticTabsFirst(newTabs);
      
      // If closing the active tab, switch to another tab
      let newActiveTabId = activeTabId;
      if (activeTabId === tabId) {
        if (updatedTabs.length > 0) {
          // Switch to the tab that was before this one, or the first query tab, or static tabs
          const queryTabs = updatedTabs.filter(t => t.type === 'query');
          const explorerTab = updatedTabs.find(t => t.id === EXPLORER_TAB_ID);
          const savedQueriesTab = updatedTabs.find(t => t.id === SAVED_QUERIES_TAB_ID);
          
          if (tabIndex > 2) {
            // Was after static tabs, switch to previous query tab
            newActiveTabId = updatedTabs[tabIndex - 1]?.id || queryTabs[0]?.id || savedQueriesTab?.id || explorerTab?.id || null;
          } else {
            // Was first query tab, switch to next query tab or static tabs
            newActiveTabId = queryTabs[0]?.id || savedQueriesTab?.id || explorerTab?.id || null;
          }
        } else {
          // No tabs left (shouldn't happen since Explorer tab is always present)
          newActiveTabId = null;
        }
      }

      set({
        tabs: updatedTabs,
        activeTabId: newActiveTabId,
      });
    },

    setActiveTab: (tabId: string) => {
      set({ activeTabId: tabId });
    },

    reorderTabs: (fromIndex: number, toIndex: number) => {
      const { tabs } = get();
      if (fromIndex === toIndex || fromIndex < 0 || fromIndex >= tabs.length || toIndex < 0 || toIndex >= tabs.length) {
        return;
      }
      
      // Don't allow reordering static tabs (Explorer, Saved Queries) or moving tabs before them
      const fromTab = tabs[fromIndex];
      const toTab = tabs[toIndex];
      if (fromTab?.type === 'explorer' || fromTab?.type === 'saved-queries' ||
          toTab?.type === 'explorer' || toTab?.type === 'saved-queries') {
        return;
      }
      
      // Don't allow moving tabs to position 0 or 1 (Explorer and Saved Queries positions)
      if (toIndex === 0 || toIndex === 1) {
        return;
      }
      
      const newTabs = [...tabs];
      const [movedTab] = newTabs.splice(fromIndex, 1);
      newTabs.splice(toIndex, 0, movedTab);
      
      // Ensure static tabs remain in correct positions (should already be, but enforce it)
      const updatedTabs = ensureStaticTabsFirst(newTabs);
      
      set({ tabs: updatedTabs });
    },

    updateTab: (tabId: string, updates: Partial<QueryTab>) => {
      set((state) => {
        const updatedTabs = state.tabs.map((tab) =>
          tab.id === tabId ? { ...tab, ...updates } : tab
        );
        // Ensure static tabs remain in correct positions after update
        return {
          tabs: ensureStaticTabsFirst(updatedTabs),
        };
      });
    },

    setTabQuery: (tabId: string, queryText: string) => {
      const tab = get().tabs.find((t) => t.id === tabId);
      if (tab) {
        get().updateTab(tabId, {
          queryText,
          isModified: queryText !== (tab.savedQueryId ? tab.queryText : ''),
        });
      }
    },

    setTabResults: (tabId: string, results: QueryResult) => {
      const tab = get().tabs.find((t) => t.id === tabId);
      get().updateTab(tabId, {
        results,
        executionStatus: 'completed',
        error: undefined,
        lastExecuted: new Date().toISOString(),
        lastExecutedQueryText: tab?.queryText || '',
      });
    },

    setTabError: (tabId: string, error: string) => {
      const tab = get().tabs.find((t) => t.id === tabId);
      get().updateTab(tabId, {
        error,
        executionStatus: 'error',
        results: undefined,
        lastExecuted: new Date().toISOString(),
        lastExecutedQueryText: tab?.queryText || '',
      });
    },

    setTabStatus: (tabId: string, status: QueryTab['executionStatus']) => {
      get().updateTab(tabId, { executionStatus: status });
    },
  };
});

// Subscribe to tab changes and auto-save (debounced)
let previousTabs: QueryTab[] = [];
let previousActiveTabId: string | null = null;

useTabsStore.subscribe((state) => {
  // Ensure static tabs are always in correct positions (safety check)
  const explorerTab = state.tabs.find(t => t.id === EXPLORER_TAB_ID);
  const savedQueriesTab = state.tabs.find(t => t.id === SAVED_QUERIES_TAB_ID);
  const explorerIndex = explorerTab ? state.tabs.findIndex(t => t.id === EXPLORER_TAB_ID) : -1;
  const savedQueriesIndex = savedQueriesTab ? state.tabs.findIndex(t => t.id === SAVED_QUERIES_TAB_ID) : -1;
  
  if ((explorerIndex !== 0 && explorerIndex !== -1) || (savedQueriesIndex !== 1 && savedQueriesIndex !== -1)) {
    // Static tabs are not in correct positions, fix them
    const fixedTabs = ensureStaticTabsFirst(state.tabs);
    useTabsStore.setState({ tabs: fixedTabs });
    return;
  }
  
  // Check if tabs or activeTabId actually changed
  const tabsChanged = state.tabs !== previousTabs || state.activeTabId !== previousActiveTabId;
  
  if (tabsChanged) {
    previousTabs = state.tabs;
    previousActiveTabId = state.activeTabId;
    // Auto-save when tabs or activeTabId changes
    debouncedSave(() => useTabsStore.getState().saveTabs());
  }
});

// Track if initialization has been done to prevent multiple calls
let isInitialized = false;

// Initialize tabs loading - will be called from App.tsx when electronAPI is ready
// This function can be called multiple times safely (idempotent)
export function initializeTabsStore(): void {
  if (isInitialized) {
    return; // Already initialized
  }

  if (window.electronAPI?.tabs) {
    isInitialized = true;
    
    useTabsStore.getState().loadTabs().then(() => {
      // Initialize active tab after loading
      const state = useTabsStore.getState();
      if (!state.activeTabId && state.tabs.length > 0) {
        useTabsStore.setState({ activeTabId: state.tabs[0].id });
      }
    }).catch((error) => {
      console.error('Failed to initialize tabs:', error);
      // Fallback: Initialize active tab on first load if loading fails
      useTabsStore.setState({ activeTabId: useTabsStore.getState().tabs[0]?.id || null });
    });

    // Listen for before-close event to save tabs immediately
    window.electronAPI.tabs.onBeforeClose(() => {
      // Clear any pending debounced save and save immediately
      if (saveTimeout) {
        clearTimeout(saveTimeout);
        saveTimeout = null;
      }
      useTabsStore.getState().saveTabs();
    });
  } else {
    // Fallback: Initialize active tab on first load if electronAPI is not available
    useTabsStore.setState({ activeTabId: useTabsStore.getState().tabs[0]?.id || null });
  }
}

// Try to initialize immediately if electronAPI is already available
// Otherwise, it will be initialized from App.tsx
if (typeof window !== 'undefined' && window.electronAPI?.tabs) {
  initializeTabsStore();
}

