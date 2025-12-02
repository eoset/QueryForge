/**
 * SQL Validation Utilities
 * 
 * This module contains utility functions for validating SQL queries,
 * including column reference validation, subquery scope handling,
 * and BigQuery syntax rule enforcement.
 * 
 * Based on BigQuery GoogleSQL query syntax rules:
 * - Query execution order: FROM -> WHERE -> GROUP BY -> HAVING -> WINDOW -> QUALIFY -> SELECT -> DISTINCT -> ORDER BY -> LIMIT/OFFSET
 * - Aggregate functions cannot be used in WHERE (use HAVING)
 * - Window functions cannot be used in WHERE or HAVING (use QUALIFY)
 * - Non-aggregated columns in SELECT must appear in GROUP BY
 * - OFFSET can only be used with LIMIT
 */

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
  severity?: 'error' | 'warning' | 'info';
  rule?: string;
}

/**
 * BigQuery aggregate functions that cannot be used in WHERE clause
 * Based on BigQuery GoogleSQL syntax documentation
 */
export const BIGQUERY_AGGREGATE_FUNCTIONS = new Set([
  'count', 'sum', 'avg', 'min', 'max',
  'array_agg', 'array_concat_agg',
  'bit_and', 'bit_or', 'bit_xor',
  'countif',
  'logical_and', 'logical_or',
  'string_agg',
  'stddev', 'stddev_pop', 'stddev_samp',
  'variance', 'var_pop', 'var_samp',
  'corr', 'covar_pop', 'covar_samp',
  'approx_count_distinct', 'approx_quantiles', 'approx_top_count', 'approx_top_sum',
  'hll_count.init', 'hll_count.merge', 'hll_count.merge_partial', 'hll_count.extract',
  'any_value',
  'grouping',
]);

/**
 * BigQuery window/analytic functions that can only be used in SELECT, ORDER BY, or with QUALIFY
 * Based on BigQuery GoogleSQL syntax documentation
 */
export const BIGQUERY_WINDOW_FUNCTIONS = new Set([
  'row_number', 'rank', 'dense_rank', 'percent_rank', 'cume_dist', 'ntile',
  'lag', 'lead', 'first_value', 'last_value', 'nth_value',
  'percentile_cont', 'percentile_disc',
]);

/**
 * Checks if an expression contains an aggregate function call
 */
export const containsAggregateFunction = (node: any): { found: boolean; functionName?: string; location?: SqlNodeLocation } => {
  if (!node) return { found: false };

  if (Array.isArray(node)) {
    for (const child of node) {
      const result = containsAggregateFunction(child);
      if (result.found) return result;
    }
    return { found: false };
  }

  if (typeof node !== 'object') return { found: false };

  // Skip subqueries - aggregate functions in subqueries are valid
  if (node.type === 'select') {
    return { found: false };
  }

  // Check for aggregate function
  if (node.type === 'aggr_func' || node.type === 'function') {
    let funcName = '';
    if (typeof node.name === 'string') {
      funcName = node.name.toLowerCase();
    } else if (node.name && typeof node.name === 'object') {
      // Handle different AST structures for function names
      if (typeof node.name.name === 'string') {
        funcName = node.name.name.toLowerCase();
      } else if (node.name.name && typeof node.name.name.value === 'string') {
        funcName = node.name.name.value.toLowerCase();
      } else if (typeof node.name.value === 'string') {
        funcName = node.name.value.toLowerCase();
      }
    }
    
    if (funcName && BIGQUERY_AGGREGATE_FUNCTIONS.has(funcName)) {
      return { 
        found: true, 
        functionName: funcName.toUpperCase(),
        location: node.location || node.loc 
      };
    }
  }

  // Recursively check child properties
  for (const key of Object.keys(node)) {
    if (key === 'location' || key === 'loc') continue;
    const result = containsAggregateFunction(node[key]);
    if (result.found) return result;
  }

  return { found: false };
};

/**
 * Checks if an expression contains a window function call (function with OVER clause)
 */
