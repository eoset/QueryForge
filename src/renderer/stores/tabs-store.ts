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

// Filter out any legacy Explorer or Saved Queries tabs
function filterStaticTabs(tabs: QueryTab[]): QueryTab[] {
  return tabs.filter(t => t.type !== 'explorer' && t.type !== 'saved-queries');
}

export const useTabsStore = create<TabsState>((set, get) => {
  return {
    tabs: [
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
        
        // Filter out any legacy Explorer or Saved Queries tabs
        let filteredTabs = filterStaticTabs(savedTabs || []);
        
        if (filteredTabs.length === 0) {
          // No saved tabs, use default tabs
          filteredTabs = get().tabs;
        }
        
        // Ensure active tab ID is valid (not a static tab)
        const validActiveTabId = filteredTabs.find(t => t.id === savedActiveTabId)?.id || filteredTabs[0]?.id || null;
        
        if (filteredTabs.length > 0) {
          set({
            tabs: filteredTabs,
            activeTabId: validActiveTabId,
          });
        } else {
          // No tabs left, use default
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
      const newTabId = generateTabId();
      const newTab: QueryTab = {
        id: newTabId,
        title: `Query ${tabs.length + 1}`,
        type: 'query',
        queryText: '',
        isModified: false,
        executionStatus: 'idle',
      };
      const updatedTabs = [...tabs, newTab];
      set({
        tabs: updatedTabs,
        activeTabId: newTabId,
      });
      return newTabId;
    },

    closeTab: (tabId: string) => {
      const { tabs, activeTabId } = get();
      const tabIndex = tabs.findIndex((t) => t.id === tabId);
      if (tabIndex === -1) return;

      const newTabs = tabs.filter((t) => t.id !== tabId);
      
      // If closing the active tab, switch to another tab
      let newActiveTabId = activeTabId;
      if (activeTabId === tabId) {
        if (newTabs.length > 0) {
          // Switch to the tab that was before this one, or the first tab
          newActiveTabId = newTabs[tabIndex - 1]?.id || newTabs[0]?.id || null;
        } else {
          // No tabs left
          newActiveTabId = null;
        }
      }

      set({
        tabs: newTabs,
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
      
      const newTabs = [...tabs];
      const [movedTab] = newTabs.splice(fromIndex, 1);
      newTabs.splice(toIndex, 0, movedTab);
      
      set({ tabs: newTabs });
    },

    updateTab: (tabId: string, updates: Partial<QueryTab>) => {
      set((state) => {
        const updatedTabs = state.tabs.map((tab) =>
          tab.id === tabId ? { ...tab, ...updates } : tab
        );
        return {
          tabs: updatedTabs,
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
  // Filter out any legacy static tabs that might have been loaded
  const filteredTabs = filterStaticTabs(state.tabs);
  if (filteredTabs.length !== state.tabs.length) {
    // Found static tabs, remove them
    const validActiveTabId = filteredTabs.find(t => t.id === state.activeTabId)?.id || filteredTabs[0]?.id || null;
    useTabsStore.setState({ tabs: filteredTabs, activeTabId: validActiveTabId });
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

