/**
 * SQLite-based schema cache for table schemas.
 * Persists schemas across sessions with a configurable TTL.
 */

import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import type { SchemaField, StoredSchema } from '../../shared/types/query';

// Re-export for convenience
export type { SchemaField, StoredSchema };

// 12 hour TTL in milliseconds
const SCHEMA_CACHE_TTL_MS = 12 * 60 * 60 * 1000;

// Database file location
const DB_NAME = 'schema-cache.db';

let db: Database.Database | null = null;

/**
 * Initialize the database connection
 */
function getDatabase(): Database.Database {
  if (db) return db;
  
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, DB_NAME);
  
  db = new Database(dbPath);
  
  // Enable WAL mode for better concurrent read/write performance
  db.pragma('journal_mode = WAL');
  
  // Set cache size to 50MB
  db.pragma('cache_size = -50000');
  
  // Enable memory-mapped I/O for better read performance
  db.pragma('mmap_size = 268435456'); // 256MB
  
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS schemas (
      key TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      dataset_id TEXT NOT NULL,
      table_id TEXT NOT NULL,
      fields_json TEXT NOT NULL,
      last_updated INTEGER NOT NULL
    );
    
    CREATE INDEX IF NOT EXISTS idx_schemas_project ON schemas(project_id);
    CREATE INDEX IF NOT EXISTS idx_schemas_dataset ON schemas(project_id, dataset_id);
    CREATE INDEX IF NOT EXISTS idx_schemas_updated ON schemas(last_updated);
  `);
  
  return db;
}

/**
 * Create a cache key from identifiers
 */
function createCacheKey(projectId: string, datasetId: string, tableId: string): string {
  return `${projectId}.${datasetId}.${tableId}`;
}

/**
 * Save a schema to the cache
 */
export function saveSchema(
  projectId: string,
  datasetId: string,
  tableId: string,
  fields: SchemaField[]
): void {
  const database = getDatabase();
  const key = createCacheKey(projectId, datasetId, tableId);
  const now = Date.now();
  
  const stmt = database.prepare(`
    INSERT OR REPLACE INTO schemas (key, project_id, dataset_id, table_id, fields_json, last_updated)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(key, projectId, datasetId, tableId, JSON.stringify(fields), now);
}

/**
 * Save multiple schemas in a single transaction (batch insert)
 */
