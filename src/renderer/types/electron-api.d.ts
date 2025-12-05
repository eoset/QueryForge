import type { ConnectionConfig, ConnectionConfiguration } from '../../shared/types/connection';
import type { SavedQuery, SaveQueryInput, UpdateQueryInput, QueryResult, ColumnMetadata, QueryTab, Row, QueryHistoryEntry } from '../../shared/types/query';
import type { Dataset, Table } from '../../shared/types/dataset';
import type { JobDetails } from '../../shared/types/bigquery';

/**
 * Electron API exposed to renderer process
 */
export interface ElectronAPI {
  // BigQuery operations
  bigquery: {
    execute(queryText: string, projectId: string, tabId?: string): Promise<QueryResult>;
    cancel(jobId: string): Promise<void>;
    dryRun(queryText: string): Promise<{ totalBytesProcessed: number; cacheHit: boolean; statementType: string | null }>;
    listDatasets(): Promise<Dataset[]>;
    listTables(datasetId: string): Promise<Table[]>;
    getTableSchema(datasetId: string, tableId: string): Promise<{ 
      fields: ColumnMetadata[];
      metadata?: {
        creationTime?: number;
        lastModifiedTime?: number;
        numRows?: number;
        numBytes?: number;
      };
    }>;
    getViewDefinition(datasetId: string, tableId: string): Promise<{ definition: string }>;
    getJobInfo(jobId: string): Promise<JobDetails>;
    onProgress(callback: (data: { jobId: string; rowsFetched: number; isComplete: boolean; message: string }) => void): () => void;
    onRowsUpdate(callback: (data: { jobId: string; columns: ColumnMetadata[]; rows: Row[]; totalRows: number; rowsReturned: number; executionTimeMs: number; bytesProcessed: number; hasMore: boolean; message: string }) => void): () => void;
  };

  // Connection management
  connection: {
    configure(config: ConnectionConfig): Promise<void>;
    getActive(): Promise<ConnectionConfiguration | null>;
    getSaved(): Promise<ConnectionConfiguration | null>;
    restore(): Promise<ConnectionConfiguration | null>;
    test(config: ConnectionConfig): Promise<boolean>;
    disconnect(): Promise<void>;
  };

  // Saved queries
  queries: {
    list(): Promise<SavedQuery[]>;
    get(id: string): Promise<SavedQuery>;
    save(query: SaveQueryInput): Promise<SavedQuery>;
    update(id: string, updates: UpdateQueryInput): Promise<SavedQuery>;
    delete(id: string): Promise<void>;
    search(term: string): Promise<SavedQuery[]>;
  };

  // UI settings
  uiSettings: {
    getLeftSidebarWidth(): Promise<number>;
    setLeftSidebarWidth(width: number): Promise<void>;
    getRightSidebarWidth(): Promise<number>;
    setRightSidebarWidth(width: number): Promise<void>;
    getTheme(): Promise<'dark' | 'light'>;
    setTheme(theme: 'dark' | 'light'): Promise<void>;
  };

  // Tabs management
  tabs: {
    getTabs(): Promise<QueryTab[]>;
    getActiveTabId(): Promise<string | null>;
    saveTabs(tabs: QueryTab[], activeTabId: string | null): Promise<void>;
    onBeforeClose(callback: () => void): () => void;
  };

  // Results cache (SQLite-backed for performance with large datasets)
  resultsCache: {
    save(tabId: string, results: QueryResult): Promise<void>;
    get(tabId: string): Promise<QueryResult | null>;
    getMetadata(tabId: string): Promise<{
      columns: ColumnMetadata[];
      totalRows: number;
      rowsReturned: number;
      executionTimeMs: number;
      bytesProcessed?: number;
      jobId: string;
      hasMore: boolean;
    } | null>;
    getPage(tabId: string, pageNumber: number): Promise<Row[] | null>;
    /** Get a range of rows for virtual scrolling */
    getRange(tabId: string, startIndex: number, count: number): Promise<Row[] | null>;
    delete(tabId: string): Promise<void>;
    clear(): Promise<void>;
    /** Get cache statistics */
    stats(): Promise<{ tabCount: number; totalRows: number; dbSizeBytes: number }>;
  };

  // Menu events
  menu: {
    onShowHelp(callback: () => void): () => void;
    onNewTab(callback: () => void): () => void;
    onShowAbout(callback: () => void): () => void;
    onCloseTab(callback: () => void): () => void;
    onSaveQuery(callback: () => void): () => void;
    onFormatQuery(callback: () => void): () => void;
    onExecuteQuery(callback: () => void): () => void;
    onShowConnection(callback: () => void): () => void;
    onDisconnect(callback: () => void): () => void;
    onToggleTheme(callback: () => void): () => void;
  };

  // Export operations
  export: {
    saveFile(content: string, options: { format: 'csv' | 'json'; defaultFilename?: string }): Promise<{ success: boolean; filePath?: string; error?: string }>;
  };

  // Query history
  queryHistory: {
    add(entry: QueryHistoryEntry): Promise<void>;
    list(limit?: number, offset?: number): Promise<QueryHistoryEntry[]>;
    search(searchTerm: string, limit?: number): Promise<QueryHistoryEntry[]>;
    get(id: string): Promise<QueryHistoryEntry | undefined>;
    delete(id: string): Promise<void>;
    updateByJobId(jobId: string, totalRows: number): Promise<void>;
    clear(): Promise<void>;
    count(): Promise<number>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

