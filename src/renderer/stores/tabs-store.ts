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

// Helper function to ensure Explorer tab is always first
function ensureExplorerTabFirst(tabs: QueryTab[]): QueryTab[] {
  const explorerTab = tabs.find(t => t.id === EXPLORER_TAB_ID) || createExplorerTab();
  const queryTabs = tabs.filter(t => t.id !== EXPLORER_TAB_ID);
  return [explorerTab, ...queryTabs];
}

export const useTabsStore = create<TabsState>((set, get) => {
  // Create Explorer tab
  const explorerTab = createExplorerTab();

  return {
    tabs: [
      explorerTab,
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
        
        // Ensure Explorer tab exists and is first
        let tabsWithExplorer = savedTabs || [];
        tabsWithExplorer = ensureExplorerTabFirst(tabsWithExplorer);
        
        if (tabsWithExplorer.length === 0) {
          // No saved tabs, use default tabs (which already include Explorer)
          tabsWithExplorer = get().tabs;
        }
        
        if (tabsWithExplorer.length > 0) {
          set({
            tabs: tabsWithExplorer,
            activeTabId: savedActiveTabId || tabsWithExplorer[0]?.id || null,
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
      // Count only query tabs (not explorer tab)
      const queryTabs = tabs.filter(t => t.type !== 'explorer');
      const newTabId = generateTabId();
      const newTab: QueryTab = {
        id: newTabId,
        title: `Query ${queryTabs.length + 1}`,
        type: 'query',
        queryText: '',
        isModified: false,
        executionStatus: 'idle',
      };
      // Add new tab after Explorer tab (always first)
      const updatedTabs = ensureExplorerTabFirst([...tabs, newTab]);
      set({
        tabs: updatedTabs,
        activeTabId: newTabId,
      });
      return newTabId;
    },

    closeTab: (tabId: string) => {
      const { tabs, activeTabId } = get();
      const tab = tabs.find((t) => t.id === tabId);
      
      // Don't allow closing Explorer tab
      if (tab?.type === 'explorer') {
        return;
      }
      
      const tabIndex = tabs.findIndex((t) => t.id === tabId);
      if (tabIndex === -1) return;

      const newTabs = tabs.filter((t) => t.id !== tabId);
      // Ensure Explorer tab remains first
      const updatedTabs = ensureExplorerTabFirst(newTabs);
      
      // If closing the active tab, switch to another tab
      let newActiveTabId = activeTabId;
      if (activeTabId === tabId) {
        if (updatedTabs.length > 0) {
          // Switch to the tab that was before this one, or the first query tab (skip Explorer)
          const queryTabs = updatedTabs.filter(t => t.type !== 'explorer');
          if (tabIndex > 1) {
            // Was after Explorer, switch to previous query tab
            newActiveTabId = updatedTabs[tabIndex - 1]?.id || queryTabs[0]?.id || updatedTabs[0]?.id || null;
          } else {
            // Was first query tab, switch to Explorer or next query tab
            newActiveTabId = queryTabs[0]?.id || updatedTabs[0]?.id || null;
          }
        } else {
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
      
      // Don't allow reordering Explorer tab or moving tabs before Explorer (index 0)
      const fromTab = tabs[fromIndex];
      const toTab = tabs[toIndex];
      if (fromTab?.type === 'explorer' || toTab?.type === 'explorer') {
        return;
      }
      
      // Don't allow moving tabs to position 0 (Explorer tab position)
      if (toIndex === 0) {
        return;
      }
      
      const newTabs = [...tabs];
      const [movedTab] = newTabs.splice(fromIndex, 1);
      newTabs.splice(toIndex, 0, movedTab);
      
      // Ensure Explorer tab remains first (should already be, but enforce it)
      const updatedTabs = ensureExplorerTabFirst(newTabs);
      
      set({ tabs: updatedTabs });
    },

    updateTab: (tabId: string, updates: Partial<QueryTab>) => {
      set((state) => {
        const updatedTabs = state.tabs.map((tab) =>
          tab.id === tabId ? { ...tab, ...updates } : tab
        );
        // Ensure Explorer tab remains first after update
        return {
          tabs: ensureExplorerTabFirst(updatedTabs),
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
  // Ensure Explorer tab is always first (safety check)
  const explorerTab = state.tabs.find(t => t.id === EXPLORER_TAB_ID);
  const explorerIndex = explorerTab ? state.tabs.findIndex(t => t.id === EXPLORER_TAB_ID) : -1;
  
  if (explorerIndex !== 0 && explorerIndex !== -1) {
    // Explorer tab is not first, fix it
    const fixedTabs = ensureExplorerTabFirst(state.tabs);
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

