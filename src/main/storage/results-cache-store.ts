import Store from 'electron-store';
import type { QueryResult, Row, ColumnMetadata } from '../../shared/types/query';

const ROWS_PER_PAGE = 200;

interface ResultsMetadata {
  columns: ColumnMetadata[];
  totalRows: number;
  rowsReturned: number;
  executionTimeMs: number;
  bytesProcessed?: number;
  jobId: string;
  hasMore: boolean;
}

interface ResultsCacheStoreData {
  metadata: { [tabId: string]: ResultsMetadata };
  pages: { [tabId: string]: { [pageNumber: number]: Row[] } };
}

const store = new Store<ResultsCacheStoreData>({
  name: 'results-cache',
  defaults: {
    metadata: {},
    pages: {},
  },
}) as Store<ResultsCacheStoreData> & {
  get(key: 'metadata'): { [tabId: string]: ResultsMetadata };
  get(key: 'pages'): { [tabId: string]: { [pageNumber: number]: Row[] } };
  set(key: 'metadata', value: { [tabId: string]: ResultsMetadata }): void;
  set(key: 'pages', value: { [tabId: string]: { [pageNumber: number]: Row[] } }): void;
};

/**
 * Save query results for a specific tab
 * This overwrites any existing results for that tab
 * Results are stored in pages for efficient access
 * Uses asynchronous chunked saving to prevent blocking the main process
 */
export function saveResults(tabId: string, results: QueryResult): void {
  const metadata: ResultsMetadata = {
    columns: results.columns,
    totalRows: results.totalRows,
    rowsReturned: results.rowsReturned,
    executionTimeMs: results.executionTimeMs,
    bytesProcessed: results.bytesProcessed,
    jobId: results.jobId,
    hasMore: results.hasMore,
  };

  // Save metadata immediately for instant access
  const allMetadata = store.get('metadata') || {};
  allMetadata[tabId] = metadata;
  store.set('metadata', allMetadata);

  // Initialize pages object
  const allPages = store.get('pages') || {};
  allPages[tabId] = {};
  
  const totalPages = Math.ceil(results.rows.length / ROWS_PER_PAGE);
  
  // Save first page immediately for instant display
  if (results.rows.length > 0) {
    const firstPage = results.rows.slice(0, ROWS_PER_PAGE);
    allPages[tabId][1] = firstPage;
    store.set('pages', allPages);
  }

  // Save remaining pages asynchronously in chunks to avoid blocking
  if (totalPages > 1) {
    let currentPage = 2;
    const CHUNK_SIZE = 5; // Save 5 pages at a time
    
    const saveNextChunk = () => {
      const endPage = Math.min(currentPage + CHUNK_SIZE - 1, totalPages);
      
      // Save chunk of pages
      for (let page = currentPage; page <= endPage; page++) {
        const startIndex = (page - 1) * ROWS_PER_PAGE;
        const endIndex = Math.min(startIndex + ROWS_PER_PAGE, results.rows.length);
        allPages[tabId][page] = results.rows.slice(startIndex, endIndex);
      }
      
      // Update store with this chunk
      store.set('pages', allPages);
      currentPage = endPage + 1;
      
      // Continue with next chunk if there are more pages
      if (currentPage <= totalPages) {
        // Use setImmediate to yield to event loop between chunks
        setImmediate(saveNextChunk);
      }
    };
    
    // Start async saving
    setImmediate(saveNextChunk);
  }
}

/**
 * Get results metadata for a specific tab (without rows)
 */
export function getResultsMetadata(tabId: string): ResultsMetadata | undefined {
  const allMetadata = store.get('metadata') || {};
  return allMetadata[tabId];
}

/**
 * Get a specific page of results for a tab
 */
export function getResultsPage(tabId: string, pageNumber: number): Row[] | undefined {
  const allPages = store.get('pages') || {};
  const tabPages = allPages[tabId];
  if (!tabPages) return undefined;
  return tabPages[pageNumber];
}

/**
 * Get all results for a tab (for backward compatibility)
 * This loads all pages - use getResultsPage for better performance
 */
export function getResults(tabId: string): QueryResult | undefined {
  const metadata = getResultsMetadata(tabId);
  if (!metadata) return undefined;

  const allPages = store.get('pages') || {};
  const tabPages = allPages[tabId];
  if (!tabPages) return undefined;

  // Combine all pages
  const rows: Row[] = [];
  const pageNumbers = Object.keys(tabPages)
    .map(Number)
    .sort((a, b) => a - b);
  
  for (const pageNum of pageNumbers) {
    rows.push(...tabPages[pageNum]);
  }

  return {
    columns: metadata.columns,
    rows,
    totalRows: metadata.totalRows,
    rowsReturned: metadata.rowsReturned,
    executionTimeMs: metadata.executionTimeMs,
    bytesProcessed: metadata.bytesProcessed,
    jobId: metadata.jobId,
    hasMore: metadata.hasMore,
  };
}

/**
 * Delete results for a specific tab
 */
export function deleteResults(tabId: string): void {
  const allMetadata = store.get('metadata') || {};
  const allPages = store.get('pages') || {};
  
  delete allMetadata[tabId];
  delete allPages[tabId];
  
  store.set('metadata', allMetadata);
  store.set('pages', allPages);
}

/**
 * Clear all cached results
 * Called when application closes
 */
export function clearAllResults(): void {
  store.set('metadata', {});
  store.set('pages', {});
}

