import { contextBridge, ipcRenderer } from 'electron';
import type { ConnectionConfig, ConnectionConfiguration } from '../shared/types/connection';
import type { SavedQuery, SaveQueryInput, UpdateQueryInput, QueryResult, ColumnMetadata } from '../shared/types/query';
import type { Dataset, Table } from '../shared/types/dataset';

/**
 * Electron API exposed to renderer process
 */
export interface ElectronAPI {
  // BigQuery operations
  bigquery: {
    execute(queryText: string, projectId: string): Promise<QueryResult>;
    cancel(jobId: string): Promise<void>;
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
  };

  // Menu events
  menu: {
    onShowHelp(callback: () => void): () => void;
    onNewTab(callback: () => void): () => void;
  };
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  bigquery: {
    execute: (queryText: string, projectId: string) =>
      ipcRenderer.invoke('bigquery:execute', queryText, projectId),
    cancel: (jobId: string) => ipcRenderer.invoke('bigquery:cancel', jobId),
    listDatasets: () => ipcRenderer.invoke('bigquery:listDatasets'),
    listTables: (datasetId: string) => ipcRenderer.invoke('bigquery:listTables', datasetId),
    getTableSchema: (datasetId: string, tableId: string) =>
      ipcRenderer.invoke('bigquery:getTableSchema', datasetId, tableId),
    getViewDefinition: (datasetId: string, tableId: string) =>
      ipcRenderer.invoke('bigquery:getViewDefinition', datasetId, tableId),
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
  },
} as ElectronAPI);

// Extend Window interface for TypeScript
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

