/**
 * BigQuery-related types and error interfaces
 */

export interface IPCError {
  code: string; // Error code (e.g., 'BIGQUERY_ERROR', 'QUERY_NOT_FOUND')
  message: string; // Human-readable error message
  details?: any; // Additional error details
}

/**
 * Job details returned from BigQuery job metadata
 */
export interface JobDetails {
  // Basic job info
  jobId: string;
  projectId: string;
  location: string;
  user: string;
  
  // Timing info
  creationTime: string; // ISO timestamp
  startTime: string; // ISO timestamp
  endTime: string; // ISO timestamp
  totalSlotMs: number; // Slot milliseconds used
  
  // Query statistics
  totalBytesProcessed: number;
  totalBytesBilled: number;
  cacheHit: boolean;
  statementType: string; // SELECT, INSERT, UPDATE, etc.
  
  // Row counts
  numDmlAffectedRows?: number; // For DML queries
  outputRows?: number; // For SELECT queries
  
  // Performance details
  billingTier?: number;
  estimatedBytesProcessed?: number;
  
  // Query plan (optional, for advanced view)
  referencedTables?: Array<{
    projectId: string;
    datasetId: string;
    tableId: string;
  }>;
  
  // Status
  state: 'PENDING' | 'RUNNING' | 'DONE';
  errorResult?: {
    reason: string;
    location: string;
    message: string;
  };
}

// BigQuery error codes
export enum BigQueryErrorCode {
  BIGQUERY_ERROR = 'BIGQUERY_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  INVALID_PROJECT_ID = 'INVALID_PROJECT_ID',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  JOB_NOT_FOUND = 'JOB_NOT_FOUND',
  CANCEL_FAILED = 'CANCEL_FAILED',
  QUERY_NOT_FOUND = 'QUERY_NOT_FOUND',
  INVALID_NAME = 'INVALID_NAME',
  DUPLICATE_NAME = 'DUPLICATE_NAME',
  STORAGE_ERROR = 'STORAGE_ERROR',
}

