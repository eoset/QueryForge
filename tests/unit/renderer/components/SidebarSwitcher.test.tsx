import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SidebarSwitcher, SidebarView } from '../../../../src/renderer/components/SidebarSwitcher/SidebarSwitcher';

describe('SidebarSwitcher', () => {
  const mockOnViewChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render both buttons', () => {
    render(
      <SidebarSwitcher currentView="explorer" onViewChange={mockOnViewChange} />
    );

    expect(screen.getByRole('button', { name: /explorer/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /saved queries/i })).toBeInTheDocument();
  });

  it('should highlight explorer button when current view is explorer', () => {
    render(
      <SidebarSwitcher currentView="explorer" onViewChange={mockOnViewChange} />
    );

    const explorerButton = screen.getByRole('button', { name: /explorer/i });
    const savedQueriesButton = screen.getByRole('button', { name: /saved queries/i });

    expect(explorerButton).toHaveClass('active');
    expect(savedQueriesButton).not.toHaveClass('active');
  });

  it('should highlight saved queries button when current view is saved-queries', () => {
    render(
      <SidebarSwitcher currentView="saved-queries" onViewChange={mockOnViewChange} />
    );

    const explorerButton = screen.getByRole('button', { name: /explorer/i });
    const savedQueriesButton = screen.getByRole('button', { name: /saved queries/i });

    expect(explorerButton).not.toHaveClass('active');
    expect(savedQueriesButton).toHaveClass('active');
  });

  it('should call onViewChange with "explorer" when explorer button is clicked', () => {
    render(
      <SidebarSwitcher currentView="saved-queries" onViewChange={mockOnViewChange} />
    );

    const explorerButton = screen.getByRole('button', { name: /explorer/i });
    fireEvent.click(explorerButton);

    expect(mockOnViewChange).toHaveBeenCalledWith('explorer');
  });

  it('should call onViewChange with "saved-queries" when saved queries button is clicked', () => {
    render(
      <SidebarSwitcher currentView="explorer" onViewChange={mockOnViewChange} />
    );

    const savedQueriesButton = screen.getByRole('button', { name: /saved queries/i });
    fireEvent.click(savedQueriesButton);

    expect(mockOnViewChange).toHaveBeenCalledWith('saved-queries');
  });

  it('should not render when collapsed is true', () => {
    render(
      <SidebarSwitcher
        currentView="explorer"
        onViewChange={mockOnViewChange}
        collapsed={true}
      />
    );

    expect(screen.queryByRole('button', { name: /explorer/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /saved queries/i })).not.toBeInTheDocument();
  });

  it('should render when collapsed is false', () => {
    render(
      <SidebarSwitcher
        currentView="explorer"
        onViewChange={mockOnViewChange}
        collapsed={false}
      />
    );

    expect(screen.getByRole('button', { name: /explorer/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /saved queries/i })).toBeInTheDocument();
  });

  it('should render when collapsed is not provided', () => {
    render(
      <SidebarSwitcher currentView="explorer" onViewChange={mockOnViewChange} />
    );

    expect(screen.getByRole('button', { name: /explorer/i })).toBeInTheDocument();
  });

  it('should have correct title attributes', () => {
    render(
      <SidebarSwitcher currentView="explorer" onViewChange={mockOnViewChange} />
    );

    expect(screen.getByTitle('Explorer')).toBeInTheDocument();
    expect(screen.getByTitle('Saved Queries')).toBeInTheDocument();
  });
});
