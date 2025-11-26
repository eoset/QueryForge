import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useConnectionStore } from '../../stores/connection-store';
import { useTabsStore } from '../../stores/tabs-store';
import { SampleDataModal } from '../SampleDataModal/SampleDataModal';
import { ViewDefinitionModal } from '../ViewDefinitionModal/ViewDefinitionModal';
import type { Dataset, Table } from '../../../shared/types/dataset';
import './DatasetTree.css';

interface DatasetWithTables extends Dataset {
  tables?: Table[];
  expanded?: boolean;
  loading?: boolean;
}

interface DatasetTreeProps {
  onShowSchema?: (projectId: string, datasetId: string, tableId: string) => void;
}

export const DatasetTree: React.FC<DatasetTreeProps> = ({ onShowSchema }) => {
  const connection = useConnectionStore((state) => state.connection);
  const { createTab, setTabQuery, updateTab, tabs, activeTabId } = useTabsStore();
  const [datasets, setDatasets] = useState<DatasetWithTables[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    dataset: Dataset;
    table: Table;
  } | null>(null);
  const [sampleDataModal, setSampleDataModal] = useState<{
    projectId: string;
    datasetId: string;
    tableId: string;
  } | null>(null);
  const [viewDefinitionModal, setViewDefinitionModal] = useState<{
    projectId: string;
    datasetId: string;
    tableId: string;
  } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const loadDatasets = useCallback(async () => {
    if (!connection || !window.electronAPI) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const datasetList = await window.electronAPI.bigquery.listDatasets();
      setDatasets(
        datasetList.map((ds) => ({
          ...ds,
          expanded: false,
          loading: false,
        }))
      );
    } catch (err: any) {
      setError(err.message || 'Failed to load datasets');
      console.error('Failed to load datasets:', err);
    } finally {
      setIsLoading(false);
    }
  }, [connection]);

  useEffect(() => {
    if (connection) {
      loadDatasets();
    } else {
      setDatasets([]);
    }
  }, [connection, loadDatasets]);

  const toggleDataset = async (datasetId: string) => {
    if (!window.electronAPI) return;

    setDatasets((prev) =>
      prev.map((ds) => {
        if (ds.id === datasetId) {
          if (ds.expanded) {
            // Collapse
            return { ...ds, expanded: false };
          } else {
            // Expand - load tables if not already loaded
            if (!ds.tables) {
              // Set loading state
              const updated = { ...ds, expanded: true, loading: true };
              
              // Load tables
              window.electronAPI.bigquery
                .listTables(datasetId)
                .then((tables) => {
                  setDatasets((prevDatasets) =>
                    prevDatasets.map((d) =>
                      d.id === datasetId
                        ? { ...d, tables, loading: false }
                        : d
                    )
                  );
                })
                .catch((err) => {
                  console.error('Failed to load tables:', err);
                  setDatasets((prevDatasets) =>
                    prevDatasets.map((d) =>
                      d.id === datasetId
                        ? { ...d, loading: false }
                        : d
                    )
                  );
                });
              
              return updated;
            }
            return { ...ds, expanded: true };
          }
        }
        return ds;
      })
    );
  };

  const handleTableClick = (event: React.MouseEvent, dataset: Dataset, table: Table) => {
    // Handle Ctrl/Cmd+click to insert SELECT statement
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      const tableRef = `\`${connection?.projectId}.${dataset.id}.${table.id}\``;
      const selectStatement = `SELECT * FROM ${tableRef}`;
      window.dispatchEvent(
        new CustomEvent('insertTableReference', { detail: selectStatement })
      );
    }
    // Regular left click does nothing (removed table insertion feature)
  };

  const handleTableContextMenu = (event: React.MouseEvent, dataset: Dataset, table: Table) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Check if Ctrl (Windows/Linux) or Cmd (Mac) is pressed for schema view
    if (event.ctrlKey || event.metaKey) {
      if (onShowSchema && connection?.projectId) {
        onShowSchema(connection.projectId, dataset.id, table.id);
      }
      return;
    }
    
    // Show context menu
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      dataset,
      table,
    });
  };

  const handleOpenInNewTab = () => {
    if (!contextMenu || !connection) return;
    
    const { dataset, table } = contextMenu;
    const tableRef = `\`${connection.projectId}.${dataset.id}.${table.id}\``;
    const queryText = `SELECT * FROM ${tableRef}`;
    
    const newTabId = createTab();
    setTabQuery(newTabId, queryText);
    updateTab(newTabId, {
      title: `${dataset.name}.${table.name}`,
    });
    
    setContextMenu(null);
  };

  const handleShowSchema = () => {
    if (!contextMenu || !connection?.projectId || !onShowSchema) return;
    
    const { dataset, table } = contextMenu;
    onShowSchema(connection.projectId, dataset.id, table.id);
    setContextMenu(null);
  };

  const handleViewSampleData = () => {
    if (!contextMenu || !connection?.projectId) return;
    
    const { dataset, table } = contextMenu;
    setSampleDataModal({
      projectId: connection.projectId,
      datasetId: dataset.id,
      tableId: table.id,
    });
    setContextMenu(null);
  };

  const handleViewDefinition = () => {
    if (!contextMenu || !connection?.projectId) return;
    
    const { dataset, table } = contextMenu;
    setViewDefinitionModal({
      projectId: connection.projectId,
      datasetId: dataset.id,
      tableId: table.id,
    });
    setContextMenu(null);
  };

  const handleAddWithJoin = () => {
    if (!contextMenu || !connection?.projectId) return;
    
    const { dataset, table } = contextMenu;
    const tableRef = `\`${connection.projectId}.${dataset.id}.${table.id}\``;
    const tableAlias = table.id.replace(/[^a-zA-Z0-9_]/g, '_'); // Sanitize table name for alias
    
    // Get the active tab's query
    const activeTab = activeTabId ? tabs.find((t) => t.id === activeTabId) : null;
    const currentQuery = activeTab?.queryText || '';
    
    let newQuery: string;
    
    if (!currentQuery.trim()) {
      // If no query exists, just insert a SELECT FROM (can't JOIN without a first table)
      newQuery = `SELECT *\nFROM ${tableRef} AS ${tableAlias}`;
    } else {
      const trimmedQuery = currentQuery.trim();
      const upperQuery = trimmedQuery.toUpperCase();
      
      // Check if there's already a FROM clause
      const fromMatch = upperQuery.match(/\bFROM\b/i);
      
      if (fromMatch) {
        // There's already a FROM clause, add JOIN
        // Find position before WHERE/ORDER/GROUP/HAVING/LIMIT
        const clauseMatch = upperQuery.match(/\b(WHERE|ORDER\s+BY|GROUP\s+BY|HAVING|LIMIT)\b/i);
        
        if (clauseMatch && clauseMatch.index !== undefined) {
          // Insert JOIN before the clause
          const beforeClause = trimmedQuery.substring(0, clauseMatch.index).trim();
          const afterClause = trimmedQuery.substring(clauseMatch.index);
          // Find the last table reference to use in JOIN condition
          const lastTableMatch = beforeClause.match(/(?:FROM|JOIN)\s+[^\s]+(?:\s+AS\s+)?(\w+)?/gi);
          const firstTableAlias = lastTableMatch && lastTableMatch.length > 0 
            ? (lastTableMatch[lastTableMatch.length - 1].match(/\b(?:AS\s+)?(\w+)$/i)?.[1] || 't1')
            : 't1';
          newQuery = `${beforeClause}\nJOIN ${tableRef} AS ${tableAlias} ON `;
        } else {
          // No WHERE/ORDER/etc clause, append JOIN at the end
          // Try to find the first table alias from FROM clause
          const fromTableMatch = trimmedQuery.match(/FROM\s+[^\s]+(?:\s+AS\s+(\w+))?/i);
          const firstTableAlias = fromTableMatch?.[1] || 't1';
          newQuery = `${trimmedQuery}\nJOIN ${tableRef} AS ${tableAlias} ON `;
        }
      } else {
        // No FROM clause found, add FROM (can't add JOIN without a first table)
        // Check if it starts with SELECT
        if (upperQuery.startsWith('SELECT')) {
          newQuery = `${trimmedQuery}\nFROM ${tableRef} AS ${tableAlias}`;
        } else {
          // Not a SELECT query, prepend SELECT and add FROM
          newQuery = `SELECT *\nFROM ${tableRef} AS ${tableAlias}\n\n${trimmedQuery}`;
        }
      }
    }
    
    // Update the active tab, or create a new one if none exists
    if (activeTab) {
      setTabQuery(activeTab.id, newQuery);
    } else {
      const newTabId = createTab();
      setTabQuery(newTabId, newQuery);
    }
    
    setContextMenu(null);
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null);
      }
    };

    if (contextMenu?.visible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [contextMenu?.visible]);

  // Close context menu on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && contextMenu?.visible) {
        setContextMenu(null);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [contextMenu?.visible]);

  // Filter datasets and tables based on search term
  const filteredDatasets = React.useMemo(() => {
    if (!searchTerm.trim()) {
      return datasets;
    }

    const searchLower = searchTerm.toLowerCase().trim();
    
    return datasets
      .filter((dataset) => {
        const datasetMatches = dataset.name.toLowerCase().includes(searchLower);
        const matchingTables = dataset.tables?.filter((table) =>
          table.name.toLowerCase().includes(searchLower)
        ) || [];
        return datasetMatches || matchingTables.length > 0;
      })
      .map((dataset) => {
        const datasetMatches = dataset.name.toLowerCase().includes(searchLower);
        const matchingTables = dataset.tables?.filter((table) =>
          table.name.toLowerCase().includes(searchLower)
        ) || [];

        return {
          ...dataset,
          // Auto-expand if searching and there are matching tables or dataset matches
          expanded: (matchingTables.length > 0 || datasetMatches) ? true : dataset.expanded,
          // Show all tables if dataset name matches, otherwise show only matching tables
          tables: datasetMatches ? dataset.tables : matchingTables.length > 0 ? matchingTables : dataset.tables,
        };
      });
  }, [datasets, searchTerm]);

  if (!connection) {
    return (
      <div className={`dataset-tree ${collapsed ? 'collapsed' : ''}`}>
        <div className="dataset-tree-header">
          <button
            className="collapse-button"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? '▶' : '◀'}
          </button>
          {!collapsed && <span className="dataset-tree-title">Explorer</span>}
        </div>
        {!collapsed && (
          <div className="dataset-tree-empty">Not connected</div>
        )}
      </div>
    );
  }

  return (
    <div className={`dataset-tree ${collapsed ? 'collapsed' : ''}`}>
      <div className="dataset-tree-header">
        <button
          className="collapse-button"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? '▶' : '◀'}
        </button>
        {!collapsed && (
          <>
            <span className="dataset-tree-title">Explorer</span>
            <button
              className="refresh-button"
              onClick={loadDatasets}
              title="Refresh"
              disabled={isLoading}
            >
              ↻
            </button>
          </>
        )}
      </div>
      {!collapsed && (
        <>
          <div className="dataset-tree-search">
            <input
              type="text"
              className="dataset-tree-search-input"
              placeholder="Search datasets and tables..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                // Prevent closing context menu when typing in search
                if (e.key === 'Escape') {
                  setSearchTerm('');
                }
              }}
            />
            {searchTerm && (
              <button
                className="dataset-tree-search-clear"
                onClick={() => setSearchTerm('')}
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>
          <div className="dataset-tree-content">
            {isLoading && datasets.length === 0 && (
              <div className="dataset-tree-loading">Loading datasets...</div>
            )}
            {error && <div className="dataset-tree-error">{error}</div>}
            {filteredDatasets.length === 0 && !isLoading && !error && (
              <div className="dataset-tree-empty">
                {searchTerm ? 'No matching datasets or tables found' : 'No datasets found'}
              </div>
            )}
            {filteredDatasets.map((dataset) => (
            <div key={dataset.id} className="dataset-item">
              <div
                className="dataset-header"
                onClick={() => toggleDataset(dataset.id)}
              >
                <span className="dataset-icon">
                  {dataset.expanded ? '▼' : '▶'}
                </span>
                <span className="dataset-name">{dataset.name}</span>
              </div>
              {dataset.expanded && (
                <div className="dataset-tables">
                  {dataset.loading ? (
                    <div className="table-loading">Loading tables...</div>
                  ) : (
                    dataset.tables?.map((table) => (
                      <div
                        key={table.id}
                        className="table-item"
                        onClick={(e) => handleTableClick(e, dataset, table)}
                        onContextMenu={(e) => handleTableContextMenu(e, dataset, table)}
                        title={`${dataset.name}.${table.name} (Ctrl+Click for SELECT, Right-click for menu)`}
                      >
                        <span className="table-icon">
                          {table.type === 'VIEW' ? '📄' : '🗄'}
                        </span>
                        <span className="table-name">{table.name}</span>
                      </div>
                    ))
                  )}
                  {dataset.tables && dataset.tables.length === 0 && (
                    <div className="table-empty">No tables</div>
                  )}
                </div>
              )}
            </div>
          ))}
          </div>
        </>
      )}
      {contextMenu?.visible && (
        <div
          ref={contextMenuRef}
          className="context-menu"
          style={{
            position: 'fixed',
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
          }}
        >
          <div className="context-menu-item" onClick={handleOpenInNewTab}>
            Open in new tab
          </div>
          <div className="context-menu-item" onClick={handleAddWithJoin}>
            Add with JOIN
          </div>
          <div className="context-menu-item" onClick={handleViewSampleData}>
            View sample data
          </div>
          {contextMenu.table.type === 'VIEW' && (
            <div className="context-menu-item" onClick={handleViewDefinition}>
              Show view definition
            </div>
          )}
          {onShowSchema && connection?.projectId && (
            <div className="context-menu-item" onClick={handleShowSchema}>
              Show schema
            </div>
          )}
        </div>
      )}
      {sampleDataModal && (
        <SampleDataModal
          projectId={sampleDataModal.projectId}
          datasetId={sampleDataModal.datasetId}
          tableId={sampleDataModal.tableId}
          onClose={() => setSampleDataModal(null)}
        />
      )}
      {viewDefinitionModal && (
        <ViewDefinitionModal
          projectId={viewDefinitionModal.projectId}
          datasetId={viewDefinitionModal.datasetId}
          tableId={viewDefinitionModal.tableId}
          onClose={() => setViewDefinitionModal(null)}
        />
      )}
    </div>
  );
};

