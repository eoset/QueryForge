import { create } from 'zustand';
import type { QueryTab, QueryResult, SplitSide } from '../../shared/types/query';

interface TabsState {
  tabs: QueryTab[];
  activeTabId: string | null;
  // Global split view state
  isSplitView: boolean;
  splitRatio: number;
  activeLeftTabId: string | null;
  activeRightTabId: string | null;
  // Tab management
  createTab: (side?: SplitSide) => string;
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
  // Split view functions
  splitTabToRight: (tabId: string) => void;
  moveTabToSide: (tabId: string, side: SplitSide) => void;
  closeSplitView: () => void;
  setSplitRatio: (ratio: number) => void;
  setActiveSideTab: (side: SplitSide, tabId: string) => void;
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
    // Global split view state
    isSplitView: false,
    splitRatio: 0.5,
    activeLeftTabId: null,
    activeRightTabId: null,

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

    createTab: (side?: SplitSide) => {
      const { tabs, isSplitView } = get();
      const newTabId = generateTabId();
      
      // Count tabs to generate title
      const queryTabCount = tabs.filter(t => t.type === 'query').length;
      
      const newTab: QueryTab = {
        id: newTabId,
        title: `Query ${queryTabCount + 1}`,
        type: 'query',
        queryText: '',
        isModified: false,
        executionStatus: 'idle',
        splitSide: isSplitView ? (side || 'left') : undefined,
      };
      
      const updatedTabs = [...tabs, newTab];
      
      // Update active tab for the appropriate side
      if (isSplitView && side === 'right') {
        set({
          tabs: updatedTabs,
          activeRightTabId: newTabId,
          activeTabId: newTabId,
        });
      } else if (isSplitView) {
        set({
          tabs: updatedTabs,
          activeLeftTabId: newTabId,
          activeTabId: newTabId,
        });
      } else {
        set({
          tabs: updatedTabs,
          activeTabId: newTabId,
        });
      }
      
      return newTabId;
    },

    closeTab: (tabId: string) => {
      const { tabs, activeTabId, isSplitView, activeLeftTabId, activeRightTabId } = get();
      const tab = tabs.find((t) => t.id === tabId);
      if (!tab) return;

      const tabIndex = tabs.findIndex((t) => t.id === tabId);
      const newTabs = tabs.filter((t) => t.id !== tabId);
      
      // Determine which tabs belong to which side
      const leftTabs = newTabs.filter(t => !t.splitSide || t.splitSide === 'left');
      const rightTabs = newTabs.filter(t => t.splitSide === 'right');
      
      let newActiveTabId = activeTabId;
      let newActiveLeftTabId = activeLeftTabId;
      let newActiveRightTabId = activeRightTabId;
      let newIsSplitView = isSplitView;
      
      if (isSplitView) {
        // In split view mode
        if (tab.splitSide === 'right') {
          // Closing a right-side tab
          if (activeRightTabId === tabId) {
            // Find another right tab, or close split view
            const nextRightTab = rightTabs[0];
            if (nextRightTab) {
              newActiveRightTabId = nextRightTab.id;
            } else {
              // No more right tabs, close split view
              newIsSplitView = false;
              newActiveRightTabId = null;
              // Move focus to left side
              newActiveTabId = newActiveLeftTabId;
            }
          }
        } else {
          // Closing a left-side tab
          if (activeLeftTabId === tabId) {
            const nextLeftTab = leftTabs.length > 0 ? leftTabs[Math.max(0, leftTabs.findIndex(t => t.id === tabId) - 1)] || leftTabs[0] : null;
            if (nextLeftTab) {
              newActiveLeftTabId = nextLeftTab.id;
            } else if (rightTabs.length > 0) {
              // No more left tabs, move all right tabs to left and close split
              newIsSplitView = false;
              newActiveLeftTabId = null;
              newActiveRightTabId = null;
              newActiveTabId = rightTabs[0].id;
              // Clear splitSide from all remaining tabs
              newTabs.forEach(t => { t.splitSide = undefined; });
            } else {
              newActiveLeftTabId = null;
              newActiveTabId = null;
            }
          }
        }
        
        // Update active tab to be the focused side's active tab
        if (newIsSplitView) {
          newActiveTabId = tab.splitSide === 'right' ? newActiveLeftTabId : (activeTabId === tabId ? newActiveLeftTabId : activeTabId);
        }
      } else {
        // Single view mode
        if (activeTabId === tabId) {
          if (newTabs.length > 0) {
            newActiveTabId = newTabs[Math.max(0, tabIndex - 1)]?.id || newTabs[0]?.id || null;
          } else {
            newActiveTabId = null;
          }
        }
      }

      set({
        tabs: newTabs,
        activeTabId: newActiveTabId,
        isSplitView: newIsSplitView,
        activeLeftTabId: newActiveLeftTabId,
        activeRightTabId: newActiveRightTabId,
      });
    },

