import { ipcMain } from 'electron';
import {
  getQueries,
  getQuery,
  saveQuery,
  updateQuery,
  deleteQuery,
  searchQueries,
} from '../storage/query-store';
import type { SavedQuery, SaveQueryInput, UpdateQueryInput } from '../../shared/types/query';
import { BigQueryErrorCode } from '../../shared/types/bigquery';

export function registerQueriesHandlers(): void {
  ipcMain.handle('queries:list', async (): Promise<SavedQuery[]> => {
    try {
      return getQueries();
    } catch (error: any) {
      throw {
        code: BigQueryErrorCode.STORAGE_ERROR,
        message: 'Failed to load queries',
        details: error.message,
      };
    }
  });

  ipcMain.handle('queries:get', async (_event, id: string): Promise<SavedQuery> => {
    try {
      const query = getQuery(id);
      if (!query) {
        throw {
          code: BigQueryErrorCode.QUERY_NOT_FOUND,
          message: `Query with id "${id}" not found`,
        };
      }
      return query;
    } catch (error: any) {
      if (error.code) {
        throw error;
      }
      throw {
        code: BigQueryErrorCode.STORAGE_ERROR,
        message: 'Failed to get query',
        details: error.message,
      };
    }
  });

  ipcMain.handle('queries:save', async (_event, input: SaveQueryInput): Promise<SavedQuery> => {
    try {
      return saveQuery(input);
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        throw {
          code: BigQueryErrorCode.DUPLICATE_NAME,
          message: error.message,
        };
      }
      if (error.message.includes('required') || error.message.includes('empty')) {
        throw {
          code: BigQueryErrorCode.INVALID_NAME,
          message: error.message,
        };
      }
      throw {
        code: BigQueryErrorCode.STORAGE_ERROR,
        message: 'Failed to save query',
        details: error.message,
      };
    }
  });

  ipcMain.handle(
    'queries:update',
    async (_event, id: string, updates: UpdateQueryInput): Promise<SavedQuery> => {
      try {
        return updateQuery(id, updates);
      } catch (error: any) {
        if (error.message.includes('not found')) {
          throw {
            code: BigQueryErrorCode.QUERY_NOT_FOUND,
            message: error.message,
          };
        }
        if (error.message.includes('already exists')) {
          throw {
            code: BigQueryErrorCode.DUPLICATE_NAME,
            message: error.message,
          };
        }
        if (error.message.includes('empty') || error.message.includes('required')) {
          throw {
            code: BigQueryErrorCode.INVALID_NAME,
            message: error.message,
          };
        }
        throw {
          code: BigQueryErrorCode.STORAGE_ERROR,
          message: 'Failed to update query',
          details: error.message,
        };
      }
    }
  );

  ipcMain.handle('queries:delete', async (_event, id: string): Promise<void> => {
    try {
      deleteQuery(id);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        throw {
          code: BigQueryErrorCode.QUERY_NOT_FOUND,
          message: error.message,
        };
      }
      throw {
        code: BigQueryErrorCode.STORAGE_ERROR,
        message: 'Failed to delete query',
        details: error.message,
      };
    }
  });

  ipcMain.handle('queries:search', async (_event, term: string): Promise<SavedQuery[]> => {
    try {
      return searchQueries(term);
    } catch (error: any) {
      throw {
        code: BigQueryErrorCode.STORAGE_ERROR,
        message: 'Failed to search queries',
        details: error.message,
      };
    }
  });
}
