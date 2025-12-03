import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { format } from 'sql-formatter';
import { parse } from 'sql-parser-cst';
import { useBigQuery } from '../../hooks/useBigQuery';
import { useTabsStore } from '../../stores/tabs-store';
import { useQueriesStore } from '../../stores/queries-store';
import { useConnectionStore } from '../../stores/connection-store';
import { registerBigQueryLanguage, setMetadataStoreGetter } from '../../utils/bigquery-completions';
import { useBigQueryMetadataStore } from '../../stores/bigquery-metadata-store';
import { validateGroupByColumns, buildTableAliasMapFromSelect as buildTableAliasMapFromSelectCST } from '../../utils/sql-validation';
import { initTreeSitterParser, validateWithTreeSitter, isTreeSitterAvailable } from '../../utils/tree-sitter-validator';
import './QueryEditor.css';

interface SqlNodeLocation {
  start?: { line: number; column: number };
  end?: { line: number; column: number };
  begin?: { line: number; column: number };
  finish?: { line: number; column: number };
}

interface ColumnRefInfo {
  alias: string | null;
  column: string;
  location?: SqlNodeLocation;
}

interface TableAliasInfo {
  alias: string;
  datasetId?: string;
  tableId?: string;
  cteColumns?: string[];
}

interface ColumnValidationIssue {
  message: string;
  line: number;
  column: number;
  length: number;
}

