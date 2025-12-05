/**
 * SQLite-based query history store
 * 
 * Stores executed queries with metadata for the History sidebar view.
 * Uses the same SQLite instance as the results cache for efficiency.
 */

import Database from 'better-sqlite3';
import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import type { QueryHistoryEntry } from '../../shared/types/query';

// Maximum number of history entries to keep
const MAX_HISTORY_ENTRIES = 1000;

// Database instance - lazy initialized
let db: Database.Database | null = null;

/**
 * Get the path to the SQLite database file
 */
function getDbPath(): string {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'query-history.sqlite');
}

/**
 * Initialize the SQLite database with required tables
 */
function getDb(): Database.Database {
  if (db) return db;
  
  const dbPath = getDbPath();
  
  db = new Database(dbPath);
  
  // Enable WAL mode for better concurrent read/write performance
  db.pragma('journal_mode = WAL');
  
  // Set reasonable cache size
  db.pragma('cache_size = -10000');
  
  // Synchronous NORMAL is a good balance of safety and speed
  db.pragma('synchronous = NORMAL');
  
  // Create tables if they don't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS query_history (
      id TEXT PRIMARY KEY,
      query_text TEXT NOT NULL,
      executed_at TEXT NOT NULL,
      execution_time_ms INTEGER NOT NULL,
      bytes_processed INTEGER,
      total_rows INTEGER,
      status TEXT NOT NULL,
      error_message TEXT,
      project_id TEXT NOT NULL,
      job_id TEXT
    );
    
    CREATE INDEX IF NOT EXISTS idx_history_executed_at ON query_history(executed_at DESC);
    CREATE INDEX IF NOT EXISTS idx_history_project_id ON query_history(project_id);
  `);
  
  return db;
}

/**
 * Close the database connection
 */
export function closeHistoryDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * Add a new query history entry
 */
export function addHistoryEntry(entry: QueryHistoryEntry): void {
  const database = getDb();
  
  const insert = database.prepare(`
    INSERT INTO query_history (id, query_text, executed_at, execution_time_ms, bytes_processed, total_rows, status, error_message, project_id, job_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  insert.run(
    entry.id,
    entry.queryText,
    entry.executedAt,
    entry.executionTimeMs,
    entry.bytesProcessed ?? null,
    entry.totalRows ?? null,
    entry.status,
    entry.errorMessage ?? null,
    entry.projectId,
    entry.jobId ?? null
  );
  
  // Cleanup old entries if we exceed the limit
  pruneOldEntries();
}

/**
 * Get all history entries, ordered by execution time (newest first)
 */
export function getHistoryEntries(limit: number = 100, offset: number = 0): QueryHistoryEntry[] {
  const database = getDb();
  
  const rows = database.prepare(`
    SELECT id, query_text, executed_at, execution_time_ms, bytes_processed, total_rows, status, error_message, project_id, job_id
    FROM query_history
    ORDER BY executed_at DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset) as {
    id: string;
    query_text: string;
    executed_at: string;
    execution_time_ms: number;
    bytes_processed: number | null;
    total_rows: number | null;
    status: string;
    error_message: string | null;
    project_id: string;
    job_id: string | null;
  }[];
  
  return rows.map(row => ({
    id: row.id,
    queryText: row.query_text,
    executedAt: row.executed_at,
    executionTimeMs: row.execution_time_ms,
    bytesProcessed: row.bytes_processed ?? undefined,
    totalRows: row.total_rows ?? undefined,
    status: row.status as 'completed' | 'error' | 'cancelled',
    errorMessage: row.error_message ?? undefined,
    projectId: row.project_id,
    jobId: row.job_id ?? undefined,
  }));
}

/**
 * Search history entries by query text
 */
export function searchHistoryEntries(searchTerm: string, limit: number = 100): QueryHistoryEntry[] {
  const database = getDb();
  
  const rows = database.prepare(`
    SELECT id, query_text, executed_at, execution_time_ms, bytes_processed, total_rows, status, error_message, project_id, job_id
    FROM query_history
    WHERE query_text LIKE ?
    ORDER BY executed_at DESC
    LIMIT ?
  `).all(`%${searchTerm}%`, limit) as {
    id: string;
    query_text: string;
    executed_at: string;
    execution_time_ms: number;
    bytes_processed: number | null;
    total_rows: number | null;
    status: string;
    error_message: string | null;
    project_id: string;
    job_id: string | null;
  }[];
  
  return rows.map(row => ({
    id: row.id,
    queryText: row.query_text,
    executedAt: row.executed_at,
    executionTimeMs: row.execution_time_ms,
    bytesProcessed: row.bytes_processed ?? undefined,
    totalRows: row.total_rows ?? undefined,
    status: row.status as 'completed' | 'error' | 'cancelled',
    errorMessage: row.error_message ?? undefined,
    projectId: row.project_id,
    jobId: row.job_id ?? undefined,
  }));
}

/**
 * Get a single history entry by ID
 */
export function getHistoryEntry(id: string): QueryHistoryEntry | undefined {
  const database = getDb();
  
  const row = database.prepare(`
    SELECT id, query_text, executed_at, execution_time_ms, bytes_processed, total_rows, status, error_message, project_id, job_id
    FROM query_history
    WHERE id = ?
  `).get(id) as {
    id: string;
    query_text: string;
    executed_at: string;
    execution_time_ms: number;
    bytes_processed: number | null;
    total_rows: number | null;
    status: string;
    error_message: string | null;
    project_id: string;
    job_id: string | null;
  } | undefined;
  
  if (!row) return undefined;
  
  return {
    id: row.id,
    queryText: row.query_text,
    executedAt: row.executed_at,
    executionTimeMs: row.execution_time_ms,
    bytesProcessed: row.bytes_processed ?? undefined,
    totalRows: row.total_rows ?? undefined,
    status: row.status as 'completed' | 'error' | 'cancelled',
    errorMessage: row.error_message ?? undefined,
    projectId: row.project_id,
    jobId: row.job_id ?? undefined,
  };
}

/**
 * Update a history entry's totalRows by jobId
 * Used to update the row count after background fetching completes
 */
export function updateHistoryEntryByJobId(jobId: string, totalRows: number): void {
  const database = getDb();
  database.prepare('UPDATE query_history SET total_rows = ? WHERE job_id = ?').run(totalRows, jobId);
}

/**
 * Delete a history entry by ID
 */
export function deleteHistoryEntry(id: string): void {
  const database = getDb();
  database.prepare('DELETE FROM query_history WHERE id = ?').run(id);
}

/**
 * Clear all history entries
 */
export function clearAllHistory(): void {
  const database = getDb();
  database.exec('DELETE FROM query_history');
  database.exec('VACUUM');
}

/**
 * Get the total count of history entries
 */
export function getHistoryCount(): number {
  const database = getDb();
  const result = database.prepare('SELECT COUNT(*) as count FROM query_history').get() as { count: number };
  return result.count;
}

/**
 * Remove old entries when we exceed the maximum
 */
function pruneOldEntries(): void {
  const database = getDb();
  const count = getHistoryCount();
  
  if (count > MAX_HISTORY_ENTRIES) {
    const deleteCount = count - MAX_HISTORY_ENTRIES;
    database.prepare(`
      DELETE FROM query_history
      WHERE id IN (
        SELECT id FROM query_history
        ORDER BY executed_at ASC
        LIMIT ?
      )
    `).run(deleteCount);
  }
}
