import { create } from 'zustand';
import type { SchemaField, StoredSchema } from '../../shared/types/query';

// Re-export types for convenience
export type { SchemaField, StoredSchema };

/**
 * Cached table schema with metadata (in-memory representation)
 */
export interface CachedTableSchema {
  datasetId: string;
  tableId: string;
  fields: SchemaField[];
  lastUpdated: number;
}

/**
 * Search result item for schema search
 */
export interface SchemaSearchResult {
  type: 'table' | 'column';
  datasetId: string;
  tableId: string;
  columnName?: string;
  columnType?: string;
  columnPath?: string; // For nested columns: "parent.child.field"
  matchScore: number;
}

interface SchemaCacheState {
  // Map of "datasetId.tableId" -> schema
  schemas: Map<string, CachedTableSchema>;
  isLoading: boolean;
  loadingProgress: { loaded: number; total: number };
  
  // Actions
  setSchema: (datasetId: string, tableId: string, fields: SchemaField[]) => void;
  getSchema: (datasetId: string, tableId: string) => CachedTableSchema | undefined;
  hasSchema: (datasetId: string, tableId: string) => boolean;
  
  // Bulk loading
  setIsLoading: (loading: boolean) => void;
  setLoadingProgress: (loaded: number, total: number) => void;
  
  // Search function
  search: (query: string, maxResults?: number) => SchemaSearchResult[];
  
  // Clear cache
  clear: () => void;
}

/**
 * Flatten nested fields into searchable paths
 */
function flattenFields(
  fields: SchemaField[],
  parentPath: string = ''
): Array<{ name: string; type: string; path: string }> {
  const result: Array<{ name: string; type: string; path: string }> = [];
  
  for (const field of fields) {
    const currentPath = parentPath ? `${parentPath}.${field.name}` : field.name;
    result.push({ name: field.name, type: field.type, path: currentPath });
    
    if (field.fields && field.fields.length > 0) {
      result.push(...flattenFields(field.fields, currentPath));
    }
  }
  
  return result;
}

/**
 * Calculate match score for fuzzy search
 * Higher score = better match
 */
function calculateMatchScore(query: string, text: string): number {
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();
  
  // Exact match
  if (textLower === queryLower) return 1000;
  
  // Starts with query
  if (textLower.startsWith(queryLower)) return 500 + (queryLower.length / textLower.length) * 100;
  
  // Contains query as whole word
  const wordBoundaryRegex = new RegExp(`\\b${escapeRegex(queryLower)}\\b`);
  if (wordBoundaryRegex.test(textLower)) return 300 + (queryLower.length / textLower.length) * 100;
  
  // Contains query
  const index = textLower.indexOf(queryLower);
  if (index !== -1) return 100 + (queryLower.length / textLower.length) * 100;
  
  // Fuzzy match - check if all characters appear in order
  let queryIndex = 0;
  let matchedChars = 0;
  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      matchedChars++;
      queryIndex++;
    }
  }
  
  if (queryIndex === queryLower.length) {
    return matchedChars / textLower.length * 50;
  }
  
  return 0;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const useSchemaCacheStore = create<SchemaCacheState>((set, get) => ({
  schemas: new Map(),
  isLoading: false,
  loadingProgress: { loaded: 0, total: 0 },
  
  setSchema: (datasetId, tableId, fields) => {
    set((state) => {
      const key = `${datasetId}.${tableId}`;
      const newSchemas = new Map(state.schemas);
      newSchemas.set(key, {
        datasetId,
        tableId,
        fields,
        lastUpdated: Date.now(),
      });
      return { schemas: newSchemas };
    });
  },
  
  getSchema: (datasetId, tableId) => {
    const key = `${datasetId}.${tableId}`;
    return get().schemas.get(key);
  },
  
  hasSchema: (datasetId, tableId) => {
    const key = `${datasetId}.${tableId}`;
    return get().schemas.has(key);
  },
  
  setIsLoading: (loading) => set({ isLoading: loading }),
  
  setLoadingProgress: (loaded, total) => set({ loadingProgress: { loaded, total } }),
  
  search: (query, maxResults = 50) => {
    if (!query.trim()) return [];
    
    const results: SchemaSearchResult[] = [];
    const { schemas } = get();
    
    // Search through all cached schemas
    for (const [, schema] of schemas) {
      const { datasetId, tableId, fields } = schema;
      
      // Check table name match
      const tableScore = calculateMatchScore(query, tableId);
      if (tableScore > 0) {
        results.push({
          type: 'table',
          datasetId,
          tableId,
          matchScore: tableScore,
        });
      }
      
      // Check column matches
      const flatFields = flattenFields(fields);
      for (const field of flatFields) {
        const nameScore = calculateMatchScore(query, field.name);
        const pathScore = field.path !== field.name ? calculateMatchScore(query, field.path) : 0;
        const bestScore = Math.max(nameScore, pathScore);
        
        if (bestScore > 0) {
          results.push({
            type: 'column',
            datasetId,
            tableId,
            columnName: field.name,
            columnType: field.type,
            columnPath: field.path,
            matchScore: bestScore,
          });
        }
      }
    }
    
    // Sort by score (descending) and limit results
    results.sort((a, b) => b.matchScore - a.matchScore);
    return results.slice(0, maxResults);
  },
  
  clear: () => set({ schemas: new Map(), isLoading: false, loadingProgress: { loaded: 0, total: 0 } }),
}));
