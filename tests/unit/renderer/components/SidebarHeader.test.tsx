import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SidebarHeader } from '../../../../src/renderer/components/SidebarHeader/SidebarHeader';

describe('SidebarHeader', () => {
  const mockOnToggleCollapse = jest.fn();
  const mockOnRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('expanded state', () => {
    it('should render collapse button when expanded', () => {
      render(
        <SidebarHeader
          collapsed={false}
          onToggleCollapse={mockOnToggleCollapse}
        />
      );

      expect(screen.getByTitle('Collapse')).toBeInTheDocument();
    });

    it('should call onToggleCollapse when collapse button is clicked', () => {
      render(
        <SidebarHeader
          collapsed={false}
          onToggleCollapse={mockOnToggleCollapse}
        />
      );

      fireEvent.click(screen.getByTitle('Collapse'));
      expect(mockOnToggleCollapse).toHaveBeenCalled();
    });

    it('should render refresh button when onRefresh is provided', () => {
      render(
        <SidebarHeader
          collapsed={false}
          onToggleCollapse={mockOnToggleCollapse}
          onRefresh={mockOnRefresh}
        />
      );

      expect(screen.getByTitle('Refresh')).toBeInTheDocument();
    });

    it('should not render refresh button when onRefresh is not provided', () => {
      render(
        <SidebarHeader
          collapsed={false}
          onToggleCollapse={mockOnToggleCollapse}
        />
      );

      expect(screen.queryByTitle('Refresh')).not.toBeInTheDocument();
    });

    it('should call onRefresh when refresh button is clicked', () => {
      render(
        <SidebarHeader
          collapsed={false}
          onToggleCollapse={mockOnToggleCollapse}
          onRefresh={mockOnRefresh}
        />
      );

      fireEvent.click(screen.getByTitle('Refresh'));
      expect(mockOnRefresh).toHaveBeenCalled();
    });

    it('should disable refresh button when isLoading is true', () => {
      render(
        <SidebarHeader
          collapsed={false}
          onToggleCollapse={mockOnToggleCollapse}
          onRefresh={mockOnRefresh}
          isLoading={true}
        />
      );

      expect(screen.getByTitle('Refresh')).toBeDisabled();
    });

    it('should enable refresh button when isLoading is false', () => {
      render(
        <SidebarHeader
          collapsed={false}
          onToggleCollapse={mockOnToggleCollapse}
          onRefresh={mockOnRefresh}
          isLoading={false}
        />
      );

      expect(screen.getByTitle('Refresh')).not.toBeDisabled();
    });
  });

  describe('collapsed state', () => {
    it('should render expand button when collapsed', () => {
      render(
        <SidebarHeader
          collapsed={true}
          onToggleCollapse={mockOnToggleCollapse}
        />
      );

      expect(screen.getByTitle('Expand')).toBeInTheDocument();
    });

    it('should call onToggleCollapse when expand button is clicked', () => {
      render(
        <SidebarHeader
          collapsed={true}
          onToggleCollapse={mockOnToggleCollapse}
        />
      );

      fireEvent.click(screen.getByTitle('Expand'));
      expect(mockOnToggleCollapse).toHaveBeenCalled();
    });

    it('should not render refresh button when collapsed', () => {
      render(
        <SidebarHeader
          collapsed={true}
          onToggleCollapse={mockOnToggleCollapse}
          onRefresh={mockOnRefresh}
        />
      );

      expect(screen.queryByTitle('Refresh')).not.toBeInTheDocument();
    });

    it('should have collapsed class', () => {
      const { container } = render(
        <SidebarHeader
          collapsed={true}
          onToggleCollapse={mockOnToggleCollapse}
        />
      );

      expect(container.querySelector('.sidebar-header-collapsed')).toBeInTheDocument();
    });
  });

  describe('default values', () => {
    it('should default collapsed to false', () => {
      render(<SidebarHeader onToggleCollapse={mockOnToggleCollapse} />);

      expect(screen.getByTitle('Collapse')).toBeInTheDocument();
    });

    it('should default isLoading to false', () => {
      render(
        <SidebarHeader
          onToggleCollapse={mockOnToggleCollapse}
          onRefresh={mockOnRefresh}
        />
      );

      expect(screen.getByTitle('Refresh')).not.toBeDisabled();
    });
  });
});
