/**
 * Additional unit tests for tabs-store
 */
import { act, renderHook } from '@testing-library/react';
import { useTabsStore } from '../../../../src/renderer/stores/tabs-store';
import type { QueryTab } from '../../../../src/shared/types/query';

describe('tabs-store additional tests', () => {
  beforeEach(() => {
    // Reset store state before each test
    act(() => {
      useTabsStore.setState({
        tabs: [
          {
            id: 'tab-1',
            title: 'Query 1',
            type: 'query',
            queryText: '',
            isModified: false,
            executionStatus: 'idle',
          },
          {
            id: 'tab-2',
            title: 'Query 2',
            type: 'query',
            queryText: '',
            isModified: false,
            executionStatus: 'idle',
          },
        ],
        activeTabId: 'tab-1',
      });
    });
  });

  describe('updateTab', () => {
    it('should update tab title', () => {
      const { result } = renderHook(() => useTabsStore());

      act(() => {
        result.current.updateTab('tab-1', { title: 'Updated Title' });
      });

      const tab = result.current.tabs.find((t) => t.id === 'tab-1');
      expect(tab?.title).toBe('Updated Title');
    });

    it('should update tab query text', () => {
      const { result } = renderHook(() => useTabsStore());

      act(() => {
        result.current.updateTab('tab-1', { queryText: 'SELECT * FROM test' });
      });

      const tab = result.current.tabs.find((t) => t.id === 'tab-1');
      expect(tab?.queryText).toBe('SELECT * FROM test');
    });

    it('should update tab isModified', () => {
      const { result } = renderHook(() => useTabsStore());

      act(() => {
        result.current.updateTab('tab-1', { isModified: true });
      });

      const tab = result.current.tabs.find((t) => t.id === 'tab-1');
      expect(tab?.isModified).toBe(true);
    });

    it('should not affect other tabs', () => {
      const { result } = renderHook(() => useTabsStore());

      act(() => {
        result.current.updateTab('tab-1', { title: 'Updated' });
      });

      const otherTab = result.current.tabs.find((t) => t.id === 'tab-2');
      expect(otherTab?.title).toBe('Query 2');
    });
  });

  describe('setTabQuery', () => {
    it('should set query text', () => {
      const { result } = renderHook(() => useTabsStore());

      act(() => {
        result.current.setTabQuery('tab-1', 'SELECT 1');
      });

      const tab = result.current.tabs.find((t) => t.id === 'tab-1');
      expect(tab?.queryText).toBe('SELECT 1');
    });

    it('should mark tab as modified when query changes', () => {
      const { result } = renderHook(() => useTabsStore());

      act(() => {
        result.current.setTabQuery('tab-1', 'SELECT 1');
      });

      const tab = result.current.tabs.find((t) => t.id === 'tab-1');
      expect(tab?.isModified).toBe(true);
    });
  });

  describe('setTabResults', () => {
    it('should set results and update status to completed', () => {
      const { result } = renderHook(() => useTabsStore());

      const mockResults = {
        columns: [{ name: 'col1', type: 'STRING' }],
        rows: [{ values: ['value1'] }],
        totalRows: 1,
        rowsReturned: 1,
        executionTimeMs: 100,
        jobId: 'job-123',
        hasMore: false,
      };

      act(() => {
        result.current.setTabResults('tab-1', mockResults);
      });

      const tab = result.current.tabs.find((t) => t.id === 'tab-1');
      expect(tab?.results).toEqual(mockResults);
      expect(tab?.executionStatus).toBe('completed');
    });
  });

  describe('setTabError', () => {
    it('should set error and update status', () => {
      const { result } = renderHook(() => useTabsStore());

      act(() => {
        result.current.setTabError('tab-1', 'Query failed');
      });

      const tab = result.current.tabs.find((t) => t.id === 'tab-1');
      expect(tab?.error).toBe('Query failed');
      expect(tab?.executionStatus).toBe('error');
    });
  });

  describe('setTabStatus', () => {
    it('should set execution status', () => {
      const { result } = renderHook(() => useTabsStore());

      act(() => {
        result.current.setTabStatus('tab-1', 'running');
      });

      const tab = result.current.tabs.find((t) => t.id === 'tab-1');
      expect(tab?.executionStatus).toBe('running');
    });
  });

  describe('reorderTabs', () => {
    it('should reorder tabs', () => {
      const { result } = renderHook(() => useTabsStore());

      const initialFirstTabId = result.current.tabs[0].id;
      const initialSecondTabId = result.current.tabs[1].id;

      act(() => {
        result.current.reorderTabs(0, 1);
      });

      expect(result.current.tabs[0].id).toBe(initialSecondTabId);
      expect(result.current.tabs[1].id).toBe(initialFirstTabId);
    });

    it('should not reorder if indices are the same', () => {
      const { result } = renderHook(() => useTabsStore());

      const tabsBefore = [...result.current.tabs];

      act(() => {
        result.current.reorderTabs(0, 0);
      });

      expect(result.current.tabs).toEqual(tabsBefore);
    });

    it('should not reorder if indices are out of bounds', () => {
      const { result } = renderHook(() => useTabsStore());

      const tabsBefore = [...result.current.tabs];

      act(() => {
        result.current.reorderTabs(-1, 0);
      });

      expect(result.current.tabs).toEqual(tabsBefore);
    });
  });

  describe('createTab', () => {
    it('should create a new tab', () => {
      const { result } = renderHook(() => useTabsStore());

      const initialCount = result.current.tabs.length;

      act(() => {
        result.current.createTab();
      });

      expect(result.current.tabs.length).toBe(initialCount + 1);
    });

    it('should set new tab as active', () => {
      const { result } = renderHook(() => useTabsStore());

      let newTabId: string;
      act(() => {
        newTabId = result.current.createTab();
      });

      expect(result.current.activeTabId).toBe(newTabId!);
    });

    it('should return the new tab id', () => {
      const { result } = renderHook(() => useTabsStore());

      let newTabId: string;
      act(() => {
        newTabId = result.current.createTab();
      });

      expect(newTabId!).toBeTruthy();
      expect(result.current.tabs.find((t) => t.id === newTabId!)).toBeTruthy();
    });
  });

  describe('closeTab', () => {
    it('should close the specified tab', () => {
      const { result } = renderHook(() => useTabsStore());

      act(() => {
        result.current.closeTab('tab-1');
      });

      expect(result.current.tabs.find((t) => t.id === 'tab-1')).toBeUndefined();
    });

    it('should switch active tab when closing active tab', () => {
      const { result } = renderHook(() => useTabsStore());

      // tab-1 is active
      expect(result.current.activeTabId).toBe('tab-1');

      act(() => {
        result.current.closeTab('tab-1');
      });

      // Should switch to tab-2
      expect(result.current.activeTabId).toBe('tab-2');
    });

    it('should not affect active tab when closing non-active tab', () => {
      const { result } = renderHook(() => useTabsStore());

      expect(result.current.activeTabId).toBe('tab-1');

      act(() => {
        result.current.closeTab('tab-2');
      });

      expect(result.current.activeTabId).toBe('tab-1');
    });
  });

  describe('setActiveTab', () => {
    it('should set active tab', () => {
      const { result } = renderHook(() => useTabsStore());

      act(() => {
        result.current.setActiveTab('tab-2');
      });

      expect(result.current.activeTabId).toBe('tab-2');
    });
  });
});
