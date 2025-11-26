import React, { useState, useEffect } from 'react';
import { useQueriesStore } from '../../stores/queries-store';
import { useTabsStore } from '../../stores/tabs-store';
import './SavedQueries.css';

interface SavedQueriesProps {
  onClose: () => void;
}

export const SavedQueries: React.FC<SavedQueriesProps> = ({ onClose }) => {
  const { queries, isLoading, loadQueries, deleteQuery, setSearchTerm, getFilteredQueries } =
    useQueriesStore();
  const { createTab, setTabQuery, updateTab } = useTabsStore();
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    loadQueries();
  }, [loadQueries]);

  useEffect(() => {
    setSearchTerm(searchValue);
  }, [searchValue, setSearchTerm]);

  const handleLoadQuery = (queryId: string) => {
    const query = queries.find((q) => q.id === queryId);
    if (!query) return;

    const newTabId = createTab();
    setTabQuery(newTabId, query.sqlText);
    updateTab(newTabId, {
      title: query.name,
      savedQueryId: query.id,
      isModified: false,
    });
    onClose();
  };

  const handleDeleteQuery = async (queryId: string, queryName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${queryName}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await deleteQuery(queryId);
    } catch (error: any) {
      alert(`Failed to delete query: ${error.message}`);
    }
  };

  const filteredQueries = getFilteredQueries();

  return (
    <div className="saved-queries-overlay" onClick={onClose}>
      <div className="saved-queries-dialog" onClick={(e) => e.stopPropagation()}>
        <h2>Saved Queries</h2>

        <div className="search-container">
          <input
            type="text"
            placeholder="Search queries..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="search-input"
          />
        </div>

        {isLoading ? (
          <div className="loading">Loading queries...</div>
        ) : filteredQueries.length === 0 ? (
          <div className="no-queries">
            {searchValue ? 'No queries match your search.' : 'No saved queries yet.'}
          </div>
        ) : (
          <div className="queries-list">
            {filteredQueries.map((query) => (
              <div key={query.id} className="query-item">
                <div className="query-header">
                  <h3 className="query-name">{query.name}</h3>
                  <div className="query-actions">
                    <button onClick={() => handleLoadQuery(query.id)} className="load-button">
                      Load
                    </button>
                    <button
                      onClick={() => handleDeleteQuery(query.id, query.name)}
                      className="delete-button"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {query.description && (
                  <p className="query-description">{query.description}</p>
                )}
                <div className="query-meta">
                  <span>Created: {new Date(query.createdAt).toLocaleDateString()}</span>
                  {query.tags && query.tags.length > 0 && (
                    <span className="query-tags">
                      Tags: {query.tags.map((tag) => `#${tag}`).join(', ')}
                    </span>
                  )}
                </div>
                <pre className="query-preview">{query.sqlText.substring(0, 200)}...</pre>
              </div>
            ))}
          </div>
        )}

        <div className="dialog-actions">
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

