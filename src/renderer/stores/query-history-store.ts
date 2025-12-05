import { create } from 'zustand';
import type { QueryHistoryEntry } from '../../shared/types/query';

interface QueryHistoryState {
  entries: QueryHistoryEntry[];
  isLoading: boolean;
  searchTerm: string;
  totalCount: number;
  loadHistory: () => Promise<void>;
  addEntry: (entry: Omit<QueryHistoryEntry, 'id'>) => Promise<void>;
  updateEntryByJobId: (jobId: string, totalRows: number) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  setSearchTerm: (term: string) => void;
  getFilteredEntries: () => QueryHistoryEntry[];
}

/**
 * Generate a unique ID for history entries
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export const useQueryHistoryStore = create<QueryHistoryState>((set, get) => ({
  entries: [],
  isLoading: false,
  searchTerm: '',
  totalCount: 0,

  loadHistory: async () => {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }

    set({ isLoading: true });
    try {
      const entries = await window.electronAPI.queryHistory.list(100, 0);
      const totalCount = await window.electronAPI.queryHistory.count();
      set({ entries, totalCount, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  addEntry: async (entryData: Omit<QueryHistoryEntry, 'id'>) => {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }

    const entry: QueryHistoryEntry = {
      ...entryData,
      id: generateId(),
    };

    await window.electronAPI.queryHistory.add(entry);
    
    // Add to the beginning of the list (newest first)
    set((state) => ({
      entries: [entry, ...state.entries].slice(0, 100), // Keep max 100 in memory
      totalCount: state.totalCount + 1,
    }));
  },

  updateEntryByJobId: async (jobId: string, totalRows: number) => {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }

    await window.electronAPI.queryHistory.updateByJobId(jobId, totalRows);
    
    // Update the entry in memory
    set((state) => ({
      entries: state.entries.map((e) =>
        e.jobId === jobId ? { ...e, totalRows } : e
      ),
    }));
  },

  deleteEntry: async (id: string) => {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }

    await window.electronAPI.queryHistory.delete(id);
    set((state) => ({
      entries: state.entries.filter((e) => e.id !== id),
      totalCount: Math.max(0, state.totalCount - 1),
    }));
  },

  clearHistory: async () => {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }

    await window.electronAPI.queryHistory.clear();
    set({ entries: [], totalCount: 0 });
  },

  setSearchTerm: (term: string) => {
    set({ searchTerm: term });
  },

  getFilteredEntries: () => {
    const { entries, searchTerm } = get();
    if (!searchTerm.trim()) {
      return entries;
    }

    const lowerTerm = searchTerm.toLowerCase();
    return entries.filter(
      (e) =>
        e.queryText.toLowerCase().includes(lowerTerm) ||
        e.projectId.toLowerCase().includes(lowerTerm) ||
        (e.errorMessage && e.errorMessage.toLowerCase().includes(lowerTerm))
    );
  },
}));
