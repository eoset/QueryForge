import Store from 'electron-store';
import type { QueryTab } from '../../shared/types/query';

interface TabsStoreData {
  tabs: QueryTab[];
  activeTabId: string | null;
}

// For persistence, we'll exclude large result data but keep everything else
type PersistedTab = Omit<QueryTab, 'results'> & {
  results?: never; // Explicitly exclude results from persisted data
};

interface PersistedTabsStoreData {
  tabs: PersistedTab[];
  activeTabId: string | null;
}

const store = new Store<PersistedTabsStoreData>({
  name: 'tabs',
  defaults: {
    tabs: [],
    activeTabId: null,
  },
}) as Store<PersistedTabsStoreData> & {
  get(key: 'tabs'): PersistedTab[];
  set(key: 'tabs', value: PersistedTab[]): void;
  get(key: 'activeTabId'): string | null;
  set(key: 'activeTabId', value: string | null): void;
};

export function getTabs(): QueryTab[] {
  const persistedTabs = store.get('tabs') || [];
  // Convert persisted tabs back to QueryTab (results will be undefined)
  return persistedTabs.map((tab) => ({
    ...tab,
    results: undefined,
  }));
}

export function getActiveTabId(): string | null {
  return store.get('activeTabId') || null;
}

export function saveTabs(tabs: QueryTab[], activeTabId: string | null): void {
  // Remove results before persisting (they can be very large)
  const persistedTabs: PersistedTab[] = tabs.map(({ results, ...tab }) => tab);
  store.set('tabs', persistedTabs);
  store.set('activeTabId', activeTabId);
}

