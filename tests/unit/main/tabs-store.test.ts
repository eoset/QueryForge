// Mock electron-store before importing the module
const mockStore = {
  get: jest.fn(),
  set: jest.fn(),
};

jest.mock('electron-store', () => {
  return jest.fn().mockImplementation(() => mockStore);
});

import type { QueryTab } from '../../../src/shared/types/query';

// Import after mocks are set up
let getTabs: () => QueryTab[];
let getActiveTabId: () => string | null;
let saveTabs: (tabs: QueryTab[], activeTabId: string | null) => void;

describe('tabs-store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    // Re-import the module to reset state
    const tabsStore = require('../../../src/main/storage/tabs-store');
    getTabs = tabsStore.getTabs;
    getActiveTabId = tabsStore.getActiveTabId;
    saveTabs = tabsStore.saveTabs;
  });

  describe('getTabs', () => {
    it('should return empty array when no tabs exist', () => {
      mockStore.get.mockReturnValue([]);
      const result = getTabs();
      expect(result).toEqual([]);
    });

    it('should return empty array when store returns null', () => {
      mockStore.get.mockReturnValue(null);
      const result = getTabs();
      expect(result).toEqual([]);
    });

    it('should return tabs with undefined results', () => {
      const persistedTabs = [
        {
          id: 'tab-1',
          title: 'Query 1',
          type: 'query',
          queryText: 'SELECT 1',
          isModified: false,
          executionStatus: 'idle',
        },
      ];
      mockStore.get.mockReturnValue(persistedTabs);

      const result = getTabs();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('tab-1');
      expect(result[0].results).toBeUndefined();
    });

    it('should preserve all tab properties except results', () => {
      const persistedTabs = [
        {
          id: 'tab-1',
          title: 'Query 1',
          type: 'query',
          queryText: 'SELECT * FROM test',
          isModified: true,
          executionStatus: 'completed',
          jobId: 'job-123',
          error: undefined,
          lastExecuted: '2024-01-01T00:00:00Z',
          savedQueryId: 'saved-1',
        },
      ];
      mockStore.get.mockReturnValue(persistedTabs);

      const result = getTabs();

      expect(result[0]).toMatchObject({
        id: 'tab-1',
        title: 'Query 1',
        type: 'query',
        queryText: 'SELECT * FROM test',
        isModified: true,
        executionStatus: 'completed',
        jobId: 'job-123',
        lastExecuted: '2024-01-01T00:00:00Z',
        savedQueryId: 'saved-1',
      });
    });
  });

  describe('getActiveTabId', () => {
    it('should return null when no active tab', () => {
      mockStore.get.mockReturnValue(null);
      const result = getActiveTabId();
      expect(result).toBeNull();
    });

    it('should return active tab id', () => {
      mockStore.get.mockReturnValue('tab-1');
      const result = getActiveTabId();
      expect(result).toBe('tab-1');
    });
  });

  describe('saveTabs', () => {
    it('should save tabs without results', () => {
      const tabs: QueryTab[] = [
        {
          id: 'tab-1',
          title: 'Query 1',
          type: 'query',
          queryText: 'SELECT 1',
          isModified: false,
          executionStatus: 'completed',
          results: {
            columns: [{ name: 'col', type: 'INTEGER' }],
            rows: [{ values: [1] }],
            totalRows: 1,
            rowsReturned: 1,
            executionTimeMs: 100,
            jobId: 'job-1',
            hasMore: false,
          },
        },
      ];

      saveTabs(tabs, 'tab-1');

      expect(mockStore.set).toHaveBeenCalledWith('tabs', [
        {
          id: 'tab-1',
          title: 'Query 1',
          type: 'query',
          queryText: 'SELECT 1',
          isModified: false,
          executionStatus: 'completed',
        },
      ]);
    });

    it('should save active tab id', () => {
      saveTabs([], 'tab-1');

      expect(mockStore.set).toHaveBeenCalledWith('activeTabId', 'tab-1');
    });

    it('should save null active tab id', () => {
      saveTabs([], null);

      expect(mockStore.set).toHaveBeenCalledWith('activeTabId', null);
    });

    it('should save multiple tabs', () => {
      const tabs: QueryTab[] = [
        {
          id: 'tab-1',
          title: 'Query 1',
          type: 'query',
          queryText: 'SELECT 1',
          isModified: false,
          executionStatus: 'idle',
        },
        {
          id: 'tab-2',
          title: 'Query 2',
          type: 'query',
          queryText: 'SELECT 2',
          isModified: true,
          executionStatus: 'idle',
        },
      ];

      saveTabs(tabs, 'tab-2');

      const savedTabs = mockStore.set.mock.calls.find((call) => call[0] === 'tabs')?.[1];
      expect(savedTabs).toHaveLength(2);
      expect(savedTabs[0].id).toBe('tab-1');
      expect(savedTabs[1].id).toBe('tab-2');
    });
  });
});
