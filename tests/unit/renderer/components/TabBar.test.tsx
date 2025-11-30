import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { TabBar } from '../../../../src/renderer/components/TabBar/TabBar';
import { useTabsStore } from '../../../../src/renderer/stores/tabs-store';

// Mock the tabs store
jest.mock('../../../../src/renderer/stores/tabs-store', () => ({
  useTabsStore: jest.fn(),
}));

const mockUseTabsStore = useTabsStore as jest.MockedFunction<typeof useTabsStore>;

describe('TabBar', () => {
  const mockTabs = [
    { id: 'tab-1', title: 'Query 1', type: 'query' as const, queryText: '', isModified: false, executionStatus: 'idle' as const },
    { id: 'tab-2', title: 'Query 2', type: 'query' as const, queryText: '', isModified: true, executionStatus: 'idle' as const },
    { id: 'tab-3', title: 'Query 3', type: 'query' as const, queryText: '', isModified: false, executionStatus: 'idle' as const },
  ];

  const mockSetActiveTab = jest.fn();
  const mockCloseTab = jest.fn();
  const mockCreateTab = jest.fn();
  const mockReorderTabs = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTabsStore.mockReturnValue({
      tabs: mockTabs,
      activeTabId: 'tab-1',
      setActiveTab: mockSetActiveTab,
      closeTab: mockCloseTab,
      createTab: mockCreateTab,
      reorderTabs: mockReorderTabs,
      updateTab: jest.fn(),
      setTabQuery: jest.fn(),
      setTabResults: jest.fn(),
      setTabError: jest.fn(),
      setTabStatus: jest.fn(),
      loadTabs: jest.fn(),
      saveTabs: jest.fn(),
    });
  });

  it('should render all query tabs', () => {
    render(<TabBar />);

    expect(screen.getByText('Query 1')).toBeInTheDocument();
    expect(screen.getByText('Query 2')).toBeInTheDocument();
    expect(screen.getByText('Query 3')).toBeInTheDocument();
  });

  it('should highlight the active tab', () => {
    render(<TabBar />);

    const activeTab = screen.getByText('Query 1').closest('.tab');
    expect(activeTab).toHaveClass('active');
  });

  it('should show modified indicator for modified tabs', () => {
    render(<TabBar />);

    // The modified tab should have a modified indicator
    const modifiedTab = screen.getByText('Query 2').closest('.tab');
    expect(modifiedTab).toHaveClass('modified');
    
    // Check for the modified indicator
    const modifiedIndicator = screen.getByText('●');
    expect(modifiedIndicator).toBeInTheDocument();
  });

  it('should call setActiveTab when clicking a tab', () => {
    render(<TabBar />);

    fireEvent.click(screen.getByText('Query 2'));

    expect(mockSetActiveTab).toHaveBeenCalledWith('tab-2');
  });

  it('should call createTab when clicking new tab button', () => {
    render(<TabBar />);

    const newTabButton = screen.getByTitle('New Tab');
    fireEvent.click(newTabButton);

    expect(mockCreateTab).toHaveBeenCalled();
  });

  it('should call closeTab when clicking close button', () => {
    // Mock window.confirm to return true
    window.confirm = jest.fn().mockReturnValue(true);

    render(<TabBar />);

    const closeButtons = screen.getAllByText('×');
    fireEvent.click(closeButtons[0]);

    expect(mockCloseTab).toHaveBeenCalledWith('tab-1');
  });

  it('should prompt confirmation when closing a modified tab', () => {
    window.confirm = jest.fn().mockReturnValue(true);

    render(<TabBar />);

    // Click close on the modified tab (tab-2)
    const closeButtons = screen.getAllByText('×');
    fireEvent.click(closeButtons[1]); // Second close button for tab-2

    expect(window.confirm).toHaveBeenCalledWith(
      'This tab has unsaved changes. Are you sure you want to close it?'
    );
    expect(mockCloseTab).toHaveBeenCalledWith('tab-2');
  });

  it('should not close modified tab when confirmation is cancelled', () => {
    window.confirm = jest.fn().mockReturnValue(false);

    render(<TabBar />);

    // Click close on the modified tab (tab-2)
    const closeButtons = screen.getAllByText('×');
    fireEvent.click(closeButtons[1]);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockCloseTab).not.toHaveBeenCalled();
  });

  it('should not show explorer or saved-queries tabs', () => {
    mockUseTabsStore.mockReturnValue({
      tabs: [
        ...mockTabs,
        { id: 'explorer', title: 'Explorer', type: 'explorer' as const, queryText: '', isModified: false, executionStatus: 'idle' as const },
        { id: 'saved', title: 'Saved Queries', type: 'saved-queries' as const, queryText: '', isModified: false, executionStatus: 'idle' as const },
      ],
      activeTabId: 'tab-1',
      setActiveTab: mockSetActiveTab,
      closeTab: mockCloseTab,
      createTab: mockCreateTab,
      reorderTabs: mockReorderTabs,
      updateTab: jest.fn(),
      setTabQuery: jest.fn(),
      setTabResults: jest.fn(),
      setTabError: jest.fn(),
      setTabStatus: jest.fn(),
      loadTabs: jest.fn(),
      saveTabs: jest.fn(),
    });

    render(<TabBar />);

    expect(screen.queryByText('Explorer')).not.toBeInTheDocument();
    expect(screen.queryByText('Saved Queries')).not.toBeInTheDocument();
  });

  describe('drag and drop', () => {
    it('should set dragging class on drag start', () => {
      render(<TabBar />);

      const tab = screen.getByText('Query 1').closest('.tab');
      
      fireEvent.dragStart(tab!, {
        dataTransfer: {
          effectAllowed: '',
          setData: jest.fn(),
          setDragImage: jest.fn(),
        },
      });

      expect(tab).toHaveClass('dragging');
    });

    it('should clear dragging class on drag end', () => {
      render(<TabBar />);

      const tab = screen.getByText('Query 1').closest('.tab');
      
      fireEvent.dragStart(tab!, {
        dataTransfer: {
          effectAllowed: '',
          setData: jest.fn(),
          setDragImage: jest.fn(),
        },
      });

      fireEvent.dragEnd(tab!);

      expect(tab).not.toHaveClass('dragging');
    });
  });
});
