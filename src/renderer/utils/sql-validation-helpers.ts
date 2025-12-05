/**
 * SQL Validation Helper Functions
 *
 * Utilities for parsing and validating SQL queries, extracting column references,
 * building table alias maps, and working with CST (Concrete Syntax Tree) nodes.
 */

// ============================================================================
// Types
// ============================================================================

export interface SqlNodeLocation {
  start?: { line: number; column: number };
  end?: { line: number; column: number };
  begin?: { line: number; column: number };
  finish?: { line: number; column: number };
}

export interface ColumnRefInfo {
  alias: string | null;
  column: string;
  location?: SqlNodeLocation;
}

export interface TableAliasInfo {
  alias: string;
  datasetId?: string;
  tableId?: string;
  cteColumns?: string[];
}

export interface ColumnValidationIssue {
  message: string;
  line: number;
  column: number;
  length: number;
}

// ============================================================================
// String Utilities
// ============================================================================

/**
 * Remove backticks, single quotes, and double quotes from an identifier.
 */
export const stripIdentifierQuotes = (value: string | null | undefined): string => {
  if (!value) return '';
  return value.replace(/[`"']/g, '');
};

/**
 * Escape special regex characters in a string.
 */
export const escapeRegExp = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Convert a character index in text to line and column numbers.
 */
export const indexToLineColumn = (
  text: string,
  index: number
): { line: number; column: number } => {
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

// ============================================================================
// CST Node Helpers
// ============================================================================

/**
 * Get node type from CST (handles both 'type' and 'kind' properties).
 */
export const getCstNodeType = (node: any): string | undefined => {
  if (!node || typeof node !== 'object') return undefined;
  return node.type || node.kind;
};

/**
 * Check if node is a SELECT statement (CST or converted AST).
 */
export const isSelectStmt = (node: any): boolean => {
  const type = getCstNodeType(node);
  return type === 'select_stmt' || type === 'SelectStatement' || type === 'select';
};

/**
 * Check if node is a column reference.
 */
export const isColumnRef = (node: any): boolean => {
  const type = getCstNodeType(node);
  return type === 'column_ref' || type === 'ColumnRef';
};

/**
 * Check if node is a binary expression.
 */
export const isBinaryExpr = (node: any): boolean => {
  const type = getCstNodeType(node);
  return type === 'binary_expr' || type === 'BinaryExpr';
};

/**
 * Check if node is a function call.
 */
export const isFunctionCall = (node: any): boolean => {
  const type = getCstNodeType(node);
  return type === 'function' || type === 'FunctionCall' || type === 'aggr_func';
};

/**
 * Get FROM clause tables from CST statement.
 */
export const getCstFromTables = (stmt: any): any[] => {
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

/**
 * Get WITH clause CTEs from CST statement.
 */
export const getCstWithCtes = (stmt: any): any[] => {
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

// ============================================================================
// Location Helpers
// ============================================================================

/**
 * Get position information from a location object.
 */
export const getLocationPosition = (
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

/**
 * Find position of a column reference in text using regex search.
 */
export const findPositionInText = (
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

// ============================================================================
// Column Reference Collection
// ============================================================================

/**
 * Recursively collect column references from an expression node.
 */
export const collectColumnRefsFromExpression = (node: any, refs: ColumnRefInfo[]): void => {
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
  if (node.type === 'select') {
    return;
  }

  if (node.type === 'column_ref') {
    // Handle both string columns and object columns
    let columnName: string;
    if (typeof node.column === 'string') {
      columnName = stripIdentifierQuotes(node.column);
    } else if (node.column && typeof node.column === 'object') {
      // Handle nested column structure
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

    // Collect column refs for validation
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

/**
 * Collect all column references from a SELECT AST.
 */
export const collectColumnRefsForSelect = (
  selectAst: any,
  includeCteBodies = false
): ColumnRefInfo[] => {
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

// ============================================================================
// CTE Column Extraction
// ============================================================================

/**
 * Extract output column names from a CTE's SELECT clause.
 */
export const extractCteColumnNames = (cteAst: any): string[] => {
  const columns: string[] = [];

  if (!cteAst || !Array.isArray(cteAst.columns)) {
    return columns;
  }

  for (const col of cteAst.columns) {
    // Skip SELECT * - we can't determine column names without schema
    if (col === '*' || col?.expr?.type === 'star') {
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

    // Column reference
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
  }

  return columns;
};

// ============================================================================
// Table Alias Map Building
// ============================================================================

/**
 * Build a map of table aliases and unique tables from a SELECT AST.
 */
export const buildTableAliasMapFromSelect = (
  selectAst: any
): {
  aliasMap: Map<string, TableAliasInfo>;
  uniqueTables: Map<string, { datasetId?: string; tableId?: string }>;
} => {
  const aliasMap = new Map<string, TableAliasInfo>();
  const uniqueTables = new Map<string, { datasetId?: string; tableId?: string }>();

  const registerAlias = (
    aliasName: string | null | undefined,
    info: { datasetId?: string; tableId?: string; cteColumns?: string[] }
  ) => {
    const cleanAlias = stripIdentifierQuotes(aliasName);
    if (!cleanAlias) return;
    const key = cleanAlias.toLowerCase();
    const existing = aliasMap.get(key);
    if (!existing || (!existing.datasetId && info.datasetId) || (!existing.tableId && info.tableId)) {
      aliasMap.set(key, {
        alias: cleanAlias,
        datasetId: info.datasetId,
        tableId: info.tableId,
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

    if (typeof item.catalog === 'string') {
      // Project ID from catalog (not used in alias registration)
      stripIdentifierQuotes(item.catalog);
    }

    if (typeof item.db === 'string') {
      const dbValue = stripIdentifierQuotes(item.db);
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
  if (Array.isArray(selectAst?.with)) {
    for (const cte of selectAst.with) {
      const cteName = cte?.name?.value || cte?.name;
      if (cteName) {
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

// ============================================================================
// SELECT Statement Counter
// ============================================================================

/**
 * Count SELECT statements in SQL text (ignoring comments and strings).
 * Only counts top-level SELECT statements, not subqueries.
 */
export const countSelectStatements = (sql: string): number => {
  // Remove comments first
  let cleanedSql = sql;

  // Remove single-line comments (--)
  cleanedSql = cleanedSql.replace(/--.*$/gm, '');

  // Remove multi-line comments
  cleanedSql = cleanedSql.replace(/\/\*[\s\S]*?\*\//g, '');

  // Remove string literals
  cleanedSql = cleanedSql.replace(/'([^'\\]|\\.)*'/g, "''");
  cleanedSql = cleanedSql.replace(/"([^"\\]|\\.)*"/g, '""');
  cleanedSql = cleanedSql.replace(/`([^`\\]|\\.)*`/g, '``');

  // Track parenthesis depth
  let depth = 0;
  let topLevelCount = 0;
  let i = 0;
  let inWithClause = false;

  // Normalize whitespace
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
      i++;
      continue;
    }

    if (depth === 0) {
      const remainingUpper = cleanedSql.substring(i).toUpperCase();

      if (remainingUpper.match(/^WITH\b/)) {
        inWithClause = true;
        i += 4;
        continue;
      }

      if (remainingUpper.match(/^SELECT\b/)) {
        if (inWithClause) {
          topLevelCount++;
          inWithClause = false;
        } else {
          topLevelCount++;
        }
        i += 6;
        continue;
      }

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
