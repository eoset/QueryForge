/**
 * IPC handlers for query history operations
 */

import { ipcMain } from 'electron';
import {
  addHistoryEntry,
  getHistoryEntries,
  searchHistoryEntries,
  getHistoryEntry,
  deleteHistoryEntry,
  updateHistoryEntryByJobId,
  clearAllHistory,
  getHistoryCount,
  closeHistoryDatabase,
} from '../storage/query-history-store';
import type { QueryHistoryEntry } from '../../shared/types/query';

export function registerQueryHistoryHandlers(): void {
  // Add a new history entry
  ipcMain.handle('query-history:add', async (_event, entry: QueryHistoryEntry) => {
    addHistoryEntry(entry);
  });

  // Get history entries with pagination
  ipcMain.handle('query-history:list', async (_event, limit?: number, offset?: number) => {
    return getHistoryEntries(limit, offset);
  });

  // Search history entries
  ipcMain.handle('query-history:search', async (_event, searchTerm: string, limit?: number) => {
    return searchHistoryEntries(searchTerm, limit);
  });

  // Get a single history entry
  ipcMain.handle('query-history:get', async (_event, id: string) => {
    return getHistoryEntry(id);
  });

  // Delete a history entry
  ipcMain.handle('query-history:delete', async (_event, id: string) => {
    deleteHistoryEntry(id);
  });

  // Update a history entry's totalRows by jobId
  ipcMain.handle('query-history:updateByJobId', async (_event, jobId: string, totalRows: number) => {
    updateHistoryEntryByJobId(jobId, totalRows);
  });

  // Clear all history
  ipcMain.handle('query-history:clear', async () => {
    clearAllHistory();
  });

  // Get history count
  ipcMain.handle('query-history:count', async () => {
    return getHistoryCount();
  });
}

export { closeHistoryDatabase };