export function saveSchemas(
  schemas: Array<{
    projectId: string;
    datasetId: string;
    tableId: string;
    fields: SchemaField[];
  }>
): void {
  const database = getDatabase();
  const now = Date.now();
  
  const stmt = database.prepare(`
    INSERT OR REPLACE INTO schemas (key, project_id, dataset_id, table_id, fields_json, last_updated)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const insertMany = database.transaction((items: typeof schemas) => {
    for (const item of items) {
      const key = createCacheKey(item.projectId, item.datasetId, item.tableId);
      stmt.run(key, item.projectId, item.datasetId, item.tableId, JSON.stringify(item.fields), now);
    }
  });
  
  insertMany(schemas);
}

/**
 * Get a schema from the cache
 * Returns null if not found or expired
 */
export function getSchema(
  projectId: string,
  datasetId: string,
  tableId: string
): StoredSchema | null {
  const database = getDatabase();
  const key = createCacheKey(projectId, datasetId, tableId);
  
  const stmt = database.prepare(`
    SELECT project_id, dataset_id, table_id, fields_json, last_updated
    FROM schemas
    WHERE key = ?
  `);
  
  const row = stmt.get(key) as {
    project_id: string;
    dataset_id: string;
    table_id: string;
    fields_json: string;
    last_updated: number;
  } | undefined;
  
  if (!row) return null;
  
  return {
    projectId: row.project_id,
    datasetId: row.dataset_id,
    tableId: row.table_id,
    fields: JSON.parse(row.fields_json),
    lastUpdated: row.last_updated,
  };
}

/**
 * Check if a schema exists and is not expired
 */
export function hasValidSchema(
  projectId: string,
  datasetId: string,
  tableId: string
): boolean {
  const database = getDatabase();
  const key = createCacheKey(projectId, datasetId, tableId);
  const expiryTime = Date.now() - SCHEMA_CACHE_TTL_MS;
  
  const stmt = database.prepare(`
    SELECT 1 FROM schemas WHERE key = ? AND last_updated > ?
  `);
  
  const row = stmt.get(key, expiryTime);
  return !!row;
}

/**
 * Get all schemas for a project that are not expired
 */
export function getSchemasForProject(projectId: string): StoredSchema[] {
  const database = getDatabase();
  const expiryTime = Date.now() - SCHEMA_CACHE_TTL_MS;
  
  const stmt = database.prepare(`
    SELECT project_id, dataset_id, table_id, fields_json, last_updated
    FROM schemas
    WHERE project_id = ? AND last_updated > ?
  `);
  
  const rows = stmt.all(projectId, expiryTime) as Array<{
    project_id: string;
    dataset_id: string;
    table_id: string;
    fields_json: string;
    last_updated: number;
  }>;
  
  return rows.map((row) => ({
    projectId: row.project_id,
    datasetId: row.dataset_id,
    tableId: row.table_id,
    fields: JSON.parse(row.fields_json),
    lastUpdated: row.last_updated,
  }));
}

/**
 * Get the last updated timestamp for schemas in a project
 * Used to check if we need to refresh
 */
export function getOldestSchemaTimestamp(projectId: string): number | null {
  const database = getDatabase();
  
  const stmt = database.prepare(`
    SELECT MIN(last_updated) as oldest
    FROM schemas
    WHERE project_id = ?
  `);
  
  const row = stmt.get(projectId) as { oldest: number | null } | undefined;
  return row?.oldest ?? null;
}

/**
 * Check if schemas for a project need to be refreshed (older than TTL)
 */
export function needsRefresh(projectId: string): boolean {
  const oldest = getOldestSchemaTimestamp(projectId);
  if (oldest === null) return true; // No schemas cached
  
  return Date.now() - oldest > SCHEMA_CACHE_TTL_MS;
}

/**
 * Delete a schema from the cache
 */
export function deleteSchema(
  projectId: string,
  datasetId: string,
  tableId: string
): void {
  const database = getDatabase();
  const key = createCacheKey(projectId, datasetId, tableId);
  
  const stmt = database.prepare('DELETE FROM schemas WHERE key = ?');
  stmt.run(key);
}

/**
 * Delete all schemas for a project
 */
export function deleteSchemasForProject(projectId: string): void {
  const database = getDatabase();
  
  const stmt = database.prepare('DELETE FROM schemas WHERE project_id = ?');
  stmt.run(projectId);
}

/**
 * Delete all expired schemas
 */
export function deleteExpiredSchemas(): number {
  const database = getDatabase();
  const expiryTime = Date.now() - SCHEMA_CACHE_TTL_MS;
  
  const stmt = database.prepare('DELETE FROM schemas WHERE last_updated < ?');
  const result = stmt.run(expiryTime);
  return result.changes;
}

/**
 * Clear all cached schemas
 */
export function clearAllSchemas(): void {
  const database = getDatabase();
  database.exec('DELETE FROM schemas');
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  totalSchemas: number;
  validSchemas: number;
  expiredSchemas: number;
  oldestTimestamp: number | null;
  newestTimestamp: number | null;
  databaseSizeBytes: number;
} {
  const database = getDatabase();
  const expiryTime = Date.now() - SCHEMA_CACHE_TTL_MS;
  
  const total = database.prepare('SELECT COUNT(*) as count FROM schemas').get() as { count: number };
  const valid = database.prepare('SELECT COUNT(*) as count FROM schemas WHERE last_updated > ?').get(expiryTime) as { count: number };
  const timestamps = database.prepare('SELECT MIN(last_updated) as oldest, MAX(last_updated) as newest FROM schemas').get() as { oldest: number | null; newest: number | null };
  const pageCount = database.pragma('page_count', { simple: true }) as number;
  const pageSize = database.pragma('page_size', { simple: true }) as number;
  
  return {
    totalSchemas: total.count,
    validSchemas: valid.count,
    expiredSchemas: total.count - valid.count,
    oldestTimestamp: timestamps.oldest,
    newestTimestamp: timestamps.newest,
    databaseSizeBytes: pageCount * pageSize,
  };
}

/**
 * Close the database connection
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * Delete the database file
 */
export function deleteDatabase(): void {
  closeDatabase();
  
  const fs = require('fs');
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, DB_NAME);
  
  // Delete main database file
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }
  
  // Delete WAL and SHM files if they exist
  const walPath = `${dbPath}-wal`;
  const shmPath = `${dbPath}-shm`;
  
  if (fs.existsSync(walPath)) {
    fs.unlinkSync(walPath);
  }
  if (fs.existsSync(shmPath)) {
    fs.unlinkSync(shmPath);
  }
}
