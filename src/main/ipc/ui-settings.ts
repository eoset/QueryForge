import { ipcMain } from 'electron';
import {
  getLeftSidebarWidth,
  setLeftSidebarWidth,
  getRightSidebarWidth,
  setRightSidebarWidth,
  getTheme,
  setTheme,
  type Theme,
} from '../storage/ui-settings-store';

export function registerUISettingsHandlers(): void {
  ipcMain.handle('ui-settings:getLeftSidebarWidth', async () => {
    return getLeftSidebarWidth();
  });

  ipcMain.handle('ui-settings:setLeftSidebarWidth', async (_event, width: number) => {
    setLeftSidebarWidth(width);
  });

  ipcMain.handle('ui-settings:getRightSidebarWidth', async () => {
    return getRightSidebarWidth();
  });

  ipcMain.handle('ui-settings:setRightSidebarWidth', async (_event, width: number) => {
    setRightSidebarWidth(width);
  });

  ipcMain.handle('ui-settings:getTheme', async () => {
    return getTheme();
  });

  ipcMain.handle('ui-settings:setTheme', async (_event, theme: Theme) => {
    setTheme(theme);
  });
}

