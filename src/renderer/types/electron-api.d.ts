import type { ConnectionConfig, ConnectionConfiguration } from '../../shared/types/connection';
import type { SavedQuery, SaveQueryInput, UpdateQueryInput, QueryResult, ColumnMetadata, QueryTab, Row, QueryHistoryEntry, SchemaField, StoredSchema } from '../../shared/types/query';
import type { Dataset, Table } from '../../shared/types/dataset';
import type { JobDetails } from '../../shared/types/bigquery';
import type {
  LLMProvider,
  LLMConfig,
  LLMSettings,
  ChatMessage,
  ChatConversation,
  ChatResponse,
  SchemaContext,
} from '../../shared/types/llm';

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

  // Schema cache (SQLite-backed with 12-hour TTL)
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
    onCloseTab(callback: () => void): () => void;
    onSaveQuery(callback: () => void): () => void;
    onFormatQuery(callback: () => void): () => void;
    onExecuteQuery(callback: () => void): () => void;
    onShowConnection(callback: () => void): () => void;
    onDisconnect(callback: () => void): () => void;
    onToggleTheme(callback: () => void): () => void;
    onSearchSchema(callback: () => void): () => void;
    onToggleAIAssistant(callback: () => void): () => void;
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

  // LLM / AI Chat operations
  llm: {
    // Settings
    getSettings(): Promise<LLMSettings>;
    saveSettings(settings: LLMSettings): Promise<void>;
    configureProvider(config: LLMConfig): Promise<void>;
    getProviderConfig(provider: LLMProvider): Promise<Omit<LLMConfig, 'apiKey'> | null>;
    hasApiKey(provider: LLMProvider): Promise<boolean>;
    deleteProviderConfig(provider: LLMProvider): Promise<void>;
    setActiveProvider(provider: LLMProvider | null): Promise<void>;
    getActiveProvider(): Promise<LLMProvider | null>;
    saveSystemPrompt(prompt: string): Promise<void>;
    getSystemPrompt(): Promise<string>;
    testConnection(provider?: LLMProvider): Promise<boolean>;
    isConfigured(): Promise<boolean>;
    
    // Chat
    chat(messages: ChatMessage[], schemaContext?: SchemaContext): Promise<ChatResponse>;
    chatStream(conversationId: string, messages: ChatMessage[], schemaContext?: SchemaContext): Promise<{ messageId: string }>;
    onStreamChunk(callback: (data: { conversationId: string; messageId: string; content: string; isComplete: boolean }) => void): () => void;
    onStreamComplete(callback: (data: { conversationId: string; messageId: string; fullContent: string; containsQuery: boolean; sqlQuery?: string }) => void): () => void;
    onStreamError(callback: (data: { conversationId: string; error: string }) => void): () => void;
    
    // Conversations
    createConversation(title?: string, tabId?: string): Promise<ChatConversation>;
    getConversation(id: string): Promise<ChatConversation | null>;
    listConversations(limit?: number, offset?: number): Promise<ChatConversation[]>;
    updateConversation(id: string, updates: Partial<Pick<ChatConversation, 'title' | 'messages' | 'tabId'>>): Promise<ChatConversation | null>;
    addMessage(conversationId: string, message: ChatMessage): Promise<ChatConversation | null>;
    deleteConversation(id: string): Promise<void>;
    clearConversations(): Promise<void>;
    searchConversations(query: string, limit?: number): Promise<ChatConversation[]>;
    getTabConversation(tabId: string): Promise<ChatConversation>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

