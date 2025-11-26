import '@testing-library/jest-dom';

// Mock Electron API
global.window = global.window || {};
(global.window as any).electronAPI = {
  bigquery: {
    execute: jest.fn().mockResolvedValue({}),
    cancel: jest.fn().mockResolvedValue(undefined),
    listDatasets: jest.fn().mockResolvedValue([]),
    listTables: jest.fn().mockResolvedValue([]),
    getTableSchema: jest.fn().mockResolvedValue({ fields: [] }),
    getViewDefinition: jest.fn().mockResolvedValue({ definition: '' }),
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
  },
  menu: {
    onShowHelp: jest.fn(() => () => {}),
    onNewTab: jest.fn(() => () => {}),
  },
};

// Mock Monaco Editor
jest.mock('@monaco-editor/react', () => ({
  default: () => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'monaco-editor' }, 'Monaco Editor');
  },
}));

