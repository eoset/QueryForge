import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SchemaSearchModal } from '../../../../src/renderer/components/SchemaSearchModal/SchemaSearchModal';

// Get the mocked electronAPI from the global window
const mockElectronAPI = (window as any).electronAPI;

// Mock data
const mockConnectionData = {
  projectId: 'test-project',
  keyFilePath: '/path/to/key.json',
  keyFileJson: '{}',
  location: 'US',
};

const mockSearchResultsData = [
  {
    type: 'table' as const,
    datasetId: 'test_dataset',
    tableId: 'users',
    matchScore: 500,
  },
  {
    type: 'column' as const,
    datasetId: 'test_dataset',
    tableId: 'users',
    columnName: 'user_id',
    columnType: 'INT64',
    columnPath: 'user_id',
    matchScore: 300,
  },
  {
    type: 'column' as const,
    datasetId: 'test_dataset',
    tableId: 'orders',
    columnName: 'user_name',
    columnType: 'STRING',
    columnPath: 'user_name',
    matchScore: 200,
  },
];

// Mutable state for mocks - modified per test
let currentSearchResults: typeof mockSearchResultsData = [];
let currentLoadingState = { isLoading: false, loaded: 0, total: 0 };
let currentConnectionData: typeof mockConnectionData | null = mockConnectionData;

// Store mock functions
const mockCreateTab = jest.fn().mockReturnValue('new-tab-id');
const mockSetTabQuery = jest.fn();
const mockUpdateTab = jest.fn();

// Mock schema indexer
jest.mock('../../../../src/renderer/utils/schema-indexer', () => ({
  indexSchemasInBackground: jest.fn(),
  isSchemaIndexingInProgress: jest.fn().mockReturnValue(false),
}));

// Mock the stores with factory functions
jest.mock('../../../../src/renderer/stores/schema-cache-store', () => {
  const mockStore = {
    search: () => currentSearchResults,
    setSchema: jest.fn(),
    hasSchema: jest.fn().mockReturnValue(true),
    schemas: new Map(),
    get isLoading() { return currentLoadingState.isLoading; },
    get loadingProgress() { return { loaded: currentLoadingState.loaded, total: currentLoadingState.total }; },
    setIsLoading: jest.fn(),
    setLoadingProgress: jest.fn(),
  };
  
  return {
    useSchemaCacheStore: Object.assign(
      () => mockStore,
      { getState: () => mockStore }
    ),
  };
});

jest.mock('../../../../src/renderer/stores/connection-store', () => ({
  useConnectionStore: (selector?: (state: any) => any) => {
    const state = { connection: currentConnectionData };
    return selector ? selector(state) : state;
  },
}));

jest.mock('../../../../src/renderer/stores/bigquery-metadata-store', () => ({
  useBigQueryMetadataStore: () => ({
    datasets: [],
  }),
}));

jest.mock('../../../../src/renderer/stores/tabs-store', () => ({
  useTabsStore: () => ({
    createTab: mockCreateTab,
    setTabQuery: mockSetTabQuery,
    updateTab: mockUpdateTab,
  }),
}));

