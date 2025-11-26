# IPC API Contracts: BigQuery Browser Application

**Feature**: BigQuery Browser Application  
**Date**: 2025-01-27  
**Phase**: Phase 1 - Design & Contracts

## Overview

This document defines the IPC (Inter-Process Communication) API contracts between the Electron renderer process (React UI) and main process (Node.js/Electron APIs). All IPC communication uses Electron's `ipcMain` and `ipcRenderer` APIs via a preload script for security.

## IPC Channel Naming Convention

- Format: `{domain}:{action}`
- Examples: `bigquery:execute`, `connection:configure`, `queries:save`

## Preload API

The preload script exposes a controlled API surface to the renderer process:

```typescript
interface ElectronAPI {
  // BigQuery operations
  bigquery: {
    execute(queryText: string, projectId: string): Promise<QueryResult>
    cancel(jobId: string): Promise<void>
  }
  
  // Connection management
  connection: {
    configure(config: ConnectionConfig): Promise<void>
    getActive(): Promise<ConnectionConfiguration | null>
    test(config: ConnectionConfig): Promise<boolean>
    disconnect(): Promise<void>
  }
  
  // Saved queries
  queries: {
    list(): Promise<SavedQuery[]>
    get(id: string): Promise<SavedQuery>
    save(query: SaveQueryInput): Promise<SavedQuery>
    update(id: string, updates: UpdateQueryInput): Promise<SavedQuery>
    delete(id: string): Promise<void>
    search(term: string): Promise<SavedQuery[]>
  }
}
```

---

## BigQuery Operations

### `bigquery:execute`

Execute a SQL query against BigQuery.

**Request**:
```typescript
{
  channel: 'bigquery:execute',
  args: [queryText: string, projectId: string]
}
```

**Response**:
```typescript
Promise<{
  columns: ColumnMetadata[]
  rows: Row[]
  totalRows: number
  rowsReturned: number
  executionTimeMs: number
  bytesProcessed?: number
  jobId: string
  hasMore: boolean
}>
```

**Errors**:
- `BIGQUERY_ERROR`: BigQuery API error (includes error message)
- `NETWORK_ERROR`: Network connectivity issue
- `AUTH_ERROR`: Authentication failure
- `TIMEOUT_ERROR`: Query execution timeout

**Example**:
```typescript
const result = await window.electronAPI.bigquery.execute(
  'SELECT * FROM `project.dataset.table` LIMIT 100',
  'my-project-id'
)
```

---

### `bigquery:cancel`

Cancel a running BigQuery query job.

**Request**:
```typescript
{
  channel: 'bigquery:cancel',
  args: [jobId: string]
}
```

**Response**:
```typescript
Promise<void>
```

**Errors**:
- `JOB_NOT_FOUND`: Job ID not found or already completed
- `CANCEL_FAILED`: Failed to cancel job

**Example**:
```typescript
await window.electronAPI.bigquery.cancel('job_1234567890')
```

---

## Connection Management

### `connection:configure`

Configure and establish connection to BigQuery.

**Request**:
```typescript
{
  channel: 'connection:configure',
  args: [config: {
    projectId: string
    authType: 'service-account' | 'application-default'
    serviceAccountKeyPath?: string
    serviceAccountKey?: string  // JSON string
  }]
}
```

**Response**:
```typescript
Promise<void>
```

**Errors**:
- `INVALID_PROJECT_ID`: Project ID format invalid
- `INVALID_CREDENTIALS`: Service account key invalid or missing
- `CONNECTION_FAILED`: Failed to establish connection
- `AUTH_FAILED`: Authentication failed

**Example**:
```typescript
await window.electronAPI.connection.configure({
  projectId: 'my-project-id',
  authType: 'service-account',
  serviceAccountKeyPath: '/path/to/key.json'
})
```

---

### `connection:getActive`

Get the currently active connection configuration.

**Request**:
```typescript
{
  channel: 'connection:getActive',
  args: []
}
```

**Response**:
```typescript
Promise<ConnectionConfiguration | null>
```

**Errors**: None (returns null if no active connection)

**Example**:
```typescript
const connection = await window.electronAPI.connection.getActive()
```

---

### `connection:test`

