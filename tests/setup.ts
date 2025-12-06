import '@testing-library/jest-dom';

// Mock Element.scrollIntoView for jsdom
Element.prototype.scrollIntoView = jest.fn();

// Mock HTMLCanvasElement.getContext for jsdom
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  clearRect: jest.fn(),
  fillRect: jest.fn(),
  getImageData: jest.fn(),
  putImageData: jest.fn(),
  createImageData: jest.fn(),
  setTransform: jest.fn(),
  drawImage: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  stroke: jest.fn(),
  fill: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  arc: jest.fn(),
  measureText: jest.fn(() => ({ width: 0 })),
  fillText: jest.fn(),
  strokeText: jest.fn(),
  clip: jest.fn(),
})) as jest.Mock;

// Mock Electron API
// Using (window as any) to avoid type conflicts with preload.ts
global.window = global.window || {};
(global.window as any).electronAPI = {
  bigquery: {
    execute: jest.fn().mockResolvedValue({}),
    cancel: jest.fn().mockResolvedValue(undefined),
    listDatasets: jest.fn().mockResolvedValue([]),
    listTables: jest.fn().mockResolvedValue([]),
    getTableSchema: jest.fn().mockResolvedValue({ fields: [] }),
    getViewDefinition: jest.fn().mockResolvedValue({ definition: '' }),
    getSampleData: jest.fn().mockResolvedValue({ rows: [], columns: [] }),
    getJobInfo: jest.fn().mockResolvedValue({}),
  },
  connection: {
    configure: jest.fn().mockResolvedValue(undefined),
    getActive: jest.fn().mockResolvedValue(null),
    getSaved: jest.fn().mockResolvedValue(null),
    restore: jest.fn().mockResolvedValue(null),
    test: jest.fn().mockResolvedValue(true),
    disconnect: jest.fn().mockResolvedValue(undefined),
  },
  queries: {
    list: jest.fn().mockResolvedValue([]),
    get: jest.fn().mockResolvedValue({}),
    save: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue(undefined),
    search: jest.fn().mockResolvedValue([]),
  },
  uiSettings: {
    getLeftSidebarWidth: jest.fn().mockResolvedValue(250),
    setLeftSidebarWidth: jest.fn().mockResolvedValue(undefined),
    getRightSidebarWidth: jest.fn().mockResolvedValue(300),
    setRightSidebarWidth: jest.fn().mockResolvedValue(undefined),
    getTheme: jest.fn().mockResolvedValue('dark'),
    setTheme: jest.fn().mockResolvedValue(undefined),
  },
  tabs: {
    getTabs: jest.fn().mockResolvedValue([]),
    getActiveTabId: jest.fn().mockResolvedValue(null),
    saveTabs: jest.fn().mockResolvedValue(undefined),
    onBeforeClose: jest.fn(() => () => {}),
  },
  menu: {
    onShowHelp: jest.fn(() => () => {}),
    onNewTab: jest.fn(() => () => {}),
    onShowAbout: jest.fn(() => () => {}),
    onCloseTab: jest.fn(() => () => {}),
    onSaveQuery: jest.fn(() => () => {}),
    onFormatQuery: jest.fn(() => () => {}),
    onExecuteQuery: jest.fn(() => () => {}),
    onShowConnection: jest.fn(() => () => {}),
    onDisconnect: jest.fn(() => () => {}),
    onToggleTheme: jest.fn(() => () => {}),
    onSearchSchema: jest.fn(() => () => {}),
  },
  resultsCache: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
  },
  schemaCache: {
    save: jest.fn().mockResolvedValue(undefined),
    saveBatch: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(null),
    hasValid: jest.fn().mockResolvedValue(false),
    getForProject: jest.fn().mockResolvedValue([]),
    needsRefresh: jest.fn().mockResolvedValue(true),
    delete: jest.fn().mockResolvedValue(undefined),
    deleteForProject: jest.fn().mockResolvedValue(undefined),
    deleteExpired: jest.fn().mockResolvedValue(0),
    clear: jest.fn().mockResolvedValue(undefined),
    stats: jest.fn().mockResolvedValue({
      totalSchemas: 0,
      validSchemas: 0,
      expiredSchemas: 0,
      oldestTimestamp: null,
      newestTimestamp: null,
      databaseSizeBytes: 0,
    }),
  },
};

// Mock Monaco Editor
jest.mock('@monaco-editor/react', () => ({
  default: () => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'monaco-editor' }, 'Monaco Editor');
  },
}));

