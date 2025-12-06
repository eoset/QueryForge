import { ipcMain } from 'electron';
import {
  saveSchema,
  saveSchemas,
  getSchema,
  hasValidSchema,
  getSchemasForProject,
  needsRefresh,
  deleteSchema,
  deleteSchemasForProject,
  deleteExpiredSchemas,
  clearAllSchemas,
  getCacheStats,
  closeDatabase,
} from '../storage/schema-cache-sqlite';
import type { SchemaField } from '../../shared/types/query';
import { BigQueryErrorCode } from '../../shared/types/bigquery';

export function registerSchemaCacheHandlers(): void {
  // Save a single schema
  ipcMain.handle(
    'schema-cache:save',
    async (
      _event,
      projectId: string,
      datasetId: string,
      tableId: string,
      fields: SchemaField[]
    ): Promise<void> => {
      try {
        saveSchema(projectId, datasetId, tableId, fields);
      } catch (error: any) {
        throw {
          code: BigQueryErrorCode.STORAGE_ERROR,
          message: 'Failed to save schema to cache',
          details: error.message,
        };
      }
    }
  );

  // Save multiple schemas in batch
  ipcMain.handle(
    'schema-cache:saveBatch',
    async (
      _event,
      schemas: Array<{
        projectId: string;
        datasetId: string;
        tableId: string;
        fields: SchemaField[];
      }>
    ): Promise<void> => {
      try {
        saveSchemas(schemas);
      } catch (error: any) {
        throw {
          code: BigQueryErrorCode.STORAGE_ERROR,
          message: 'Failed to save schemas to cache',
          details: error.message,
        };
      }
    }
  );

  // Get a single schema
  ipcMain.handle(
    'schema-cache:get',
    async (_event, projectId: string, datasetId: string, tableId: string) => {
      try {
        return getSchema(projectId, datasetId, tableId);
      } catch (error: any) {
        throw {
          code: BigQueryErrorCode.STORAGE_ERROR,
          message: 'Failed to get schema from cache',
          details: error.message,
        };
      }
    }
  );

  // Check if schema exists and is valid (not expired)
  ipcMain.handle(
    'schema-cache:hasValid',
    async (_event, projectId: string, datasetId: string, tableId: string): Promise<boolean> => {
      try {
        return hasValidSchema(projectId, datasetId, tableId);
      } catch (error: any) {
        throw {
          code: BigQueryErrorCode.STORAGE_ERROR,
          message: 'Failed to check schema validity',
          details: error.message,
        };
      }
    }
  );

  // Get all schemas for a project
  ipcMain.handle('schema-cache:getForProject', async (_event, projectId: string) => {
    try {
      return getSchemasForProject(projectId);
    } catch (error: any) {
      throw {
        code: BigQueryErrorCode.STORAGE_ERROR,
        message: 'Failed to get schemas for project',
        details: error.message,
      };
    }
  });

  // Check if schemas need refresh
  ipcMain.handle('schema-cache:needsRefresh', async (_event, projectId: string): Promise<boolean> => {
    try {
      return needsRefresh(projectId);
    } catch (error: any) {
      throw {
        code: BigQueryErrorCode.STORAGE_ERROR,
        message: 'Failed to check if refresh is needed',
        details: error.message,
      };
    }
  });

  // Delete a single schema
  ipcMain.handle(
    'schema-cache:delete',
    async (_event, projectId: string, datasetId: string, tableId: string): Promise<void> => {
      try {
        deleteSchema(projectId, datasetId, tableId);
      } catch (error: any) {
        throw {
          code: BigQueryErrorCode.STORAGE_ERROR,
          message: 'Failed to delete schema from cache',
          details: error.message,
        };
      }
    }
  );

  // Delete all schemas for a project
  ipcMain.handle('schema-cache:deleteForProject', async (_event, projectId: string): Promise<void> => {
    try {
      deleteSchemasForProject(projectId);
    } catch (error: any) {
      throw {
        code: BigQueryErrorCode.STORAGE_ERROR,
        message: 'Failed to delete project schemas from cache',
        details: error.message,
      };
    }
  });

  // Delete all expired schemas
  ipcMain.handle('schema-cache:deleteExpired', async (): Promise<number> => {
    try {
      return deleteExpiredSchemas();
    } catch (error: any) {
      throw {
        code: BigQueryErrorCode.STORAGE_ERROR,
        message: 'Failed to delete expired schemas',
        details: error.message,
      };
    }
  });

  // Clear all schemas
  ipcMain.handle('schema-cache:clear', async (): Promise<void> => {
    try {
      clearAllSchemas();
    } catch (error: any) {
      throw {
        code: BigQueryErrorCode.STORAGE_ERROR,
        message: 'Failed to clear schema cache',
        details: error.message,
      };
    }
  });

  // Get cache statistics
  ipcMain.handle('schema-cache:stats', async () => {
    try {
      return getCacheStats();
    } catch (error: any) {
      throw {
        code: BigQueryErrorCode.STORAGE_ERROR,
        message: 'Failed to get cache statistics',
        details: error.message,
      };
    }
  });
}

/**
 * Close the schema cache database
 * Should be called when the app is closing
 */
export function closeSchemaCacheDatabase(): void {
  closeDatabase();
}