Test a connection configuration without making it active.

**Request**:
```typescript
{
  channel: 'connection:test',
  args: [config: ConnectionConfig]
}
```

**Response**:
```typescript
Promise<boolean>  // true if connection successful
```

**Errors**: Returns false on failure (error details logged in main process)

**Example**:
```typescript
const isValid = await window.electronAPI.connection.test({
  projectId: 'test-project',
  authType: 'service-account',
  serviceAccountKeyPath: '/path/to/key.json'
})
```

---

### `connection:disconnect`

Disconnect from BigQuery and clear active connection.

**Request**:
```typescript
{
  channel: 'connection:disconnect',
  args: []
}
```

**Response**:
```typescript
Promise<void>
```

**Errors**: None

**Example**:
```typescript
await window.electronAPI.connection.disconnect()
```

---

## Saved Queries Operations

### `queries:list`

Get all saved queries.

**Request**:
```typescript
{
  channel: 'queries:list',
  args: []
}
```

**Response**:
```typescript
Promise<SavedQuery[]>
```

**Errors**:
- `STORAGE_ERROR`: Failed to read from storage

**Example**:
```typescript
const queries = await window.electronAPI.queries.list()
```

---

### `queries:get`

Get a specific saved query by ID.

**Request**:
```typescript
{
  channel: 'queries:get',
  args: [id: string]
}
```

**Response**:
```typescript
Promise<SavedQuery>
```

**Errors**:
- `QUERY_NOT_FOUND`: Query with given ID not found
- `STORAGE_ERROR`: Failed to read from storage

**Example**:
```typescript
const query = await window.electronAPI.queries.get('query-uuid')
```

---

### `queries:save`

Save a new query.

**Request**:
```typescript
{
  channel: 'queries:save',
  args: [query: {
    name: string
    sqlText: string
    description?: string
    tags?: string[]
  }]
}
```

**Response**:
```typescript
Promise<SavedQuery>  // Includes generated id, createdAt, updatedAt
```

**Errors**:
- `INVALID_NAME`: Name is empty or invalid
- `DUPLICATE_NAME`: Query with same name already exists
- `STORAGE_ERROR`: Failed to write to storage

**Example**:
```typescript
const saved = await window.electronAPI.queries.save({
  name: 'My Query',
  sqlText: 'SELECT * FROM table',
  description: 'Description here',
  tags: ['analytics', 'daily']
})
```

---

### `queries:update`

Update an existing saved query.

**Request**:
```typescript
{
  channel: 'queries:update',
  args: [id: string, updates: {
    name?: string
    sqlText?: string
    description?: string
    tags?: string[]
  }]
}
```

**Response**:
```typescript
Promise<SavedQuery>  // Updated query with new updatedAt
```

**Errors**:
- `QUERY_NOT_FOUND`: Query with given ID not found
- `INVALID_NAME`: Name is empty or invalid (if provided)
- `DUPLICATE_NAME`: Another query with same name exists (if name changed)
- `STORAGE_ERROR`: Failed to write to storage

**Example**:
```typescript
const updated = await window.electronAPI.queries.update('query-uuid', {
  name: 'Updated Name',
  description: 'New description'
})
```

---

### `queries:delete`

Delete a saved query.

**Request**:
```typescript
{
  channel: 'queries:delete',
  args: [id: string]
}
```

**Response**:
```typescript
Promise<void>
```

**Errors**:
- `QUERY_NOT_FOUND`: Query with given ID not found
- `STORAGE_ERROR`: Failed to delete from storage

**Example**:
```typescript
await window.electronAPI.queries.delete('query-uuid')
```

---

### `queries:search`

Search saved queries by name or SQL text.

**Request**:
```typescript
{
  channel: 'queries:search',
  args: [term: string]
}
```

**Response**:
```typescript
Promise<SavedQuery[]>  // Filtered queries matching search term
```

**Errors**:
- `STORAGE_ERROR`: Failed to read from storage

**Example**:
```typescript
const results = await window.electronAPI.queries.search('analytics')
```

---

## Type Definitions

### ConnectionConfig
```typescript
interface ConnectionConfig {
  projectId: string
  authType: 'service-account' | 'application-default'
  serviceAccountKeyPath?: string
  serviceAccountKey?: string  // JSON string content
}
```

