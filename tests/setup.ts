import '@testing-library/jest-dom';

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
  },
  resultsCache: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
  },
};

// Mock Monaco Editor
jest.mock('@monaco-editor/react', () => ({
  default: () => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'monaco-editor' }, 'Monaco Editor');
  },
}));

