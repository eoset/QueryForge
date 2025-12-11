/**
 * Background schema indexer
 * Loads and indexes all table schemas for the AI assistant and schema search
 */

import { useSchemaCacheStore } from '../stores/schema-cache-store';
import { useBigQueryMetadataStore } from '../stores/bigquery-metadata-store';
import type { SchemaField, StoredSchema } from '../../shared/types/query';

// Datasets to exclude from schema indexing
const FILTERED_DATASETS = ['airbyte_internal', 'Auditlogs'];

// Track if indexing is already in progress
let isIndexingInProgress = false;

/**
 * Load schemas from SQLite cache and index them in memory
 * Then fetch any missing or expired schemas from BigQuery
 */
export async function indexSchemasInBackground(projectId: string): Promise<void> {
  // Prevent multiple concurrent indexing operations
  if (isIndexingInProgress) {
    console.log('[SchemaIndexer] Indexing already in progress, skipping');
    return;
  }

  if (!window.electronAPI?.schemaCache || !window.electronAPI?.bigquery) {
    console.warn('[SchemaIndexer] Required APIs not available');
    return;
  }

  const { setSchema, hasSchema, setIsLoading, setLoadingProgress } = useSchemaCacheStore.getState();

  try {
    isIndexingInProgress = true;

    // Step 1: Check if we need to refresh (older than 12 hour TTL)
    let needsRefresh = false;
    try {
      needsRefresh = await window.electronAPI.schemaCache.needsRefresh(projectId);
    } catch (err) {
      console.warn('[SchemaIndexer] Failed to check cache refresh status:', err);
      needsRefresh = true;
    }

    // Step 2: Load existing cached schemas from SQLite
    try {
      const cachedSchemas = await window.electronAPI.schemaCache.getForProject(projectId);
      
      // Populate in-memory store with cached schemas
      for (const schema of cachedSchemas) {
        if (FILTERED_DATASETS.includes(schema.datasetId)) continue;
        setSchema(schema.datasetId, schema.tableId, schema.fields);
      }
      
      console.log(`[SchemaIndexer] Loaded ${cachedSchemas.length} schemas from SQLite cache`);

      // If cache is fresh (within TTL), we're done
      if (!needsRefresh && cachedSchemas.length > 0) {
        console.log('[SchemaIndexer] Cache is fresh, skipping BigQuery fetch');
        return;
      }
    } catch (err) {
      console.warn('[SchemaIndexer] Failed to load cached schemas:', err);
    }

    // Step 3: Get datasets list
    const { datasets } = useBigQueryMetadataStore.getState();
    if (datasets.length === 0) {
      console.log('[SchemaIndexer] No datasets available yet, will retry when datasets are loaded');
      return;
    }

    // Step 4: Collect all tables that need to be fetched
    const allTables: Array<{ datasetId: string; tableId: string }> = [];
    
    for (const dataset of datasets) {
      if (FILTERED_DATASETS.includes(dataset.id)) continue;
      
      try {
        const tables = await window.electronAPI.bigquery.listTables(dataset.id);
        for (const table of tables) {
          // If cache needs full refresh, load all tables
          // Otherwise, only load tables not in memory cache
          if (needsRefresh || !hasSchema(dataset.id, table.id)) {
            allTables.push({ datasetId: dataset.id, tableId: table.id });
          }
        }
      } catch (err) {
        console.warn(`[SchemaIndexer] Failed to list tables for ${dataset.id}:`, err);
      }
    }

    if (allTables.length === 0) {
      console.log('[SchemaIndexer] All schemas are up to date');
      return;
    }

    console.log(`[SchemaIndexer] Fetching ${allTables.length} schemas from BigQuery`);
    setIsLoading(true);
    setLoadingProgress(0, allTables.length);

    // Step 5: Fetch schemas in batches
    const batchSize = 5;
    const schemasToSave: Array<{
      projectId: string;
      datasetId: string;
      tableId: string;
      fields: SchemaField[];
    }> = [];

    for (let i = 0; i < allTables.length; i += batchSize) {
      const batch = allTables.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async ({ datasetId, tableId }) => {
          try {
            const schemaResult = await window.electronAPI.bigquery.getTableSchema(datasetId, tableId);
            if (schemaResult?.fields) {
              setSchema(datasetId, tableId, schemaResult.fields);
              schemasToSave.push({
                projectId,
                datasetId,
                tableId,
                fields: schemaResult.fields,
              });
            }
          } catch (err) {
            console.warn(`[SchemaIndexer] Failed to load schema for ${datasetId}.${tableId}:`, err);
          }
        })
      );
      
      setLoadingProgress(Math.min(i + batchSize, allTables.length), allTables.length);
    }

    // Step 6: Save all fetched schemas to SQLite cache
    if (schemasToSave.length > 0) {
      try {
        await window.electronAPI.schemaCache.saveBatch(schemasToSave);
        console.log(`[SchemaIndexer] Saved ${schemasToSave.length} schemas to SQLite cache`);
      } catch (err) {
        console.warn('[SchemaIndexer] Failed to save schemas to cache:', err);
      }
    }

    setIsLoading(false);
    console.log('[SchemaIndexer] Schema indexing complete');

  } catch (err) {
    console.error('[SchemaIndexer] Error during schema indexing:', err);
    useSchemaCacheStore.getState().setIsLoading(false);
  } finally {
    isIndexingInProgress = false;
  }
}

/**
 * Check if schema indexing is currently in progress
 */
export function isSchemaIndexingInProgress(): boolean {
  return isIndexingInProgress;
}
