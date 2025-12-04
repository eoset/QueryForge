import { ipcMain, dialog, BrowserWindow } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

export interface ExportOptions {
  format: 'csv' | 'json';
  defaultFilename?: string;
}

export interface ExportResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

/**
 * Register IPC handlers for file export operations
 */
export function registerExportHandlers(): void {
  // Handler for showing save dialog and writing file
  ipcMain.handle(
    'export:saveFile',
    async (
      _event,
      content: string,
      options: ExportOptions
    ): Promise<ExportResult> => {
      try {
        const focusedWindow = BrowserWindow.getFocusedWindow();

        const filters =
          options.format === 'csv'
            ? [{ name: 'CSV Files', extensions: ['csv'] }]
            : [{ name: 'JSON Files', extensions: ['json'] }];

        const defaultPath = options.defaultFilename
          ? `${options.defaultFilename}.${options.format}`
          : `query-results.${options.format}`;

        const dialogOptions: Electron.SaveDialogOptions = {
          title: `Export as ${options.format.toUpperCase()}`,
          defaultPath,
          filters,
          properties: ['createDirectory', 'showOverwriteConfirmation'],
        };

        const result = focusedWindow
          ? await dialog.showSaveDialog(focusedWindow, dialogOptions)
          : await dialog.showSaveDialog(dialogOptions);

        if (result.canceled || !result.filePath) {
          return { success: false };
        }

        // Ensure the file has the correct extension
        let filePath = result.filePath;
        const expectedExtension = `.${options.format}`;
        if (!filePath.toLowerCase().endsWith(expectedExtension)) {
          filePath += expectedExtension;
        }

        // Write the file
        await fs.promises.writeFile(filePath, content, 'utf-8');

        return { success: true, filePath };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Failed to export file:', errorMessage);
        return { success: false, error: errorMessage };
      }
    }
  );
}
