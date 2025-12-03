import { ipcMain } from 'electron';
import {
  saveResults,
  getResults,
  getResultsMetadata,
  getResultsPage,
  getResultsRange,
  deleteResults,
  clearAllResults,
  closeDatabase,
  getCacheStats,
} from '../storage/results-cache-sqlite';
import type { QueryResult, Row } from '../../shared/types/query';
import { BigQueryErrorCode } from '../../shared/types/bigquery';

export function registerResultsCacheHandlers(): void {
  ipcMain.handle('results-cache:save', async (_event, tabId: string, results: QueryResult): Promise<void> => {
    try {
      saveResults(tabId, results);
    } catch (error: any) {
      throw {
        code: BigQueryErrorCode.STORAGE_ERROR,
        message: 'Failed to save results to cache',
        details: error.message,
      };
    }
  });

  ipcMain.handle('results-cache:get', async (_event, tabId: string): Promise<QueryResult | null> => {
    try {
      const results = getResults(tabId);
      return results || null;
    } catch (error: any) {
      throw {
        code: BigQueryErrorCode.STORAGE_ERROR,
        message: 'Failed to get results from cache',
        details: error.message,
      };
    }
  });

  ipcMain.handle('results-cache:getMetadata', async (_event, tabId: string) => {
    try {
      const metadata = getResultsMetadata(tabId);
      return metadata || null;
    } catch (error: any) {
      throw {
        code: BigQueryErrorCode.STORAGE_ERROR,
        message: 'Failed to get results metadata from cache',
        details: error.message,
      };
    }
  });

  ipcMain.handle('results-cache:getPage', async (_event, tabId: string, pageNumber: number): Promise<Row[] | null> => {
    try {
      const page = getResultsPage(tabId, pageNumber);
      return page || null;
    } catch (error: any) {
      throw {
        code: BigQueryErrorCode.STORAGE_ERROR,
        message: 'Failed to get results page from cache',
        details: error.message,
      };
    }
  });

  ipcMain.handle('results-cache:delete', async (_event, tabId: string): Promise<void> => {
    try {
      deleteResults(tabId);
    } catch (error: any) {
      throw {
        code: BigQueryErrorCode.STORAGE_ERROR,
        message: 'Failed to delete results from cache',
        details: error.message,
      };
    }
  });

  ipcMain.handle('results-cache:clear', async (): Promise<void> => {
    try {
      clearAllResults();
    } catch (error: any) {
      throw {
        code: BigQueryErrorCode.STORAGE_ERROR,
        message: 'Failed to clear results cache',
        details: error.message,
      };
    }
  });

  // New: Get a range of rows (for virtual scrolling)
  ipcMain.handle('results-cache:getRange', async (_event, tabId: string, startIndex: number, count: number): Promise<Row[] | null> => {
    try {
      const rows = getResultsRange(tabId, startIndex, count);
      return rows || null;
    } catch (error: any) {
      throw {
        code: BigQueryErrorCode.STORAGE_ERROR,
        message: 'Failed to get results range from cache',
        details: error.message,
      };
    }
  });

  // New: Get cache statistics
  ipcMain.handle('results-cache:stats', async () => {
    try {
      return getCacheStats();
    } catch (error: any) {
      throw {
        code: BigQueryErrorCode.STORAGE_ERROR,
        message: 'Failed to get cache stats',
        details: error.message,
      };
    }
  });
}

/**
 * Close the database connection
 * Should be called when the app is closing
 */
export function closeCacheDatabase(): void {
  closeDatabase();
}
