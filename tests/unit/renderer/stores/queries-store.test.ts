import { act, renderHook, waitFor } from '@testing-library/react';
import { useQueriesStore } from '../../../../src/renderer/stores/queries-store';
import type { SavedQuery, SaveQueryInput, UpdateQueryInput } from '../../../../src/shared/types/query';

describe('queries-store', () => {
  const mockQueries: SavedQuery[] = [
    {
      id: '1',
      name: 'Sales Report',
      sqlText: 'SELECT * FROM sales',
      description: 'Monthly sales data',
      tags: ['report', 'monthly'],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      name: 'User Analytics',
      sqlText: 'SELECT * FROM users WHERE active = true',
      description: 'Active user metrics',
      tags: ['analytics', 'users'],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    // Reset store state before each test
    useQueriesStore.setState({
      queries: [],
      isLoading: false,
      searchTerm: '',
    });
    
    // Reset mock implementations
    jest.clearAllMocks();
    
    // Setup default mock responses
    (window.electronAPI.queries.list as jest.Mock).mockResolvedValue(mockQueries);
    (window.electronAPI.queries.save as jest.Mock).mockImplementation(async (input: SaveQueryInput) => ({
      id: 'new-id',
      ...input,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    (window.electronAPI.queries.update as jest.Mock).mockImplementation(
      async (id: string, updates: UpdateQueryInput) => ({
        ...mockQueries.find((q) => q.id === id),
        ...updates,
        updatedAt: new Date().toISOString(),
      })
    );
    (window.electronAPI.queries.delete as jest.Mock).mockResolvedValue(undefined);
  });

  describe('initial state', () => {
    it('should have empty queries', () => {
      const { result } = renderHook(() => useQueriesStore());
      expect(result.current.queries).toEqual([]);
    });

    it('should not be loading', () => {
      const { result } = renderHook(() => useQueriesStore());
      expect(result.current.isLoading).toBe(false);
    });

    it('should have empty search term', () => {
      const { result } = renderHook(() => useQueriesStore());
      expect(result.current.searchTerm).toBe('');
    });
  });

  describe('loadQueries', () => {
    it('should load queries from API', async () => {
      const { result } = renderHook(() => useQueriesStore());

      await act(async () => {
        await result.current.loadQueries();
      });

      expect(result.current.queries).toEqual(mockQueries);
      expect(window.electronAPI.queries.list).toHaveBeenCalled();
    });

    it('should set isLoading during load', async () => {
      const { result } = renderHook(() => useQueriesStore());

      // Start the load
      let loadPromise: Promise<void>;
      act(() => {
        loadPromise = result.current.loadQueries();
      });

      // Check loading state
      expect(result.current.isLoading).toBe(true);

      // Wait for completion
      await act(async () => {
        await loadPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should throw error when electronAPI is not available', async () => {
      const { result } = renderHook(() => useQueriesStore());
      
      // Temporarily remove electronAPI
      const originalElectronAPI = window.electronAPI;
      delete (window as any).electronAPI;

      await expect(
        act(async () => {
          await result.current.loadQueries();
        })
      ).rejects.toThrow('Electron API not available');

      // Restore electronAPI
      (window as any).electronAPI = originalElectronAPI;
    });

    it('should set isLoading to false on error', async () => {
      const { result } = renderHook(() => useQueriesStore());
      
      (window.electronAPI.queries.list as jest.Mock).mockRejectedValue(new Error('Load failed'));

      try {
        await act(async () => {
          await result.current.loadQueries();
        });
      } catch (e) {
        // Expected to throw
      }

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('saveQuery', () => {
    it('should save a new query', async () => {
      const { result } = renderHook(() => useQueriesStore());

      const input: SaveQueryInput = {
        name: 'New Query',
        sqlText: 'SELECT 1',
        description: 'A new query',
        tags: ['new'],
      };

      let savedQuery: SavedQuery;
      await act(async () => {
        savedQuery = await result.current.saveQuery(input);
      });

      expect(savedQuery!).toMatchObject({
        id: 'new-id',
        name: 'New Query',
        sqlText: 'SELECT 1',
      });
      expect(result.current.queries).toContainEqual(expect.objectContaining({ id: 'new-id' }));
    });

    it('should call API to save query', async () => {
      const { result } = renderHook(() => useQueriesStore());

      const input: SaveQueryInput = {
        name: 'New Query',
        sqlText: 'SELECT 1',
      };

      await act(async () => {
        await result.current.saveQuery(input);
      });

      expect(window.electronAPI.queries.save).toHaveBeenCalledWith(input);
    });
  });

  describe('updateQuery', () => {
    beforeEach(() => {
      // Pre-populate queries
      useQueriesStore.setState({ queries: mockQueries });
    });

    it('should update an existing query', async () => {
      const { result } = renderHook(() => useQueriesStore());

      const updates: UpdateQueryInput = {
        name: 'Updated Sales Report',
      };

      await act(async () => {
        await result.current.updateQuery('1', updates);
      });

      expect(result.current.queries.find((q) => q.id === '1')?.name).toBe('Updated Sales Report');
    });

    it('should call API to update query', async () => {
      const { result } = renderHook(() => useQueriesStore());

      const updates: UpdateQueryInput = {
        sqlText: 'SELECT * FROM new_table',
      };

      await act(async () => {
        await result.current.updateQuery('1', updates);
      });

      expect(window.electronAPI.queries.update).toHaveBeenCalledWith('1', updates);
    });
  });

  describe('deleteQuery', () => {
    beforeEach(() => {
      // Pre-populate queries
      useQueriesStore.setState({ queries: mockQueries });
    });

    it('should delete a query', async () => {
      const { result } = renderHook(() => useQueriesStore());

      await act(async () => {
        await result.current.deleteQuery('1');
      });

      expect(result.current.queries.find((q) => q.id === '1')).toBeUndefined();
      expect(result.current.queries).toHaveLength(1);
    });

    it('should call API to delete query', async () => {
      const { result } = renderHook(() => useQueriesStore());

      await act(async () => {
        await result.current.deleteQuery('1');
      });

      expect(window.electronAPI.queries.delete).toHaveBeenCalledWith('1');
    });
  });

  describe('setSearchTerm', () => {
    it('should set search term', () => {
      const { result } = renderHook(() => useQueriesStore());

      act(() => {
        result.current.setSearchTerm('sales');
      });

      expect(result.current.searchTerm).toBe('sales');
    });
  });

  describe('getFilteredQueries', () => {
    beforeEach(() => {
      // Pre-populate queries
      useQueriesStore.setState({ queries: mockQueries });
    });

    it('should return all queries for empty search term', () => {
      const { result } = renderHook(() => useQueriesStore());

      const filtered = result.current.getFilteredQueries();
      expect(filtered).toEqual(mockQueries);
    });

    it('should filter queries by name', () => {
      const { result } = renderHook(() => useQueriesStore());

      act(() => {
        result.current.setSearchTerm('sales');
      });

      const filtered = result.current.getFilteredQueries();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Sales Report');
    });

    it('should filter queries by SQL text', () => {
      const { result } = renderHook(() => useQueriesStore());

      act(() => {
        result.current.setSearchTerm('active');
      });

      const filtered = result.current.getFilteredQueries();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('User Analytics');
    });

    it('should filter queries by description', () => {
      const { result } = renderHook(() => useQueriesStore());

      act(() => {
        result.current.setSearchTerm('metrics');
      });

      const filtered = result.current.getFilteredQueries();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('User Analytics');
    });

    it('should filter queries by tags', () => {
      const { result } = renderHook(() => useQueriesStore());

      act(() => {
        result.current.setSearchTerm('monthly');
      });

      const filtered = result.current.getFilteredQueries();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Sales Report');
    });

    it('should be case-insensitive', () => {
      const { result } = renderHook(() => useQueriesStore());

      act(() => {
        result.current.setSearchTerm('SALES');
      });

      const filtered = result.current.getFilteredQueries();
      expect(filtered).toHaveLength(1);
    });

    it('should return all queries for whitespace search term', () => {
      const { result } = renderHook(() => useQueriesStore());

      act(() => {
        result.current.setSearchTerm('   ');
      });

      const filtered = result.current.getFilteredQueries();
      expect(filtered).toEqual(mockQueries);
    });
  });
});