### ConnectionConfiguration
```typescript
interface ConnectionConfiguration {
  projectId: string
  authType: 'service-account' | 'application-default'
  serviceAccountKeyPath?: string
  lastConnected?: string  // ISO timestamp
  isActive: boolean
}
```

### SavedQuery
```typescript
interface SavedQuery {
  id: string
  name: string
  sqlText: string
  description?: string
  createdAt: string  // ISO timestamp
  updatedAt: string  // ISO timestamp
  tags?: string[]
}
```

### SaveQueryInput
```typescript
interface SaveQueryInput {
  name: string
  sqlText: string
  description?: string
  tags?: string[]
}
```

### UpdateQueryInput
```typescript
interface UpdateQueryInput {
  name?: string
  sqlText?: string
  description?: string
  tags?: string[]
}
```

### QueryResult
```typescript
interface QueryResult {
  columns: ColumnMetadata[]
  rows: Row[]
  totalRows: number
  rowsReturned: number
  executionTimeMs: number
  bytesProcessed?: number
  jobId: string
  hasMore: boolean
}
```

### ColumnMetadata
```typescript
interface ColumnMetadata {
  name: string
  type: string  // BigQuery type: STRING, INTEGER, FLOAT, etc.
  mode?: string  // NULLABLE, REQUIRED, REPEATED
}
```

### Row
```typescript
interface Row {
  values: any[]  // Values matching column order
}
```

---

## Error Handling

All IPC methods return promises that reject with structured error objects:

```typescript
interface IPCError {
  code: string  // Error code (e.g., 'BIGQUERY_ERROR', 'QUERY_NOT_FOUND')
  message: string  // Human-readable error message
  details?: any  // Additional error details
}
```

**Error Codes**:
- `BIGQUERY_ERROR`: BigQuery API error
- `NETWORK_ERROR`: Network connectivity issue
- `AUTH_ERROR`: Authentication failure
- `TIMEOUT_ERROR`: Operation timeout
- `INVALID_PROJECT_ID`: Invalid project ID format
- `INVALID_CREDENTIALS`: Invalid credentials
- `CONNECTION_FAILED`: Connection establishment failed
- `JOB_NOT_FOUND`: BigQuery job not found
- `CANCEL_FAILED`: Failed to cancel job
- `QUERY_NOT_FOUND`: Saved query not found
- `INVALID_NAME`: Invalid query name
- `DUPLICATE_NAME`: Duplicate query name
- `STORAGE_ERROR`: Storage operation failed

---

## Implementation Notes

### Main Process Handlers

IPC handlers should be registered in the main process:

```typescript
// src/main/ipc/bigquery.ts
ipcMain.handle('bigquery:execute', async (event, queryText, projectId) => {
  // Implementation
})

ipcMain.handle('bigquery:cancel', async (event, jobId) => {
  // Implementation
})
```

### Preload Script

Preload script exposes safe API to renderer:

```typescript
// src/main/preload.ts
contextBridge.exposeInMainWorld('electronAPI', {
  bigquery: {
    execute: (queryText: string, projectId: string) => 
      ipcRenderer.invoke('bigquery:execute', queryText, projectId),
    cancel: (jobId: string) => 
      ipcRenderer.invoke('bigquery:cancel', jobId)
  },
  // ... other APIs
})
```

### Renderer Usage

Renderer uses exposed API:

```typescript
// src/renderer/hooks/useBigQuery.ts
const executeQuery = async (queryText: string) => {
  const connection = await window.electronAPI.connection.getActive()
  if (!connection) throw new Error('No active connection')
  
  return await window.electronAPI.bigquery.execute(queryText, connection.projectId)
}
```

---

## Testing Contracts

### Unit Tests
- Test IPC handlers with mocked BigQuery client
- Test error handling and validation
- Test data transformation (BigQuery response → QueryResult)

### Integration Tests
- Test end-to-end IPC communication
- Test with real BigQuery (test project)
- Test error scenarios (network failures, auth failures)

### Contract Tests
- Verify IPC channel names match
- Verify request/response types match
- Verify error codes are consistent