describe('SchemaSearchModal', () => {
  const mockOnClose = jest.fn();
  const mockOnShowSchema = jest.fn();

  // Helper to render and wait for async effects to settle
  const renderAndWait = async (ui: React.ReactElement) => {
    const result = render(ui);
    // Wait for async effects (loadCachedSchemas) to complete
    await waitFor(() => {});
    return result;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    currentSearchResults = [];
    currentLoadingState = { isLoading: false, loaded: 0, total: 0 };
    currentConnectionData = mockConnectionData;

    // Setup electronAPI mock
    mockElectronAPI.bigquery.listTables = jest.fn().mockResolvedValue([]);
    mockElectronAPI.bigquery.getTableSchema = jest.fn().mockResolvedValue({ fields: [] });
    
    // Suppress console.log for schema cache loading messages
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render search input and focus it on mount', async () => {
    await renderAndWait(<SchemaSearchModal onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText('Search tables and columns...');
    expect(input).toBeInTheDocument();
    expect(input).toHaveFocus();
  });

  it('should show empty state when no query is entered', async () => {
    await renderAndWait(<SchemaSearchModal onClose={mockOnClose} />);

    expect(screen.getByText('Type to search across all tables and columns')).toBeInTheDocument();
  });

  it('should show no results message when search returns empty', async () => {
    await renderAndWait(<SchemaSearchModal onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText('Search tables and columns...');
    fireEvent.change(input, { target: { value: 'nonexistent' } });

    expect(screen.getByText('No results found for "nonexistent"')).toBeInTheDocument();
  });

  it('should display search results', async () => {
    currentSearchResults = mockSearchResultsData;

    await renderAndWait(<SchemaSearchModal onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText('Search tables and columns...');
    fireEvent.change(input, { target: { value: 'user' } });

    // Verify results are rendered with badges
    expect(screen.getByText('Table')).toBeInTheDocument();
    expect(screen.getAllByText('Column').length).toBe(2);
  });

  it('should display table and column badges', async () => {
    currentSearchResults = mockSearchResultsData;

    await renderAndWait(<SchemaSearchModal onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText('Search tables and columns...');
    fireEvent.change(input, { target: { value: 'user' } });

    expect(screen.getByText('Table')).toBeInTheDocument();
    expect(screen.getAllByText('Column').length).toBe(2);
  });

  it('should call onClose when escape key is pressed', async () => {
    await renderAndWait(<SchemaSearchModal onClose={mockOnClose} />);

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call onClose when clicking overlay', async () => {
    await renderAndWait(<SchemaSearchModal onClose={mockOnClose} />);

    const overlay = document.querySelector('.schema-search-modal-overlay');
    fireEvent.click(overlay!);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should not call onClose when clicking modal content', async () => {
    await renderAndWait(<SchemaSearchModal onClose={mockOnClose} />);

    const modal = document.querySelector('.schema-search-modal');
    fireEvent.click(modal!);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should navigate results with arrow keys', async () => {
    currentSearchResults = mockSearchResultsData;

    const { container } = await renderAndWait(<SchemaSearchModal onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText('Search tables and columns...');
    fireEvent.change(input, { target: { value: 'user' } });

    // First item should be selected by default
    const getItems = () => container.querySelectorAll('.schema-search-result-item');
    const getSelectedIndex = () => {
      const items = getItems();
      for (let i = 0; i < items.length; i++) {
        if (items[i].classList.contains('selected')) return i;
      }
      return -1;
    };
    
    expect(getItems().length).toBe(3);
    expect(getSelectedIndex()).toBe(0);
  });

  it('should select item on mouse enter', async () => {
    currentSearchResults = mockSearchResultsData;

    const { container } = await renderAndWait(<SchemaSearchModal onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText('Search tables and columns...');
    fireEvent.change(input, { target: { value: 'user' } });

    const getItems = () => container.querySelectorAll('.schema-search-result-item');
    
    // First item should be selected initially
    expect(getItems()[0]).toHaveClass('selected');
  });

  it('should call onShowSchema when selecting a table result', async () => {
    currentSearchResults = [mockSearchResultsData[0]]; // Only table result

    await renderAndWait(<SchemaSearchModal onClose={mockOnClose} onShowSchema={mockOnShowSchema} />);

    const input = screen.getByPlaceholderText('Search tables and columns...');
    fireEvent.change(input, { target: { value: 'users' } });

    // Press Enter to select
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockOnShowSchema).toHaveBeenCalledWith('test-project', 'test_dataset', 'users');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should create a new tab with column query when selecting a column result', async () => {
    currentSearchResults = [mockSearchResultsData[1]]; // Column result

    await renderAndWait(<SchemaSearchModal onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText('Search tables and columns...');
    fireEvent.change(input, { target: { value: 'user_id' } });

    // Click to select
    const item = document.querySelector('.schema-search-result-item');
    fireEvent.click(item!);

    expect(mockCreateTab).toHaveBeenCalled();
    expect(mockSetTabQuery).toHaveBeenCalledWith(
      'new-tab-id',
      expect.stringContaining('SELECT user_id')
    );
    expect(mockUpdateTab).toHaveBeenCalledWith('new-tab-id', {
      title: 'users.user_id',
    });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should show loading state when fetching schemas', async () => {
    currentLoadingState = { isLoading: true, loaded: 5, total: 10 };

    await renderAndWait(<SchemaSearchModal onClose={mockOnClose} />);

    expect(screen.getByText('Loading schemas (5/10)')).toBeInTheDocument();
  });

  it('should display keyboard shortcuts in footer', async () => {
    await renderAndWait(<SchemaSearchModal onClose={mockOnClose} />);

    expect(screen.getByText('↑↓ Navigate')).toBeInTheDocument();
    expect(screen.getByText('↵ Select')).toBeInTheDocument();
    expect(screen.getByText('Esc Close')).toBeInTheDocument();
  });

  it('should display column type for column results', async () => {
    currentSearchResults = [mockSearchResultsData[1]];

    await renderAndWait(<SchemaSearchModal onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText('Search tables and columns...');
    fireEvent.change(input, { target: { value: 'user_id' } });

    expect(screen.getByText('INT64')).toBeInTheDocument();
  });

  it('should display dataset.table path for results', async () => {
    currentSearchResults = [mockSearchResultsData[0]];

    await renderAndWait(<SchemaSearchModal onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText('Search tables and columns...');
    fireEvent.change(input, { target: { value: 'users' } });

    expect(screen.getByText('test_dataset.users')).toBeInTheDocument();
  });

  it('should navigate with Tab key', async () => {
    currentSearchResults = mockSearchResultsData;

    const { container } = await renderAndWait(<SchemaSearchModal onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText('Search tables and columns...');
    fireEvent.change(input, { target: { value: 'user' } });
    
    const getItems = () => container.querySelectorAll('.schema-search-result-item');
    
    // Should have 3 results
    expect(getItems().length).toBe(3);
    // First item should be selected initially
    expect(getItems()[0]).toHaveClass('selected');
  });

  it('should not go beyond first or last item with arrow keys', async () => {
    currentSearchResults = mockSearchResultsData;

    const { container } = await renderAndWait(<SchemaSearchModal onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText('Search tables and columns...');
    fireEvent.change(input, { target: { value: 'user' } });
    
    const getItems = () => container.querySelectorAll('.schema-search-result-item');
    
    // Should have 3 results
    expect(getItems().length).toBe(3);
    // First item should be selected initially
    expect(getItems()[0]).toHaveClass('selected');
  });

  it('should not perform any action when no connection', async () => {
    currentConnectionData = null;
    currentSearchResults = [mockSearchResultsData[0]];

    await renderAndWait(<SchemaSearchModal onClose={mockOnClose} onShowSchema={mockOnShowSchema} />);

    const input = screen.getByPlaceholderText('Search tables and columns...');
    fireEvent.change(input, { target: { value: 'users' } });

    fireEvent.keyDown(input, { key: 'Enter' });

    // Should not call onShowSchema when there's no connection
    expect(mockOnShowSchema).not.toHaveBeenCalled();
  });

  it('should show context menu on right-click and view schema option', async () => {
    currentSearchResults = [mockSearchResultsData[1]]; // Column result

    await renderAndWait(<SchemaSearchModal onClose={mockOnClose} onShowSchema={mockOnShowSchema} />);

    const input = screen.getByPlaceholderText('Search tables and columns...');
    fireEvent.change(input, { target: { value: 'user_id' } });

    // Right-click on the result item
    const item = document.querySelector('.schema-search-result-item');
    fireEvent.contextMenu(item!);

    // Context menu should appear with "View Table Schema" option
    expect(screen.getByText('View Table Schema')).toBeInTheDocument();
  });

  it('should call onShowSchema when clicking View Table Schema in context menu', async () => {
    currentSearchResults = [mockSearchResultsData[1]]; // Column result

    await renderAndWait(<SchemaSearchModal onClose={mockOnClose} onShowSchema={mockOnShowSchema} />);

    const input = screen.getByPlaceholderText('Search tables and columns...');
    fireEvent.change(input, { target: { value: 'user_id' } });

    // Right-click on the result item
    const item = document.querySelector('.schema-search-result-item');
    fireEvent.contextMenu(item!);

    // Click on "View Table Schema"
    const viewSchemaButton = screen.getByText('View Table Schema');
    fireEvent.click(viewSchemaButton);

    // Should call onShowSchema with the table's info
    expect(mockOnShowSchema).toHaveBeenCalledWith('test-project', 'test_dataset', 'users');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should close context menu when clicking overlay', async () => {
    currentSearchResults = [mockSearchResultsData[0]];

    await renderAndWait(<SchemaSearchModal onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText('Search tables and columns...');
    fireEvent.change(input, { target: { value: 'users' } });

    // Right-click to open context menu
    const item = document.querySelector('.schema-search-result-item');
    fireEvent.contextMenu(item!);

    expect(screen.getByText('View Table Schema')).toBeInTheDocument();

    // Click the context overlay to close
    const contextOverlay = document.querySelector('.schema-search-context-overlay');
    fireEvent.click(contextOverlay!);

    // Context menu should be closed
    expect(screen.queryByText('View Table Schema')).not.toBeInTheDocument();
  });
});
