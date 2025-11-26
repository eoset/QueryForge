import { create } from 'zustand';
import type { SavedQuery, SaveQueryInput, UpdateQueryInput } from '../../shared/types/query';

interface QueriesState {
  queries: SavedQuery[];
  isLoading: boolean;
  searchTerm: string;
  loadQueries: () => Promise<void>;
  saveQuery: (input: SaveQueryInput) => Promise<SavedQuery>;
  updateQuery: (id: string, updates: UpdateQueryInput) => Promise<void>;
  deleteQuery: (id: string) => Promise<void>;
  setSearchTerm: (term: string) => void;
  getFilteredQueries: () => SavedQuery[];
}

export const useQueriesStore = create<QueriesState>((set, get) => ({
  queries: [],
  isLoading: false,
  searchTerm: '',

  loadQueries: async () => {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }

    set({ isLoading: true });
    try {
      const queries = await window.electronAPI.queries.list();
      set({ queries, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  saveQuery: async (input: SaveQueryInput) => {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }

    const saved = await window.electronAPI.queries.save(input);
    set((state) => ({
      queries: [...state.queries, saved],
    }));
    return saved;
  },

  updateQuery: async (id: string, updates: UpdateQueryInput) => {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }

    const updated = await window.electronAPI.queries.update(id, updates);
    set((state) => ({
      queries: state.queries.map((q) => (q.id === id ? updated : q)),
    }));
  },

  deleteQuery: async (id: string) => {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }

    await window.electronAPI.queries.delete(id);
    set((state) => ({
      queries: state.queries.filter((q) => q.id !== id),
    }));
  },

  setSearchTerm: (term: string) => {
    set({ searchTerm: term });
  },

  getFilteredQueries: () => {
    const { queries, searchTerm } = get();
    if (!searchTerm.trim()) {
      return queries;
    }

    if (!window.electronAPI) {
      return queries;
    }

    // Use IPC search for server-side filtering
    // For now, do client-side filtering
    const lowerTerm = searchTerm.toLowerCase();
    return queries.filter(
      (q) =>
        q.name.toLowerCase().includes(lowerTerm) ||
        q.sqlText.toLowerCase().includes(lowerTerm) ||
        (q.description && q.description.toLowerCase().includes(lowerTerm)) ||
        (q.tags && q.tags.some((tag) => tag.toLowerCase().includes(lowerTerm)))
    );
  },
}));