    setActiveTab: (tabId: string) => {
      const { tabs, isSplitView } = get();
      const tab = tabs.find(t => t.id === tabId);
      if (!tab) return;
      
      if (isSplitView) {
        if (tab.splitSide === 'right') {
          set({ activeTabId: tabId, activeRightTabId: tabId });
        } else {
          set({ activeTabId: tabId, activeLeftTabId: tabId });
        }
      } else {
        set({ activeTabId: tabId });
      }
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

    // Split view functions
    splitTabToRight: (tabId: string) => {
      const { tabs, activeLeftTabId } = get();
      const tab = tabs.find(t => t.id === tabId);
      if (!tab) return;
      
      // Mark the tab as belonging to the right side
      const updatedTabs = tabs.map(t => 
        t.id === tabId 
          ? { ...t, splitSide: 'right' as SplitSide }
          : t
      );
      
      // Find another tab for the left side if needed
      const leftTabs = updatedTabs.filter(t => !t.splitSide || t.splitSide === 'left');
      let newActiveLeftTabId = activeLeftTabId;
      
      if (activeLeftTabId === tabId || !leftTabs.find(t => t.id === activeLeftTabId)) {
        // Need to find a new left tab
        newActiveLeftTabId = leftTabs[0]?.id || null;
        
        // If no left tabs exist, create one
        if (!newActiveLeftTabId) {
          const newTabId = generateTabId();
          const queryTabCount = updatedTabs.filter(t => t.type === 'query').length;
          const newTab: QueryTab = {
            id: newTabId,
            title: `Query ${queryTabCount + 1}`,
            type: 'query',
            queryText: '',
            isModified: false,
            executionStatus: 'idle',
            splitSide: 'left',
          };
          updatedTabs.push(newTab);
          newActiveLeftTabId = newTabId;
        }
      }
      
      set({
        tabs: updatedTabs,
        isSplitView: true,
        splitRatio: 0.5,
        activeLeftTabId: newActiveLeftTabId,
        activeRightTabId: tabId,
        activeTabId: tabId, // Focus on the newly split tab
      });
    },

    moveTabToSide: (tabId: string, side: SplitSide) => {
      const { tabs, activeLeftTabId, activeRightTabId, isSplitView } = get();
      if (!isSplitView) return;
      
      const tab = tabs.find(t => t.id === tabId);
      if (!tab) return;
      
      // Update the tab's side
      const updatedTabs = tabs.map(t =>
        t.id === tabId ? { ...t, splitSide: side } : t
      );
      
      // Update active tabs for each side
      let newActiveLeftTabId = activeLeftTabId;
      let newActiveRightTabId = activeRightTabId;
      
      if (side === 'right' && activeLeftTabId === tabId) {
        // Moving from left to right, find new left active
        const leftTabs = updatedTabs.filter(t => !t.splitSide || t.splitSide === 'left');
        newActiveLeftTabId = leftTabs[0]?.id || null;
      } else if (side === 'left' && activeRightTabId === tabId) {
        // Moving from right to left, find new right active
        const rightTabs = updatedTabs.filter(t => t.splitSide === 'right');
        newActiveRightTabId = rightTabs[0]?.id || null;
      }
      
      // Set the moved tab as active on its new side
      if (side === 'right') {
        newActiveRightTabId = tabId;
      } else {
        newActiveLeftTabId = tabId;
      }
      
      set({
        tabs: updatedTabs,
        activeLeftTabId: newActiveLeftTabId,
        activeRightTabId: newActiveRightTabId,
      });
    },

    closeSplitView: () => {
      const { tabs, activeLeftTabId, activeRightTabId } = get();
      
      // Clear splitSide from all tabs
      const updatedTabs = tabs.map(t => ({ ...t, splitSide: undefined }));
      
      // Use the active left tab, or fall back to right, or first tab
      const newActiveTabId = activeLeftTabId || activeRightTabId || updatedTabs[0]?.id || null;
      
      set({
        tabs: updatedTabs,
        isSplitView: false,
        splitRatio: 0.5,
        activeLeftTabId: null,
        activeRightTabId: null,
        activeTabId: newActiveTabId,
      });
    },

    setSplitRatio: (ratio: number) => {
      set({ splitRatio: Math.max(0.2, Math.min(0.8, ratio)) });
    },

    setActiveSideTab: (side: SplitSide, tabId: string) => {
      if (side === 'left') {
        set({ activeLeftTabId: tabId, activeTabId: tabId });
      } else {
        set({ activeRightTabId: tabId, activeTabId: tabId });
      }
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

