import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../../../src/renderer/App';

// Mock the components that might have dependencies
jest.mock('../../../src/renderer/components/ConnectionDialog/ConnectionDialog', () => ({
  ConnectionDialog: () => <div data-testid="connection-dialog">Connection Dialog</div>,
}));

jest.mock('../../../src/renderer/components/SavedQueries/SavedQueries', () => ({
  SavedQueries: () => <div data-testid="saved-queries">Saved Queries</div>,
}));

jest.mock('../../../src/renderer/components/HelpDialog/HelpDialog', () => ({
  HelpDialog: () => <div data-testid="help-dialog">Help Dialog</div>,
}));

jest.mock('../../../src/renderer/components/AboutDialog/AboutDialog', () => ({
  AboutDialog: () => <div data-testid="about-dialog">About Dialog</div>,
}));

jest.mock('../../../src/renderer/components/TabBar/TabBar', () => ({
  TabBar: () => <div data-testid="tab-bar">Tab Bar</div>,
}));

jest.mock('../../../src/renderer/components/QueryEditor/QueryEditor', () => ({
  QueryEditor: () => <div data-testid="query-editor">Query Editor</div>,
}));

jest.mock('../../../src/renderer/components/QueryResults/QueryResults', () => ({
  QueryResults: () => <div data-testid="query-results">Query Results</div>,
}));

jest.mock('../../../src/renderer/components/DatasetTree/DatasetTree', () => ({
  DatasetTree: () => <div data-testid="dataset-tree">Dataset Tree</div>,
}));

jest.mock('../../../src/renderer/components/SavedQueriesTree/SavedQueriesTree', () => ({
  SavedQueriesTree: () => <div data-testid="saved-queries-tree">Saved Queries Tree</div>,
}));

jest.mock('../../../src/renderer/components/SchemaSidebar/SchemaSidebar', () => ({
  SchemaSidebar: () => <div data-testid="schema-sidebar">Schema Sidebar</div>,
}));

jest.mock('../../../src/renderer/components/SidebarSwitcher/SidebarSwitcher', () => ({
  SidebarSwitcher: ({ currentView, onViewChange }: { currentView: string; onViewChange: (view: string) => void }) => (
    <div data-testid="sidebar-switcher" data-view={currentView}>
      <button onClick={() => onViewChange('explorer')}>Explorer</button>
      <button onClick={() => onViewChange('saved-queries')}>Saved Queries</button>
    </div>
  ),
}));

jest.mock('../../../src/renderer/components/SidebarHeader/SidebarHeader', () => ({
  SidebarHeader: () => <div data-testid="sidebar-header">Sidebar Header</div>,
}));

describe('App', () => {
  beforeEach(() => {
    // Reset mocks to return an active connection to avoid triggering setShowConnectionDialog
    (window as any).electronAPI.connection.getActive.mockResolvedValue({
      projectId: 'test-project',
      keyFilePath: '/path/to/key.json',
    });
  });

  it('renders without crashing', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('tab-bar')).toBeInTheDocument();
    });
  });

  it('renders the main app structure', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('tab-bar')).toBeInTheDocument();
      expect(screen.getByTestId('query-editor')).toBeInTheDocument();
      expect(screen.getByTestId('query-results')).toBeInTheDocument();
    });
  });

  it('renders sidebar components', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('sidebar-header')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar-switcher')).toBeInTheDocument();
    });
  });
});

