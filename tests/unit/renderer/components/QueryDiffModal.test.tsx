import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryDiffModal } from '../../../../src/renderer/components/QueryDiffModal/QueryDiffModal';

// Mock the Monaco DiffEditor component
jest.mock('@monaco-editor/react', () => ({
  DiffEditor: () => <div data-testid="diff-editor">Monaco Diff Editor</div>,
}));

// Mock the stores
jest.mock('../../../../src/renderer/stores/tabs-store', () => ({
  useTabsStore: jest.fn(() => ({
    tabs: [
      { id: 'tab1', type: 'query', title: 'Query 1', queryText: 'SELECT 1' },
      { id: 'tab2', type: 'query', title: 'Query 2', queryText: 'SELECT 2' },
    ],
    activeTabId: 'tab1',
  })),
}));

jest.mock('../../../../src/renderer/stores/queries-store', () => ({
  useQueriesStore: jest.fn(() => ({
    queries: [
      { id: 'q1', name: 'Saved Query 1', sqlText: 'SELECT * FROM table1' },
      { id: 'q2', name: 'Saved Query 2', sqlText: 'SELECT * FROM table2' },
    ],
  })),
}));

jest.mock('../../../../src/renderer/stores/theme-store', () => ({
  useThemeStore: jest.fn(() => ({
    activeTheme: { type: 'dark', name: 'Dark' },
  })),
}));

jest.mock('../../../../src/renderer/themes/built-in-themes', () => ({
  getMonacoThemeName: jest.fn(() => 'vs-dark'),
}));

describe('QueryDiffModal', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the modal with title', () => {
    render(<QueryDiffModal onClose={mockOnClose} />);
    expect(screen.getByText('Compare Queries')).toBeInTheDocument();
  });

  it('renders the Monaco DiffEditor', () => {
    render(<QueryDiffModal onClose={mockOnClose} />);
    expect(screen.getByTestId('diff-editor')).toBeInTheDocument();
  });

  it('closes when close button is clicked', () => {
    render(<QueryDiffModal onClose={mockOnClose} />);
    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('closes when Escape key is pressed', () => {
    render(<QueryDiffModal onClose={mockOnClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('renders source selection dropdowns', () => {
    render(<QueryDiffModal onClose={mockOnClose} />);
    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBeGreaterThanOrEqual(2);
  });

  it('renders swap sides button', () => {
    render(<QueryDiffModal onClose={mockOnClose} />);
    const swapButton = screen.getByTitle('Swap sides');
    expect(swapButton).toBeInTheDocument();
  });

  it('renders copy to new tab buttons', () => {
    render(<QueryDiffModal onClose={mockOnClose} />);
    expect(screen.getByText('Copy Left to New Tab')).toBeInTheDocument();
    expect(screen.getByText('Copy Right to New Tab')).toBeInTheDocument();
  });

  it('renders toggle options', () => {
    render(<QueryDiffModal onClose={mockOnClose} />);
    expect(screen.getByText('Inline View')).toBeInTheDocument();
    expect(screen.getByText('Ignore Whitespace')).toBeInTheDocument();
  });

  it('initializes with provided left source', () => {
    render(
      <QueryDiffModal
        onClose={mockOnClose}
        initialLeft={{ type: 'saved', id: 'q1' }}
      />
    );
    // Check that the modal renders successfully with initial values
    expect(screen.getByText('Compare Queries')).toBeInTheDocument();
  });

  it('initializes with provided right source', () => {
    render(
      <QueryDiffModal
        onClose={mockOnClose}
        initialRight={{ type: 'tab', id: 'tab2' }}
      />
    );
    // Check that the modal renders successfully with initial values
    expect(screen.getByText('Compare Queries')).toBeInTheDocument();
  });
});
