import { ipcMain } from 'electron';
import {
  getLeftSidebarWidth,
  setLeftSidebarWidth,
  getRightSidebarWidth,
  setRightSidebarWidth,
  getTheme,
  setTheme,
  getThemeSettings,
  setActiveThemeId,
  addCustomTheme,
  removeCustomTheme,
  type Theme,
} from '../storage/ui-settings-store';
import type { ThemeDefinition } from '../../shared/types/theme';

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

  // Theme settings handlers
  ipcMain.handle('ui-settings:getThemeSettings', async () => {
    return getThemeSettings();
  });

  ipcMain.handle('ui-settings:setActiveTheme', async (_event, themeId: string) => {
    setActiveThemeId(themeId);
  });

  ipcMain.handle('ui-settings:addCustomTheme', async (_event, theme: ThemeDefinition) => {
    addCustomTheme(theme);
  });

  ipcMain.handle('ui-settings:removeCustomTheme', async (_event, themeId: string) => {
    removeCustomTheme(themeId);
  });
}
