import { ipcMain } from 'electron';
import { getTabs, getActiveTabId, saveTabs } from '../storage/tabs-store';
import type { QueryTab } from '../../shared/types/query';

export function registerTabsHandlers(): void {
  ipcMain.handle('tabs:getTabs', async () => {
    return getTabs();
  });

  ipcMain.handle('tabs:getActiveTabId', async () => {
    return getActiveTabId();
  });

  ipcMain.handle('tabs:saveTabs', async (_event, tabs: QueryTab[], activeTabId: string | null) => {
    saveTabs(tabs, activeTabId);
  });
}

