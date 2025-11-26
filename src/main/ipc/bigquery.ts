import { ipcMain } from 'electron';
import { getBigQueryClient, getActiveConnection } from './connection';
import type { QueryResult, ColumnMetadata, Row } from '../../shared/types/query';
import { BigQueryErrorCode } from '../../shared/types/bigquery';

export function registerBigQueryHandlers(): void {
  ipcMain.handle('bigquery:execute', async (_event, queryText: string, projectId: string) => {
    const client = getBigQueryClient();
    if (!client) {
      throw {
        code: BigQueryErrorCode.CONNECTION_FAILED,
        message: 'No active BigQuery connection',
      };
    }

    try {
      const startTime = Date.now();

      // Get location from active connection, default to EU
      const connection = getActiveConnection();
      const location = connection?.location || 'EU';

      // Create query job
      const [job] = await client.createQueryJob({
        query: queryText,
        location,
      });

      // Wait for job to complete and get all results
      // Use a large maxResults to get all rows (BigQuery API limit is 10MB per response)
      // For very large result sets, we'd need pagination, but for now get as many as possible
      const [rows] = await job.getQueryResults({ maxResults: 100000 });
      
      // Get job metadata
      const [jobMetadata] = await job.getMetadata();

      const executionTimeMs = Date.now() - startTime;

      // Transform schema to ColumnMetadata
      // Get schema from job metadata - check multiple possible locations
      let schema = jobMetadata.configuration?.query?.schema || 
                   jobMetadata.statistics?.query?.schema ||
                   jobMetadata.schema;
      
      let columns: ColumnMetadata[] = [];
      
      if (schema?.fields && schema.fields.length > 0) {
        // Use schema from metadata
        columns = schema.fields.map((field: any) => ({
          name: field.name,
          type: field.type,
          mode: field.mode,
        }));
      } else if (rows && rows.length > 0) {
        // Fallback: extract column names and types from first row
        const firstRow = rows[0];
        columns = Object.keys(firstRow).map((key) => {
          const value = firstRow[key];
          let type = 'STRING'; // Default type
          if (typeof value === 'number') {
            type = Number.isInteger(value) ? 'INTEGER' : 'FLOAT';
          } else if (typeof value === 'boolean') {
            type = 'BOOLEAN';
          } else if (value instanceof Date) {
            type = 'TIMESTAMP';
          } else if (Array.isArray(value)) {
            type = 'ARRAY';
          } else if (value && typeof value === 'object') {
            type = 'RECORD';
          }
          return {
            name: key,
            type,
            mode: 'NULLABLE',
          };
        });
      }

      // Transform rows to Row format
      // BigQuery returns rows as objects with field names as keys
      const transformedRows: Row[] = rows.map((row: any) => ({
        values: columns.map((col) => {
          const value = row[col.name];
          return value !== null && value !== undefined ? value : null;
        }),
      }));

      // Use the actual number of rows returned, or totalRowsReturned from metadata if available
      const totalRowsReturned = parseInt(
        jobMetadata.statistics?.query?.totalRowsReturned || 
        jobMetadata.statistics?.totalRowsReturned || 
        String(transformedRows.length), 
        10
      );

      const result: QueryResult = {
        columns,
        rows: transformedRows,
        totalRows: totalRowsReturned,
        rowsReturned: transformedRows.length,
        executionTimeMs,
        bytesProcessed: parseInt(jobMetadata.statistics?.totalBytesProcessed || '0', 10),
        jobId: job.id || '',
        hasMore: transformedRows.length < totalRowsReturned, // Indicate if there are more rows available
      };

      return result;
    } catch (error: any) {
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        const err = new Error('Network error: Unable to connect to BigQuery');
        (err as any).code = BigQueryErrorCode.NETWORK_ERROR;
        (err as any).details = error.message;
        throw err;
      }
      if (error.code === 403 || error.code === 401) {
        const err = new Error('Authentication error');
        (err as any).code = BigQueryErrorCode.AUTH_ERROR;
        (err as any).details = error.message;
        throw err;
      }
      
      // Extract error message from BigQuery error
      let errorMessage = error.message || 'Query execution failed';
      
      // If error has details array, try to extract message from first detail
      if (error.errors && Array.isArray(error.errors) && error.errors.length > 0) {
        const firstError = error.errors[0];
        if (firstError.message) {
          errorMessage = firstError.message;
        } else if (typeof firstError === 'string') {
          errorMessage = firstError;
        }
      }
      
      const err = new Error(errorMessage);
      (err as any).code = BigQueryErrorCode.BIGQUERY_ERROR;
      (err as any).details = error.errors || error;
      throw err;
    }
  });

  ipcMain.handle('bigquery:cancel', async (_event, jobId: string) => {
    const client = getBigQueryClient();
    if (!client) {
      throw {
        code: BigQueryErrorCode.CONNECTION_FAILED,
        message: 'No active BigQuery connection',
      };
    }

    try {
      const job = client.job(jobId);
      await job.cancel();
    } catch (error: any) {
      if (error.code === 404) {
        throw {
          code: BigQueryErrorCode.JOB_NOT_FOUND,
          message: 'Job not found or already completed',
        };
      }
      throw {
        code: BigQueryErrorCode.CANCEL_FAILED,
        message: 'Failed to cancel job',
        details: error.message,
      };
    }
  });

  ipcMain.handle('bigquery:listDatasets', async () => {
    const client = getBigQueryClient();
    if (!client) {
      throw {
        code: BigQueryErrorCode.CONNECTION_FAILED,
        message: 'No active BigQuery connection',
      };
    }

    try {
      const [datasets] = await client.getDatasets();
      return datasets.map((dataset) => ({
        id: dataset.id,
        name: dataset.id,
        location: dataset.metadata?.location || 'US',
      }));
    } catch (error: any) {
      throw {
        code: BigQueryErrorCode.BIGQUERY_ERROR,
        message: error.message || 'Failed to list datasets',
        details: error.errors || error,
      };
    }
  });

  ipcMain.handle('bigquery:listTables', async (_event, datasetId: string) => {
    const client = getBigQueryClient();
    if (!client) {
      throw {
        code: BigQueryErrorCode.CONNECTION_FAILED,
        message: 'No active BigQuery connection',
      };
    }

    try {
      const dataset = client.dataset(datasetId);
      const [tables] = await dataset.getTables();
      return tables.map((table) => ({
        id: table.id,
        name: table.id,
        type: table.metadata?.type || 'TABLE',
      }));
    } catch (error: any) {
      throw {
        code: BigQueryErrorCode.BIGQUERY_ERROR,
        message: error.message || 'Failed to list tables',
        details: error.errors || error,
      };
    }
  });

  ipcMain.handle('bigquery:getTableSchema', async (_event, datasetId: string, tableId: string) => {
    const client = getBigQueryClient();
    if (!client) {
      throw {
        code: BigQueryErrorCode.CONNECTION_FAILED,
        message: 'No active BigQuery connection',
      };
    }

    try {
      const table = client.dataset(datasetId).table(tableId);
      const [metadata] = await table.getMetadata();
      
      // Extract schema fields
      const schema = metadata.schema;
      if (!schema || !schema.fields) {
        return {
          fields: [],
        };
      }

      // Recursively transform fields to include nested structures
      const transformField = (field: any): ColumnMetadata & { fields?: any[] } => {
        const result: ColumnMetadata & { fields?: any[] } = {
          name: field.name,
          type: field.type,
          mode: field.mode || 'NULLABLE',
        };
        
        if (field.fields && field.fields.length > 0) {
          result.fields = field.fields.map(transformField);
        }
        
        return result;
      };

      // Extract table metadata
      // BigQuery timestamps are in milliseconds, can be string or number
      const creationTime = metadata.creationTime 
        ? (typeof metadata.creationTime === 'string' 
            ? parseInt(metadata.creationTime, 10) 
            : metadata.creationTime)
        : undefined;
      const lastModifiedTime = metadata.lastModifiedTime
        ? (typeof metadata.lastModifiedTime === 'string'
            ? parseInt(metadata.lastModifiedTime, 10)
            : metadata.lastModifiedTime)
        : undefined;
      const numRows = metadata.numRows
        ? (typeof metadata.numRows === 'string'
            ? parseInt(metadata.numRows, 10)
            : metadata.numRows)
        : undefined;
      const numBytes = metadata.numBytes
        ? (typeof metadata.numBytes === 'string'
            ? parseInt(metadata.numBytes, 10)
            : metadata.numBytes)
        : undefined;

      return {
        fields: schema.fields.map(transformField),
        metadata: {
          creationTime,
          lastModifiedTime,
          numRows,
          numBytes,
        },
      };
    } catch (error: any) {
      if (error.code === 404) {
        throw {
          code: BigQueryErrorCode.BIGQUERY_ERROR,
          message: 'Table not found',
          details: error.message,
        };
      }
      throw {
        code: BigQueryErrorCode.BIGQUERY_ERROR,
        message: error.message || 'Failed to get table schema',
        details: error.errors || error,
      };
    }
  });

  ipcMain.handle('bigquery:getViewDefinition', async (_event, datasetId: string, tableId: string) => {
    const client = getBigQueryClient();
    if (!client) {
      throw {
        code: BigQueryErrorCode.CONNECTION_FAILED,
        message: 'No active BigQuery connection',
      };
    }

    try {
      const table = client.dataset(datasetId).table(tableId);
      const [metadata] = await table.getMetadata();
      
      // Check if this is actually a view
      if (metadata.type !== 'VIEW' && metadata.type !== 'MATERIALIZED_VIEW') {
        throw {
          code: BigQueryErrorCode.BIGQUERY_ERROR,
          message: 'Table is not a view',
        };
      }

      // Get view definition from metadata
      // For regular views: metadata.view.query
      // For materialized views: metadata.materializedView.query
      let viewDefinition = '';
      if (metadata.type === 'VIEW' && metadata.view) {
        viewDefinition = metadata.view.query || '';
      } else if (metadata.type === 'MATERIALIZED_VIEW' && metadata.materializedView) {
        viewDefinition = metadata.materializedView.query || '';
      }
      
      if (!viewDefinition) {
        throw {
          code: BigQueryErrorCode.BIGQUERY_ERROR,
          message: 'View definition not found',
        };
      }

      return {
        definition: viewDefinition,
      };
    } catch (error: any) {
      if (error.code === 404) {
        throw {
          code: BigQueryErrorCode.BIGQUERY_ERROR,
          message: 'View not found',
          details: error.message,
        };
      }
      if (error.code) {
        throw error;
      }
      throw {
        code: BigQueryErrorCode.BIGQUERY_ERROR,
        message: error.message || 'Failed to get view definition',
        details: error.errors || error,
      };
    }
  });
}
