import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { format } from 'sql-formatter';
import { Parser } from 'node-sql-parser';
import { useBigQuery } from '../../hooks/useBigQuery';
import { useTabsStore } from '../../stores/tabs-store';
import { useQueriesStore } from '../../stores/queries-store';
import { useConnectionStore } from '../../stores/connection-store';
import { registerBigQueryLanguage, setMetadataStoreGetter } from '../../utils/bigquery-completions';
import { useBigQueryMetadataStore } from '../../stores/bigquery-metadata-store';
import './QueryEditor.css';

export const QueryEditor: React.FC = () => {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [sqlValidationStatus, setSqlValidationStatus] = useState<{
    isValid: boolean | null;
    errorMessage: string | null;
  }>({ isValid: null, errorMessage: null });
  const [expectedQuerySize, setExpectedQuerySize] = useState<number | null>(null);
  const [isLoadingQuerySize, setIsLoadingQuerySize] = useState(false);
  const [completedQueryText, setCompletedQueryText] = useState<string | null>(null);
  const [completedQueryExecutionTime, setCompletedQueryExecutionTime] = useState<number | null>(null);
  const editorRef = useRef<any>(null);
  const editorWrapperRef = useRef<HTMLDivElement>(null);
  const [editorHeight, setEditorHeight] = useState(300);
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

  // Format bytes to human-readable string
  const formatBytes = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  // Format execution time to human-readable string
  const formatExecutionTime = (ms: number): string => {
    if (ms < 1000) {
      return `${ms}ms`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(2)}s`;
    } else {
      const seconds = Math.floor(ms / 1000);
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    }
  };

  // SQL parser instance for validation
  const parserRef = useRef<Parser | null>(null);
  
  // Initialize parser
  useEffect(() => {
    parserRef.current = new Parser();
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

    // Initial height calculation
    updateHeight();

    // Use ResizeObserver to update height when container resizes
    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(editorWrapperRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [activeTab]);

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
      // Update status bar - but preserve table not found errors if they exist
      setSqlValidationStatus((prev) => {
        // Only clear if there's no table not found error
        if (prev.errorMessage && prev.errorMessage.includes('Table not found')) {
          return prev;
        }
        return { isValid: null, errorMessage: null };
      });
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
        // Update status bar - valid SQL syntax
        // But preserve table not found errors - they will be set by calculateExpectedQuerySize
        setSqlValidationStatus((prev) => {
          // If there's a table not found error, keep it
          if (prev.errorMessage && prev.errorMessage.includes('Table not found')) {
            return prev;
          }
          // Otherwise, mark as valid
          return { isValid: true, errorMessage: null };
        });
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
        // Update status bar - invalid SQL syntax (this takes precedence over table not found)
        setSqlValidationStatus({ isValid: false, errorMessage });
      }
    };

    // Debounce validation to avoid excessive parsing
    const timeoutId = setTimeout(validateSQL, 300);
    return () => clearTimeout(timeoutId);
  }, [queryText]);

  const handleExecute = async () => {
    const currentTab = useTabsStore.getState().tabs.find((t) => t.id === useTabsStore.getState().activeTabId);
    if (!currentTab) return;

    const currentIsConnected = useConnectionStore.getState().connection !== null;

    if (!currentIsConnected) {
      setTabError(currentTab.id, 'Not connected to BigQuery. Please configure a connection first.');
      return;
    }

    // Get the query text to execute - use selection if available, otherwise use entire query
    let queryTextToExecute = '';
    
    if (editorRef.current) {
      const selection = editorRef.current.getSelection();
      const model = editorRef.current.getModel();
      
      // Check if there's a non-empty selection
      if (selection && !selection.isEmpty() && model) {
        queryTextToExecute = model.getValueInRange(selection);
      } else {
        // No selection, use entire query text
        queryTextToExecute = currentTab.queryText || '';
      }
    } else {
      // Editor not available, use entire query text
      queryTextToExecute = currentTab.queryText || '';
    }

    if (!queryTextToExecute.trim()) {
      setTabError(currentTab.id, 'Please enter a query or select text to execute');
      return;
    }

    // Set status to running and clear previous results in a single update
    useTabsStore.getState().updateTab(currentTab.id, {
      executionStatus: 'running',
      error: '',
      results: undefined,
    });
    
      // Reset completion status when starting a new query
    setCompletedQueryText(null);
    setCompletedQueryExecutionTime(null);
    
    // Clear cache for this tab when starting a new query
    if (window.electronAPI?.resultsCache) {
      await window.electronAPI.resultsCache.delete(currentTab.id).catch((err: unknown) => {
        console.error('Failed to clear cache:', err);
      });
    }

    try {
      const result = await executeQuery(queryTextToExecute);
      useTabsStore.getState().updateTab(currentTab.id, { jobId: result.jobId });
      
      // Save results to cache for this tab BEFORE updating tab state
      // This ensures cache is ready when QueryResults component reloads
      if (window.electronAPI?.resultsCache) {
        await window.electronAPI.resultsCache.save(currentTab.id, result);
      }
      
      // Update tab state after cache is saved
      setTabResults(currentTab.id, result);
      
      // Mark query as completed successfully - store the executed query text and execution time
      setCompletedQueryText(queryTextToExecute);
      setCompletedQueryExecutionTime(result.executionTimeMs);
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
      const newQueryText = value || '';
      setTabQuery(activeTab.id, newQueryText);
      
      // If query text has changed from the completed query, reset completion status
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

  // Strip SQL comments from query text
  // Handles both single-line (--) and multi-line (/* */) comments
  // Preserves comments inside string literals
  const stripComments = (sql: string): string => {
    let result = '';
    let i = 0;
    const len = sql.length;
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let inBacktick = false;

    while (i < len) {
      const char = sql[i];
      const nextChar = i + 1 < len ? sql[i + 1] : '';

      // Handle string literals - don't process comments inside strings
      if (char === "'" && !inDoubleQuote && !inBacktick) {
        inSingleQuote = !inSingleQuote;
        result += char;
        i++;
        continue;
      }
      if (char === '"' && !inSingleQuote && !inBacktick) {
        inDoubleQuote = !inDoubleQuote;
        result += char;
        i++;
        continue;
      }
      if (char === '`' && !inSingleQuote && !inDoubleQuote) {
        inBacktick = !inBacktick;
        result += char;
        i++;
        continue;
      }

      // If we're inside a string literal, just copy the character
      if (inSingleQuote || inDoubleQuote || inBacktick) {
        result += char;
        i++;
        continue;
      }

      // Handle single-line comments (--)
      if (char === '-' && nextChar === '-') {
        // Skip until end of line
        while (i < len && sql[i] !== '\n' && sql[i] !== '\r') {
          i++;
        }
        // Include the newline character if present
        if (i < len && sql[i] === '\n') {
          result += '\n';
          i++;
        } else if (i < len && sql[i] === '\r') {
          result += '\r';
          i++;
          if (i < len && sql[i] === '\n') {
            result += '\n';
            i++;
          }
        }
        continue;
      }

      // Handle multi-line comments (/* */)
      if (char === '/' && nextChar === '*') {
        i += 2; // Skip /*
        // Skip until */
        while (i < len) {
          if (sql[i] === '*' && i + 1 < len && sql[i + 1] === '/') {
            i += 2; // Skip */
            break;
          }
          i++;
        }
        // Replace with a space to preserve word boundaries
        result += ' ';
        continue;
      }

      // Regular character
      result += char;
      i++;
    }

    return result;
  };

  // Extract table references from SQL query
  const extractTableReferences = (sql: string): Array<{ datasetId: string; tableId: string }> => {
    const tableRefsMap = new Map<string, { datasetId: string; tableId: string }>();
    
    // Strip comments before extracting table references
    const sqlWithoutComments = stripComments(sql);
    const trimmedSql = sqlWithoutComments.trim();
    
    if (!trimmedSql) return [];

    // Match FROM and JOIN clauses (including LEFT JOIN, RIGHT JOIN, INNER JOIN, etc.)
    // This pattern matches: FROM/JOIN/LEFT JOIN/etc followed by table reference
    // Handles: backticked identifiers (with dots inside), quoted identifiers, and regular identifiers
    // Pattern explanation:
    // - Matches FROM or any JOIN type
    // - Captures table reference which can be:
    //   - Backticked: `project.dataset.table` (captures everything between backticks)
    //   - Quoted: "project.dataset.table" or 'project.dataset.table' (captures everything between quotes)
    //   - Regular: project.dataset.table or dataset.table (captures dot-separated identifiers)
    // - Handles AS aliases
    const fromJoinPattern = /(?:FROM|(?:LEFT|RIGHT|INNER|OUTER|FULL|CROSS)\s+JOIN|JOIN)\s+((?:`[^`]+`|["'][^"']+["']|[\w\-]+(?:\.[\w\-]+){0,2}))(?:\s+AS\s+[\w\-]+)?/gi;
    const matches = Array.from(trimmedSql.matchAll(fromJoinPattern));

    for (const match of matches) {
      let tableRef = match[1].trim();
      
      // Remove quotes/backticks
      tableRef = tableRef.replace(/[`"']/g, '');

      // Parse table reference
      // Could be: table, dataset.table, or project.dataset.table
      const parts = tableRef.split('.').filter(p => p.length > 0);
      
      let datasetId: string | null = null;
      let tableId: string | null = null;
      
      if (parts.length === 2) {
        // dataset.table
        datasetId = parts[0];
        tableId = parts[1];
      } else if (parts.length === 3) {
        // project.dataset.table
        datasetId = parts[1];
        tableId = parts[2];
      }
      
      // Only add if we have both dataset and table
      if (datasetId && tableId) {
        // Use a key to deduplicate - same table won't be counted twice
        const key = `${datasetId}.${tableId}`;
        if (!tableRefsMap.has(key)) {
          tableRefsMap.set(key, { datasetId, tableId });
        }
      }
    }

    return Array.from(tableRefsMap.values());
  };

  // Calculate expected query size from table/view metadata
  useEffect(() => {
    const calculateExpectedQuerySize = async () => {
      if (!queryText.trim() || !isConnected || !connection?.projectId || !window.electronAPI) {
        setExpectedQuerySize(null);
        return;
      }

      // Skip table validation if SQL syntax is invalid (syntax errors take precedence)
      // But still allow clearing previous table not found errors
      const shouldSkipTableCheck = sqlValidationStatus.isValid === false && 
        (!sqlValidationStatus.errorMessage || !sqlValidationStatus.errorMessage.includes('Table not found'));
      
      if (shouldSkipTableCheck) {
        setExpectedQuerySize(null);
        return;
      }

      setIsLoadingQuerySize(true);
      
      try {
        const tableRefs = extractTableReferences(queryText);
        
        if (tableRefs.length === 0) {
          setExpectedQuerySize(null);
          setIsLoadingQuerySize(false);
          return;
        }

        // Fetch metadata for each table/view and sum up numBytes
        // This includes all tables from FROM and JOIN clauses
        let totalBytes = 0;
        let hasMetadata = false;
        let tableNotFoundError: { message: string; tableRef: string } | null = null;

        for (const { datasetId, tableId } of tableRefs) {
          try {
            const schemaResult = await window.electronAPI.bigquery.getTableSchema(datasetId, tableId);
            if (schemaResult.metadata?.numBytes !== undefined) {
              totalBytes += schemaResult.metadata.numBytes;
              hasMetadata = true;
            }
          } catch (err: any) {
            // Electron IPC wraps errors, so we need to extract the actual error
            // The error structure can be:
            // 1. Direct error object with code/message/details
            // 2. Error object with nested details
            // 3. Error message string containing "[object Object]" that needs parsing
            
            let actualError = err;
            let errorCode: string | undefined;
            let errorMessage: string = '';
            let errorDetails: any = null;
            
            // Try to extract the actual error from Electron IPC wrapper
            // Electron IPC errors often have the real error nested in various places
            if (err instanceof Error) {
              errorMessage = err.message;
              // Check if message contains "[object Object]" - means nested error
              if (errorMessage.includes('[object Object]')) {
                // Try to get the actual error from various possible locations
                actualError = (err as any).cause || (err as any).details || (err as any).error || err;
              } else {
                actualError = err;
              }
            } else if (typeof err === 'object' && err !== null) {
              actualError = err;
            }
            
            // Extract error properties from the actual error object
            // Try multiple possible locations for the error code and message
            // The error thrown from main process is: { code: 'BIGQUERY_ERROR', message: 'Table not found', details: '...' }
            // But Electron IPC wraps it, so we need to check the error object itself
            errorCode = actualError?.code || 
                       (actualError as any)?.error?.code ||
                       (err as any)?.code;
            
            // Check if errorMessage is just "[object Object]" - if so, try to get real message from error object
            if (!errorMessage || errorMessage.includes('[object Object]')) {
              errorMessage = actualError?.message || 
                            (actualError as any)?.error?.message || 
                            (actualError as any)?.details?.message ||
                            (err as any)?.message ||
                            '';
            }
            
            // For errorDetails, check if it's the actual error object or a string
            errorDetails = actualError?.details || 
                          (actualError as any)?.error?.details ||
                          (actualError as any)?.error ||
                          actualError?.message || 
                          errorMessage;
            
            // If errorDetails is still "[object Object]", the actual error might be in err itself
            if (String(errorDetails).includes('[object Object]')) {
              // Try to access the error properties directly from err
              if ((err as any)?.code) errorCode = (err as any).code;
              if ((err as any)?.message && !(err as any).message.includes('[object Object]')) {
                errorMessage = (err as any).message;
              }
              if ((err as any)?.details) {
                errorDetails = (err as any).details;
              }
            }
            
            // If we still have "[object Object]", try to extract nested error properties
            if (errorMessage.includes('[object Object]') || String(errorDetails).includes('[object Object]')) {
              try {
                // Try to access nested error properties directly
                // Electron IPC might nest the error in different ways
                const nestedError = (actualError as any)?.error || 
                                   (actualError as any)?.details ||
                                   (actualError as any)?.cause ||
                                   actualError;
                
                if (nestedError && nestedError !== actualError) {
                  errorCode = nestedError?.code;
                  errorMessage = nestedError?.message || errorMessage;
                  errorDetails = nestedError?.details || nestedError?.message || errorMessage;
                }
                
                // Try to stringify to see the structure
                try {
                  const errorStr = JSON.stringify(actualError, null, 2);
                  const parsed = JSON.parse(errorStr);
                  if (parsed.error || parsed.details) {
                    const extracted = parsed.error || parsed.details;
                    errorCode = extracted?.code || errorCode;
                    errorMessage = extracted?.message || errorMessage;
                    errorDetails = extracted?.details || extracted?.message || errorMessage;
                  }
                } catch (e) {
                  // Silently handle stringify errors
                }
              } catch (e) {
                // Silently handle extraction errors
              }
            }
            
            // If errorDetails is an object, try to extract message from it
            if (typeof errorDetails === 'object' && errorDetails !== null) {
              if (errorDetails.message) {
                errorMessage = errorDetails.message;
                errorDetails = errorDetails.message;
              } else if (Array.isArray(errorDetails) && errorDetails.length > 0) {
                const firstDetail = errorDetails[0];
                if (typeof firstDetail === 'object' && firstDetail.message) {
                  errorMessage = firstDetail.message;
                  errorDetails = firstDetail.message;
                } else if (typeof firstDetail === 'string') {
                  errorMessage = firstDetail;
                  errorDetails = firstDetail;
                }
              } else {
                // Try to stringify to get readable error
                try {
                  errorDetails = JSON.stringify(errorDetails);
                } catch {
                  errorDetails = String(errorDetails);
                }
              }
            }
            
            // Convert errorDetails to string for checking
            const errorDetailsStr = typeof errorDetails === 'string' ? errorDetails : String(errorDetails);
            const errorMessageStr = typeof errorMessage === 'string' ? errorMessage : String(errorMessage);
            
            // Check for table not found error - can be identified by:
            // 1. code === 'BIGQUERY_ERROR' and message === 'Table not found'
            // 2. message/details containing 'Table not found' or 'Not found: Table'
            // 3. error code 404 (BigQuery returns 404 for not found)
            // 4. Check error object properties directly (even if message is "[object Object]")
            // 5. If error is from getTableSchema and contains "[object Object]", it's likely table not found
            const actualErrorCode = actualError?.code || (err as any)?.code;
            const actualErrorMessage = actualError?.message || (err as any)?.message || errorMessageStr;
            
            // Check if this is an IPC error from getTableSchema - if so, check error properties
            const isGetTableSchemaError = errorMessageStr.includes('bigquery:getTableSchema');
            
            // Check both the extracted strings and the error object properties directly
            const isTableNotFound = 
              (errorCode === 'BIGQUERY_ERROR' && errorMessageStr === 'Table not found') ||
              (actualErrorCode === 'BIGQUERY_ERROR' && actualErrorMessage === 'Table not found') ||
              (errorMessageStr.includes('Table not found')) ||
              (errorMessageStr.includes('Not found: Table')) ||
              (actualErrorMessage.includes('Table not found')) ||
              (actualErrorMessage.includes('Not found: Table')) ||
              (errorDetailsStr.includes('Table not found')) ||
              (errorDetailsStr.includes('Not found: Table')) ||
              (actualErrorCode === 404 || actualErrorCode === '404') ||
              ((err as any)?.code === 404) ||
              // Fallback: if it's a getTableSchema error and we can't extract details, assume table not found
              (isGetTableSchemaError && errorMessageStr.includes('[object Object]'));
            
            if (isTableNotFound) {
              const tableRef = `${datasetId}.${tableId}`;
              // Extract table name from error details if available
              let displayMessage = `Table not found: ${tableRef}`;
              
              // Try to extract the full table reference from error details
              const fullMatch = errorDetailsStr.match(/Not found: Table ([^\s]+)/);
              if (fullMatch) {
                displayMessage = `Table not found: ${fullMatch[1]}`;
              } else {
                // Try to extract from project.dataset.table format in error message
                const tableMatch = errorMessageStr.match(/([a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+)/);
                if (tableMatch) {
                  displayMessage = `Table not found: ${tableMatch[1]}`;
                }
              }
              
              tableNotFoundError = {
                message: displayMessage,
                tableRef,
              };
              // Break on first table not found error to show it in status bar
              break;
            } else {
              // Silently skip other errors (permissions, etc.)
              console.debug(`Could not fetch metadata for ${datasetId}.${tableId}:`, {
                err,
                errorCode,
                errorMessage: errorMessageStr,
                errorDetails: errorDetailsStr,
              });
            }
          }
        }

        // If a table was not found, update SQL validation status to show error
        if (tableNotFoundError) {
          setSqlValidationStatus((prev) => {
            // Only set table not found error if SQL syntax is valid (syntax errors take precedence)
            if (prev.isValid === true || prev.isValid === null) {
              return {
                isValid: false,
                errorMessage: tableNotFoundError.message,
              };
            }
            // Keep syntax error if it exists
            return prev;
          });
          setExpectedQuerySize(null);
        } else {
          // Clear any previous table not found errors if all tables are valid
          setSqlValidationStatus((prev) => {
            // Only clear if the current error is a table not found error
            if (prev.errorMessage && prev.errorMessage.includes('Table not found')) {
              // Clear table not found error, restore to valid if syntax was valid
              return { isValid: true, errorMessage: null };
            }
            // Keep other errors (syntax errors)
            return prev;
          });
          setExpectedQuerySize(hasMetadata ? totalBytes : null);
        }
      } catch (err) {
        console.error('Failed to calculate expected query size:', err);
        setExpectedQuerySize(null);
      } finally {
        setIsLoadingQuerySize(false);
      }
    };

    // Debounce calculation to avoid excessive API calls
    const timeoutId = setTimeout(calculateExpectedQuerySize, 500);
    return () => clearTimeout(timeoutId);
  }, [queryText, isConnected, connection?.projectId, sqlValidationStatus.isValid]);

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
          <>
            <div className="editor-wrapper" ref={editorWrapperRef}>
              <Editor
                height={`${editorHeight}px`}
                defaultLanguage="sql"
                theme="vs-dark"
                value={queryText}
                onChange={handleQueryChange}
              beforeMount={(monaco) => {
                // Register BigQuery language support before editor mounts
                // Provide a function to get the current project ID
                const getProjectId = () => {
                  const currentConnection = useConnectionStore.getState().connection;
                  return currentConnection?.projectId || null;
                };
                
                // Store project ID getter on window for completion provider
                (window as any).__bigqueryGetProjectId = getProjectId;
                
                // Set metadata store getter for completion provider
                setMetadataStoreGetter(() => useBigQueryMetadataStore.getState());
                
                registerBigQueryLanguage(monaco as typeof import('monaco-editor'), getProjectId);
              }}
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
                suggestOnTriggerCharacters: true,
                quickSuggestions: {
                  other: true,
                  comments: false,
                  strings: false,
                },
                suggestSelection: 'first',
                tabCompletion: 'on',
              }}
              />
            </div>
            <div className="editor-status-bar">
              <div className="status-left">
                {completedQueryText !== null && queryText === completedQueryText ? (
                  <span className="status-text status-valid">
                    <span className="status-indicator status-indicator-valid"></span>
                    Query completed{completedQueryExecutionTime !== null ? ` in ${formatExecutionTime(completedQueryExecutionTime)}` : ''}
                  </span>
                ) : sqlValidationStatus.isValid === null ? (
                  <span className="status-text">Ready</span>
                ) : sqlValidationStatus.isValid ? (
                  <span className="status-text status-valid">
                    <span className="status-indicator status-indicator-valid"></span>
                    SQL Syntax is valid
                  </span>
                ) : (
                  <span className="status-text status-invalid">
                    <span className="status-indicator status-indicator-invalid"></span>
                    {sqlValidationStatus.errorMessage || 'SQL syntax error'}
                  </span>
                )}
              </div>
              {expectedQuerySize !== null && (
                <div className="status-right">
                  <span className="status-text">
                    Estimated query size: {formatBytes(expectedQuerySize)}
                  </span>
                </div>
              )}
              {isLoadingQuerySize && expectedQuerySize === null && (
                <div className="status-right">
                  <span className="status-text">Calculating query size...</span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="no-tab-message">No active tab</div>
        )}
      </div>
    </div>
  );
};

