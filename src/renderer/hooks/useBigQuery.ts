import { useCallback } from 'react';
import { useConnectionStore } from '../stores/connection-store';
import type { QueryResult } from '../../shared/types/query';

export function useBigQuery() {
  const connection = useConnectionStore((state) => state.connection);

  const executeQuery = useCallback(
    async (queryText: string): Promise<QueryResult> => {
      if (!connection) {
        throw new Error('No active connection');
      }

      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }

      return await window.electronAPI.bigquery.execute(queryText, connection.projectId);
    },
    [connection]
  );

  const cancelQuery = useCallback(
    async (jobId: string): Promise<void> => {
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }

      return await window.electronAPI.bigquery.cancel(jobId);
    },
    []
  );

  return {
    executeQuery,
    cancelQuery,
    isConnected: !!connection,
  };
}

