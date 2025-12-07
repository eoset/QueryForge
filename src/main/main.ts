import { app, BrowserWindow, Menu, nativeImage, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { registerBigQueryHandlers } from './ipc/bigquery';
import { registerConnectionHandlers } from './ipc/connection';
import { registerQueriesHandlers } from './ipc/queries';
import { registerUISettingsHandlers } from './ipc/ui-settings';
import { registerTabsHandlers } from './ipc/tabs';
import { registerResultsCacheHandlers, closeCacheDatabase } from './ipc/results-cache';
import { registerSchemaCacheHandlers, closeSchemaCacheDatabase } from './ipc/schema-cache';
import { registerExportHandlers } from './ipc/export';
import { registerQueryHistoryHandlers, closeHistoryDatabase } from './ipc/query-history';
import { getWindowBounds, setWindowBounds } from './storage/ui-settings-store';
import { clearAllResults } from './storage/results-cache-sqlite';

// Suppress error logging for "Table not found" errors from IPC handlers
// These errors are handled in the UI and don't need console logging
// Intercept at the process level before Electron logs them
const originalStderrWrite = process.stderr.write.bind(process.stderr);
process.stderr.write = function(chunk: any, encoding?: any, callback?: any): boolean {
  const message = chunk?.toString() || '';
  // Check if this is a "Table not found" error from getTableSchema
  // Match various formats Electron might use to log the error
  if ((message.includes('bigquery:getTableSchema') || message.includes('Error occurred in handler')) && 
      (message.includes('Table not found') || 
       message.includes('code: \'BIGQUERY_ERROR\'') ||
       message.includes('BIGQUERY_ERROR'))) {
    // Suppress logging for table not found errors
    return true;
  }
  // Write all other messages normally
  return originalStderrWrite(chunk, encoding, callback);
};

// Set app name immediately (before any other app calls) for macOS dock
// This must be called before app.whenReady() to ensure the dock shows the correct name
if (process.platform === 'darwin') {
  app.setName('QueryForge');
  console.log('Initial app name set to:', app.getName());
}

let mainWindow: BrowserWindow | null = null;

// Register IPC handlers
registerBigQueryHandlers();
registerConnectionHandlers();
registerQueriesHandlers();
registerUISettingsHandlers();
registerTabsHandlers();
registerResultsCacheHandlers();
registerSchemaCacheHandlers();
registerExportHandlers();
registerQueryHistoryHandlers();

// Register app version handler
ipcMain.handle('app:getVersion', () => {
  return app.getVersion();
});

function createMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Tab',
          accelerator: 'CmdOrCtrl+T',
          click: () => {
            mainWindow?.webContents.send('menu:new-tab');
          },
        },
        {
          label: 'Save Query',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow?.webContents.send('menu:save-query');
          },
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo', label: 'Undo' },
        { role: 'redo', label: 'Redo' },
        { type: 'separator' },
        { role: 'cut', label: 'Cut' },
        { role: 'copy', label: 'Copy' },
        { role: 'paste', label: 'Paste' },
        { type: 'separator' },
        {
          label: 'Search Schema...',
          accelerator: 'CmdOrCtrl+P',
          click: () => {
            mainWindow?.webContents.send('menu:search-schema');
          },
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload', label: 'Reload' },
        { role: 'forceReload', label: 'Force Reload' },
        { role: 'toggleDevTools', label: 'Toggle Developer Tools' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Actual Size' },
        { role: 'zoomIn', label: 'Zoom In' },
        { role: 'zoomOut', label: 'Zoom Out' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Toggle Full Screen' },
        { type: 'separator' },
        {
          label: 'Theme Settings...',
          accelerator: 'CmdOrCtrl+Shift+T',
          click: () => {
            mainWindow?.webContents.send('menu:show-theme-settings');
          },
        },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About QueryForge',
          click: () => {
            mainWindow?.webContents.send('menu:show-about');
          },
        },
        { type: 'separator' },
        {
          label: 'Keyboard Shortcuts',
          accelerator: 'CmdOrCtrl+?',
          click: () => {
            mainWindow?.webContents.send('menu:show-help');
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createWindow(): void {
  // Restore window size and position from previous session
  const savedBounds = getWindowBounds();
  const windowState = {
    width: savedBounds?.width || 1200,
    height: savedBounds?.height || 800,
    x: savedBounds?.x,
    y: savedBounds?.y,
  };

  // Get icon path - always check from root directory first (most reliable)
  const rootDir = process.cwd();
  let iconPath: string | undefined;
  
  if (process.platform === 'darwin') {
    // macOS: prefer .icns file (better transparency support)
    const icnsPath = path.join(rootDir, 'queryforge_icon.icns');
    const pngPath = path.join(rootDir, 'queryforge_icon.png');
    
    // Prefer .icns for better transparency and native macOS support
    if (fs.existsSync(icnsPath)) {
      iconPath = icnsPath;
    } else if (fs.existsSync(pngPath)) {
      iconPath = pngPath;
    }
  } else {
    // Windows/Linux: use PNG
    const pngPath = path.join(rootDir, 'queryforge_icon.png');
    if (fs.existsSync(pngPath)) {
      iconPath = pngPath;
    }
  }
  
  if (iconPath) {
    console.log('Using icon:', iconPath);
  } else {
    console.warn('Icon not found. Expected locations:');
    if (process.platform === 'darwin') {
      console.warn('  -', path.join(rootDir, 'queryforge_icon.icns'));
      console.warn('  -', path.join(rootDir, 'queryforge_icon.png'));
    } else {
      console.warn('  -', path.join(rootDir, 'queryforge_icon.png'));
    }
  }

  const windowOptions: Electron.BrowserWindowConstructorOptions = {
    width: windowState.width,
    height: windowState.height,
    x: windowState.x,
    y: windowState.y,
    backgroundColor: '#1e1e1e',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false, // Required for preload script
    },
  };

  // Set icon for Windows/Linux (macOS uses dock icon instead)
  if (iconPath && process.platform !== 'darwin') {
    windowOptions.icon = iconPath;
  }

  mainWindow = new BrowserWindow({
    ...windowOptions,
    title: 'QueryForge',
  });
  
  // Set app icon for macOS dock (if icon found)
  // macOS will automatically apply rounded corners to the icon
  if (iconPath && process.platform === 'darwin' && app.dock) {
    try {
      // Ensure we have an absolute path
      const absoluteIconPath = path.isAbsolute(iconPath) ? iconPath : path.resolve(rootDir, iconPath);
      
      // Verify file exists
      if (!fs.existsSync(absoluteIconPath)) {
        console.warn('Icon file does not exist:', absoluteIconPath);
        return;
      }
      
      // Use nativeImage for both .icns and PNG files
      // nativeImage.createFromPath() works with .icns files on macOS
      const icon = nativeImage.createFromPath(absoluteIconPath);
      if (!icon.isEmpty()) {
        app.dock.setIcon(icon);
        // Set app name again after setting dock icon (macOS may need this)
        app.setName('QueryForge');
        console.log('Set macOS dock icon:', absoluteIconPath);
        console.log('App name after setting icon:', app.getName());
      } else {
        console.warn('Icon file is empty:', absoluteIconPath);
      }
    } catch (error) {
      console.warn('Failed to set dock icon:', error);
    }
  }

  // Debounce function to avoid saving too frequently
  let saveTimeout: NodeJS.Timeout | null = null;
  const saveWindowBounds = () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    saveTimeout = setTimeout(() => {
      const bounds = mainWindow?.getBounds();
      if (bounds) {
        setWindowBounds({
          width: bounds.width,
          height: bounds.height,
          x: bounds.x,
          y: bounds.y,
        });
      }
    }, 500); // Debounce by 500ms
  };

  // Save window state on move/resize
  mainWindow.on('moved', saveWindowBounds);
  mainWindow.on('resized', saveWindowBounds);

  // Save window bounds and tabs when window is closed
  mainWindow.on('close', () => {
    const bounds = mainWindow?.getBounds();
    if (bounds) {
      setWindowBounds({
        width: bounds.width,
        height: bounds.height,
        x: bounds.x,
        y: bounds.y,
      });
    }
    // Request tabs to be saved from renderer process
    mainWindow?.webContents.send('app:before-close');
    // Clear results cache when application closes
    clearAllResults();
  });

  // Load the HTML file from dist (webpack bundles everything)
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // DevTools can be opened manually via View > Toggle Developer Tools menu or Cmd+Option+I / Ctrl+Shift+I
  // Only open automatically if explicitly requested via command line flag
  if (process.argv.includes('--dev') || process.argv.includes('--open-devtools')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Set app icon before app is ready (for better compatibility)
function setAppIcon(): void {
  const rootDir = process.cwd();
  let iconPath: string | undefined;
  
  if (process.platform === 'darwin') {
    // macOS: prefer .icns file (better transparency support)
    const icnsPath = path.join(rootDir, 'queryforge_icon.icns');
    const pngPath = path.join(rootDir, 'queryforge_icon.png');
    
    // Prefer .icns for better transparency and native macOS support
    if (fs.existsSync(icnsPath)) {
      iconPath = icnsPath;
    } else if (fs.existsSync(pngPath)) {
      iconPath = pngPath;
    }
  } else {
    // Windows/Linux: use PNG
    const pngPath = path.join(rootDir, 'queryforge_icon.png');
    if (fs.existsSync(pngPath)) {
      iconPath = pngPath;
    }
  }
  
  if (iconPath) {
    try {
      // Ensure we have an absolute path
      const absoluteIconPath = path.isAbsolute(iconPath) ? iconPath : path.resolve(rootDir, iconPath);
      
      // Verify file exists
      if (!fs.existsSync(absoluteIconPath)) {
        console.warn('Icon file does not exist:', absoluteIconPath);
        return;
      }
      
      // Use nativeImage for both .icns and PNG files
      // nativeImage.createFromPath() works with .icns files on macOS
      const icon = nativeImage.createFromPath(absoluteIconPath);
      if (!icon.isEmpty()) {
        app.setAboutPanelOptions({
          iconPath: absoluteIconPath,
        });
        console.log('Set app icon:', absoluteIconPath);
      } else {
        console.warn('Icon file is empty:', absoluteIconPath);
      }
    } catch (error) {
      console.warn('Failed to set app icon:', error);
    }
  }
}

// Set icon early
setAppIcon();

app.whenReady().then(() => {
  // Verify and set app name again after app is ready (for macOS dock)
  if (process.platform === 'darwin') {
    app.setName('QueryForge');
    console.log('App name set to:', app.getName());
  }
  
  // Also override console.error as a backup (though stderr.write should catch most cases)
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const errorMessage = args.join(' ') || '';
    // Check if this is a "Table not found" error from getTableSchema
    // Match various formats Electron might use to log the error
    if ((errorMessage.includes('bigquery:getTableSchema') || errorMessage.includes('Error occurred in handler')) && 
        (errorMessage.includes('Table not found') || 
         errorMessage.includes('code: \'BIGQUERY_ERROR\'') ||
         errorMessage.includes('BIGQUERY_ERROR'))) {
      // Suppress logging for table not found errors
      return;
    }
    // Log all other errors normally
    originalConsoleError.apply(console, args);
  };
  
  createMenu();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Clear results cache when all windows are closed
  clearAllResults();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Clear cache and close database on app quit (for macOS)
app.on('will-quit', () => {
  clearAllResults();
  closeCacheDatabase();
  closeSchemaCacheDatabase();
  closeHistoryDatabase();
});