export const containsWindowFunction = (node: any): { found: boolean; functionName?: string; location?: SqlNodeLocation } => {
  if (!node) return { found: false };

  if (Array.isArray(node)) {
    for (const child of node) {
      const result = containsWindowFunction(child);
      if (result.found) return result;
    }
    return { found: false };
  }

  if (typeof node !== 'object') return { found: false };

  // Skip subqueries - window functions in subqueries are valid
  if (node.type === 'select') {
    return { found: false };
  }

  // Helper function to extract function name from various AST structures
  const extractFuncName = (nameNode: any): string => {
    if (typeof nameNode === 'string') {
      return nameNode.toLowerCase();
    }
    if (nameNode && typeof nameNode === 'object') {
      if (typeof nameNode.name === 'string') {
        return nameNode.name.toLowerCase();
      } else if (nameNode.name && typeof nameNode.name.value === 'string') {
        return nameNode.name.value.toLowerCase();
      } else if (typeof nameNode.value === 'string') {
        return nameNode.value.toLowerCase();
      }
    }
    return '';
  };

  // Check for window function (any function with OVER clause)
  if (node.over || node.window) {
    const funcName = extractFuncName(node.name) || 'window function';
    
    return { 
      found: true, 
      functionName: funcName.toUpperCase(),
      location: node.location || node.loc 
    };
  }

  // Also check for known window-only functions
  if (node.type === 'function' || node.type === 'aggr_func') {
    const funcName = extractFuncName(node.name);
    
    if (BIGQUERY_WINDOW_FUNCTIONS.has(funcName) && (node.over || node.window)) {
      return { 
        found: true, 
        functionName: funcName.toUpperCase(),
        location: node.location || node.loc 
      };
    }
  }

  // Recursively check child properties
  for (const key of Object.keys(node)) {
    if (key === 'location' || key === 'loc') continue;
    const result = containsWindowFunction(node[key]);
    if (result.found) return result;
  }

  return { found: false };
};

/**
 * Validates BigQuery syntax rules for a SELECT statement.
 * Returns an array of validation issues based on GoogleSQL rules.
 */
export const validateBigQuerySyntaxRules = (selectAst: any): ColumnValidationIssue[] => {
  const issues: ColumnValidationIssue[] = [];

  if (!selectAst || typeof selectAst !== 'object') {
    return issues;
  }

  // Rule 1: Aggregate functions cannot be used in WHERE clause (use HAVING instead)
  if (selectAst.where) {
    const aggregateCheck = containsAggregateFunction(selectAst.where);
    if (aggregateCheck.found) {
      issues.push({
        message: `Aggregate function ${aggregateCheck.functionName || 'unknown'} cannot be used in WHERE clause. Use HAVING to filter aggregated results.`,
        line: aggregateCheck.location?.start?.line || 1,
        column: aggregateCheck.location?.start?.column || 1,
        length: aggregateCheck.functionName?.length || 10,
        severity: 'error',
        rule: 'aggregate-in-where',
      });
    }
  }

  // Rule 2: Window functions cannot be used in WHERE clause (use QUALIFY instead)
  if (selectAst.where) {
    const windowCheck = containsWindowFunction(selectAst.where);
    if (windowCheck.found) {
      issues.push({
        message: `Window function ${windowCheck.functionName || 'unknown'} cannot be used in WHERE clause. Use QUALIFY to filter window function results.`,
        line: windowCheck.location?.start?.line || 1,
        column: windowCheck.location?.start?.column || 1,
        length: windowCheck.functionName?.length || 10,
        severity: 'error',
        rule: 'window-in-where',
      });
    }
  }

  // Rule 3: Window functions cannot be used in HAVING clause (use QUALIFY instead)
  if (selectAst.having) {
    const windowCheck = containsWindowFunction(selectAst.having);
    if (windowCheck.found) {
      issues.push({
        message: `Window function ${windowCheck.functionName || 'unknown'} cannot be used in HAVING clause. Use QUALIFY to filter window function results.`,
        line: windowCheck.location?.start?.line || 1,
        column: windowCheck.location?.start?.column || 1,
        length: windowCheck.functionName?.length || 10,
        severity: 'error',
        rule: 'window-in-having',
      });
    }
  }

  // Rule 4: OFFSET can only be used with LIMIT
  // Check if we have an OFFSET without LIMIT
  if (selectAst.limit) {
    // node-sql-parser represents LIMIT/OFFSET differently depending on the database
    // In BigQuery mode, check for offset without limit value
    const hasLimit = selectAst.limit.value !== undefined && selectAst.limit.value !== null;
    const hasOffset = selectAst.limit.offset !== undefined && selectAst.limit.offset !== null;
    
    if (hasOffset && !hasLimit) {
      issues.push({
        message: 'OFFSET can only be used with LIMIT clause.',
        line: 1,
        column: 1,
        length: 6,
        severity: 'error',
        rule: 'offset-without-limit',
      });
    }
  }

  // Rule 5: When GROUP BY is used, non-aggregated SELECT columns should be in GROUP BY
  // This is a warning since BigQuery may infer some cases
  if (selectAst.groupby && Array.isArray(selectAst.columns)) {
    const groupByColumns = new Set<string>();
    
    // Extract GROUP BY column names
    const extractGroupByColumns = (groupExpr: any) => {
      if (!groupExpr) return;
      if (Array.isArray(groupExpr)) {
        groupExpr.forEach(extractGroupByColumns);
        return;
      }
      if (groupExpr.value && Array.isArray(groupExpr.value)) {
        groupExpr.value.forEach(extractGroupByColumns);
        return;
      }
      
      // Handle column reference
      if (groupExpr.type === 'column_ref') {
        const colName = typeof groupExpr.column === 'string' 
          ? groupExpr.column 
          : groupExpr.column?.expr?.value || groupExpr.column?.column || '';
        if (colName) {
          groupByColumns.add(stripIdentifierQuotes(colName).toLowerCase());
        }
      }
      // Handle positional reference (1, 2, 3)
      else if (groupExpr.type === 'number' && typeof groupExpr.value === 'number') {
        // Positional references are valid, add a placeholder
        groupByColumns.add(`__positional_${groupExpr.value}__`);
      }
    };
    
    extractGroupByColumns(selectAst.groupby);
    
    // Check SELECT columns that are not aggregated
    for (let i = 0; i < selectAst.columns.length; i++) {
      const col = selectAst.columns[i];
      const expr = col?.expr ?? col;
      
      // Skip if it's an aggregate function or has OVER clause (window function)
      if (expr?.type === 'aggr_func' || expr?.over || expr?.window) {
        continue;
      }
      
      // Skip SELECT * 
      if (expr?.type === 'star' || col === '*') {
        continue;
      }
      
      // Check if column has an aggregate function anywhere in its expression
      const hasAggregate = containsAggregateFunction(expr);
      if (hasAggregate.found) {
        continue;
      }
      
      // Check for simple column reference
      if (expr?.type === 'column_ref') {
        const colName = typeof expr.column === 'string'
          ? expr.column
          : expr.column?.expr?.value || expr.column?.column || '';
        const cleanColName = stripIdentifierQuotes(colName).toLowerCase();
        
        // Check if this column is in GROUP BY or if there's a positional reference for this position
        const isInGroupBy = groupByColumns.has(cleanColName) || 
                           groupByColumns.has(`__positional_${i + 1}__`);
        
        if (!isInGroupBy && cleanColName) {
          issues.push({
            message: `Column "${colName}" must appear in GROUP BY clause or be used in an aggregate function.`,
            line: expr.location?.start?.line || 1,
            column: expr.location?.start?.column || 1,
            length: colName.length || 10,
            severity: 'warning',
            rule: 'missing-group-by',
          });
        }
      }
    }
  }

  // Recursively validate CTEs
  if (Array.isArray(selectAst.with)) {
    for (const cte of selectAst.with) {
      const cteAst = cte?.stmt?.ast;
      if (cteAst) {
        const cteIssues = validateBigQuerySyntaxRules(cteAst);
        issues.push(...cteIssues);
      }
    }
  }

  return issues;
};

