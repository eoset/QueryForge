/**
 * Query-related types
 */

export interface QueryTab {
  id: string;
  title: string;
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

