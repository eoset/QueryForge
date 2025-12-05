import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { format } from 'sql-formatter';
import { useBigQuery } from '../../hooks/useBigQuery';
import { useTabsStore } from '../../stores/tabs-store';
import { useQueriesStore } from '../../stores/queries-store';
import { useQueryHistoryStore } from '../../stores/query-history-store';
import { useConnectionStore } from '../../stores/connection-store';
import { registerBigQueryLanguage, setMetadataStoreGetter } from '../../utils/bigquery-completions';
import { useBigQueryMetadataStore } from '../../stores/bigquery-metadata-store';
import {
  hasDbtSyntax,
  convertToDbtSyntax,
  convertFromDbtSyntax,
} from '../../utils/dbt-utils';
import { EditorToolbar } from './EditorToolbar';
import { EditorStatusBar } from './EditorStatusBar';
import { SaveQueryDialog } from './SaveQueryDialog';
import './QueryEditor.css';

interface QueryEditorProps {
  theme?: 'dark' | 'light';
}

export const QueryEditor: React.FC<QueryEditorProps> = ({ theme = 'dark' }) => {
  // ============================================================================
  // State
  // ============================================================================

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  const [sqlValidationStatus, setSqlValidationStatus] = useState<{
    isValid: boolean | null;
    errorMessage: string | null;
    errorLine: number | null;
  }>({ isValid: null, errorMessage: null, errorLine: null });

  const [expectedQuerySize, setExpectedQuerySize] = useState<number | null>(null);
  const [isLoadingQuerySize, setIsLoadingQuerySize] = useState(false);
  const [selectedText, setSelectedText] = useState<string>('');
  const [completedQueryText, setCompletedQueryText] = useState<string | null>(null);
  const [completedQueryExecutionTime, setCompletedQueryExecutionTime] = useState<number | null>(null);

  // ============================================================================
  // Refs
  // ============================================================================

  const editorRef = useRef<any>(null);
  const editorWrapperRef = useRef<HTMLDivElement>(null);
  const [editorHeight, setEditorHeight] = useState(300);
  const executeHandlerRef = useRef<(() => void) | null>(null);
  const expandSelectStarHandlerRef = useRef<(() => void) | null>(null);
  const errorDecorationsRef = useRef<string[]>([]);

  // ============================================================================
  // Store Selectors
  // ============================================================================

  const activeTab = useTabsStore((state) => {
    const tab = state.tabs.find((t) => t.id === state.activeTabId);
    return tab || null;
  });

  const queryText = activeTab?.queryText || '';
  const isExecuting = activeTab?.executionStatus === 'running';
  const jobId = activeTab?.jobId || null;

  const { setTabQuery, setTabResults, setTabError, setTabStatus, updateTab } = useTabsStore();
  const { saveQuery, updateQuery } = useQueriesStore();
  const { executeQuery, cancelQuery, isConnected } = useBigQuery();
  const connection = useConnectionStore((state) => state.connection);

  // ============================================================================
  // Effects
  // ============================================================================

  // Listen for save query menu shortcut (Cmd+S)
  useEffect(() => {
    if (window.electronAPI?.menu?.onSaveQuery) {
      const removeListener = window.electronAPI.menu.onSaveQuery(() => {
        if (activeTab && queryText.trim()) {
          setSaveName(activeTab.savedQueryId ? activeTab.title : '');
          setSaveDescription('');
          setShowSaveDialog(true);
        }
      });
      return () => removeListener();
    }
  }, [activeTab, queryText]);

  // Listen for rows-update events to update query history with final row count
  useEffect(() => {
    if (!window.electronAPI?.bigquery?.onRowsUpdate) return;

    const unsubscribe = window.electronAPI.bigquery.onRowsUpdate((data) => {
      if (data.jobId && data.rowsReturned > 0) {
        useQueryHistoryStore.getState().updateEntryByJobId(data.jobId, data.rowsReturned);
      }
    });

    return unsubscribe;
  }, []);

  // Ensure Monaco editor tooltips render above toolbar
  useEffect(() => {
    const styleId = 'monaco-tooltip-z-index-fix';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .monaco-editor .monaco-hover,
        .monaco-editor .monaco-editor-hover,
        .monaco-editor .monaco-editor-overlaymessage {
          z-index: 1000 !important;
        }
      `;
      document.head.appendChild(style);
    }

    return () => {
      const style = document.getElementById(styleId);
      if (style) {
        document.head.removeChild(style);
      }
    };
  }, []);

  // Reset completion status when tab changes
  useEffect(() => {
    setCompletedQueryText(null);
    setCompletedQueryExecutionTime(null);
  }, [activeTab?.id]);

  // Calculate editor height based on container size
  useEffect(() => {
    if (!editorWrapperRef.current) return;

    const updateHeight = () => {
      if (editorWrapperRef.current) {
        const height = editorWrapperRef.current.clientHeight;
        setEditorHeight(height);
      }
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(editorWrapperRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [activeTab]);

  // Dry run validation effect
  useEffect(() => {
    const calculateExpectedQuerySize = async () => {
      const textToAnalyze = selectedText.trim() || queryText.trim();

      if (!textToAnalyze) {
        setExpectedQuerySize(null);
        setSqlValidationStatus({ isValid: null, errorMessage: null, errorLine: null });
        return;
      }

      if (!isConnected || !connection?.projectId || !window.electronAPI) {
        setExpectedQuerySize(null);
        return;
      }

      setIsLoadingQuerySize(true);

      try {
        const result = await window.electronAPI.bigquery.dryRun(textToAnalyze);

        setSqlValidationStatus({ isValid: true, errorMessage: null, errorLine: null });

        // Clear Monaco editor markers
        const model = editorRef.current?.getModel();
        if (model && (window as any).monaco) {
          (window as any).monaco.editor.setModelMarkers(model, 'sql', []);
          if (editorRef.current) {
            errorDecorationsRef.current = editorRef.current.deltaDecorations(
              errorDecorationsRef.current,
              []
            );
          }
        }

        setExpectedQuerySize(result.totalBytesProcessed);
      } catch (err: any) {
        let errorMessage = err?.message || '';
        const errorLocation = err?.location;

        errorMessage = errorMessage
          .replace(/^Error invoking remote method '[^']+': /, '')
          .replace(/^Error: /, '');

        let errorLine: number | null = errorLocation?.line || null;
        let errorColumn: number | null = errorLocation?.column || null;

        if (!errorLine) {
          const lineColMatch = errorMessage.match(/at \[(\d+):(\d+)\]/);
          if (lineColMatch) {
            errorLine = parseInt(lineColMatch[1], 10);
            errorColumn = parseInt(lineColMatch[2], 10);
          }
        }

        let displayMessage = errorMessage;

        const isTableNotFound =
          errorMessage.includes('Table not found') ||
          errorMessage.includes('Not found: Table');

        const isColumnNotFound =
          errorMessage.includes('Unrecognized name') ||
          (errorMessage.includes('Name') && errorMessage.includes('not found'));

        const isSyntaxError =
          errorMessage.includes('Syntax error') ||
          errorMessage.includes('syntax error');

        if (isTableNotFound) {
          const tableMatch = errorMessage.match(/Not found: Table ([^\s;]+)/);
          if (tableMatch) {
            displayMessage = `Table not found: ${tableMatch[1]}`;
          } else {
            displayMessage = 'Table not found';
          }
        } else if (isColumnNotFound) {
          const columnMatch = errorMessage.match(/Unrecognized name: (\w+)/);
          if (columnMatch) {
            displayMessage = `Unknown column: ${columnMatch[1]}`;
          }
        } else if (isSyntaxError) {
          displayMessage = errorMessage.replace(/; reason:.*$/, '');
        }

        setSqlValidationStatus({
          isValid: false,
          errorMessage: displayMessage,
          errorLine: errorLine,
        });

        // Add Monaco editor markers for the BigQuery error
        const model = editorRef.current?.getModel();
        if (model && (window as any).monaco && errorLine) {
          const totalLines = model.getLineCount();
          const actualLine = Math.max(1, Math.min(errorLine, totalLines));
          const lineLength = model.getLineLength(actualLine);
          const actualColumn = errorColumn ? Math.max(1, Math.min(errorColumn, lineLength + 1)) : 1;

          let endColumn = actualColumn + 10;
          if (isSyntaxError || isColumnNotFound) {
            const lineText = model.getLineContent(actualLine);
            const wordMatch = lineText.substring(actualColumn - 1).match(/^\S+/);
            if (wordMatch) {
              endColumn = actualColumn + wordMatch[0].length;
            }
          }
          endColumn = Math.min(endColumn, lineLength + 1);

          const markers: any[] = [
            {
              severity: (window as any).monaco.MarkerSeverity.Error,
              startLineNumber: actualLine,
              startColumn: actualColumn,
              endLineNumber: actualLine,
              endColumn: endColumn,
              message: displayMessage,
              source: 'BigQuery',
            },
          ];
          (window as any).monaco.editor.setModelMarkers(model, 'sql', markers);

          if (editorRef.current) {
            const decorations: any[] = [
              {
                range: new (window as any).monaco.Range(actualLine, 1, actualLine, 1),
                options: {
                  glyphMarginClassName: 'error-glyph-margin',
                  glyphMarginHoverMessage: { value: displayMessage },
                  minimap: { color: '#f48771' },
                  overviewRuler: {
                    color: '#f48771',
                    position: (window as any).monaco?.editor?.OverviewRulerLane?.Right ?? 2,
                  },
                },
              },
            ];

            errorDecorationsRef.current = editorRef.current.deltaDecorations(
              errorDecorationsRef.current,
              decorations
            );
          }
        }

        setExpectedQuerySize(null);
      } finally {
        setIsLoadingQuerySize(false);
      }
    };

    const timeoutId = setTimeout(calculateExpectedQuerySize, 250);
    return () => clearTimeout(timeoutId);
  }, [queryText, selectedText, isConnected, connection?.projectId]);

  // Listen for table reference insertion from DatasetTree
  useEffect(() => {
    const handleInsertTableReference = (event: CustomEvent) => {
      if (activeTab) {
        const tableRef = event.detail as string;
        const currentText = activeTab.queryText || '';
        const newText =
          currentText + (currentText && !currentText.endsWith(' ') ? ' ' : '') + tableRef + ' ';
        setTabQuery(activeTab.id, newText);

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

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleExecute = async () => {
    const currentTab = useTabsStore
      .getState()
      .tabs.find((t) => t.id === useTabsStore.getState().activeTabId);
    if (!currentTab) return;

    const currentConnection = useConnectionStore.getState().connection;
    const currentIsConnected = currentConnection !== null;

    if (!currentIsConnected) {
      setTabError(currentTab.id, 'Not connected to BigQuery. Please configure a connection first.');
      return;
    }

    let queryTextToExecute = '';

    if (editorRef.current) {
      const selection = editorRef.current.getSelection();
      const model = editorRef.current.getModel();

      if (selection && !selection.isEmpty() && model) {
        queryTextToExecute = model.getValueInRange(selection);
      } else {
        queryTextToExecute = currentTab.queryText || '';
      }
    } else {
      queryTextToExecute = currentTab.queryText || '';
    }

    if (!queryTextToExecute.trim()) {
      setTabError(currentTab.id, 'Please enter a query or select text to execute');
      return;
    }

    useTabsStore.getState().updateTab(currentTab.id, {
      executionStatus: 'running',
      error: '',
      results: undefined,
    });

    setCompletedQueryText(null);
    setCompletedQueryExecutionTime(null);

    if (window.electronAPI?.resultsCache) {
      await window.electronAPI.resultsCache.delete(currentTab.id).catch((err: unknown) => {
        console.error('Failed to clear cache:', err);
      });
    }

    const executionStartTime = Date.now();

    try {
      const result = await executeQuery(queryTextToExecute, currentTab.id);
      useTabsStore.getState().updateTab(currentTab.id, { jobId: result.jobId });

      setTabResults(currentTab.id, result);

      setCompletedQueryText(queryTextToExecute);
      setCompletedQueryExecutionTime(result.executionTimeMs);

      useQueryHistoryStore.getState().addEntry({
        queryText: queryTextToExecute,
        executedAt: new Date().toISOString(),
        executionTimeMs: result.executionTimeMs,
        bytesProcessed: result.bytesProcessed,
        totalRows: result.totalRows,
        status: 'completed',
        projectId: currentConnection?.projectId || '',
        jobId: result.jobId,
      });
    } catch (err: any) {
      let errorMessage = 'Query execution failed';

      if (err) {
        if (err instanceof Error) {
          errorMessage = err.message;
        } else if (typeof err === 'object') {
          if (err.message && typeof err.message === 'string') {
            errorMessage = err.message;
          } else if (err.details) {
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
          } else if (err.code) {
            errorMessage = err.code;
          } else {
            try {
              errorMessage = JSON.stringify(err);
            } catch {
              errorMessage = String(err);
            }
          }
        } else if (typeof err === 'string') {
          errorMessage = err;
        } else {
          errorMessage = String(err);
        }
      }

      const electronPrefix = /^Error: Error invoking remote method 'bigquery:execute':\s*/i;
      errorMessage = errorMessage.replace(electronPrefix, '');

      setTabError(currentTab.id, errorMessage);

      useQueryHistoryStore.getState().addEntry({
        queryText: queryTextToExecute,
        executedAt: new Date().toISOString(),
        executionTimeMs: Date.now() - executionStartTime,
        status: 'error',
        errorMessage: errorMessage,
        projectId: currentConnection?.projectId || '',
      });
    }
  };

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
      const newQueryText = value || '';
      setTabQuery(activeTab.id, newQueryText);

      if (completedQueryText !== null && newQueryText !== completedQueryText) {
        setCompletedQueryText(null);
        setCompletedQueryExecutionTime(null);
      }
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
        await updateQuery(activeTab.savedQueryId, {
          name: saveName.trim(),
          sqlText: queryText,
          description: saveDescription.trim() || undefined,
        });
        updateTab(activeTab.id, {
          title: saveName.trim(),
          isModified: false,
        });
        setSaveSuccessMessage('Query updated successfully');
        setTimeout(() => setSaveSuccessMessage(null), 3000);
      } else {
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
        setSaveSuccessMessage('Query saved successfully');
        setTimeout(() => setSaveSuccessMessage(null), 3000);
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

  const handleExpandSelectStar = useCallback(async () => {
    if (!activeTab || !queryText.trim() || !connection || !window.electronAPI) {
      return;
    }

    try {
      const trimmedQuery = queryText.trim();

      const selectStarMatch = trimmedQuery.match(/SELECT\s+\*\s+FROM/i);
      if (!selectStarMatch) {
        setTabError(activeTab.id, 'No SELECT * FROM statement found');
        return;
      }

      const fromMatch = trimmedQuery.match(
        /FROM\s+([^\s]+(?:\s+AS\s+\w+)?)(?:\s|$|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|GROUP|ORDER|HAVING|LIMIT)/i
      );
      if (!fromMatch) {
        setTabError(activeTab.id, 'Could not find table reference in FROM clause');
        return;
      }

      let tableRef = fromMatch[1].trim();
      tableRef = tableRef.replace(/\s+AS\s+\w+$/i, '');
      tableRef = tableRef.replace(/`/g, '');

      const parts = tableRef.split('.');
      let datasetId: string;
      let tableId: string;

      if (parts.length === 1) {
        setTabError(
          activeTab.id,
          'Cannot determine dataset from table name. Please use dataset.table or project.dataset.table format.'
        );
        return;
      } else if (parts.length === 2) {
        datasetId = parts[0];
        tableId = parts[1];
      } else if (parts.length === 3) {
        datasetId = parts[1];
        tableId = parts[2];
      } else {
        setTabError(
          activeTab.id,
          'Invalid table reference format. Expected: dataset.table or project.dataset.table'
        );
        return;
      }

      const schemaResult = await window.electronAPI.bigquery.getTableSchema(datasetId, tableId);

      if (!schemaResult.fields || schemaResult.fields.length === 0) {
        setTabError(activeTab.id, 'No columns found in table schema');
        return;
      }

      const columnNames = schemaResult.fields.map((field: any) => {
        const name = field.name;
        if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
          return name;
        } else {
          return `\`${name}\``;
        }
      });

      const columnList = columnNames.join(', ');
      const expandedQuery = trimmedQuery.replace(/SELECT\s+\*/i, `SELECT ${columnList}`);

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
        setTabQuery(activeTab.id, expandedQuery);
        setTabError(
          activeTab.id,
          `Expanded SELECT * but formatting failed: ${formatError.message || 'Invalid SQL syntax'}`
        );
      }
    } catch (err: any) {
      setTabError(activeTab.id, `Failed to expand SELECT *: ${err.message || 'Unknown error'}`);
    }
  }, [activeTab, queryText, connection, setTabQuery, setTabError]);

  const handleDbtify = () => {
    if (!activeTab || !queryText.trim()) {
      return;
    }

    if (hasDbtSyntax(queryText)) {
      const getAllTables = () => useBigQueryMetadataStore.getState().getAllTables();
      const bigQuerySyntax = convertFromDbtSyntax(
        queryText,
        connection?.projectId || 'project',
        getAllTables
      );
      setTabQuery(activeTab.id, bigQuerySyntax);
    } else {
      if (sqlValidationStatus.isValid !== true) {
        return;
      }
      const dbtSyntax = convertToDbtSyntax(queryText);
      setTabQuery(activeTab.id, dbtSyntax);
    }
  };

  // Update handler refs
  useEffect(() => {
    executeHandlerRef.current = handleExecute;
  }, [executeQuery, setTabError, setTabStatus, setTabResults]);

  useEffect(() => {
    expandSelectStarHandlerRef.current = handleExpandSelectStar;
  }, [handleExpandSelectStar]);

  // ============================================================================
  // Render
  // ============================================================================

  const isQueryCompleted =
    completedQueryText !== null && queryText === completedQueryText;

  return (
    <div className="query-editor">
      <EditorToolbar
        onExecute={handleExecute}
        onCancel={handleCancel}
        onFormat={handleFormat}
        onExpandSelectStar={handleExpandSelectStar}
        onDbtify={handleDbtify}
        onOpenSaveDialog={handleOpenSaveDialog}
        isExecuting={isExecuting}
        isConnected={isConnected}
        hasQuery={!!queryText.trim()}
        hasDbtSyntax={hasDbtSyntax(queryText)}
        isQueryValid={sqlValidationStatus.isValid}
        enableDbtSupport={connection?.enableDbtSupport ?? false}
        savedQueryId={activeTab?.savedQueryId || null}
      />

      <SaveQueryDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={handleSave}
        saveName={saveName}
        onNameChange={setSaveName}
        saveDescription={saveDescription}
        onDescriptionChange={setSaveDescription}
        isUpdate={!!activeTab?.savedQueryId}
        isSaveDisabled={!saveName.trim()}
      />

      <div className="editor-container">
        {activeTab ? (
          <>
            <div className="editor-wrapper" ref={editorWrapperRef}>
              <Editor
                height={`${editorHeight}px`}
                defaultLanguage="sql"
                theme={theme === 'light' ? 'light' : 'vs-dark'}
                value={queryText}
                onChange={handleQueryChange}
                beforeMount={(monaco) => {
                  const getProjectId = () => {
                    const currentConnection = useConnectionStore.getState().connection;
                    return currentConnection?.projectId || null;
                  };

                  (window as any).__bigqueryGetProjectId = getProjectId;
                  setMetadataStoreGetter(() => useBigQueryMetadataStore.getState());
                  registerBigQueryLanguage(monaco as typeof import('monaco-editor'), getProjectId);
                }}
                onMount={(editor) => {
                  editorRef.current = editor;

                  // Cmd+Enter / Ctrl+Enter to run query
                  editor.addCommand(
                    (window as any).monaco.KeyMod.CtrlCmd | (window as any).monaco.KeyCode.Enter,
                    () => {
                      if (executeHandlerRef.current) {
                        executeHandlerRef.current();
                      }
                    }
                  );

                  // Cmd+B / Ctrl+B to expand SELECT *
                  editor.addCommand(
                    (window as any).monaco.KeyMod.CtrlCmd | (window as any).monaco.KeyCode.KeyB,
                    () => {
                      if (expandSelectStarHandlerRef.current) {
                        expandSelectStarHandlerRef.current();
                      }
                    }
                  );

                  // Track selection changes for validation
                  editor.onDidChangeCursorSelection(() => {
                    const selection = editor.getSelection();
                    const model = editor.getModel();
                    if (selection && !selection.isEmpty() && model) {
                      setSelectedText(model.getValueInRange(selection));
                    } else {
                      setSelectedText('');
                    }
                  });
                }}
                options={{
                  minimap: { enabled: false },
                  fontSize: 12,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  suggestOnTriggerCharacters: true,
                  quickSuggestions: {
                    other: true,
                    comments: false,
                    strings: false,
                  },
                  suggestSelection: 'first',
                  tabCompletion: 'on',
                  hover: {
                    enabled: true,
                    delay: 300,
                    sticky: true,
                  },
                  fixedOverflowWidgets: true,
                  glyphMargin: true,
                }}
              />
            </div>

            <EditorStatusBar
              saveSuccessMessage={saveSuccessMessage}
              isQueryCompleted={isQueryCompleted}
              completedExecutionTime={completedQueryExecutionTime}
              validationStatus={sqlValidationStatus}
              expectedQuerySize={expectedQuerySize}
              isLoadingQuerySize={isLoadingQuerySize}
            />
          </>
        ) : (
          <div className="no-tab-message">No active tab</div>
        )}
      </div>
    </div>
  );
};
