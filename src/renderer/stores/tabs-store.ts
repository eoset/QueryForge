import { create } from 'zustand';
import type { QueryTab, QueryResult } from '../../shared/types/query';

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
}

function generateTabId(): string {
  return `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export const useTabsStore = create<TabsState>((set, get) => ({
  tabs: [
    {
      id: generateTabId(),
      title: 'Query 1',
      queryText: '',
      isModified: false,
      executionStatus: 'idle',
    },
  ],
  activeTabId: null,

  createTab: () => {
    const tabs = get().tabs;
    const newTabId = generateTabId();
    const newTab: QueryTab = {
      id: newTabId,
      title: `Query ${tabs.length + 1}`,
      queryText: '',
      isModified: false,
      executionStatus: 'idle',
    };
    set({
      tabs: [...tabs, newTab],
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
        newActiveTabId = tabIndex > 0 ? tabs[tabIndex - 1].id : newTabs[0].id;
      } else {
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
    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.id === tabId ? { ...tab, ...updates } : tab
      ),
    }));
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
}));

// Initialize active tab on first load
useTabsStore.getState().activeTabId = useTabsStore.getState().tabs[0]?.id || null;

