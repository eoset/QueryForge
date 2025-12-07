import { contextBridge, ipcRenderer } from 'electron';
import type { ConnectionConfig, ConnectionConfiguration } from '../shared/types/connection';
import type { SavedQuery, SaveQueryInput, UpdateQueryInput, QueryResult, ColumnMetadata, QueryTab, Row, QueryHistoryEntry, SchemaField, StoredSchema } from '../shared/types/query';
import type { Dataset, Table } from '../shared/types/dataset';
import type { JobDetails } from '../shared/types/bigquery';
import type { ThemeDefinition, StoredThemeSettings } from '../shared/types/theme';

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
    onRowsUpdate(callback: (data: { jobId: string; columns: any[]; rows: any[]; totalRows: number; rowsReturned: number; executionTimeMs: number; bytesProcessed: number; hasMore: boolean; message: string }) => void): () => void;
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
    // Theme settings
    getThemeSettings(): Promise<StoredThemeSettings>;
    setActiveTheme(themeId: string): Promise<void>;
    addCustomTheme(theme: ThemeDefinition): Promise<void>;
    removeCustomTheme(themeId: string): Promise<void>;
  };

  // Tabs management
  tabs: {
    getTabs(): Promise<QueryTab[]>;
    getActiveTabId(): Promise<string | null>;
    saveTabs(tabs: QueryTab[], activeTabId: string | null): Promise<void>;
    onBeforeClose(callback: () => void): () => void;
  };

  // Results cache
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
    delete(tabId: string): Promise<void>;
    clear(): Promise<void>;
  };

  // Schema cache
  schemaCache: {
    save(projectId: string, datasetId: string, tableId: string, fields: SchemaField[]): Promise<void>;
    saveBatch(schemas: Array<{ projectId: string; datasetId: string; tableId: string; fields: SchemaField[] }>): Promise<void>;
    get(projectId: string, datasetId: string, tableId: string): Promise<StoredSchema | null>;
    hasValid(projectId: string, datasetId: string, tableId: string): Promise<boolean>;
    getForProject(projectId: string): Promise<StoredSchema[]>;
    needsRefresh(projectId: string): Promise<boolean>;
    delete(projectId: string, datasetId: string, tableId: string): Promise<void>;
    deleteForProject(projectId: string): Promise<void>;
    deleteExpired(): Promise<number>;
    clear(): Promise<void>;
    stats(): Promise<{
      totalSchemas: number;
      validSchemas: number;
      expiredSchemas: number;
      oldestTimestamp: number | null;
      newestTimestamp: number | null;
      databaseSizeBytes: number;
    }>;
  };

  // Menu events
  menu: {
    onShowHelp(callback: () => void): () => void;
    onNewTab(callback: () => void): () => void;
    onShowAbout(callback: () => void): () => void;
    onToggleTheme(callback: () => void): () => void;
    onSaveQuery(callback: () => void): () => void;
    onSearchSchema(callback: () => void): () => void;
    onShowThemeSettings(callback: () => void): () => void;
  };

  // App info
  app: {
    getVersion(): Promise<string>;
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

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  bigquery: {
    execute: (queryText: string, projectId: string, tabId?: string) =>
      ipcRenderer.invoke('bigquery:execute', queryText, projectId, tabId),
    cancel: (jobId: string) => ipcRenderer.invoke('bigquery:cancel', jobId),
    dryRun: (queryText: string) => ipcRenderer.invoke('bigquery:dryRun', queryText),
    listDatasets: () => ipcRenderer.invoke('bigquery:listDatasets'),
    listTables: (datasetId: string) => ipcRenderer.invoke('bigquery:listTables', datasetId),
    getTableSchema: (datasetId: string, tableId: string) =>
      ipcRenderer.invoke('bigquery:getTableSchema', datasetId, tableId),
    getViewDefinition: (datasetId: string, tableId: string) =>
      ipcRenderer.invoke('bigquery:getViewDefinition', datasetId, tableId),
    getJobInfo: (jobId: string) => ipcRenderer.invoke('bigquery:getJobInfo', jobId),
    onProgress: (callback: (data: { jobId: string; rowsFetched: number; isComplete: boolean; message: string }) => void) => {
      const handler = (_event: any, data: any) => callback(data);
      ipcRenderer.on('bigquery:progress', handler);
      return () => ipcRenderer.removeListener('bigquery:progress', handler);
    },
    onRowsUpdate: (callback: (data: { jobId: string; columns: any[]; rows: any[]; totalRows: number; rowsReturned: number; executionTimeMs: number; bytesProcessed: number; hasMore: boolean; message: string }) => void) => {
      const handler = (_event: any, data: any) => callback(data);
      ipcRenderer.on('bigquery:rows-update', handler);
      return () => ipcRenderer.removeListener('bigquery:rows-update', handler);
    },
  },
  connection: {
    configure: (config: ConnectionConfig) =>
      ipcRenderer.invoke('connection:configure', config),
    getActive: () => ipcRenderer.invoke('connection:getActive'),
    getSaved: () => ipcRenderer.invoke('connection:getSaved'),
    restore: () => ipcRenderer.invoke('connection:restore'),
    test: (config: ConnectionConfig) => ipcRenderer.invoke('connection:test', config),
    disconnect: () => ipcRenderer.invoke('connection:disconnect'),
  },
  queries: {
    list: () => ipcRenderer.invoke('queries:list'),
    get: (id: string) => ipcRenderer.invoke('queries:get', id),
    save: (query: SaveQueryInput) => ipcRenderer.invoke('queries:save', query),
    update: (id: string, updates: UpdateQueryInput) =>
      ipcRenderer.invoke('queries:update', id, updates),
    delete: (id: string) => ipcRenderer.invoke('queries:delete', id),
    search: (term: string) => ipcRenderer.invoke('queries:search', term),
  },
  uiSettings: {
    getLeftSidebarWidth: () => ipcRenderer.invoke('ui-settings:getLeftSidebarWidth'),
    setLeftSidebarWidth: (width: number) => ipcRenderer.invoke('ui-settings:setLeftSidebarWidth', width),
    getRightSidebarWidth: () => ipcRenderer.invoke('ui-settings:getRightSidebarWidth'),
    setRightSidebarWidth: (width: number) => ipcRenderer.invoke('ui-settings:setRightSidebarWidth', width),
    getTheme: () => ipcRenderer.invoke('ui-settings:getTheme'),
    setTheme: (theme: 'dark' | 'light') => ipcRenderer.invoke('ui-settings:setTheme', theme),
    // Theme settings
    getThemeSettings: () => ipcRenderer.invoke('ui-settings:getThemeSettings'),
    setActiveTheme: (themeId: string) => ipcRenderer.invoke('ui-settings:setActiveTheme', themeId),
    addCustomTheme: (theme: ThemeDefinition) => ipcRenderer.invoke('ui-settings:addCustomTheme', theme),
    removeCustomTheme: (themeId: string) => ipcRenderer.invoke('ui-settings:removeCustomTheme', themeId),
  },
  tabs: {
    getTabs: () => ipcRenderer.invoke('tabs:getTabs'),
    getActiveTabId: () => ipcRenderer.invoke('tabs:getActiveTabId'),
    saveTabs: (tabs: QueryTab[], activeTabId: string | null) =>
      ipcRenderer.invoke('tabs:saveTabs', tabs, activeTabId),
    onBeforeClose: (callback: () => void) => {
      const handler = () => callback();
      ipcRenderer.on('app:before-close', handler);
      return () => ipcRenderer.removeListener('app:before-close', handler);
    },
  },
  resultsCache: {
    save: (tabId: string, results: QueryResult) =>
      ipcRenderer.invoke('results-cache:save', tabId, results),
    get: (tabId: string) => ipcRenderer.invoke('results-cache:get', tabId),
    getMetadata: (tabId: string) => ipcRenderer.invoke('results-cache:getMetadata', tabId),
    getPage: (tabId: string, pageNumber: number) =>
      ipcRenderer.invoke('results-cache:getPage', tabId, pageNumber),
    getRange: (tabId: string, startIndex: number, count: number) =>
      ipcRenderer.invoke('results-cache:getRange', tabId, startIndex, count),
    delete: (tabId: string) => ipcRenderer.invoke('results-cache:delete', tabId),
    clear: () => ipcRenderer.invoke('results-cache:clear'),
    stats: () => ipcRenderer.invoke('results-cache:stats'),
  },
  schemaCache: {
    save: (projectId: string, datasetId: string, tableId: string, fields: SchemaField[]) =>
      ipcRenderer.invoke('schema-cache:save', projectId, datasetId, tableId, fields),
    saveBatch: (schemas: Array<{ projectId: string; datasetId: string; tableId: string; fields: SchemaField[] }>) =>
      ipcRenderer.invoke('schema-cache:saveBatch', schemas),
    get: (projectId: string, datasetId: string, tableId: string) =>
      ipcRenderer.invoke('schema-cache:get', projectId, datasetId, tableId),
    hasValid: (projectId: string, datasetId: string, tableId: string) =>
      ipcRenderer.invoke('schema-cache:hasValid', projectId, datasetId, tableId),
    getForProject: (projectId: string) =>
      ipcRenderer.invoke('schema-cache:getForProject', projectId),
    needsRefresh: (projectId: string) =>
      ipcRenderer.invoke('schema-cache:needsRefresh', projectId),
    delete: (projectId: string, datasetId: string, tableId: string) =>
      ipcRenderer.invoke('schema-cache:delete', projectId, datasetId, tableId),
    deleteForProject: (projectId: string) =>
      ipcRenderer.invoke('schema-cache:deleteForProject', projectId),
    deleteExpired: () => ipcRenderer.invoke('schema-cache:deleteExpired'),
    clear: () => ipcRenderer.invoke('schema-cache:clear'),
    stats: () => ipcRenderer.invoke('schema-cache:stats'),
  },
  menu: {
    onShowHelp: (callback: () => void) => {
      const handler = () => callback();
      ipcRenderer.on('menu:show-help', handler);
      return () => ipcRenderer.removeListener('menu:show-help', handler);
    },
    onNewTab: (callback: () => void) => {
      const handler = () => callback();
      ipcRenderer.on('menu:new-tab', handler);
      return () => ipcRenderer.removeListener('menu:new-tab', handler);
    },
    onShowAbout: (callback: () => void) => {
      const handler = () => callback();
      ipcRenderer.on('menu:show-about', handler);
      return () => ipcRenderer.removeListener('menu:show-about', handler);
    },
    onToggleTheme: (callback: () => void) => {
      const handler = () => callback();
      ipcRenderer.on('menu:toggle-theme', handler);
      return () => ipcRenderer.removeListener('menu:toggle-theme', handler);
    },
    onSaveQuery: (callback: () => void) => {
      const handler = () => callback();
      ipcRenderer.on('menu:save-query', handler);
      return () => ipcRenderer.removeListener('menu:save-query', handler);
    },
    onSearchSchema: (callback: () => void) => {
      const handler = () => callback();
      ipcRenderer.on('menu:search-schema', handler);
      return () => ipcRenderer.removeListener('menu:search-schema', handler);
    },
    onShowThemeSettings: (callback: () => void) => {
      const handler = () => callback();
      ipcRenderer.on('menu:show-theme-settings', handler);
      return () => ipcRenderer.removeListener('menu:show-theme-settings', handler);
    },
  },
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
  },
  export: {
    saveFile: (content: string, options: { format: 'csv' | 'json'; defaultFilename?: string }) =>
      ipcRenderer.invoke('export:saveFile', content, options),
  },
  queryHistory: {
    add: (entry: QueryHistoryEntry) => ipcRenderer.invoke('query-history:add', entry),
    list: (limit?: number, offset?: number) => ipcRenderer.invoke('query-history:list', limit, offset),
    search: (searchTerm: string, limit?: number) => ipcRenderer.invoke('query-history:search', searchTerm, limit),
    get: (id: string) => ipcRenderer.invoke('query-history:get', id),
    delete: (id: string) => ipcRenderer.invoke('query-history:delete', id),
    updateByJobId: (jobId: string, totalRows: number) => ipcRenderer.invoke('query-history:updateByJobId', jobId, totalRows),
    clear: () => ipcRenderer.invoke('query-history:clear'),
    count: () => ipcRenderer.invoke('query-history:count'),
  },
} as ElectronAPI);

// Extend Window interface for TypeScript
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