export const stripIdentifierQuotes = (value: string | null | undefined): string => {
  if (!value) return '';
  return value.replace(/[`"']/g, '');
};

/**
 * Collects column references from an AST expression node.
 * Skips subqueries as they have their own scope.
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

/**
 * Collects all column references from a SELECT statement AST.
 */
export const collectColumnRefsForSelect = (selectAst: any, includeCteBodies = false): ColumnRefInfo[] => {
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
export const extractCteColumnNames = (cteAst: any): string[] => {
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
    // Function call without alias - use function name (common in BigQuery)
    else if (expr?.type === 'function' || expr?.type === 'aggr_func') {
      // Function calls without alias are hard to reference, skip them
      // BigQuery would use the function expression as the column name
    }
  }
  
  return columns;
};

/**
 * Builds a map of table aliases and unique tables from a SELECT statement AST.
 */
export const buildTableAliasMapFromSelect = (
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
      // node-sql-parser uses db for project in BigQuery dialects
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

/**
 * Collects all subqueries from an AST node.
 */
export const collectSubqueries = (node: any, subqueries: any[]): void => {
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

/**
 * Validates column references in a SELECT statement, including subqueries.
 * Returns an array of validation issues found.
 * 
 * @param selectAst - The parsed SELECT statement AST
 * @param getTableFields - Function to fetch table field names (for schema validation)
 * @param textToValidate - The original SQL text (for error position finding)
 * @param canFetchSchemas - Whether schema fetching is available
 */
export const validateColumnReferences = async (
  selectAst: any,
  getTableFields: (datasetId: string, tableId: string) => Promise<string[] | null>,
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
      const location = { line: 1, column: 1, length: Math.max(1, columnRef.column.length) };

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
      // We can't validate columns against CTEs since we don't know their output schema.
      // Skip validation for these cases.
      if (aliasInfo && (!aliasInfo.datasetId || !aliasInfo.tableId)) {
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
        // Check if any table in scope is a CTE/subquery (no schema).
        // If so, we can't reliably validate unqualified columns since they might come from the CTE.
        const hasCteOrSubquery = Array.from(scopeAliasMap.values()).some(
          info => !info.datasetId || !info.tableId
        );
        
        if (hasCteOrSubquery) {
          // Skip validation for unqualified columns when CTEs/subqueries are present
          // since we can't determine which table the column belongs to
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

        if (!columnFound && uniqueTableList.length > 0) {
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
};
