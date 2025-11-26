import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { format } from 'sql-formatter';
import { Parser } from 'node-sql-parser';
import { useBigQuery } from '../../hooks/useBigQuery';
import { useTabsStore } from '../../stores/tabs-store';
import { useQueriesStore } from '../../stores/queries-store';
import { useConnectionStore } from '../../stores/connection-store';
import './QueryEditor.css';

export const QueryEditor: React.FC = () => {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const editorRef = useRef<any>(null);
  const executeHandlerRef = useRef<(() => void) | null>(null);
  const expandSelectStarHandlerRef = useRef<(() => void) | null>(null);
  const activeTab = useTabsStore((state) => {
    const tab = state.tabs.find((t) => t.id === state.activeTabId);
    return tab || null;
  });
  
  const queryText = activeTab?.queryText || '';
  const isExecuting = activeTab?.executionStatus === 'running';
  const error = activeTab?.error || null;
  const jobId = activeTab?.jobId || null;
  
  const { setTabQuery, setTabResults, setTabError, setTabStatus, updateTab } = useTabsStore();
  const { saveQuery, updateQuery } = useQueriesStore();
  const { executeQuery, cancelQuery, isConnected } = useBigQuery();
  const connection = useConnectionStore((state) => state.connection);
  
  const shouldDisableRunButton = isExecuting || !isConnected;

  // SQL parser instance for validation
  const parserRef = useRef<Parser | null>(null);
  
  // Initialize parser
  useEffect(() => {
    parserRef.current = new Parser();
  }, []);

  // Validate SQL syntax and set markers in Monaco Editor
  useEffect(() => {
    if (!editorRef.current || !parserRef.current) {
      return;
    }

    // Skip validation for empty or very short queries to avoid false positives
    const trimmedQuery = queryText.trim();
    if (!trimmedQuery || trimmedQuery.length < 3) {
      // Clear markers if query is empty or too short
      const model = editorRef.current.getModel();
      if (model && (window as any).monaco) {
        (window as any).monaco.editor.setModelMarkers(model, 'sql', []);
      }
      return;
    }

    const validateSQL = () => {
      const model = editorRef.current?.getModel();
      if (!model || !(window as any).monaco) return;

      try {
        // Try to parse the SQL
        parserRef.current!.astify(trimmedQuery, {
          database: 'bigquery',
        });
        
        // If parsing succeeds, clear markers
        (window as any).monaco.editor.setModelMarkers(model, 'sql', []);
      } catch (error: any) {
        // Parse error occurred, create marker
        const errorMessage = error.message || 'SQL syntax error';
        
        // Try to extract line and column from error message
        let lineNumber = 1;
        let column = 1;
        
        // Common error message patterns from node-sql-parser
        const lineMatch = errorMessage.match(/line (\d+)/i) || errorMessage.match(/at line (\d+)/i);
        const columnMatch = errorMessage.match(/column (\d+)/i) || errorMessage.match(/at column (\d+)/i);
        
        if (lineMatch) {
          lineNumber = parseInt(lineMatch[1], 10);
        }
        if (columnMatch) {
          column = parseInt(columnMatch[1], 10);
        }

        // If we can't extract position, try to find it in the query text
        if (lineNumber === 1 && column === 1) {
          // Try to find the position of common error patterns
          const lines = queryText.split('\n');
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim() && errorMessage.toLowerCase().includes(lines[i].trim().toLowerCase())) {
              lineNumber = i + 1;
              column = lines[i].length + 1;
              break;
            }
          }
        }

        // Ensure line number is within bounds
        const totalLines = model.getLineCount();
        if (lineNumber > totalLines) {
          lineNumber = totalLines;
        }
        if (lineNumber < 1) {
          lineNumber = 1;
        }

        // Get line length to ensure column is within bounds
        const lineLength = model.getLineLength(lineNumber);
        if (column > lineLength) {
          column = Math.max(1, lineLength);
        }
        if (column < 1) {
          column = 1;
        }

        // Create marker for the error
        const markers: any[] = [
          {
            severity: (window as any).monaco.MarkerSeverity.Error,
            startLineNumber: lineNumber,
            startColumn: column,
            endLineNumber: lineNumber,
            endColumn: Math.min(column + 10, lineLength + 1),
            message: errorMessage,
          },
        ];

        (window as any).monaco.editor.setModelMarkers(model, 'sql', markers);
      }
    };

    // Debounce validation to avoid excessive parsing
    const timeoutId = setTimeout(validateSQL, 300);
    return () => clearTimeout(timeoutId);
  }, [queryText]);

  const handleExecute = async () => {
    const currentTab = useTabsStore.getState().tabs.find((t) => t.id === useTabsStore.getState().activeTabId);
    if (!currentTab) return;

    const currentQueryText = currentTab.queryText || '';
    const currentIsConnected = useConnectionStore.getState().connection !== null;

    if (!currentIsConnected) {
      setTabError(currentTab.id, 'Not connected to BigQuery. Please configure a connection first.');
      return;
    }

    if (!currentQueryText.trim()) {
      setTabError(currentTab.id, 'Please enter a query');
      return;
    }

    // Set status to running and clear previous results in a single update
    useTabsStore.getState().updateTab(currentTab.id, {
      executionStatus: 'running',
      error: '',
      results: undefined,
    });

    try {
      const result = await executeQuery(currentQueryText);
      useTabsStore.getState().updateTab(currentTab.id, { jobId: result.jobId });
      setTabResults(currentTab.id, result);
    } catch (err: any) {
      // Extract error message from various possible error formats
      let errorMessage = 'Query execution failed';
      
      if (err) {
        // Handle Error objects (most common case from Electron IPC)
        if (err instanceof Error) {
          errorMessage = err.message;
        }
        // Handle plain objects
        else if (typeof err === 'object') {
          // First try to get the message property
          if (err.message && typeof err.message === 'string') {
            errorMessage = err.message;
          }
          // If details is an array, try to extract message from first item
          else if (err.details) {
            if (Array.isArray(err.details) && err.details.length > 0) {
              const firstDetail = err.details[0];
              if (typeof firstDetail === 'object' && firstDetail.message) {
                errorMessage = firstDetail.message;
              } else if (typeof firstDetail === 'string') {
                errorMessage = firstDetail;
              } else {
                errorMessage = JSON.stringify(firstDetail);
              }
            } else if (typeof err.details === 'string') {
              errorMessage = err.details;
            } else if (typeof err.details === 'object') {
              errorMessage = err.details.message || JSON.stringify(err.details);
            }
          }
          // Fallback to code if available
          else if (err.code) {
            errorMessage = err.code;
          }
          // Last resort: stringify the whole object
          else {
            try {
              errorMessage = JSON.stringify(err);
            } catch {
              errorMessage = String(err);
            }
          }
        }
        // Handle string errors
        else if (typeof err === 'string') {
          errorMessage = err;
        }
        // Handle other types
        else {
          errorMessage = String(err);
        }
      }
      
      // Remove Electron IPC error prefix if present
      const electronPrefix = /^Error: Error invoking remote method 'bigquery:execute':\s*/i;
      errorMessage = errorMessage.replace(electronPrefix, '');
      
      setTabError(currentTab.id, errorMessage);
    }
  };

  // Update the refs whenever handlers change
  useEffect(() => {
    executeHandlerRef.current = handleExecute;
  }, [executeQuery, setTabError, setTabStatus, setTabResults]);

  useEffect(() => {
    expandSelectStarHandlerRef.current = handleExpandSelectStar;
  }, [activeTab, queryText, connection, setTabQuery, setTabError]);

  const handleCancel = async () => {
    if (!activeTab || !jobId) return;

    try {
      await cancelQuery(jobId);
      setTabStatus(activeTab.id, 'cancelled');
    } catch (err: any) {
      setTabError(activeTab.id, err.message || 'Failed to cancel query');
    }
  };

  const handleQueryChange = (value: string | undefined) => {
    if (activeTab) {
      setTabQuery(activeTab.id, value || '');
    }
  };

  const handleSave = async () => {
    if (!activeTab || !queryText.trim()) {
      return;
    }

    if (!saveName.trim()) {
      alert('Please enter a name for the query');
      return;
    }

    try {
      if (activeTab.savedQueryId) {
        // Update existing query
        await updateQuery(activeTab.savedQueryId, {
          name: saveName.trim(),
          sqlText: queryText,
          description: saveDescription.trim() || undefined,
        });
      } else {
        // Save new query
        const saved = await saveQuery({
          name: saveName.trim(),
          sqlText: queryText,
          description: saveDescription.trim() || undefined,
        });
        updateTab(activeTab.id, {
          savedQueryId: saved.id,
          title: saved.name,
          isModified: false,
        });
      }
      setShowSaveDialog(false);
      setSaveName('');
      setSaveDescription('');
    } catch (error: any) {
      alert(`Failed to save query: ${error.message || error.code || 'Unknown error'}`);
    }
  };

  const handleOpenSaveDialog = () => {
    if (activeTab) {
      setSaveName(activeTab.savedQueryId ? activeTab.title : '');
      setSaveDescription('');
      setShowSaveDialog(true);
    }
  };

  const handleFormat = () => {
    if (!activeTab || !queryText.trim()) {
      return;
    }

    try {
      const formatted = format(queryText, {
        language: 'bigquery',
        tabWidth: 2,
        useTabs: false,
        keywordCase: 'upper',
        indentStyle: 'standard',
      });
      setTabQuery(activeTab.id, formatted);
    } catch (err: any) {
      setTabError(activeTab.id, `Formatting failed: ${err.message || 'Invalid SQL syntax'}`);
    }
  };

  const handleExpandSelectStar = async () => {
    if (!activeTab || !queryText.trim() || !connection || !window.electronAPI) {
      return;
    }

    try {
      const trimmedQuery = queryText.trim();
      
      // Check if query contains SELECT *
      const selectStarMatch = trimmedQuery.match(/SELECT\s+\*\s+FROM/i);
      if (!selectStarMatch) {
        setTabError(activeTab.id, 'No SELECT * FROM statement found');
        return;
      }

      // Extract table reference using regex (more reliable than AST parsing)
      // Match: FROM table_ref [AS alias] [WHERE|JOIN|...]
      // Handle backticks, quoted identifiers, and different formats
      const fromMatch = trimmedQuery.match(/FROM\s+([^\s]+(?:\s+AS\s+\w+)?)(?:\s|$|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|GROUP|ORDER|HAVING|LIMIT)/i);
      if (!fromMatch) {
        setTabError(activeTab.id, 'Could not find table reference in FROM clause');
        return;
      }

      // Extract table reference (remove AS alias if present)
      let tableRef = fromMatch[1].trim();
      // Remove AS alias
      tableRef = tableRef.replace(/\s+AS\s+\w+$/i, '');
      // Remove backticks
      tableRef = tableRef.replace(/`/g, '');

      // Parse table reference
      // Could be: table, dataset.table, or project.dataset.table
      const parts = tableRef.split('.');
      let datasetId: string;
      let tableId: string;

      if (parts.length === 1) {
        // Just table name - cannot determine dataset
        setTabError(activeTab.id, 'Cannot determine dataset from table name. Please use dataset.table or project.dataset.table format.');
        return;
      } else if (parts.length === 2) {
        // dataset.table
        datasetId = parts[0];
        tableId = parts[1];
      } else if (parts.length === 3) {
        // project.dataset.table
        datasetId = parts[1];
        tableId = parts[2];
      } else {
        setTabError(activeTab.id, 'Invalid table reference format. Expected: dataset.table or project.dataset.table');
        return;
      }

      // Fetch table schema
      const schemaResult = await window.electronAPI.bigquery.getTableSchema(
        datasetId,
        tableId
      );

      if (!schemaResult.fields || schemaResult.fields.length === 0) {
        setTabError(activeTab.id, 'No columns found in table schema');
        return;
      }

      // Extract column names (only top-level columns, not nested fields)
      const columnNames = schemaResult.fields.map((field: any) => {
        // Escape column names that need escaping (contain special characters or are reserved words)
        const name = field.name;
        // Check if column name needs escaping
        if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
          return name;
        } else {
          return `\`${name}\``;
        }
      });

      // Replace SELECT * with SELECT column1, column2, ...
      // Use a more precise regex to only replace the first SELECT * in the query
      const columnList = columnNames.join(', ');
      const expandedQuery = trimmedQuery.replace(/SELECT\s+\*/i, `SELECT ${columnList}`);

      // Format the query after expansion
      try {
        const formatted = format(expandedQuery, {
          language: 'bigquery',
          tabWidth: 2,
          useTabs: false,
          keywordCase: 'upper',
          indentStyle: 'standard',
        });
        setTabQuery(activeTab.id, formatted);
      } catch (formatError: any) {
        // If formatting fails, still set the expanded query without formatting
        setTabQuery(activeTab.id, expandedQuery);
        setTabError(activeTab.id, `Expanded SELECT * but formatting failed: ${formatError.message || 'Invalid SQL syntax'}`);
      }
    } catch (err: any) {
      setTabError(activeTab.id, `Failed to expand SELECT *: ${err.message || 'Unknown error'}`);
    }
  };

  // Listen for table reference insertion from DatasetTree
  useEffect(() => {
    const handleInsertTableReference = (event: CustomEvent) => {
      if (activeTab) {
        const tableRef = event.detail as string;
        const currentText = activeTab.queryText || '';
        const newText = currentText + (currentText && !currentText.endsWith(' ') ? ' ' : '') + tableRef + ' ';
        setTabQuery(activeTab.id, newText);
        
        // Focus editor and move cursor to end
        if (editorRef.current) {
          editorRef.current.focus();
          const model = editorRef.current.getModel();
          if (model) {
            const lineCount = model.getLineCount();
            const lastLineLength = model.getLineLength(lineCount);
            editorRef.current.setPosition({ lineNumber: lineCount, column: lastLineLength + 1 });
          }
        }
      }
    };

    window.addEventListener('insertTableReference', handleInsertTableReference as EventListener);
    return () => {
      window.removeEventListener('insertTableReference', handleInsertTableReference as EventListener);
    };
  }, [activeTab, setTabQuery]);

  return (
    <div className="query-editor">
      <div className="query-editor-toolbar">
        <button onClick={handleExecute} disabled={shouldDisableRunButton} className="run-button">
          {isExecuting ? 'Executing...' : (
            <>
              Run <span className="arrow-icon">→</span>
            </>
          )}
        </button>
        {isExecuting && <button onClick={handleCancel} className="cancel-button">Cancel</button>}
        <button
          onClick={handleFormat}
          disabled={!activeTab || !queryText.trim()}
          className="format-button"
          title="Format SQL query"
        >
          Format
        </button>
        <button
          onClick={handleExpandSelectStar}
          disabled={!activeTab || !queryText.trim() || !isConnected}
          className="expand-button"
          title="Expand SELECT * to columns (Cmd+B / Ctrl+B)"
        >
          Expand *
        </button>
        <button onClick={handleOpenSaveDialog} disabled={!activeTab || !queryText.trim()} className="save-button">
          {activeTab?.savedQueryId ? 'Update' : 'Save'}
        </button>
        {!isConnected && <span className="connection-warning">Not connected</span>}
      </div>
      {showSaveDialog && (
        <div className="save-dialog-overlay" onClick={() => setShowSaveDialog(false)}>
          <div className="save-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>{activeTab?.savedQueryId ? 'Update Query' : 'Save Query'}</h3>
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Query name"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={saveDescription}
                onChange={(e) => setSaveDescription(e.target.value)}
                placeholder="Optional description"
                rows={3}
              />
            </div>
            <div className="dialog-actions">
              <button onClick={() => setShowSaveDialog(false)}>Cancel</button>
              <button onClick={handleSave} disabled={!saveName.trim()}>
                {activeTab?.savedQueryId ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="editor-container">
        {activeTab ? (
          <Editor
            height="300px"
            defaultLanguage="sql"
            theme="vs-dark"
            value={queryText}
            onChange={handleQueryChange}
            onMount={(editor) => {
              editorRef.current = editor;
              
              // Add keyboard shortcut for running query (Cmd+Enter on Mac, Ctrl+Enter on Windows/Linux)
              editor.addCommand(
                (window as any).monaco.KeyMod.CtrlCmd | (window as any).monaco.KeyCode.Enter,
                () => {
                  if (executeHandlerRef.current) {
                    executeHandlerRef.current();
                  }
                }
              );

              // Add keyboard shortcut for expanding SELECT * (Cmd+B on Mac, Ctrl+B on Windows/Linux)
              editor.addCommand(
                (window as any).monaco.KeyMod.CtrlCmd | (window as any).monaco.KeyCode.KeyB,
                () => {
                  if (expandSelectStarHandlerRef.current) {
                    expandSelectStarHandlerRef.current();
                  }
                }
              );
            }}
            options={{
              minimap: { enabled: false },
              fontSize: 12,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        ) : (
          <div className="no-tab-message">No active tab</div>
        )}
      </div>
    </div>
  );
};

