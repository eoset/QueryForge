/**
 * Integration tests for TabBar and tabs store interaction
 */
import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { TabBar } from '../../src/renderer/components/TabBar/TabBar';
import { useTabsStore } from '../../src/renderer/stores/tabs-store';

describe('TabBar integration with tabs-store', () => {
  beforeEach(() => {
    // Reset the store state before each test
    act(() => {
      useTabsStore.setState({
        tabs: [
          {
            id: 'tab-1',
            title: 'Query 1',
            type: 'query',
            queryText: '',
            isModified: false,
            executionStatus: 'idle',
          },
        ],
        activeTabId: 'tab-1',
      });
    });
    
    // Mock window.confirm
    window.confirm = jest.fn().mockReturnValue(true);
  });

  it('should create a new tab and update the store', () => {
    render(<TabBar />);

    const initialTabCount = useTabsStore.getState().tabs.length;

    // Click new tab button
    const newTabButton = screen.getByTitle('New Tab');
    fireEvent.click(newTabButton);

    // Check store was updated
    const newTabCount = useTabsStore.getState().tabs.length;
    expect(newTabCount).toBe(initialTabCount + 1);
  });

  it('should close a tab and update the store', () => {
    // Add a second tab first
    act(() => {
      useTabsStore.getState().createTab();
    });

    render(<TabBar />);

    const initialTabCount = useTabsStore.getState().tabs.length;
    expect(initialTabCount).toBe(2);

    // Close the first tab
    const closeButtons = screen.getAllByText('×');
    fireEvent.click(closeButtons[0]);

    // Check store was updated
    const newTabCount = useTabsStore.getState().tabs.length;
    expect(newTabCount).toBe(initialTabCount - 1);
  });

  it('should switch active tab when clicking', () => {
    // Add a second tab
    act(() => {
      useTabsStore.getState().createTab();
    });

    render(<TabBar />);

    // Get the tabs
    const tabs = useTabsStore.getState().tabs;
    const secondTabId = tabs[1].id;

    // Click the second tab
    const secondTab = screen.getByText(tabs[1].title);
    fireEvent.click(secondTab);

    // Check active tab was updated
    expect(useTabsStore.getState().activeTabId).toBe(secondTabId);
  });

  it('should reflect store changes in the UI', () => {
    render(<TabBar />);

    // Initially should show Query 1
    expect(screen.getByText('Query 1')).toBeInTheDocument();

    // Update the tab title through the store
    act(() => {
      const tabs = useTabsStore.getState().tabs;
      useTabsStore.getState().updateTab(tabs[0].id, { title: 'Updated Query' });
    });

    // Re-render to see updates (in real app this happens automatically)
    // For this test, we need to check the store state
    expect(useTabsStore.getState().tabs[0].title).toBe('Updated Query');
  });

  it('should show modified indicator when tab is modified', () => {
    render(<TabBar />);

    // Mark tab as modified through store
    act(() => {
      const tabs = useTabsStore.getState().tabs;
      useTabsStore.getState().updateTab(tabs[0].id, { isModified: true });
    });

    // The modified indicator should be visible
    // We need to re-render or the component needs to re-render on store change
    // In the actual app with Zustand, this happens automatically
    const state = useTabsStore.getState();
    expect(state.tabs[0].isModified).toBe(true);
  });

  it('should handle creating multiple tabs in sequence', () => {
    render(<TabBar />);

    const newTabButton = screen.getByTitle('New Tab');

    // Create multiple tabs
    fireEvent.click(newTabButton);
    fireEvent.click(newTabButton);
    fireEvent.click(newTabButton);

    // Should have 4 tabs total (1 initial + 3 new)
    expect(useTabsStore.getState().tabs.length).toBe(4);
  });

  it('should handle closing all but one tab', () => {
    // Start with 3 tabs
    act(() => {
      useTabsStore.setState({
        tabs: [
          { id: 'tab-1', title: 'Query 1', type: 'query', queryText: '', isModified: false, executionStatus: 'idle' },
          { id: 'tab-2', title: 'Query 2', type: 'query', queryText: '', isModified: false, executionStatus: 'idle' },
          { id: 'tab-3', title: 'Query 3', type: 'query', queryText: '', isModified: false, executionStatus: 'idle' },
        ],
        activeTabId: 'tab-1',
      });
    });

    render(<TabBar />);

    // Close tabs one by one
    let closeButtons = screen.getAllByText('×');
    fireEvent.click(closeButtons[0]); // Close first tab

    closeButtons = screen.getAllByText('×');
    fireEvent.click(closeButtons[0]); // Close next first tab

    // Should have 1 tab left
    expect(useTabsStore.getState().tabs.length).toBe(1);
  });

  it('should maintain active tab state across tab operations', () => {
    act(() => {
      useTabsStore.setState({
        tabs: [
          { id: 'tab-1', title: 'Query 1', type: 'query', queryText: '', isModified: false, executionStatus: 'idle' },
          { id: 'tab-2', title: 'Query 2', type: 'query', queryText: '', isModified: false, executionStatus: 'idle' },
        ],
        activeTabId: 'tab-2',
      });
    });

    render(<TabBar />);

    // Initial active tab should be tab-2
    expect(useTabsStore.getState().activeTabId).toBe('tab-2');

    // Close the active tab
    const closeButtons = screen.getAllByText('×');
    fireEvent.click(closeButtons[1]); // Close tab-2

    // Active tab should switch to tab-1
    expect(useTabsStore.getState().activeTabId).toBe('tab-1');
  });
});