const stripIdentifierQuotes = (value: string | null | undefined): string => {
  if (!value) return '';
  return value.replace(/[`"']/g, '');
};

/**
 * Helper functions for working with CST (Concrete Syntax Tree) nodes directly.
 * This provides better BigQuery syntax handling and more accurate parsing.
 */

// Get node type from CST (handles both 'type' and 'kind' properties)
const getCstNodeType = (node: any): string | undefined => {
  if (!node || typeof node !== 'object') return undefined;
  return node.type || node.kind;
};

// Check if node is a SELECT statement (CST or converted AST)
const isSelectStmt = (node: any): boolean => {
  const type = getCstNodeType(node);
  return type === 'select_stmt' || type === 'SelectStatement' || type === 'select';
};

// Check if node is a column reference
const isColumnRef = (node: any): boolean => {
  const type = getCstNodeType(node);
  return type === 'column_ref' || type === 'ColumnRef';
};

// Check if node is a binary expression
const isBinaryExpr = (node: any): boolean => {
  const type = getCstNodeType(node);
  return type === 'binary_expr' || type === 'BinaryExpr';
};

// Check if node is a function call
const isFunctionCall = (node: any): boolean => {
  const type = getCstNodeType(node);
  return type === 'function' || type === 'FunctionCall' || type === 'aggr_func';
};

// Get FROM clause tables from CST statement
const getCstFromTables = (stmt: any): any[] => {
  if (!stmt) return [];
  
  const fromClause = stmt.fromClause || stmt.from;
  if (!fromClause) return [];
  
  // CST structure: fromClause.tables or array
  if (fromClause.tables) {
    return Array.isArray(fromClause.tables) ? fromClause.tables : [fromClause.tables];
  }
  
  if (Array.isArray(fromClause)) {
    return fromClause;
  }
  
  // Fallback to AST structure
  if (Array.isArray(stmt.from)) {
    return stmt.from;
  }
  
  return [];
};

// Get WITH clause CTEs from CST statement
const getCstWithCtes = (stmt: any): any[] => {
  const withClause = stmt.withClause || stmt.with;
  if (!withClause) return [];
  
  if (withClause.ctes) {
    return Array.isArray(withClause.ctes) ? withClause.ctes : [withClause.ctes];
  }
  
  if (Array.isArray(withClause)) {
    return withClause;
  }
  
  // Fallback to AST structure
  if (Array.isArray(stmt.with)) {
    return stmt.with;
  }
  
  return [];
};

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const indexToLineColumn = (text: string, index: number): { line: number; column: number } => {
  let line = 1;
  let column = 1;

  for (let i = 0; i < index && i < text.length; i++) {
    const char = text[i];
    if (char === '\n') {
      line += 1;
      column = 1;
    } else if (char === '\r') {
      // Handle Windows-style line endings (\r\n)
      if (i + 1 < text.length && text[i + 1] === '\n') {
        i += 1;
      }
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
  }

  return { line, column };
};

const getLocationPosition = (
  location: SqlNodeLocation | undefined,
  fallbackLength: number
): { line: number; column: number; length: number } | null => {
  if (!location) return null;

  const start = location.start || location.begin;
  const end = location.end || location.finish;

  if (!start || start.line === undefined || start.column === undefined) {
    return null;
  }

  let length = Math.max(1, fallbackLength);

  if (end && end.line !== undefined && end.column !== undefined) {
    if (end.line === start.line) {
      const computedLength = end.column - start.column;
      if (computedLength > 0) {
        length = computedLength;
      }
    }
  }

  return {
    line: start.line,
    column: start.column,
    length,
  };
};

const findPositionInText = (
  text: string,
  alias: string | null,
  column: string
): { line: number; column: number; length: number } | null => {
  const searchPatterns: Array<{ pattern: string; length: number }> = [];

  const sanitizedAlias = alias ? stripIdentifierQuotes(alias) : null;
  const sanitizedColumn = stripIdentifierQuotes(column);

  if (sanitizedAlias) {
    const aliasPattern = `${sanitizedAlias}.${sanitizedColumn}`;
    searchPatterns.push({ pattern: aliasPattern, length: aliasPattern.length });
  }

  if (sanitizedColumn) {
    searchPatterns.push({ pattern: sanitizedColumn, length: sanitizedColumn.length });
  }

    for (const { pattern, length } of searchPatterns) {
      const regex = new RegExp(`\\b${escapeRegExp(pattern)}\\b`, 'i');
    const match = regex.exec(text);
    if (match && match.index !== undefined) {
      const { line, column: col } = indexToLineColumn(text, match.index);
      return { line, column: col, length: Math.max(1, length) };
    }
  }

  return null;
};

const collectColumnRefsFromExpression = (node: any, refs: ColumnRefInfo[]) => {
  if (!node) return;

  if (Array.isArray(node)) {
    for (const child of node) {
      collectColumnRefsFromExpression(child, refs);
    }
    return;
  }

  if (typeof node !== 'object') {
    return;
  }

  // Skip subqueries - they have their own scope and should be validated separately
  // This handles NOT EXISTS, EXISTS, IN (SELECT ...), scalar subqueries, etc.
  if (node.type === 'select') {
    return;
  }

  if (node.type === 'column_ref') {
    // Handle both string columns and object columns (BigQuery parser returns object for unqualified columns)
    let columnName: string;
    if (typeof node.column === 'string') {
      columnName = stripIdentifierQuotes(node.column);
    } else if (node.column && typeof node.column === 'object') {
      // Handle nested column structure: { expr: { type: 'default', value: 'ColumnName' }, offset: [] }
      if (node.column.expr && typeof node.column.expr.value === 'string') {
        columnName = stripIdentifierQuotes(node.column.expr.value);
      } else if (typeof node.column.column === 'string') {
        columnName = stripIdentifierQuotes(node.column.column);
      } else {
        columnName = '';
      }
    } else {
      columnName = '';
    }
    
    // Collect column refs for validation:
    // - Non-* columns: always collect for column name validation
    // - * columns with alias (e.g., da.*): collect to validate alias exists
    // - Bare * without alias: skip (no validation needed)
    const hasAlias = node.table ? true : false;
    const shouldCollect = columnName && (columnName !== '*' || hasAlias);
    
    if (shouldCollect) {
      refs.push({
        alias: node.table ? stripIdentifierQuotes(node.table) : null,
        column: columnName,
        location: node.location || node.loc,
      });
    }
    return;
  }

  // Recursively inspect child properties
  for (const key of Object.keys(node)) {
    if (key === 'location' || key === 'loc') {
      continue;
    }
    collectColumnRefsFromExpression(node[key], refs);
  }
};

const collectColumnRefsForSelect = (selectAst: any, includeCteBodies = false): ColumnRefInfo[] => {
  const refs: ColumnRefInfo[] = [];

  if (!selectAst || typeof selectAst !== 'object') {
    return refs;
  }

  const collect = (expr: any) => collectColumnRefsFromExpression(expr, refs);

  // Optionally collect from CTE bodies (for full query validation)
  if (includeCteBodies && Array.isArray(selectAst.with)) {
    for (const cte of selectAst.with) {
      const cteAst = cte?.stmt?.ast;
      if (cteAst) {
        // Recursively collect from CTE body (but not nested CTEs within CTEs)
        const cteRefs = collectColumnRefsForSelect(cteAst, false);
        refs.push(...cteRefs);
      }
    }
  }

  if (Array.isArray(selectAst.columns)) {
    for (const col of selectAst.columns) {
      collect(col?.expr ?? col);
    }
  }

  if (selectAst.where) {
    collect(selectAst.where);
  }

  if (Array.isArray(selectAst.groupby)) {
    for (const groupExpr of selectAst.groupby) {
      collect(groupExpr);
    }
  } else if (selectAst.groupby?.value && Array.isArray(selectAst.groupby.value)) {
    for (const groupExpr of selectAst.groupby.value) {
      collect(groupExpr);
    }
  }

  if (Array.isArray(selectAst.orderby)) {
    for (const orderItem of selectAst.orderby) {
      collect(orderItem?.expr ?? orderItem);
    }
  }

  if (selectAst.having) {
    collect(selectAst.having);
  }

  if (Array.isArray(selectAst.from)) {
    for (const fromItem of selectAst.from) {
      if (fromItem?.on) {
        collect(fromItem.on);
      }
    }
  }

  return refs;
};

/**
 * Extracts output column names from a CTE's SELECT clause.
 * Returns the column aliases (AS names) or the column names if no alias is specified.
 */
const extractCteColumnNames = (cteAst: any): string[] => {
  const columns: string[] = [];
  
  if (!cteAst || !Array.isArray(cteAst.columns)) {
    return columns;
  }
  
  for (const col of cteAst.columns) {
    // Skip SELECT * - we can't determine column names without schema
    if (col === '*' || (col?.expr?.type === 'star')) {
      continue;
    }
    
    // Check for explicit alias (AS clause)
    const alias = col?.as || col?.alias;
    if (alias) {
      const aliasName = typeof alias === 'string' ? alias : alias?.value;
      if (aliasName) {
        columns.push(stripIdentifierQuotes(aliasName));
        continue;
      }
    }
    
    // No alias - try to get column name from expression
    const expr = col?.expr ?? col;
    
    // Column reference: { type: 'column_ref', column: 'name' } or { type: 'column_ref', column: { expr: { value: 'name' } } }
    if (expr?.type === 'column_ref') {
      let columnName: string | undefined;
      if (typeof expr.column === 'string') {
        columnName = expr.column;
      } else if (expr.column?.expr?.value) {
        columnName = expr.column.expr.value;
      } else if (expr.column?.column) {
        columnName = expr.column.column;
      }
      if (columnName) {
        columns.push(stripIdentifierQuotes(columnName));
      }
    }
    // Function call without alias - skip (BigQuery would use the function expression as the column name)
  }
  
  return columns;
};

const buildTableAliasMapFromSelect = (
  selectAst: any
): {
  aliasMap: Map<string, TableAliasInfo>;
  uniqueTables: Map<string, { datasetId?: string; tableId?: string }>;
} => {
  const aliasMap = new Map<string, TableAliasInfo>();
  const uniqueTables = new Map<string, { datasetId?: string; tableId?: string }>();

  const registerAlias = (aliasName: string | null | undefined, info: { datasetId?: string; tableId?: string; cteColumns?: string[] }) => {
    const cleanAlias = stripIdentifierQuotes(aliasName);
    if (!cleanAlias) return;
    const key = cleanAlias.toLowerCase();
    const existing = aliasMap.get(key);
    if (!existing || (!existing.datasetId && info.datasetId) || (!existing.tableId && info.tableId)) {
      aliasMap.set(key, {
        alias: cleanAlias,
        datasetId: info.datasetId,
        tableId: info.tableId,
        // Preserve cteColumns from existing entry if not provided in new info
        cteColumns: info.cteColumns ?? existing?.cteColumns,
      });
    }
  };

  const processFromItem = (item: any) => {
    if (!item || typeof item !== 'object') {
      return;
    }

    if (Array.isArray(item)) {
      for (const child of item) {
        processFromItem(child);
      }
      return;
    }

    // Handle subqueries - register alias name but skip schema mapping
    if (item.expr && item.expr.type === 'select') {
      registerAlias(item.as || item.alias, {});
      return;
    }

    let datasetId: string | undefined;
    let tableId: string | undefined;
    let projectId: string | undefined;

    if (typeof item.catalog === 'string') {
      projectId = stripIdentifierQuotes(item.catalog);
    }

    if (typeof item.db === 'string') {
      const dbValue = stripIdentifierQuotes(item.db);
      // In BigQuery dialects, db field may represent project or dataset
      projectId = projectId ?? dbValue;
      if (!datasetId) {
        datasetId = dbValue;
      }
    }

    if (typeof item.schema === 'string') {
      datasetId = stripIdentifierQuotes(item.schema);
    }

    if (typeof item.dataset === 'string') {
      datasetId = stripIdentifierQuotes(item.dataset);
    }

    const registerTableName = (raw: string | undefined) => {
      if (!raw) return;
      const cleaned = stripIdentifierQuotes(raw);
      if (!cleaned) return;
      const parts = cleaned.split('.').filter(Boolean);

      let resolvedDataset = datasetId;
      let resolvedTable = tableId;

      if (parts.length >= 2) {
        const potentialDataset = parts[parts.length - 2];
        const potentialProject = parts.length >= 3 ? parts[parts.length - 3] : undefined;
        if (!resolvedDataset || resolvedDataset === potentialProject) {
          resolvedDataset = potentialDataset;
        }
        resolvedTable = parts[parts.length - 1];
      } else if (parts.length === 1) {
        resolvedTable = parts[0];
      }

      if (resolvedDataset) {
        datasetId = resolvedDataset;
      }
      if (resolvedTable) {
        tableId = resolvedTable;
      }

      if (resolvedDataset && resolvedTable) {
        const key = `${resolvedDataset}.${resolvedTable}`.toLowerCase();
        if (!uniqueTables.has(key)) {
          uniqueTables.set(key, { datasetId: resolvedDataset, tableId: resolvedTable });
        }
      }

      registerAlias(cleaned, { datasetId: resolvedDataset, tableId: resolvedTable });
    };

    if (typeof item.table === 'string') {
      registerTableName(item.table);
    } else if (item.table && typeof item.table === 'object') {
      if (typeof item.table.table === 'string') {
        registerTableName(item.table.table);
      }
      if (typeof item.table.name === 'string') {
        registerTableName(item.table.name);
      }
      if (typeof item.table.db === 'string' && !datasetId) {
        datasetId = stripIdentifierQuotes(item.table.db);
      }
    }

    // Register alias variations for lookup
    registerAlias(item.as || item.alias, { datasetId, tableId });

    if (tableId) {
      registerAlias(tableId, { datasetId, tableId });
    }

    if (datasetId && tableId) {
      registerAlias(`${datasetId}.${tableId}`, { datasetId, tableId });
    }
  };

  // Process CTEs (WITH clause) - register CTE names as valid aliases
  // Note: We only register the CTE name here, not the tables inside the CTE.
  // CTE bodies are validated separately with their own scope in validateColumnsForSelect.
  if (Array.isArray(selectAst?.with)) {
    for (const cte of selectAst.with) {
      // Register CTE name as a valid alias (without dataset/table since it's a virtual table)
      const cteName = cte?.name?.value || cte?.name;
      if (cteName) {
        // Extract the column names from the CTE's SELECT clause
        const cteAst = cte?.stmt?.ast;
        const cteColumns = cteAst ? extractCteColumnNames(cteAst) : [];
        registerAlias(cteName, { cteColumns: cteColumns.length > 0 ? cteColumns : undefined });
      }
    }
  }

  if (Array.isArray(selectAst?.from)) {
    for (const fromItem of selectAst.from) {
      processFromItem(fromItem);
    }
  } else {
    processFromItem(selectAst?.from);
  }

  return { aliasMap, uniqueTables };
};

interface QueryEditorProps {
  theme?: 'dark' | 'light';
}

export const QueryEditor: React.FC<QueryEditorProps> = ({ theme = 'dark' }) => {
  // Initialize tree-sitter parser on component mount
  const [treeSitterReady, setTreeSitterReady] = useState(false);
  useEffect(() => {
    initTreeSitterParser().then((success) => {
      setTreeSitterReady(success);
      if (success) {
        console.log('[QueryEditor] Tree-sitter parser initialized successfully');
      }
    });
  }, []);

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
  const editorRef = useRef<any>(null);
  const editorWrapperRef = useRef<HTMLDivElement>(null);
  const [editorHeight, setEditorHeight] = useState(300);
  const executeHandlerRef = useRef<(() => void) | null>(null);
  const expandSelectStarHandlerRef = useRef<(() => void) | null>(null);
  const validateHandlerRef = useRef<(() => void) | null>(null);
  const selectionValidationTimeoutRef = useRef<number | null>(null);
  const isMouseSelectingRef = useRef(false);
  const validationRunIdRef = useRef(0);
  const schemaCacheRef = useRef<Map<string, Promise<string[] | null>>>(new Map());
    useEffect(() => {
      return () => {
        if (selectionValidationTimeoutRef.current !== null) {
          window.clearTimeout(selectionValidationTimeoutRef.current);
          selectionValidationTimeoutRef.current = null;
        }
        isMouseSelectingRef.current = false;
      };
    }, []);

    const scheduleSelectionValidation = (delay: number = 150) => {
      if (selectionValidationTimeoutRef.current !== null) {
        window.clearTimeout(selectionValidationTimeoutRef.current);
      }
      selectionValidationTimeoutRef.current = window.setTimeout(() => {
        selectionValidationTimeoutRef.current = null;
        if (validateHandlerRef.current) {
          validateHandlerRef.current();
        }
      }, delay);
    };
  const errorDecorationsRef = useRef<string[]>([]);
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

  const getTableFields = useCallback(async (datasetId: string, tableId: string): Promise<string[] | null> => {
    const cacheKey = `${datasetId}.${tableId}`.toLowerCase();
    const existing = schemaCacheRef.current.get(cacheKey);
    if (existing) {
      return existing;
    }

    const fetchPromise = (async () => {
      try {
        if (!window.electronAPI?.bigquery?.getTableSchema) {
          return null;
        }
        const schemaResult = await window.electronAPI.bigquery.getTableSchema(datasetId, tableId);
        if (!schemaResult || !Array.isArray(schemaResult.fields)) {
          return [];
        }
        return schemaResult.fields
          .map((field: any) => (typeof field?.name === 'string' ? field.name : null))
          .filter((name): name is string => Boolean(name));
      } catch (error) {
        // If the schema call fails (e.g., table not found), return null so other checks can handle it.
        return null;
      }
    })();

    schemaCacheRef.current.set(cacheKey, fetchPromise);
    return fetchPromise;
  }, []);

  const validateColumnsForSelect = useCallback(async (
    selectAst: any,
    textToValidate: string,
    canFetchSchemas: boolean
  ): Promise<ColumnValidationIssue[]> => {
    const issues: ColumnValidationIssue[] = [];

    // Helper function to validate columns for a single SELECT scope
    const validateScope = async (
      scopeAst: any,
      scopeAliasMap: Map<string, TableAliasInfo>,
      scopeUniqueTables: Map<string, { datasetId?: string; tableId?: string }>
    ) => {
      const columnRefs = collectColumnRefsForSelect(scopeAst, false);
      const uniqueTableList = Array.from(scopeUniqueTables.values());

      for (const columnRef of columnRefs) {
        const baseColumnName = columnRef.column.split('.')[0];
        const lowerColumnName = baseColumnName.toLowerCase();
        const location =
          getLocationPosition(columnRef.location, columnRef.column.length) ||
          findPositionInText(textToValidate, columnRef.alias, columnRef.column) || {
            line: 1,
            column: 1,
            length: Math.max(1, columnRef.column.length),
          };

        const aliasKey = columnRef.alias ? columnRef.alias.toLowerCase() : null;
        const aliasInfo = aliasKey ? scopeAliasMap.get(aliasKey) : null;

        if (aliasKey && !aliasInfo) {
          issues.push({
            message: `Unknown table or alias "${columnRef.alias}" used in column reference`,
            line: location.line,
            column: location.column,
            length: location.length,
          });
          continue;
        }

        // For alias.* patterns (e.g., da.*), we've validated the alias exists above.
        // The * means "all columns" which is always valid syntax, so skip column validation.
        if (columnRef.column === '*') {
          continue;
        }

        if (!canFetchSchemas) {
          // Without schema access we can only report alias issues.
          continue;
        }

        // If aliasInfo exists but has no datasetId/tableId, it's a CTE or subquery.
        // Check if we have CTE column information to validate against.
        if (aliasInfo && (!aliasInfo.datasetId || !aliasInfo.tableId)) {
          // If we have CTE columns, validate against them
          if (aliasInfo.cteColumns && aliasInfo.cteColumns.length > 0) {
            const hasColumn = aliasInfo.cteColumns.some(
              (col) => col.toLowerCase() === lowerColumnName
            );
            if (!hasColumn) {
              issues.push({
                message: `Column "${columnRef.column}" not found in ${aliasInfo.alias}`,
                line: location.line,
                column: location.column,
                length: location.length,
              });
            }
          }
          // If no CTE columns available (e.g., SELECT * in CTE), skip validation
          continue;
        }

        if (aliasInfo && aliasInfo.datasetId && aliasInfo.tableId) {
          const fields = await getTableFields(aliasInfo.datasetId, aliasInfo.tableId);
          if (fields === null) {
            // Schema lookup failed (likely table not found). Skip detailed column checks.
            continue;
          }

          const hasColumn = fields.some((fieldName) => fieldName.toLowerCase() === lowerColumnName);
          if (!hasColumn) {
            const targetName = aliasInfo.alias || `${aliasInfo.datasetId}.${aliasInfo.tableId}`;
            issues.push({
              message: `Column "${columnRef.column}" not found in ${targetName}`,
              line: location.line,
              column: location.column,
              length: location.length,
            });
          }
          continue;
        }

        if (!aliasInfo) {
          // Check if any table in scope is a CTE/subquery (no schema from database).
          const cteOrSubqueryInfos = Array.from(scopeAliasMap.values()).filter(
            info => !info.datasetId || !info.tableId
          );
          
          // First, check if the column exists in any CTE that has column info
          let foundInCte = false;
          for (const cteInfo of cteOrSubqueryInfos) {
            if (cteInfo.cteColumns && cteInfo.cteColumns.length > 0) {
              const hasColumn = cteInfo.cteColumns.some(
                (col) => col.toLowerCase() === lowerColumnName
              );
              if (hasColumn) {
                foundInCte = true;
                break;
              }
            }
          }
          
          if (foundInCte) {
            continue;
          }
          
          // Check if there are CTEs without column info (e.g., SELECT * in CTE)
          // In this case, we can't validate since we don't know the CTE's columns
          const hasUnknownCteColumns = cteOrSubqueryInfos.some(
            info => !info.cteColumns || info.cteColumns.length === 0
          );
          
          if (hasUnknownCteColumns) {
            // Skip validation for unqualified columns when CTEs with unknown columns are present
            continue;
          }

          let columnFound = false;

          for (const tableInfo of uniqueTableList) {
            if (!tableInfo.datasetId || !tableInfo.tableId) {
              continue;
            }

            const fields = await getTableFields(tableInfo.datasetId, tableInfo.tableId);
            if (fields === null) {
              continue;
            }

            const hasColumn = fields.some((fieldName) => fieldName.toLowerCase() === lowerColumnName);
            if (hasColumn) {
              columnFound = true;
              break;
            }
          }

          // If column wasn't found in database tables, also check all CTE columns
          if (!columnFound) {
            for (const cteInfo of cteOrSubqueryInfos) {
              if (cteInfo.cteColumns && cteInfo.cteColumns.length > 0) {
                const hasColumn = cteInfo.cteColumns.some(
                  (col) => col.toLowerCase() === lowerColumnName
                );
                if (hasColumn) {
                  columnFound = true;
                  break;
                }
              }
            }
          }

          // Report error if column not found in any table or CTE
          const hasAnySource = uniqueTableList.length > 0 || cteOrSubqueryInfos.some(
            info => info.cteColumns && info.cteColumns.length > 0
          );
          
          if (!columnFound && hasAnySource) {
            issues.push({
              message: `Column "${columnRef.column}" not found in referenced tables`,
              line: location.line,
              column: location.column,
              length: location.length,
            });
          }
        }
      }
    };

    // First, validate each CTE body independently against its own FROM tables
    if (Array.isArray(selectAst?.with)) {
      for (const cte of selectAst.with) {
        const cteAst = cte?.stmt?.ast;
        if (cteAst) {
          // Build alias map for just this CTE's scope (its own FROM clause only)
          const { aliasMap: cteAliasMap, uniqueTables: cteUniqueTables } = buildTableAliasMapFromSelect({
            ...cteAst,
            with: null, // Don't process nested CTEs here, they'd be handled separately
          });
          await validateScope(cteAst, cteAliasMap, cteUniqueTables);
        }
      }
    }

    // Then validate the main query (excluding CTE bodies, but including CTE names as valid aliases)
    const { aliasMap, uniqueTables } = buildTableAliasMapFromSelect(selectAst);
    await validateScope(selectAst, aliasMap, uniqueTables);

    // Helper function to collect all subqueries from an AST node
    const collectSubqueries = (node: any, subqueries: any[]) => {
      if (!node) return;
      
      if (Array.isArray(node)) {
        for (const child of node) {
          collectSubqueries(child, subqueries);
        }
        return;
      }
      
      if (typeof node !== 'object') return;
      
      // Found a subquery
      if (node.type === 'select') {
        subqueries.push(node);
        // Don't recurse into the subquery here - it will be processed separately
        return;
      }
      
      // Recurse into child properties
      for (const key of Object.keys(node)) {
        if (key === 'location' || key === 'loc') continue;
        collectSubqueries(node[key], subqueries);
      }
    };

    // Recursively validate subqueries within the AST
    // parentAliasMap contains aliases from outer scopes (for correlated subqueries)
    const validateSubqueries = async (
      ast: any,
      parentAliasMap: Map<string, TableAliasInfo> = new Map(),
      parentUniqueTables: Map<string, { datasetId?: string; tableId?: string }> = new Map()
    ) => {
      const subqueries: any[] = [];
      
      // Collect subqueries from WHERE, HAVING, SELECT columns, etc.
      collectSubqueries(ast.where, subqueries);
      collectSubqueries(ast.having, subqueries);
      if (Array.isArray(ast.columns)) {
        for (const col of ast.columns) {
          collectSubqueries(col?.expr ?? col, subqueries);
        }
      }
      // Also check JOIN ON conditions for subqueries
      if (Array.isArray(ast.from)) {
        for (const fromItem of ast.from) {
          if (fromItem?.on) {
            collectSubqueries(fromItem.on, subqueries);
          }
        }
      }
      
      // Validate each subquery with its own scope + parent scope (for correlated subqueries)
      for (const subquery of subqueries) {
        const { aliasMap: subAliasMap, uniqueTables: subUniqueTables } = buildTableAliasMapFromSelect(subquery);
        
        // Merge parent aliases into subquery's alias map (subquery's own aliases take precedence)
        const mergedAliasMap = new Map(parentAliasMap);
        for (const [key, value] of subAliasMap) {
          mergedAliasMap.set(key, value);
        }
        
        // Merge parent unique tables into subquery's unique tables
        const mergedUniqueTables = new Map(parentUniqueTables);
        for (const [key, value] of subUniqueTables) {
          mergedUniqueTables.set(key, value);
        }
        
        await validateScope(subquery, mergedAliasMap, mergedUniqueTables);
        // Recursively validate nested subqueries, passing the merged scope
        await validateSubqueries(subquery, mergedAliasMap, mergedUniqueTables);
      }
    };

    // Validate subqueries in CTEs (CTEs have their own scope, not the main query's scope)
    if (Array.isArray(selectAst?.with)) {
      for (const cte of selectAst.with) {
        const cteAst = cte?.stmt?.ast;
        if (cteAst) {
          const { aliasMap: cteAliasMap, uniqueTables: cteUniqueTables } = buildTableAliasMapFromSelect({
            ...cteAst,
            with: null,
          });
          await validateSubqueries(cteAst, cteAliasMap, cteUniqueTables);
        }
      }
    }

    // Validate subqueries in the main query, passing the main query's aliases as parent scope
    await validateSubqueries(selectAst, aliasMap, uniqueTables);

    return issues;
  }, [getTableFields]);

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

  // SQL parser function for validation (sql-parser-cst doesn't need instance)
  // No initialization needed - parse function can be called directly

  // Ensure Monaco editor tooltips render above toolbar
  useEffect(() => {
    // Add global style to ensure Monaco hover tooltips have high z-index
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
      // Cleanup: remove style when component unmounts
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

    // Initial height calculation
    updateHeight();

    // Use ResizeObserver to update height when container resizes
    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(editorWrapperRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [activeTab]);

  // Helper function to count SELECT statements in SQL text (ignoring comments and strings)
  const countSelectStatements = (sql: string): number => {
    // Count only top-level SELECT statements (not CTEs or subqueries)
    // A top-level SELECT is one that starts a new statement, not inside parentheses
    
    // Remove comments first
    let cleanedSql = sql;
    
    // Remove single-line comments (--)
    cleanedSql = cleanedSql.replace(/--.*$/gm, '');
    
    // Remove multi-line comments (/* */)
    cleanedSql = cleanedSql.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Remove string literals (single quotes, double quotes, backticks)
    cleanedSql = cleanedSql.replace(/'([^'\\]|\\.)*'/g, "''");
    cleanedSql = cleanedSql.replace(/"([^"\\]|\\.)*"/g, '""');
    cleanedSql = cleanedSql.replace(/`([^`\\]|\\.)*`/g, '``');
    
    // Now count top-level statements by tracking parenthesis depth
    // A SELECT at depth 0 that is not preceded by WITH...AS is a top-level statement
    let depth = 0;
    let topLevelCount = 0;
    let i = 0;
    let inWithClause = false;
    
    // Normalize whitespace for easier matching
    cleanedSql = cleanedSql.replace(/\s+/g, ' ').trim();
    
    while (i < cleanedSql.length) {
      const char = cleanedSql[i];
      
      if (char === '(') {
        depth++;
        i++;
        continue;
      }
      
      if (char === ')') {
        depth--;
        // When we exit the outermost parenthesis after a WITH clause CTE definition,
        // we're still in the WITH clause until we hit the main SELECT
        i++;
        continue;
      }
      
      // Check for WITH keyword at depth 0 (start of CTE)
      if (depth === 0) {
        const remainingUpper = cleanedSql.substring(i).toUpperCase();
        
        // Check for WITH keyword (start of CTE)
        if (remainingUpper.match(/^WITH\b/)) {
          inWithClause = true;
          i += 4;
          continue;
        }
        
        // Check for SELECT keyword
        if (remainingUpper.match(/^SELECT\b/)) {
          if (inWithClause) {
            // This SELECT is the main query after WITH clause - count it
            topLevelCount++;
            inWithClause = false;
          } else {
            // This is a standalone SELECT statement
            topLevelCount++;
          }
          i += 6;
          continue;
        }
        
        // Check for semicolon (statement separator) - reset state for next statement
        if (char === ';') {
          inWithClause = false;
          i++;
          continue;
        }
      }
      
      i++;
    }
    
    return topLevelCount;
  };

  // Validate SQL syntax and set markers in Monaco Editor
  useEffect(() => {
    if (!editorRef.current) {
      return;
    }

    const validateSQL = async () => {
      const model = editorRef.current?.getModel();
      if (!model || !(window as any).monaco) return;

      const currentRunId = ++validationRunIdRef.current;

      // Get current selection
      const selection = editorRef.current?.getSelection();
      const hasSelection = selection && !selection.isEmpty();
      
      // Determine which text to validate
      let textToValidate = queryText;
      if (hasSelection && selection && model) {
        textToValidate = model.getValueInRange(selection);
      }
      
      const trimmedQuery = textToValidate.trim();
      
      // Skip validation for empty or very short queries to avoid false positives
      if (!trimmedQuery || trimmedQuery.length < 3) {
        // Clear markers if query is empty or too short
        (window as any).monaco.editor.setModelMarkers(model, 'sql', []);
        
        // Clear error decorations in glyph margin
        if (editorRef.current) {
          errorDecorationsRef.current = editorRef.current.deltaDecorations(
            errorDecorationsRef.current,
            []
          );
        }
        
        // Update status bar - but preserve table not found errors if they exist
        setSqlValidationStatus((prev) => {
          // Only clear if there's no table not found error
          if (prev.errorMessage && prev.errorMessage.includes('Table not found')) {
            return prev;
          }
          return { isValid: null, errorMessage: null, errorLine: null };
        });
        return;
      }

      // Check for multiple SELECT statements when no selection is active
      // Only check full query text, not selected text
      const selectCount = countSelectStatements(queryText);
      
      if (selectCount > 1 && !hasSelection) {
        // Multiple SELECT statements detected without selection - show error
        // Find the position of the second SELECT statement
        const lines = queryText.split('\n');
        let secondSelectLine = 1;
        let secondSelectColumn = 1;
        let selectFound = 0;
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          // Remove comments and strings for matching
          let cleanedLine = line.replace(/--.*$/, '').replace(/\/\*.*?\*\//g, '');
          cleanedLine = cleanedLine.replace(/'([^'\\]|\\.)*'/g, "''").replace(/"([^"\\]|\\.)*"/g, '""').replace(/`([^`\\]|\\.)*`/g, '``');
          
          const selectMatch = cleanedLine.match(/\bSELECT\b/i);
          if (selectMatch) {
            selectFound++;
            if (selectFound === 2) {
              secondSelectLine = i + 1;
              secondSelectColumn = (selectMatch.index || 0) + 1;
              break;
            }
          }
        }
        
        const markers: any[] = [
          {
            severity: (window as any).monaco.MarkerSeverity.Error,
            startLineNumber: secondSelectLine,
            startColumn: secondSelectColumn,
            endLineNumber: secondSelectLine,
            endColumn: Math.min(secondSelectColumn + 6, model.getLineLength(secondSelectLine) + 1), // Highlight "SELECT"
            message: 'Multiple SELECT statements detected. Please select the specific query you want to execute, or remove extra statements.',
          },
        ];
        (window as any).monaco.editor.setModelMarkers(model, 'sql', markers);
        
        // Add error indicator in glyph margin for multiple SELECT error
        if (editorRef.current) {
          const errorMsg = 'Multiple SELECT statements detected. Please select the specific query you want to execute, or remove extra statements.';
          const decorations: any[] = [
            {
              range: new (window as any).monaco.Range(secondSelectLine, 1, secondSelectLine, 1),
              options: {
                glyphMarginClassName: 'error-glyph-margin',
                glyphMarginHoverMessage: { value: errorMsg },
                minimap: {
                  color: '#f48771',
                },
                overviewRuler: {
                  color: '#f48771',
                  position: (window as any).monaco?.editor?.OverviewRulerLane?.Right ?? 2,
                },
              },
            },
          ];
          
          // Update decorations (remove old ones, add new ones)
          errorDecorationsRef.current = editorRef.current.deltaDecorations(
            errorDecorationsRef.current,
            decorations
          );
        }
        
        setSqlValidationStatus({ 
          isValid: false, 
          errorMessage: 'Multiple SELECT statements detected. Please select the specific query you want to execute, or remove extra statements.',
          errorLine: null
        });
        return;
      }

      // === HYBRID VALIDATION: tree-sitter + sql-parser-cst ===
      
      // Step 1: Fast syntax validation with tree-sitter (if available)
      // Tree-sitter excels at catching structural syntax errors
      if (isTreeSitterAvailable()) {
        const treeSitterErrors = validateWithTreeSitter(trimmedQuery);
        if (treeSitterErrors.length > 0) {
          // Tree-sitter found syntax errors - show the first one
          const firstError = treeSitterErrors[0];
          
          // Set markers for all tree-sitter errors
          const markers = treeSitterErrors.map(err => ({
            severity: (window as any).monaco.MarkerSeverity.Error,
            startLineNumber: err.line,
            startColumn: err.column,
            endLineNumber: err.line,
            endColumn: err.column + err.length,
            message: err.message,
            source: 'tree-sitter',
          }));
          (window as any).monaco.editor.setModelMarkers(model, 'sql', markers);
          
          // Add error decoration in glyph margin
          if (editorRef.current) {
            const decorations = treeSitterErrors.map(err => ({
              range: new (window as any).monaco.Range(err.line, 1, err.line, 1),
              options: {
                glyphMarginClassName: 'error-glyph-margin',
                glyphMarginHoverMessage: { value: err.message },
                minimap: { color: '#f48771' },
                overviewRuler: {
                  color: '#f48771',
                  position: (window as any).monaco?.editor?.OverviewRulerLane?.Right ?? 2,
                },
              },
            }));
            errorDecorationsRef.current = editorRef.current.deltaDecorations(
              errorDecorationsRef.current,
              decorations
            );
          }
          
          setSqlValidationStatus({
            isValid: false,
            errorMessage: firstError.message,
            errorLine: firstError.line,
          });
          
          // Still try sql-parser-cst for potentially better error messages
          // but don't block on it - tree-sitter already found the error
        }
      }

      // Step 2: Validate with sql-parser-cst (for detailed parsing and semantic validation)
      let parsedAst: any;
      try {
        // Try to parse the SQL using sql-parser-cst (returns CST directly)
        const cst = parse(trimmedQuery, {
          dialect: 'bigquery',
          includeRange: true,
        });
        
        // Use CST directly - no conversion needed!
        // This provides better BigQuery syntax handling and preserves more information
        parsedAst = cst;
        
        // Additional validation: Check for JOINs without ON/USING clause
        // BigQuery requires ON or USING clauses for JOINs (except CROSS JOIN)
        const validateJoins = (stmt: any): { valid: boolean; error?: string; line?: number; column?: number } => {
          // Helper to check if an ON clause contains a valid join condition
          const isValidOnCondition = (onClause: any): boolean => {
            if (!onClause) return false;
            
            const nodeType = getCstNodeType(onClause);
            
            // ON TRUE or ON FALSE - technically valid (cartesian with always true/false)
            if (nodeType === 'bool' || nodeType === 'BooleanLiteral') return true;
            
            // ON 1=1 or similar comparison - valid
            if (isBinaryExpr(onClause)) {
              const operator = onClause.operator?.text || onClause.operator;
              const comparisonOperators = ['=', '!=', '<>', '<', '>', '<=', '>=', 'LIKE', 'IN', 'IS', 'AND', 'OR'];
              if (comparisonOperators.includes(operator?.toUpperCase?.())) {
                return true;
              }
              // Could be nested AND/OR with valid conditions
              if (['AND', 'OR'].includes(operator?.toUpperCase?.())) {
                return isValidOnCondition(onClause.left) || isValidOnCondition(onClause.right);
              }
            }
            
            // ON column_ref alone (e.g., ON t1.id) - NOT valid, needs comparison
            if (isColumnRef(onClause)) return false;
            
            // Function calls might be valid (e.g., ON some_function())
            if (isFunctionCall(onClause)) return true;
            
            // For other types, be lenient - let BigQuery decide
            return true;
          };
          
          const checkFromClause = (fromTables: any[]): { valid: boolean; error?: string; tableName?: string } | null => {
            if (!Array.isArray(fromTables)) return null;
            
            for (const item of fromTables) {
              // Check if this is a JOIN (not CROSS JOIN)
              // CST structure: item.join.type.text or item.join.type or item.join
              const joinType = item.join?.type?.text || item.join?.type || item.join;
              if (joinType && typeof joinType === 'string') {
                const joinTypeUpper = joinType.toUpperCase();
                // CROSS JOIN doesn't require ON/USING
                if (!joinTypeUpper.includes('CROSS')) {
                  // Regular JOIN, LEFT JOIN, RIGHT JOIN, etc. require ON or USING
                  const onCondition = item.onClause?.condition || item.on;
                  if (!onCondition && !item.using) {
                    const tableName = item.table?.name || item.table || item.name || 'table';
                    return { valid: false, error: `${joinTypeUpper} is missing ON or USING clause`, tableName };
                  }
                  
                  // Check if ON clause has a valid condition (not just a column reference)
                  if (onCondition && !isValidOnCondition(onCondition)) {
                    const tableName = item.table?.name || item.table || item.name || 'table';
                    return { valid: false, error: `${joinTypeUpper} ON clause requires a valid condition (e.g., t1.col = t2.col)`, tableName };
                  }
                }
              }
              
              // Check nested subqueries in FROM clause
              if (item.query) {
                const nestedFromTables = getCstFromTables(item.query);
                const nestedResult = checkFromClause(nestedFromTables);
                if (nestedResult && !nestedResult.valid) return nestedResult;
              }
            }
            return null;
          };
          
          // Handle CST structure - statements are in a Program node or array
          const statements = cst.statements || (Array.isArray(cst) ? cst : [cst]);
          
          for (const stmt of statements) {
            // Check for SELECT statement in CST
            if (isSelectStmt(stmt)) {
              const fromTables = getCstFromTables(stmt);
              const result = checkFromClause(fromTables);
              if (result && !result.valid) {
                // Try to find the position of the JOIN in the query
                let line = 1;
                let column = 1;
                
                // Look for the JOIN keyword that precedes this table reference
                const lines = trimmedQuery.split('\n');
                for (let i = 0; i < lines.length; i++) {
                  const lineText = lines[i];
                  const joinRegex = new RegExp(`\\b(?:LEFT\\s+|RIGHT\\s+|INNER\\s+|OUTER\\s+|FULL\\s+)?JOIN\\b`, 'i');
                  const joinMatch = lineText.match(joinRegex);
                  
                  if (joinMatch) {
                    const tableNameParts = (result.tableName || '').split('.');
                    const lastPart = tableNameParts[tableNameParts.length - 1] || result.tableName || '';
                    
                    if (lineText.toLowerCase().includes(lastPart.toLowerCase())) {
                      line = i + 1;
                      column = (joinMatch.index || 0) + 1;
                      break;
                    }
                  }
                }
                
                return { valid: false, error: result.error, line, column };
              }
            }
            
            // Check CTEs (WITH clause) - CST structure
            const ctes = getCstWithCtes(stmt);
            for (const cte of ctes) {
              const cteQuery = cte.query || cte.stmt?.ast || cte.stmt;
              if (cteQuery) {
                const cteResult = validateJoins(cteQuery);
                if (!cteResult.valid) return cteResult;
              }
            }
          }
          
          return { valid: true };
        };
        
        const joinValidation = validateJoins(cst);
        if (!joinValidation.valid) {
          const errorMessage = joinValidation.error || 'JOIN is missing ON or USING clause';
          const lineNumber = joinValidation.line || 1;
          const column = joinValidation.column || 1;
          
          // Create marker for the error
          const markers: any[] = [
            {
              severity: (window as any).monaco.MarkerSeverity.Error,
              startLineNumber: lineNumber,
              startColumn: column,
              endLineNumber: lineNumber,
              endColumn: model.getLineLength(lineNumber) + 1,
              message: errorMessage,
            },
          ];
          (window as any).monaco.editor.setModelMarkers(model, 'sql', markers);
          
          // Add error indicator in glyph margin
          if (editorRef.current) {
            const decorations: any[] = [
              {
                range: new (window as any).monaco.Range(lineNumber, 1, lineNumber, 1),
                options: {
                  glyphMarginClassName: 'error-glyph-margin',
                  glyphMarginHoverMessage: { value: errorMessage },
                  minimap: {
                    color: '#f48771',
                  },
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
          
          setSqlValidationStatus({ isValid: false, errorMessage, errorLine: lineNumber });
          return;
        }
        
        // Parsing succeeded - set valid status immediately
        // (column validation may change this to invalid later if issues are found)
        setSqlValidationStatus((prev) => {
          // Don't overwrite table not found errors - those are handled by calculateExpectedQuerySize
          if (prev.errorMessage && prev.errorMessage.includes('Table not found')) {
            return prev;
          }
          return { isValid: true, errorMessage: null, errorLine: null };
        });
        
        // Clear markers
        (window as any).monaco.editor.setModelMarkers(model, 'sql', []);
        
        // Clear error decorations in glyph margin
        if (editorRef.current) {
          errorDecorationsRef.current = editorRef.current.deltaDecorations(
            errorDecorationsRef.current,
            []
          );
        }
      } catch (error: any) {
        if (currentRunId !== validationRunIdRef.current) {
          return;
        }
        // Parse error occurred, create marker
        let errorMessage = error.message || 'SQL syntax error';
        
        // First, check if there's an obvious syntax error on line 1
        // This helps catch errors that the parser might report as being on later lines
        const lines = textToValidate.split('\n');
        let firstLineError: { line: number; column: number } | null = null;
        
        // Check for incomplete JOIN ON clause pattern
        // This happens when user writes "JOIN table ON" without a condition
        let incompleteJoinError: { line: number; column: number; message: string } | null = null;
        for (let i = 0; i < lines.length; i++) {
          const lineText = lines[i];
          const lineUpper = lineText.toUpperCase();
          
          // Check if this line has a JOIN with ON but the ON is at the end or followed by WHERE/ORDER/GROUP/etc.
          const joinOnMatch = lineText.match(/\b(?:LEFT\s+|RIGHT\s+|INNER\s+|OUTER\s+|FULL\s+)?JOIN\b.*\bON\s*$/i);
          if (joinOnMatch) {
            // ON is at the end of the line - check if next non-empty line starts with WHERE, ORDER, GROUP, etc.
            let nextLineIndex = i + 1;
            while (nextLineIndex < lines.length && !lines[nextLineIndex].trim()) {
              nextLineIndex++;
            }
            if (nextLineIndex < lines.length) {
              const nextLine = lines[nextLineIndex].trim().toUpperCase();
              if (nextLine.startsWith('WHERE') || nextLine.startsWith('ORDER') || 
                  nextLine.startsWith('GROUP') || nextLine.startsWith('HAVING') || 
                  nextLine.startsWith('LIMIT') || nextLine.startsWith('UNION')) {
                const joinMatch = lineText.match(/\b(?:LEFT\s+|RIGHT\s+|INNER\s+|OUTER\s+|FULL\s+)?JOIN\b/i);
                incompleteJoinError = {
                  line: i + 1,
                  column: joinMatch?.index ? joinMatch.index + 1 : 1,
                  message: 'JOIN ON clause is incomplete. Expected a condition (e.g., t1.col = t2.col)'
                };
                break;
              }
            }
          }
          
          // Also check for "JOIN table ON WHERE" on the same line
          const joinOnWhereMatch = lineText.match(/\b(?:LEFT\s+|RIGHT\s+|INNER\s+|OUTER\s+|FULL\s+)?JOIN\b.*\bON\s+(?:WHERE|ORDER|GROUP|HAVING|LIMIT)\b/i);
          if (joinOnWhereMatch) {
            const joinMatch = lineText.match(/\b(?:LEFT\s+|RIGHT\s+|INNER\s+|OUTER\s+|FULL\s+)?JOIN\b/i);
            incompleteJoinError = {
              line: i + 1,
              column: joinMatch?.index ? joinMatch.index + 1 : 1,
              message: 'JOIN ON clause is incomplete. Expected a condition (e.g., t1.col = t2.col)'
            };
            break;
          }
        }
        
        if (lines.length > 0 && lines[0].trim()) {
          const firstLine = lines[0].trim();
          // Check for common first-line syntax errors
          const firstLineErrors = [
            /sel\s+ect/i,  // SEL ECT
            /fro\s+m/i,    // FRO M
            /wher\s+e/i,   // WHER E
            /orde\s+r/i,   // ORDE R
            /grou\s+p/i,   // GROU P
          ];
          
          for (const pattern of firstLineErrors) {
            const match = firstLine.match(pattern);
            if (match && match.index !== undefined) {
              firstLineError = { line: 1, column: match.index + 1 };
              break;
            }
          }
        }
        
        // Try to extract line and column from error object properties first
        let lineNumber = 1;
        let column = 1;
        
        // Check error object for position properties (sql-parser-cst may provide these)
        if (error.loc) {
          lineNumber = error.loc.line || error.loc.start?.line || 1;
          column = error.loc.column || error.loc.start?.column || error.loc.start?.character || 1;
        } else if (error.location) {
          lineNumber = error.location.line || error.location.start?.line || 1;
          column = error.location.column || error.location.start?.column || error.location.start?.character || 1;
        } else if (error.line !== undefined) {
          lineNumber = error.line;
          column = error.column || 1;
        } else if (error.pos !== undefined) {
          // If we have a character position, convert it to line/column
          let charCount = 0;
          for (let i = 0; i < lines.length; i++) {
            const lineLength = lines[i].length + 1; // +1 for newline
            if (charCount + lineLength > error.pos) {
              lineNumber = i + 1;
              column = error.pos - charCount + 1;
              break;
            }
            charCount += lineLength;
          }
        } else {
          // Try to extract line and column from error message string
          // Common error message patterns from sql-parser-cst
          const lineMatch = errorMessage.match(/line (\d+)/i) || 
                           errorMessage.match(/at line (\d+)/i) ||
                           errorMessage.match(/line: (\d+)/i) ||
                           errorMessage.match(/Line (\d+)/i);
          const columnMatch = errorMessage.match(/column (\d+)/i) || 
                             errorMessage.match(/at column (\d+)/i) ||
                             errorMessage.match(/column: (\d+)/i) ||
                             errorMessage.match(/Column (\d+)/i) ||
                             errorMessage.match(/col (\d+)/i);
          
          if (lineMatch) {
            lineNumber = parseInt(lineMatch[1], 10);
          }
          if (columnMatch) {
            column = parseInt(columnMatch[1], 10);
          }
        }
        
        // If we found an error on line 1, prioritize it over parser's reported line
        // (parser might report where it gave up, not where the first error occurred)
        if (firstLineError && lineNumber > 1) {
          lineNumber = firstLineError.line;
          column = firstLineError.column;
        }

        // If we still can't extract position, try to find it in the query text
        if (lineNumber === 1 && column === 1) {
            const lines = textToValidate.split('\n');
            
            // Extract potential error tokens from error message
            // Common patterns: "Unexpected token X", "Syntax error near X", etc.
            const errorLower = errorMessage.toLowerCase();
            
            // Try to find tokens mentioned in the error message
            // Look for quoted strings or specific keywords in the error
            const quotedMatch = errorMessage.match(/['"`]([^'"`]+)['"`]/);
            const unexpectedMatch = errorMessage.match(/unexpected\s+(\w+)/i);
            const nearMatch = errorMessage.match(/near\s+['"`]?(\w+)['"`]?/i);
            
            const searchTokens: string[] = [];
            if (quotedMatch) searchTokens.push(quotedMatch[1]);
            if (unexpectedMatch) searchTokens.push(unexpectedMatch[1]);
            if (nearMatch) searchTokens.push(nearMatch[1]);
            
            // Also try to extract meaningful words from error message
            const errorWords = errorLower.match(/\b(select|from|where|join|insert|update|delete|create|alter|drop|table|view|index|syntax|error|unexpected|token)\b/g);
            if (errorWords) {
              searchTokens.push(...errorWords);
            }
            
            // Find the FIRST occurrence of any token across ALL lines
            let earliestMatch: { line: number; column: number } | null = null;
            
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i];
              const lineLower = line.toLowerCase();
              
              // Check each search token
              for (const token of searchTokens) {
                if (token && token.length > 1) {
                  const tokenLower = token.toLowerCase();
                  // Look for the token in the line
                  // Try exact word match first (with word boundaries)
                  const wordBoundaryRegex = new RegExp(`\\b${tokenLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
                  let tokenIndex = lineLower.search(wordBoundaryRegex);
                  
                  // If not found as whole word, try substring match
                  if (tokenIndex === -1) {
                    tokenIndex = lineLower.indexOf(tokenLower);
                  }
                  
                  if (tokenIndex !== -1) {
                    // Found a match - check if it's earlier than previous matches
                    if (!earliestMatch || i + 1 < earliestMatch.line || 
                        (i + 1 === earliestMatch.line && tokenIndex + 1 < earliestMatch.column)) {
                      earliestMatch = { line: i + 1, column: tokenIndex + 1 };
                    }
                  }
                }
              }
            }
            
            // Use the earliest match if found
            if (earliestMatch) {
              lineNumber = earliestMatch.line;
              column = earliestMatch.column;
            }
            
            // If still not found, look for lines that contain syntax errors
            // Check for common syntax error patterns like "SEL ECT" (space in keyword)
            if (lineNumber === 1 && column === 1) {
              let earliestMalformed: { line: number; column: number } | null = null;
              
              for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                
                // Check for malformed SQL keywords (space in the middle)
                const malformedKeywords = [
                  /sel\s+ect/i,  // SEL ECT
                  /fro\s+m/i,    // FRO M
                  /wher\s+e/i,   // WHER E
                  /orde\s+r/i,   // ORDE R
                  /grou\s+p/i,   // GROU P
                ];
                
                for (const pattern of malformedKeywords) {
                  if (pattern.test(line)) {
                    const match = line.match(pattern);
                    if (match && match.index !== undefined) {
                      // Found a malformed keyword - check if it's earlier than previous matches
                      if (!earliestMalformed || i + 1 < earliestMalformed.line ||
                          (i + 1 === earliestMalformed.line && match.index + 1 < earliestMalformed.column)) {
                        earliestMalformed = { line: i + 1, column: match.index + 1 };
                      }
                    }
                  }
                }
              }
              
              // Use the earliest malformed keyword match if found
              if (earliestMalformed) {
                lineNumber = earliestMalformed.line;
                column = earliestMalformed.column;
              }
            }
            
            // Last resort: if we still haven't found anything, default to line 1, column 1
            // (the error is likely at the start of the query)
            if (lineNumber === 1 && column === 1) {
              // Check if first line has content
              if (lines.length > 0 && lines[0].trim()) {
                lineNumber = 1;
                column = 1;
              }
            }
        }

        // If we detected an incomplete JOIN ON clause, use that error instead
        if (incompleteJoinError) {
          lineNumber = incompleteJoinError.line;
          column = incompleteJoinError.column;
          errorMessage = incompleteJoinError.message;
        }

        // Adjust line number if we're validating a selection
        let actualLineNumber = lineNumber;
        if (hasSelection && selection) {
          // Error line numbers are relative to the selected text, adjust to document line numbers
          actualLineNumber = selection.startLineNumber + lineNumber - 1;
        }

        // Ensure line number is within bounds
        const totalLines = model.getLineCount();
        if (actualLineNumber > totalLines) {
          actualLineNumber = totalLines;
        }
        if (actualLineNumber < 1) {
          actualLineNumber = 1;
        }

        // Get line length to ensure column is within bounds
        const lineLength = model.getLineLength(actualLineNumber);
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
            startLineNumber: actualLineNumber,
            startColumn: column,
            endLineNumber: actualLineNumber,
            endColumn: Math.min(column + 10, lineLength + 1),
            message: errorMessage,
          },
        ];

        (window as any).monaco.editor.setModelMarkers(model, 'sql', markers);
        
        // Add error indicator in glyph margin
        if (editorRef.current) {
          const decorations: any[] = [
            {
              range: new (window as any).monaco.Range(actualLineNumber, 1, actualLineNumber, 1),
              options: {
                glyphMarginClassName: 'error-glyph-margin',
                glyphMarginHoverMessage: { value: errorMessage },
                minimap: {
                  color: '#f48771',
                },
                overviewRuler: {
                  color: '#f48771',
                  position: (window as any).monaco?.editor?.OverviewRulerLane?.Right ?? 2,
                },
              },
            },
          ];
          
          // Update decorations (remove old ones, add new ones)
          errorDecorationsRef.current = editorRef.current.deltaDecorations(
            errorDecorationsRef.current,
            decorations
          );
        }
        
        // Update status bar - invalid SQL syntax (this takes precedence over table not found)
        setSqlValidationStatus({ isValid: false, errorMessage, errorLine: actualLineNumber });
        return;
      }

      if (currentRunId !== validationRunIdRef.current) {
        return;
      }

      // Extract statements from CST (program.statements) or use directly if it's already a statement
      const statements = parsedAst?.statements || (Array.isArray(parsedAst) ? parsedAst : [parsedAst]);
      // Filter for SELECT statements - CST uses 'select_stmt', AST uses 'select'
      const selectStatements = statements.filter((stmt: any) => {
        const stmtType = stmt?.type || stmt?.kind;
        return stmtType === 'select' || stmtType === 'select_stmt' || stmtType === 'SelectStatement';
      });

      let columnIssues: ColumnValidationIssue[] = [];

      if (selectStatements.length > 0) {
        const canFetchSchemas = Boolean(isConnected && window.electronAPI?.bigquery?.getTableSchema);
        for (const statement of selectStatements) {
          const issues = await validateColumnsForSelect(statement, textToValidate, canFetchSchemas);
          if (issues.length > 0) {
            columnIssues = columnIssues.concat(issues);
          }
          
          // Validate GROUP BY columns
          try {
            const { aliasMap, uniqueTables } = buildTableAliasMapFromSelectCST(statement);
            const groupByIssues = await validateGroupByColumns(
              statement,
              aliasMap,
              uniqueTables,
              getTableFields,
              textToValidate,
              canFetchSchemas
            );
            if (groupByIssues.length > 0) {
              columnIssues = columnIssues.concat(groupByIssues);
            }
          } catch (error) {
            // If GROUP BY validation fails, continue with other validations
            console.warn('GROUP BY validation error:', error);
          }
        }
      }

      if (currentRunId !== validationRunIdRef.current) {
        return;
      }

      if (columnIssues.length > 0) {
        const markers: any[] = [];
        const decorations: any[] = [];

        for (const issue of columnIssues) {
          let lineNumber = issue.line;
          let column = issue.column;

          if (hasSelection && selection) {
            lineNumber = selection.startLineNumber + lineNumber - 1;
          }

          lineNumber = Math.max(1, Math.min(lineNumber, model.getLineCount()));
          const lineLength = model.getLineLength(lineNumber);
          const startColumn = Math.max(1, Math.min(column, lineLength + 1));
          const endColumn = Math.max(startColumn, Math.min(column + issue.length, lineLength + 1));

          markers.push({
            severity: (window as any).monaco.MarkerSeverity.Error,
            startLineNumber: lineNumber,
            startColumn,
            endLineNumber: lineNumber,
            endColumn,
            message: issue.message,
          });

          decorations.push({
            range: new (window as any).monaco.Range(lineNumber, 1, lineNumber, 1),
            options: {
              glyphMarginClassName: 'error-glyph-margin',
              glyphMarginHoverMessage: { value: issue.message },
              minimap: {
                color: '#f48771',
              },
              overviewRuler: {
                color: '#f48771',
                position: (window as any).monaco?.editor?.OverviewRulerLane?.Right ?? 2,
              },
            },
          });
        }

        (window as any).monaco.editor.setModelMarkers(model, 'sql', markers);

        if (editorRef.current) {
          errorDecorationsRef.current = editorRef.current.deltaDecorations(
            errorDecorationsRef.current,
            decorations
          );
        }

        setSqlValidationStatus({
          isValid: false,
          errorMessage: columnIssues[0]?.message ?? 'Column validation failed',
          errorLine: columnIssues[0]?.line ?? null,
        });
        return;
      }

      // Update status bar - valid SQL syntax (no column issues)
      setSqlValidationStatus((prev) => {
        if (prev.errorMessage && prev.errorMessage.includes('Table not found')) {
          return prev;
        }
        return { isValid: true, errorMessage: null, errorLine: null };
      });
    };

    // Store validation function in ref so it can be called from selection change listener
    validateHandlerRef.current = () => {
      void validateSQL();
    };

    // Debounce validation to avoid excessive parsing
    const timeoutId = setTimeout(() => {
      void validateSQL();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [queryText, isConnected, validateColumnsForSelect]);

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
        // Update tab title in case name changed
        updateTab(activeTab.id, {
          title: saveName.trim(),
          isModified: false,
        });
        // Show success feedback
        setSaveSuccessMessage('Query updated successfully');
        setTimeout(() => setSaveSuccessMessage(null), 3000);
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
        // Show success feedback
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
    // Handles: backticked identifiers (with dots inside OR separate backticks for each part),
    // quoted identifiers, and regular identifiers
    // Pattern explanation:
    // - Matches FROM or any JOIN type
    // - Captures table reference which can be:
    //   - Backticked with dots inside: `project.dataset.table`
    //   - Backticked separately: `project`.`dataset`.`table`
    //   - Quoted: "project.dataset.table" or 'project.dataset.table'
    //   - Regular: project.dataset.table or dataset.table
    // - Handles AS aliases
    // The pattern now handles `part1`.`part2`.`part3` format used by BigQuery
    const fromJoinPattern = /(?:FROM|(?:LEFT|RIGHT|INNER|OUTER|FULL|CROSS)\s+JOIN|JOIN)\s+((?:`[^`]+`(?:\.`[^`]+`){0,2}|`[^`]+`|["'][^"']+["']|[\w\-]+(?:\.[\w\-]+){0,2}))(?:\s+AS\s+[\w\-]+)?/gi;
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

  // Convert SQL to dbt syntax by replacing table references with {{ source('DATASET', 'TABLE') }}
  const convertToDbtSyntax = (sql: string): string => {
    let result = sql;
    
    // Only match table references that come after FROM or JOIN keywords
    // This prevents matching column references like alias.column
    // Pattern matches: FROM/JOIN followed by table reference (with optional backticks)
    const fromJoinTablePattern = /(\b(?:FROM|JOIN)\s+)((?:`[^`]+`|[a-zA-Z0-9_-]+(?:\.[a-zA-Z0-9_-]+){1,2}))(\s|$|,|\))/gi;
    
    const matches = Array.from(result.matchAll(fromJoinTablePattern));
    
    // Process matches in reverse order to preserve positions when replacing
    const processedMatches: Array<{ start: number; end: number; replacement: string }> = [];
    
    for (const match of matches) {
      const prefix = match[1]; // FROM or JOIN with trailing space
      const tableRef = match[2]; // The table reference
      const suffix = match[3]; // Trailing whitespace or delimiter
      
      // Remove backticks if present
      const cleanRef = tableRef.replace(/`/g, '');
      
      // Split by dots
      const parts = cleanRef.split('.');
      
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
      } else {
        // Not a valid table reference (single part or more than 3 parts)
        continue;
      }
      
      // Skip if this looks like it's inside a string literal
      const beforeMatch = result.substring(0, match.index);
      const openSingleQuotes = (beforeMatch.match(/'/g) || []).length;
      const openDoubleQuotes = (beforeMatch.match(/"/g) || []).length;
      
      // If odd number of quotes, we're inside a string - skip
      if (openSingleQuotes % 2 !== 0 || openDoubleQuotes % 2 !== 0) {
        continue;
      }
      
      // Create dbt source syntax
      const dbtSource = `{{ source('${datasetId}', '${tableId}') }}`;
      
      // Replace just the table reference part, keeping the FROM/JOIN prefix and suffix
      processedMatches.push({
        start: match.index!,
        end: match.index! + match[0].length,
        replacement: `${prefix}${dbtSource}${suffix}`,
      });
    }
    
    // Apply replacements in reverse order to preserve positions
    processedMatches.sort((a, b) => b.start - a.start);
    
    for (const { start, end, replacement } of processedMatches) {
      result = result.substring(0, start) + replacement + result.substring(end);
    }
    
    return result;
  };

  // Check if the query contains dbt source/ref syntax
  const hasDbtSyntax = queryText.includes("{{ source('") || queryText.includes("{{ ref('");

  // Convert dbt source syntax back to BigQuery table references
  const convertFromDbtSyntax = (sql: string): string => {
    // Get project ID from connection
    const projectId = connection?.projectId || 'project';
    
    // Get all cached tables for ref() lookup
    const allTables = useBigQueryMetadataStore.getState().getAllTables();
    
    // Pattern to match {{ source('DATASET', 'TABLE') }}
    const dbtSourcePattern = /\{\{\s*source\s*\(\s*'([^']+)'\s*,\s*'([^']+)'\s*\)\s*\}\}/g;
    
    // Pattern to match {{ ref('TABLE') }} - search in cached tables to find the dataset
    const dbtRefPattern = /\{\{\s*ref\s*\(\s*'([^']+)'\s*\)\s*\}\}/g;
    
    let result = sql.replace(dbtSourcePattern, (_, datasetId, tableId) => {
      return `${projectId}.${datasetId}.${tableId}`;
    });
    
    result = result.replace(dbtRefPattern, (match, tableId) => {
      // Search for the table in cached metadata
      const tableIdLower = tableId.toLowerCase();
      const foundTable = allTables.find(
        (t) => t.table.id.toLowerCase() === tableIdLower
      );
      
      if (foundTable) {
        // Found the table - return full path with project, dataset, and table
        return `${projectId}.${foundTable.dataset}.${foundTable.table.id}`;
      }
      
      // Table not found in cache - keep original ref syntax as a warning
      // or return just the table name as fallback
      return tableId;
    });
    
    return result;
  };

  // Handle dbtify/de-dbtify button click
  const handleDbtify = () => {
    if (!activeTab || !queryText.trim()) {
      return;
    }
    
    if (hasDbtSyntax) {
      // De-dbtify: convert from dbt syntax to BigQuery
      const bigQuerySyntax = convertFromDbtSyntax(queryText);
      setTabQuery(activeTab.id, bigQuerySyntax);
    } else {
      // Dbtify: convert from BigQuery to dbt syntax
      if (sqlValidationStatus.isValid !== true) {
        return;
      }
      const dbtSyntax = convertToDbtSyntax(queryText);
      setTabQuery(activeTab.id, dbtSyntax);
    }
  };

  // Calculate expected query size from table/view metadata
  useEffect(() => {
    const calculateExpectedQuerySize = async () => {
      // Use selected text if available, otherwise use full query text
      const textToAnalyze = selectedText.trim() || queryText.trim();
      
      if (!textToAnalyze || !isConnected || !connection?.projectId || !window.electronAPI) {
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
        const tableRefs = extractTableReferences(textToAnalyze);
        
        if (tableRefs.length === 0) {
          setExpectedQuerySize(null);
          setIsLoadingQuerySize(false);
          return;
        }

        // Helper function to get size for a table or view
        // For views, recursively fetches the underlying table sizes
        // visitedViews tracks already processed views to prevent infinite loops
        const getTableOrViewSize = async (
          datasetId: string,
          tableId: string,
          visitedViews: Set<string>
        ): Promise<{ bytes: number; hasMetadata: boolean; error?: { message: string; tableRef: string } }> => {
          const tableKey = `${datasetId}.${tableId}`;
          
          // Prevent infinite recursion for views that reference each other
          if (visitedViews.has(tableKey)) {
            return { bytes: 0, hasMetadata: false };
          }
          
          try {
            const schemaResult = await window.electronAPI.bigquery.getTableSchema(datasetId, tableId);
            
            // If numBytes exists and is > 0, this is a regular table with data
            if (schemaResult.metadata?.numBytes !== undefined && schemaResult.metadata.numBytes > 0) {
              return { bytes: schemaResult.metadata.numBytes, hasMetadata: true };
            }
            
            // If numBytes is 0 or undefined, this might be a view
            // Try to get the view definition and extract underlying tables
            try {
              const viewResult = await window.electronAPI.bigquery.getViewDefinition(datasetId, tableId);
              if (viewResult.definition) {
                // Mark this view as visited before processing its definition
                visitedViews.add(tableKey);
                
                // Extract table references from the view definition
                const viewTableRefs = extractTableReferences(viewResult.definition);
                
                // If no table references found in view definition, return 0 bytes but mark as having metadata
                // so the user sees "0 bytes" rather than hiding the estimate
                if (viewTableRefs.length === 0) {
                  return { bytes: 0, hasMetadata: true };
                }
                
                let viewTotalBytes = 0;
                let viewHasMetadata = false;
                
                // Recursively get sizes for all tables referenced in the view
                for (const ref of viewTableRefs) {
                  const result = await getTableOrViewSize(ref.datasetId, ref.tableId, visitedViews);
                  if (result.error) {
                    // Propagate the first error encountered
                    return result;
                  }
                  if (result.hasMetadata) {
                    viewTotalBytes += result.bytes;
                    viewHasMetadata = true;
                  }
                }
                
                // If we successfully processed a view, always mark as having metadata
                // so the estimate is shown (even if 0 bytes)
                return { bytes: viewTotalBytes, hasMetadata: true };
              }
            } catch {
              // Not a view, or view definition couldn't be fetched
              // This is normal for empty tables, just return no bytes
            }
            
            // Regular table with no data, or couldn't determine view definition
            return { bytes: 0, hasMetadata: schemaResult.metadata?.numBytes !== undefined };
          } catch (err: any) {
            // Handle table not found errors - will be processed below
            throw err;
          }
        };

        // Fetch metadata for each table/view and sum up numBytes
        // This includes all tables from FROM and JOIN clauses
        let totalBytes = 0;
        let hasMetadata = false;
        let tableNotFoundError: { message: string; tableRef: string } | null = null;
        // Track visited views to prevent infinite loops when views reference each other
        const visitedViews = new Set<string>();

        for (const { datasetId, tableId } of tableRefs) {
          try {
            const result = await getTableOrViewSize(datasetId, tableId, visitedViews);
            if (result.error) {
              tableNotFoundError = result.error;
              break;
            }
            if (result.hasMetadata) {
              totalBytes += result.bytes;
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
                errorLine: null,
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
              return { isValid: true, errorMessage: null, errorLine: null };
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
  }, [queryText, selectedText, isConnected, connection?.projectId, sqlValidationStatus.isValid]);

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
        {connection?.enableDbtSupport && (
          <button
            onClick={handleDbtify}
            disabled={!activeTab || !queryText.trim() || (!hasDbtSyntax && sqlValidationStatus.isValid !== true)}
            className="dbtify-button"
            title={hasDbtSyntax ? "Convert dbt source/ref syntax back to BigQuery table references" : "Convert table references to dbt source syntax"}
          >
            {hasDbtSyntax ? 'de-dbtify' : 'dbtify'}
          </button>
        )}
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
                theme={theme === 'light' ? 'light' : 'vs-dark'}
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

                // Listen for selection changes to re-validate
                editor.onMouseDown(() => {
                  isMouseSelectingRef.current = true;
                  if (selectionValidationTimeoutRef.current !== null) {
                    window.clearTimeout(selectionValidationTimeoutRef.current);
                    selectionValidationTimeoutRef.current = null;
                  }
                });

                editor.onMouseUp(() => {
                  isMouseSelectingRef.current = false;
                  scheduleSelectionValidation(200);
                  // Update selected text state
                  const selection = editor.getSelection();
                  const model = editor.getModel();
                  if (selection && !selection.isEmpty() && model) {
                    setSelectedText(model.getValueInRange(selection));
                  } else {
                    setSelectedText('');
                  }
                });

                editor.onDidChangeCursorSelection(() => {
                  if (isMouseSelectingRef.current) {
                    return;
                  }
                  scheduleSelectionValidation();
                  // Update selected text state
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
                // Ensure tooltips can render above the editor
                fixedOverflowWidgets: true,
                // Enable glyph margin for error indicators
                glyphMargin: true,
              }}
              />
            </div>
            <div className="editor-status-bar">
              <div className="status-left">
                {saveSuccessMessage ? (
                  <span className="status-text status-valid">
                    <span className="status-indicator status-indicator-valid"></span>
                    {saveSuccessMessage}
                  </span>
                ) : completedQueryText !== null && queryText === completedQueryText ? (
                  <span className="status-text status-valid">
                    <span className="status-indicator status-indicator-valid"></span>
                    Query completed{completedQueryExecutionTime !== null ? ` in ${formatExecutionTime(completedQueryExecutionTime)}` : ''}
                  </span>
                ) : sqlValidationStatus.isValid === null ? (
                  <span className="status-text">✦ Type a query to get started</span>
                ) : sqlValidationStatus.isValid ? (
                  <span className="status-text status-valid">
                    <span className="status-indicator status-indicator-valid"></span>
                    SQL Syntax is valid
                  </span>
                ) : (
                  <span className="status-text status-invalid">
                    <span className="status-indicator status-indicator-invalid"></span>
                    {sqlValidationStatus.errorLine && (
                      <span className="status-error-line">Line {sqlValidationStatus.errorLine}: </span>
                    )}
                    <span className="status-error-message">{sqlValidationStatus.errorMessage || 'SQL syntax error'}</span>
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

