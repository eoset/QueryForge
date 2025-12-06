/**
 * Query-related types
 */

export type TabType = 'query' | 'explorer' | 'saved-queries';

export interface QueryTab {
  id: string;
  title: string;
  type?: TabType; // 'query' by default, 'explorer' for Explorer tab
  queryText: string;
  isModified: boolean;
  executionStatus: 'idle' | 'running' | 'completed' | 'error' | 'cancelled';
  jobId?: string;
  results?: QueryResult;
  error?: string;
  lastExecuted?: string; // ISO timestamp
  lastExecutedQueryText?: string; // The query text that was last executed
  savedQueryId?: string;
}

export interface SavedQuery {
  id: string;
  name: string;
  sqlText: string;
  description?: string;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  tags?: string[];
}

export interface SaveQueryInput {
  name: string;
  sqlText: string;
  description?: string;
  tags?: string[];
}

export interface UpdateQueryInput {
  name?: string;
  sqlText?: string;
  description?: string;
  tags?: string[];
}

export interface QueryResult {
  columns: ColumnMetadata[];
  rows: Row[];
  totalRows: number;
  rowsReturned: number;
  executionTimeMs: number;
  bytesProcessed?: number;
  jobId: string;
  hasMore: boolean;
}

export interface ColumnMetadata {
  name: string;
  type: string; // BigQuery type: STRING, INTEGER, FLOAT, etc.
  mode?: string; // NULLABLE, REQUIRED, REPEATED
}

export interface Row {
  values: any[]; // Values matching column order
}

/**
 * Schema field with nested field support for RECORD/STRUCT types
 */
export interface SchemaField extends ColumnMetadata {
  fields?: SchemaField[];
}

/**
 * Stored schema record from the cache
 */
export interface StoredSchema {
  projectId: string;
  datasetId: string;
  tableId: string;
  fields: SchemaField[];
  lastUpdated: number;
}

/**
 * Query history entry - tracks executed queries with metadata
 */
export interface QueryHistoryEntry {
  id: string;
  queryText: string;
  executedAt: string; // ISO timestamp
  executionTimeMs: number;
  bytesProcessed?: number;
  totalRows?: number;
  status: 'completed' | 'error' | 'cancelled';
  errorMessage?: string;
  projectId: string;
  jobId?: string;
}

