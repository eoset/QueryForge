# Data Model: BigQuery Browser Application

**Feature**: BigQuery Browser Application  
**Date**: 2025-01-27  
**Phase**: Phase 1 - Design & Contracts

## Entities

### ConnectionConfiguration

Represents GCP project connection settings and authentication credentials.

**Fields**:
- `projectId` (string, required): GCP project ID
- `authType` (enum: 'service-account' | 'application-default', required): Authentication method
- `serviceAccountKeyPath` (string, optional): Path to service account JSON file (if authType is 'service-account')
- `serviceAccountKey` (string, optional): Service account key JSON content (encrypted in storage)
- `lastConnected` (timestamp, optional): Last successful connection timestamp
- `isActive` (boolean): Whether this connection is currently active

**Validation Rules**:
- `projectId` must be non-empty and match GCP project ID format
- If `authType` is 'service-account', either `serviceAccountKeyPath` or `serviceAccountKey` must be provided
- `serviceAccountKey` must be valid JSON if provided

**Storage**: Encrypted using Electron safeStorage API, stored in main process only

**Relationships**: None (single active connection at a time)

---

### QueryTab

Represents an individual query workspace tab with its own editor and results.

**Fields**:
- `id` (string, required): Unique tab identifier (UUID)
- `title` (string, required): Tab display title (defaults to "Query N" or query name if saved)
- `queryText` (string, required): SQL query text
- `isModified` (boolean): Whether query has been modified since last save/load
- `executionStatus` (enum: 'idle' | 'running' | 'completed' | 'error' | 'cancelled'): Current execution state
- `jobId` (string, optional): BigQuery job ID for cancellation
- `results` (QueryResult, optional): Query execution results
- `error` (string, optional): Error message if execution failed
- `lastExecuted` (timestamp, optional): Last execution timestamp
- `savedQueryId` (string, optional): Reference to SavedQuery if loaded from saved query

**Validation Rules**:
- `id` must be unique across all tabs
- `queryText` must be non-empty string
- `executionStatus` transitions: idle → running → (completed | error | cancelled)

**Storage**: In-memory only (renderer process state)

**Relationships**: 
- May reference one `SavedQuery` (via `savedQueryId`)

---

### SavedQuery

Represents a query that has been saved locally for reuse.

**Fields**:
- `id` (string, required): Unique identifier (UUID)
- `name` (string, required): User-defined query name
- `sqlText` (string, required): SQL query text
- `description` (string, optional): Optional description/notes
- `createdAt` (timestamp, required): Creation timestamp
- `updatedAt` (timestamp, required): Last modification timestamp
- `tags` (string[], optional): Optional tags for organization

**Validation Rules**:
- `name` must be non-empty, max 255 characters
- `name` must be unique (enforced at storage level)
- `sqlText` must be non-empty
- `createdAt` <= `updatedAt`

**Storage**: JSON file via electron-store in app user data directory

**Relationships**: None (standalone entity)

**File Format**:
```json
{
  "queries": [
    {
      "id": "uuid",
      "name": "Query Name",
      "sqlText": "SELECT * FROM ...",
      "description": "Optional description",
      "createdAt": "2025-01-27T10:00:00Z",
      "updatedAt": "2025-01-27T10:00:00Z",
      "tags": ["tag1", "tag2"]
    }
  ]
}
```

---

### QueryResult

Represents the data returned from executing a query.

**Fields**:
- `columns` (ColumnMetadata[], required): Column definitions
- `rows` (Row[], required): Data rows (may be paginated)
- `totalRows` (number, required): Total number of rows returned
- `rowsReturned` (number, required): Number of rows in current result set
- `executionTimeMs` (number, required): Query execution time in milliseconds
- `bytesProcessed` (number, optional): Bytes processed by query
- `jobId` (string, required): BigQuery job ID
- `hasMore` (boolean): Whether more rows are available (pagination)

**Validation Rules**:
- `columns.length` must match `rows[0].length` (if rows exist)
- `rowsReturned` <= `totalRows`
- `executionTimeMs` >= 0

**Storage**: In-memory only (renderer process state)

**Relationships**: 
- Belongs to one `QueryTab`

---

### ColumnMetadata

