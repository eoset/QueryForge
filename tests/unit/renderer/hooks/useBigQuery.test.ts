import { renderHook, act, waitFor } from '@testing-library/react';
import { useBigQuery } from '../../../../src/renderer/hooks/useBigQuery';
import { useConnectionStore } from '../../../../src/renderer/stores/connection-store';

describe('useBigQuery', () => {
  beforeEach(() => {
    // Reset connection store
    act(() => {
      useConnectionStore.getState().clearConnection();
    });

    // Reset mocks
    jest.clearAllMocks();
    (window.electronAPI.bigquery.execute as jest.Mock).mockResolvedValue({
      columns: [{ name: 'col1', type: 'STRING' }],
      rows: [{ values: ['value1'] }],
      totalRows: 1,
      rowsReturned: 1,
      executionTimeMs: 100,
      jobId: 'job-123',
      hasMore: false,
    });
    (window.electronAPI.bigquery.cancel as jest.Mock).mockResolvedValue(undefined);
  });

  describe('isConnected', () => {
    it('should return false when no connection', () => {
      const { result } = renderHook(() => useBigQuery());
      expect(result.current.isConnected).toBe(false);
    });

    it('should return true when connected', () => {
      act(() => {
        useConnectionStore.getState().setConnection({
          projectId: 'test-project',
          authType: 'application-default',
          location: 'EU',
          isActive: true,
        });
      });

      const { result } = renderHook(() => useBigQuery());
      expect(result.current.isConnected).toBe(true);
    });
  });

  describe('executeQuery', () => {
    it('should throw error when no connection', async () => {
      const { result } = renderHook(() => useBigQuery());

      await expect(result.current.executeQuery('SELECT 1')).rejects.toThrow('No active connection');
    });

    it('should execute query when connected', async () => {
      act(() => {
        useConnectionStore.getState().setConnection({
          projectId: 'test-project',
          authType: 'application-default',
          location: 'EU',
          isActive: true,
        });
      });

      const { result } = renderHook(() => useBigQuery());

      const queryResult = await result.current.executeQuery('SELECT 1');

      expect(window.electronAPI.bigquery.execute).toHaveBeenCalledWith('SELECT 1', 'test-project', undefined);
      expect(queryResult.jobId).toBe('job-123');
    });

    it('should pass query text to API', async () => {
      act(() => {
        useConnectionStore.getState().setConnection({
          projectId: 'test-project',
          authType: 'application-default',
          location: 'EU',
          isActive: true,
        });
      });

      const { result } = renderHook(() => useBigQuery());

      await result.current.executeQuery('SELECT * FROM `dataset.table`');

      expect(window.electronAPI.bigquery.execute).toHaveBeenCalledWith(
        'SELECT * FROM `dataset.table`',
        'test-project',
        undefined
      );
    });

    it('should return query result', async () => {
      act(() => {
        useConnectionStore.getState().setConnection({
          projectId: 'test-project',
          authType: 'application-default',
          location: 'EU',
          isActive: true,
        });
      });

      const { result } = renderHook(() => useBigQuery());

      const queryResult = await result.current.executeQuery('SELECT 1');

      expect(queryResult).toEqual({
        columns: [{ name: 'col1', type: 'STRING' }],
        rows: [{ values: ['value1'] }],
        totalRows: 1,
        rowsReturned: 1,
        executionTimeMs: 100,
        jobId: 'job-123',
        hasMore: false,
      });
    });

    it('should propagate API errors', async () => {
      act(() => {
        useConnectionStore.getState().setConnection({
          projectId: 'test-project',
          authType: 'application-default',
          location: 'EU',
          isActive: true,
        });
      });

      (window.electronAPI.bigquery.execute as jest.Mock).mockRejectedValue(
        new Error('Query syntax error')
      );

      const { result } = renderHook(() => useBigQuery());

      await expect(result.current.executeQuery('INVALID SQL')).rejects.toThrow('Query syntax error');
    });
  });

  describe('cancelQuery', () => {
    it('should cancel a running query', async () => {
      const { result } = renderHook(() => useBigQuery());

      await result.current.cancelQuery('job-123');

      expect(window.electronAPI.bigquery.cancel).toHaveBeenCalledWith('job-123');
    });

    it('should propagate cancel errors', async () => {
      (window.electronAPI.bigquery.cancel as jest.Mock).mockRejectedValue(
        new Error('Job not found')
      );

      const { result } = renderHook(() => useBigQuery());

      await expect(result.current.cancelQuery('invalid-job')).rejects.toThrow('Job not found');
    });
  });

  describe('connection state changes', () => {
    it('should update isConnected when connection changes', () => {
      const { result, rerender } = renderHook(() => useBigQuery());

      expect(result.current.isConnected).toBe(false);

      // Set connection
      act(() => {
        useConnectionStore.getState().setConnection({
          projectId: 'test-project',
          authType: 'application-default',
          location: 'EU',
          isActive: true,
        });
      });

      rerender();
      expect(result.current.isConnected).toBe(true);

      // Clear connection
      act(() => {
        useConnectionStore.getState().clearConnection();
      });

      rerender();
      expect(result.current.isConnected).toBe(false);
    });
  });
});