Represents metadata for a result column.

**Fields**:
- `name` (string, required): Column name
- `type` (string, required): BigQuery data type (STRING, INTEGER, FLOAT, BOOLEAN, TIMESTAMP, DATE, etc.)
- `mode` (string, optional): Column mode (NULLABLE, REQUIRED, REPEATED)

**Validation Rules**:
- `name` must be non-empty

---

### Row

Represents a single row of query results.

**Fields**:
- `values` (any[], required): Cell values matching column order

**Validation Rules**:
- `values.length` must match parent QueryResult's `columns.length`

---

## State Management

### Connection Store (Zustand)

Manages active connection state.

**State**:
- `connection`: ConnectionConfiguration | null
- `isConnecting`: boolean
- `connectionError`: string | null

**Actions**:
- `setConnection(config: ConnectionConfiguration)`
- `clearConnection()`
- `setConnecting(isConnecting: boolean)`
- `setConnectionError(error: string | null)`

---

### Tabs Store (Zustand)

Manages query tabs state.

**State**:
- `tabs`: QueryTab[]
- `activeTabId`: string | null

**Actions**:
- `createTab(): string` (returns new tab ID)
- `closeTab(tabId: string)`
- `setActiveTab(tabId: string)`
- `updateTab(tabId: string, updates: Partial<QueryTab>)`
- `setTabQuery(tabId: string, queryText: string)`
- `setTabResults(tabId: string, results: QueryResult)`
- `setTabError(tabId: string, error: string)`
- `setTabStatus(tabId: string, status: QueryTab['executionStatus'])`

---

### Saved Queries Store (Zustand)

Manages saved queries state.

**State**:
- `queries`: SavedQuery[]
- `isLoading`: boolean
- `searchTerm`: string

**Actions**:
- `loadQueries()`: Promise<void>
- `saveQuery(query: Omit<SavedQuery, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>`
- `updateQuery(id: string, updates: Partial<SavedQuery>): Promise<void>`
- `deleteQuery(id: string): Promise<void>`
- `setSearchTerm(term: string)`
- `getFilteredQueries(): SavedQuery[]` (computed based on searchTerm)

---

## Data Flow

### Query Execution Flow

1. User types query in QueryTab
2. User clicks "Execute" button
3. Renderer calls IPC: `bigquery:execute(queryText, projectId)`
4. Main process creates BigQuery job
5. Main process streams results back via IPC
6. Renderer updates QueryTab with results
7. QueryTab state updated: executionStatus = 'completed', results set

### Save Query Flow

1. User clicks "Save Query" in QueryTab
2. User provides name (and optional description)
3. Renderer calls IPC: `queries:save({ name, sqlText, description })`
4. Main process generates ID, timestamps, saves to electron-store
5. Main process returns SavedQuery via IPC
6. Renderer updates SavedQueries store
7. QueryTab updated with savedQueryId

### Load Query Flow

1. User selects saved query from list
2. Renderer calls IPC: `queries:load(id)`
3. Main process loads SavedQuery from electron-store
4. Main process returns SavedQuery via IPC
5. Renderer creates new QueryTab or updates active tab with query text
6. QueryTab updated with savedQueryId reference

---

## Validation Rules Summary

### ConnectionConfiguration
- Project ID: Non-empty, valid GCP format
- Auth: Service account key must be valid JSON if provided

### QueryTab
- Query text: Non-empty
- Status transitions: Valid state machine

### SavedQuery
- Name: Non-empty, max 255 chars, unique
- SQL: Non-empty

### QueryResult
- Column/row consistency: Columns match row structure
- Pagination: rowsReturned <= totalRows

---

## Storage Locations

### Main Process (Node.js)
- **Connection credentials**: Electron safeStorage API (encrypted)
- **Saved queries**: `electron-store` → `app.getPath('userData')/queries.json`

### Renderer Process (React)
- **Tabs state**: Zustand store (in-memory)
- **Connection state**: Zustand store (in-memory)
- **Saved queries cache**: Zustand store (loaded from main process)

---

## Migration Considerations

### Future Schema Changes
- Version field in saved queries JSON for migration support
- Backward compatibility: Handle missing optional fields gracefully
- Export/import functionality for user data portability

