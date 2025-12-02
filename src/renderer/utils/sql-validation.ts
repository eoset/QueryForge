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
 * 
 * This module works directly with CST (Concrete Syntax Tree) from sql-parser-cst,
 * providing better BigQuery syntax handling and more accurate parsing.
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
 * Helper functions for working with CST (Concrete Syntax Tree) nodes
 */

// Get node type from CST (handles both 'type' and 'kind' properties)
const getNodeType = (node: any): string | undefined => {
  if (!node || typeof node !== 'object') return undefined;
  return node.type || node.kind;
};

// Check if node is a SELECT statement (CST or converted AST)
const isSelectStmt = (node: any): boolean => {
  const type = getNodeType(node);
  return type === 'select_stmt' || type === 'SelectStatement' || type === 'select';
};

// Check if node is a column reference
const isColumnRef = (node: any): boolean => {
  const type = getNodeType(node);
  return type === 'column_ref' || type === 'ColumnRef';
};

// Check if node is a binary expression
const isBinaryExpr = (node: any): boolean => {
  const type = getNodeType(node);
  return type === 'binary_expr' || type === 'BinaryExpr';
};

// Check if node is a function call
const isFunctionCall = (node: any): boolean => {
  if (!node) return false;
  const type = getNodeType(node);
  return type === 'function' || 
         type === 'FunctionCall' || 
         type === 'function_call' ||
         type === 'func_call' ||
         type === 'aggr_func' ||
         type === 'call_expr' ||
         (type === 'identifier' && node.args !== undefined); // CST: function calls might be identifier with args
};

// Check if node is a literal value (NULL, number, string, boolean)
// Literals don't need to be in GROUP BY as they're constants
const isLiteral = (node: any): boolean => {
  if (!node || typeof node !== 'object') return false;
  
  const type = getNodeType(node);
  
  // NULL literal
  if (type === 'null' || type === 'NullLiteral' || type === 'NULL') {
    return true;
  }
  
  // Number literal
  if (type === 'number' || type === 'NumberLiteral' || type === 'int' || type === 'integer' || 
      type === 'float' || type === 'FloatLiteral' || type === 'bigint') {
    return true;
  }
  
  // String literal
  if (type === 'string' || type === 'StringLiteral' || type === 'single_quote_string' || 
      type === 'double_quote_string' || type === 'backtick_string') {
    return true;
  }
  
  // Boolean literal
  if (type === 'bool' || type === 'BooleanLiteral' || type === 'boolean') {
    return true;
  }
  
  // Check for literal values in CST structure
  if (node.value !== undefined) {
    const valueType = typeof node.value;
    if (valueType === 'string' || valueType === 'number' || valueType === 'boolean' || node.value === null) {
      return true;
    }
  }
  
  // Check for NULL keyword
  if (node.keyword === 'NULL' || node.text === 'NULL' || node.name === 'NULL') {
    return true;
  }
  
  return false;
};

// Check if node is a CASE expression
// CASE expressions don't need to be in GROUP BY as they're complex expressions evaluated per row
const isCaseExpression = (node: any): boolean => {
  if (!node || typeof node !== 'object') return false;
  
  const type = getNodeType(node);
  
  // CASE expression types in CST
  if (type === 'case_expr' || type === 'CaseExpr' || type === 'case' || type === 'Case' || 
      type === 'case_expression' || type === 'CaseExpression') {
    return true;
  }
  
  // Check for CASE keyword in CST structure
  if (node.keyword === 'CASE' || node.keyword?.text === 'CASE' || 
      node.keyword?.name === 'CASE' || node.type === 'case') {
    return true;
  }
  
  // Check if it has CASE-like structure (when/then/else clauses)
  // CST structure: case_expr has branches (array of when/then pairs) and else
  if (node.branches || node.when || node.cases || node.then || node.else || node.elseExpr) {
    return true;
  }
  
  // Check for when_branch structure (CST)
  if (Array.isArray(node.branches) && node.branches.length > 0) {
    const firstBranch = node.branches[0];
    if (firstBranch && (firstBranch.when || firstBranch.condition || firstBranch.then || firstBranch.result)) {
      return true;
    }
  }
  
  return false;
};

// Extract location from CST node (uses 'range' property)
const getLocationFromCst = (node: any): SqlNodeLocation | undefined => {
  if (!node) return undefined;
  
  // CST uses 'range' property
  if (node.range) {
    return {
      start: node.range.start ? { line: node.range.start.line, column: node.range.start.column } : undefined,
      end: node.range.end ? { line: node.range.end.line, column: node.range.end.column } : undefined,
    };
  }
  
  // Fallback to AST-style location
  if (node.location) {
    return node.location;
  }
  
  if (node.loc) {
    return {
      start: node.loc.start,
      end: node.loc.end,
    };
  }
  
  return undefined;
};

// Extract function name from CST node
const extractFunctionName = (node: any): string => {
  if (!node) return '';
  
  const nodeType = getNodeType(node);
  
  // CST: func_call has name.identifier.name or name.identifier.text
  if (nodeType === 'func_call' || nodeType === 'call_expr' || nodeType === 'CallExpr') {
    if (node.name) {
      // name is an identifier object
      if (node.name.name) {
        return typeof node.name.name === 'string' ? node.name.name.toLowerCase() : '';
      }
      if (node.name.text) {
        return node.name.text.toLowerCase();
      }
      if (typeof node.name === 'string') {
        return node.name.toLowerCase();
      }
    }
  }
  
  // CST: function_call or identifier with args
  if (nodeType === 'function_call' || nodeType === 'FunctionCall' || 
      (nodeType === 'identifier' && node.args !== undefined)) {
    if (typeof node.name === 'string') {
      return node.name.toLowerCase();
    }
    if (node.name?.name) {
      return typeof node.name.name === 'string' ? node.name.name.toLowerCase() : '';
    }
    if (node.text) {
      return node.text.toLowerCase();
    }
  }
  
  // Handle string name
  if (typeof node.name === 'string') {
    return node.name.toLowerCase();
  }
  
  // Handle CST structure: name might be an object with 'name' property
  if (node.name && typeof node.name === 'object') {
    // CST: name.name or name.value or name.text
    if (typeof node.name.name === 'string') {
      return node.name.name.toLowerCase();
    }
    if (typeof node.name.value === 'string') {
      return node.name.value.toLowerCase();
    }
    if (node.name.text) {
      return node.name.text.toLowerCase();
    }
    // Nested structure
    if (node.name.name && typeof node.name.name.value === 'string') {
      return node.name.name.value.toLowerCase();
    }
  }
  
  return '';
};

// Get columns from SELECT statement (CST structure)
const getSelectColumns = (stmt: any): any[] => {
  if (!stmt) return [];
  
  // CST structure: clauses array with select_clause
  if (stmt.clauses && Array.isArray(stmt.clauses)) {
    const selectClause = stmt.clauses.find((c: any) => c.type === 'select_clause');
    if (selectClause) {
      // Columns are in selectClause.columns.items (list_expr)
      if (selectClause.columns?.items) {
        return selectClause.columns.items;
      }
      if (Array.isArray(selectClause.columns)) {
        return selectClause.columns;
      }
      if (selectClause.columns) {
        return [selectClause.columns];
      }
    }
  }
  
  // Fallback: direct properties (AST or older CST)
  const selectClause = stmt.selectClause || stmt.select;
  if (selectClause) {
    if (selectClause.columns?.items) {
      return selectClause.columns.items;
    }
    if (Array.isArray(selectClause.columns)) {
      return selectClause.columns;
    }
    if (selectClause.columns) {
      return [selectClause.columns];
    }
  }
  
  // Fallback to AST structure
  if (Array.isArray(stmt.columns)) {
    return stmt.columns;
  }
  
  return [];
};

// Extract tables from join_expr recursively (CST structure)
const extractTablesFromJoinExpr = (joinExpr: any, tables: any[]): void => {
  if (!joinExpr) return;
  
  const exprType = getNodeType(joinExpr);
  
  // Handle join_expr: has left, right, and specification
  if (exprType === 'join_expr' || exprType === 'JoinExpr') {
    // Add left side
    if (joinExpr.left) {
      extractTablesFromJoinExpr(joinExpr.left, tables);
    }
    // Add right side
    if (joinExpr.right) {
      extractTablesFromJoinExpr(joinExpr.right, tables);
    }
    return;
  }
  
  // Handle alias (table with alias)
  if (exprType === 'alias' || exprType === 'Alias') {
    tables.push(joinExpr);
    return;
  }
  
  // Handle simple identifier (table name)
  if (exprType === 'identifier' || exprType === 'Identifier') {
    tables.push(joinExpr);
    return;
  }
  
  // Fallback: add as-is
  tables.push(joinExpr);
};

// Get FROM clause tables (CST structure)
const getFromTables = (stmt: any): any[] => {
  if (!stmt) return [];
  
  const tables: any[] = [];
  
  // CST structure: clauses array with from_clause
  if (stmt.clauses && Array.isArray(stmt.clauses)) {
    const fromClause = stmt.clauses.find((c: any) => c.type === 'from_clause');
    if (fromClause) {
      // FROM clause has expr (single table or join_expr) or tables (array)
      if (fromClause.tables) {
        return Array.isArray(fromClause.tables) ? fromClause.tables : [fromClause.tables];
      }
      if (fromClause.expr) {
        extractTablesFromJoinExpr(fromClause.expr, tables);
        if (tables.length > 0) {
          return tables;
        }
        return [fromClause];
      }
      return [fromClause];
    }
  }
  
  // Fallback: direct properties (AST or older CST)
  const fromClause = stmt.fromClause || stmt.from;
  if (fromClause) {
    if (fromClause.tables) {
      return Array.isArray(fromClause.tables) ? fromClause.tables : [fromClause.tables];
    }
    if (Array.isArray(fromClause)) {
      return fromClause;
    }
    if (fromClause.expr) {
      extractTablesFromJoinExpr(fromClause.expr, tables);
      if (tables.length > 0) {
        return tables;
      }
      return [fromClause];
    }
    return [fromClause];
  }
  
  // Fallback to AST structure
  if (Array.isArray(stmt.from)) {
    return stmt.from;
  }
  
  return [];
};

// Get WHERE clause condition (CST structure)
const getWhereCondition = (stmt: any): any => {
  if (!stmt) return undefined;
  
  // CST structure: clauses array with where_clause
  if (stmt.clauses && Array.isArray(stmt.clauses)) {
    const whereClause = stmt.clauses.find((c: any) => c.type === 'where_clause');
    if (whereClause) {
      return whereClause.condition || whereClause.expr || whereClause;
    }
  }
  
  // Fallback: direct properties (AST or older CST)
  const whereClause = stmt.whereClause || stmt.where;
  if (whereClause) {
    return whereClause.condition || whereClause.expr || whereClause;
  }
  
  return stmt.where;
};

// Get HAVING clause condition (CST structure)
const getHavingCondition = (stmt: any): any => {
  if (!stmt) return undefined;
  
  // CST structure: clauses array with having_clause
  if (stmt.clauses && Array.isArray(stmt.clauses)) {
    const havingClause = stmt.clauses.find((c: any) => c.type === 'having_clause');
    if (havingClause) {
      return havingClause.condition || havingClause.expr || havingClause;
    }
  }
  
  // Fallback: direct properties (AST or older CST)
  const havingClause = stmt.havingClause || stmt.having;
  if (havingClause) {
    return havingClause.condition || havingClause.expr || havingClause;
  }
  
  return stmt.having;
};

// Get GROUP BY expressions (CST structure)
const getGroupByExpressions = (stmt: any): any[] => {
  if (!stmt) return [];
  
  // CST structure: clauses array with group_by_clause
  if (stmt.clauses && Array.isArray(stmt.clauses)) {
    const groupByClause = stmt.clauses.find((c: any) => c.type === 'group_by_clause');
    if (groupByClause) {
      if (groupByClause.expressions?.items) {
        return groupByClause.expressions.items;
      }
      if (groupByClause.expressions) {
        return Array.isArray(groupByClause.expressions) ? groupByClause.expressions : [groupByClause.expressions];
      }
      if (Array.isArray(groupByClause)) {
        return groupByClause;
      }
    }
  }
  
  // Fallback: direct properties (AST or older CST)
  const groupByClause = stmt.groupByClause || stmt.groupBy;
  if (groupByClause) {
    if (groupByClause.expressions?.items) {
      return groupByClause.expressions.items;
    }
    if (groupByClause.expressions) {
      return Array.isArray(groupByClause.expressions) ? groupByClause.expressions : [groupByClause.expressions];
    }
    if (Array.isArray(groupByClause)) {
      return groupByClause;
    }
  }
  
  // Fallback to AST structure
  if (Array.isArray(stmt.groupby)) {
    return stmt.groupby;
  }
  if (stmt.groupby?.value && Array.isArray(stmt.groupby.value)) {
    return stmt.groupby.value;
  }
  
  return [];
};

// Get ORDER BY items (CST structure)
const getOrderByItems = (stmt: any): any[] => {
  if (!stmt) return [];
  
  // CST structure: clauses array with order_by_clause
  if (stmt.clauses && Array.isArray(stmt.clauses)) {
    const orderByClause = stmt.clauses.find((c: any) => c.type === 'order_by_clause');
    if (orderByClause) {
      if (orderByClause.items) {
        return Array.isArray(orderByClause.items) ? orderByClause.items : [orderByClause.items];
      }
      if (Array.isArray(orderByClause)) {
        return orderByClause;
      }
    }
  }
  
  // Fallback: direct properties (AST or older CST)
  const orderByClause = stmt.orderByClause || stmt.orderBy;
  if (orderByClause) {
    if (orderByClause.items) {
      return Array.isArray(orderByClause.items) ? orderByClause.items : [orderByClause.items];
    }
    if (Array.isArray(orderByClause)) {
      return orderByClause;
    }
  }
  
  // Fallback to AST structure
  if (Array.isArray(stmt.orderby)) {
    return stmt.orderby;
  }
  
  return [];
};

// Get WITH clause CTEs (CST structure)
const getWithCtes = (stmt: any): any[] => {
  if (!stmt) return [];
  
  // CST structure: clauses array with with_clause
  if (stmt.clauses && Array.isArray(stmt.clauses)) {
    const withClause = stmt.clauses.find((c: any) => c.type === 'with_clause');
    if (withClause) {
      // CST: with_clause has tables property (list_expr) with items containing common_table_expression nodes
      if (withClause.tables?.items) {
        return withClause.tables.items;
      }
      // Or tables might be directly an array
      if (withClause.tables) {
        return Array.isArray(withClause.tables) ? withClause.tables : [withClause.tables];
      }
      // Fallback: ctes property (older CST or AST)
      if (withClause.ctes?.items) {
        return withClause.ctes.items;
      }
      if (withClause.ctes) {
        return Array.isArray(withClause.ctes) ? withClause.ctes : [withClause.ctes];
      }
    }
  }
  
  // Fallback: direct properties (AST or older CST)
  const withClause = stmt.withClause || stmt.with;
  if (withClause) {
    if (withClause.tables?.items) {
      return withClause.tables.items;
    }
    if (withClause.tables) {
      return Array.isArray(withClause.tables) ? withClause.tables : [withClause.tables];
    }
    if (withClause.ctes?.items) {
      return withClause.ctes.items;
    }
    if (withClause.ctes) {
      return Array.isArray(withClause.ctes) ? withClause.ctes : [withClause.ctes];
    }
    if (Array.isArray(withClause)) {
      return withClause;
    }
  }
  
  // Fallback to AST structure
  if (Array.isArray(stmt.with)) {
    return stmt.with;
  }
  
  return [];
};

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
  if (isSelectStmt(node)) {
    return { found: false };
  }

  // Check for aggregate function (CST or AST)
  // CST uses func_call, AST uses function/aggr_func
  const nodeType = getNodeType(node);
  const isFunc = isFunctionCall(node) || nodeType === 'func_call';
  
  if (isFunc) {
    const funcName = extractFunctionName(node);
    
    // Check if it's an aggregate function
    if (funcName && BIGQUERY_AGGREGATE_FUNCTIONS.has(funcName)) {
      return { 
        found: true, 
        functionName: funcName.toUpperCase(),
        location: getLocationFromCst(node)
      };
    }
  }

  // Recursively check child properties
  for (const key of Object.keys(node)) {
    if (key === 'location' || key === 'loc' || key === 'range') continue;
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
  if (isSelectStmt(node)) {
    return { found: false };
  }

  // Check for window function (any function with OVER clause)
  // CST uses 'overClause' or 'over', AST uses 'over' or 'window'
  if (node.overClause || node.over || node.window) {
    const funcName = extractFunctionName(node) || 'window function';
    
    return { 
      found: true, 
      functionName: funcName.toUpperCase(),
      location: getLocationFromCst(node)
    };
  }

  // Also check for known window-only functions
  if (isFunctionCall(node)) {
    const funcName = extractFunctionName(node);
    
    if (funcName && BIGQUERY_WINDOW_FUNCTIONS.has(funcName) && (node.overClause || node.over || node.window)) {
      return { 
        found: true, 
        functionName: funcName.toUpperCase(),
        location: getLocationFromCst(node)
      };
    }
  }

  // Recursively check child properties
  for (const key of Object.keys(node)) {
    if (key === 'location' || key === 'loc' || key === 'range') continue;
    const result = containsWindowFunction(node[key]);
    if (result.found) return result;
  }

  return { found: false };
};

/**
 * Validates BigQuery syntax rules for a SELECT statement (CST or AST).
 * Returns an array of validation issues based on GoogleSQL rules.
 */
export const validateBigQuerySyntaxRules = (selectStmt: any): ColumnValidationIssue[] => {
  const issues: ColumnValidationIssue[] = [];

  if (!selectStmt || typeof selectStmt !== 'object') {
    return issues;
  }

  // Rule 1: Aggregate functions cannot be used in WHERE clause (use HAVING instead)
  const whereCondition = getWhereCondition(selectStmt);
  if (whereCondition) {
    const aggregateCheck = containsAggregateFunction(whereCondition);
    if (aggregateCheck.found) {
      const location = aggregateCheck.location?.start || { line: 1, column: 1 };
      issues.push({
        message: `Aggregate function ${aggregateCheck.functionName || 'unknown'} cannot be used in WHERE clause. Use HAVING to filter aggregated results.`,
        line: location.line || 1,
        column: location.column || 1,
        length: aggregateCheck.functionName?.length || 10,
        severity: 'error',
        rule: 'aggregate-in-where',
      });
    }
  }

  // Rule 2: Window functions cannot be used in WHERE clause (use QUALIFY instead)
  if (whereCondition) {
    const windowCheck = containsWindowFunction(whereCondition);
    if (windowCheck.found) {
      const location = windowCheck.location?.start || { line: 1, column: 1 };
      issues.push({
        message: `Window function ${windowCheck.functionName || 'unknown'} cannot be used in WHERE clause. Use QUALIFY to filter window function results.`,
        line: location.line || 1,
        column: location.column || 1,
        length: windowCheck.functionName?.length || 10,
        severity: 'error',
        rule: 'window-in-where',
      });
    }
  }

  // Rule 3: Window functions cannot be used in HAVING clause (use QUALIFY instead)
  const havingCondition = getHavingCondition(selectStmt);
  if (havingCondition) {
    const windowCheck = containsWindowFunction(havingCondition);
    if (windowCheck.found) {
      const location = windowCheck.location?.start || { line: 1, column: 1 };
      issues.push({
        message: `Window function ${windowCheck.functionName || 'unknown'} cannot be used in HAVING clause. Use QUALIFY to filter window function results.`,
        line: location.line || 1,
        column: location.column || 1,
        length: windowCheck.functionName?.length || 10,
        severity: 'error',
        rule: 'window-in-having',
      });
    }
  }

  // Rule 4: OFFSET can only be used with LIMIT
  const limitClause = selectStmt.limitClause || selectStmt.limit;
  if (limitClause) {
    // CST structure: limitClause.count and limitClause.offset
    // AST structure: limit.value and limit.offset
    const hasLimit = (limitClause.count?.value !== undefined && limitClause.count?.value !== null) ||
                     (limitClause.value !== undefined && limitClause.value !== null);
    const hasOffset = limitClause.offset?.value !== undefined && limitClause.offset?.value !== null;
    
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
  const groupByExprs = getGroupByExpressions(selectStmt);
  const columns = getSelectColumns(selectStmt);
  
  if (groupByExprs.length > 0 && columns.length > 0) {
    const groupByColumns = new Set<string>();
    
    // Extract GROUP BY column names
    const extractGroupByColumns = (groupExpr: any) => {
      if (!groupExpr) return;
      if (Array.isArray(groupExpr)) {
        groupExpr.forEach(extractGroupByColumns);
        return;
      }
      
      // Handle column reference (CST or AST)
      if (isColumnRef(groupExpr)) {
        const colName = extractColumnName(groupExpr);
        if (colName) {
          groupByColumns.add(stripIdentifierQuotes(colName).toLowerCase());
        }
      }
      // Handle positional reference (1, 2, 3)
      else if (getNodeType(groupExpr) === 'number' && typeof groupExpr.value === 'number') {
        groupByColumns.add(`__positional_${groupExpr.value}__`);
      }
    };
    
    groupByExprs.forEach(extractGroupByColumns);
    
    // Check SELECT columns that are not aggregated
    for (let i = 0; i < columns.length; i++) {
      const col = columns[i];
      const expr = col?.expr ?? col?.expression ?? col;
      
      // Skip if it's an aggregate function or has OVER clause (window function)
      if (isFunctionCall(expr) && extractFunctionName(expr) && BIGQUERY_AGGREGATE_FUNCTIONS.has(extractFunctionName(expr))) {
        continue;
      }
      if (expr?.overClause || expr?.over || expr?.window) {
        continue;
      }
      
      // Skip SELECT * 
      if (getNodeType(expr) === 'star' || col === '*') {
        continue;
      }
      
      // Check if column has an aggregate function anywhere in its expression
      const hasAggregate = containsAggregateFunction(expr);
      if (hasAggregate.found) {
        continue;
      }
      
      // Check for simple column reference
      if (isColumnRef(expr)) {
        const colName = extractColumnName(expr);
        if (colName) {
          const cleanColName = stripIdentifierQuotes(colName).toLowerCase();
          
          // Check if this column is in GROUP BY or if there's a positional reference for this position
          const isInGroupBy = groupByColumns.has(cleanColName) || 
                             groupByColumns.has(`__positional_${i + 1}__`);
          
          if (!isInGroupBy) {
            const location = getLocationFromCst(expr)?.start || { line: 1, column: 1 };
            issues.push({
              message: `Column "${colName}" must appear in GROUP BY clause or be used in an aggregate function.`,
              line: location.line || 1,
              column: location.column || 1,
              length: colName.length || 10,
              severity: 'warning',
              rule: 'missing-group-by',
            });
          }
        }
      }
    }
  }

  // Recursively validate CTEs
  const ctes = getWithCtes(selectStmt);
  for (const cte of ctes) {
    // CST: cte.expr.expr (paren_expr.expr is the select_stmt)
    // AST: cte.query or cte.stmt.ast
    let cteQuery = cte.expr?.expr || cte.expr; // CST: unwrap paren_expr if needed
    if (!cteQuery || !isSelectStmt(cteQuery)) {
      cteQuery = cte.query || cte.stmt?.ast || cte.stmt;
    }
    if (cteQuery) {
      const cteIssues = validateBigQuerySyntaxRules(cteQuery);
      issues.push(...cteIssues);
    }
  }

  return issues;
};

export const stripIdentifierQuotes = (value: string | null | undefined): string => {
  if (!value) return '';
  return value.replace(/[`"']/g, '');
};

// Extract column name from column reference (CST or AST)
const extractColumnName = (node: any): string => {
  if (!node) return '';
  
  const nodeType = getNodeType(node);
  
  // CST: member_expr (e.g., t.col1) - property is the column name
  if (nodeType === 'member_expr' || nodeType === 'MemberExpr') {
    if (node.property) {
      if (typeof node.property.name === 'string') {
        return node.property.name;
      }
      if (typeof node.property === 'string') {
        return node.property;
      }
      if (node.property.text) {
        return node.property.text;
      }
    }
  }
  
  // CST: identifier (simple column name)
  if (nodeType === 'identifier' || nodeType === 'Identifier') {
    if (typeof node.name === 'string') {
      return node.name;
    }
    if (node.text) {
      return node.text;
    }
  }
  
  // CST structure: node.name or node.column
  if (typeof node.name === 'string') {
    return node.name;
  }
  if (node.name?.name) {
    return typeof node.name.name === 'string' ? node.name.name : node.name.name.value || '';
  }
  if (node.name?.value) {
    return node.name.value;
  }
  
  // AST structure: node.column
  if (typeof node.column === 'string') {
    return node.column;
  }
  if (node.column && typeof node.column === 'object') {
    if (node.column.expr && typeof node.column.expr.value === 'string') {
      return node.column.expr.value;
    }
    if (typeof node.column.column === 'string') {
      return node.column.column;
    }
  }
  
  return '';
};

// Extract table name from column reference (CST or AST)
const extractTableName = (node: any): string | null => {
  if (!node) return null;
  
  const nodeType = getNodeType(node);
  
  // CST: member_expr (e.g., t.col1) - object is the table/alias name
  if (nodeType === 'member_expr' || nodeType === 'MemberExpr') {
    if (node.object) {
      if (typeof node.object.name === 'string') {
        return node.object.name;
      }
      if (typeof node.object === 'string') {
        return node.object;
      }
      if (node.object.text) {
        return node.object.text;
      }
    }
  }
  
  // CST structure: node.table or node.table.name
  if (typeof node.table === 'string') {
    return node.table;
  }
  if (node.table?.name) {
    return typeof node.table.name === 'string' ? node.table.name : node.table.name.value || null;
  }
  
  // AST structure: node.table
  if (typeof node.table === 'string') {
    return node.table;
  }
  
  return null;
};

/**
 * Collects column references from a CST or AST expression node.
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
  if (isSelectStmt(node)) {
    return;
  }

  // Check for column references: CST uses member_expr or identifier, AST uses column_ref
  const nodeType = getNodeType(node);
  const isColumnReference = isColumnRef(node) || 
                            nodeType === 'member_expr' || 
                            nodeType === 'MemberExpr' ||
                            nodeType === 'identifier' ||
                            nodeType === 'Identifier';
  
  if (isColumnReference) {
    const columnName = extractColumnName(node);
    const tableName = extractTableName(node);
    
    // Skip if it's just an identifier without a column name (might be a table name)
    if (!columnName && nodeType === 'identifier') {
      // Continue recursion - might be part of a larger expression
    } else {
      // Collect column refs for validation:
      // - Non-* columns: always collect for column name validation
      // - * columns with alias (e.g., da.*): collect to validate alias exists
      // - Bare * without alias: skip (no validation needed)
      const hasAlias = tableName ? true : false;
      const shouldCollect = columnName && (columnName !== '*' || hasAlias);
      
      if (shouldCollect) {
        refs.push({
          alias: tableName ? stripIdentifierQuotes(tableName) : null,
          column: stripIdentifierQuotes(columnName),
          location: getLocationFromCst(node),
        });
      }
      return;
    }
  }

  // Recursively inspect child properties
  for (const key of Object.keys(node)) {
    if (key === 'location' || key === 'loc' || key === 'range') {
      continue;
    }
    collectColumnRefsFromExpression(node[key], refs);
  }
};

/**
 * Collects all column references from a SELECT statement (CST or AST).
 */
export const collectColumnRefsForSelect = (selectStmt: any, includeCteBodies = false): ColumnRefInfo[] => {
  const refs: ColumnRefInfo[] = [];

  if (!selectStmt || typeof selectStmt !== 'object') {
    return refs;
  }

  const collect = (expr: any) => collectColumnRefsFromExpression(expr, refs);

  // Optionally collect from CTE bodies (for full query validation)
  if (includeCteBodies) {
    const ctes = getWithCtes(selectStmt);
    for (const cte of ctes) {
      // CST: cte.expr.expr (paren_expr.expr is the select_stmt)
      // AST: cte.query or cte.stmt.ast
      let cteQuery = cte.expr?.expr || cte.expr; // CST: unwrap paren_expr if needed
      if (!cteQuery || !isSelectStmt(cteQuery)) {
        cteQuery = cte.query || cte.stmt?.ast || cte.stmt;
      }
      if (cteQuery) {
        // Recursively collect from CTE body (but not nested CTEs within CTEs)
        const cteRefs = collectColumnRefsForSelect(cteQuery, false);
        refs.push(...cteRefs);
      }
    }
  }

  // Collect from SELECT columns
  const columns = getSelectColumns(selectStmt);
  for (const col of columns) {
    const expr = col?.expr ?? col?.expression ?? col;
    collect(expr);
  }

  // Collect from WHERE clause
  const whereCondition = getWhereCondition(selectStmt);
  if (whereCondition) {
    collect(whereCondition);
  }

  // Collect from GROUP BY
  const groupByExprs = getGroupByExpressions(selectStmt);
  for (const groupExpr of groupByExprs) {
    collect(groupExpr);
  }

  // Collect from ORDER BY
  const orderByItems = getOrderByItems(selectStmt);
  for (const orderItem of orderByItems) {
    const expr = orderItem?.expr ?? orderItem?.expression ?? orderItem;
    collect(expr);
  }

  // Collect from HAVING clause
  const havingCondition = getHavingCondition(selectStmt);
  if (havingCondition) {
    collect(havingCondition);
  }

  // Collect from JOIN ON clauses
  // CST: join_expr has specification.join_on_specification.expr
  // AST: fromItem.on or fromItem.onClause
  if (selectStmt.clauses && Array.isArray(selectStmt.clauses)) {
    const fromClause = selectStmt.clauses.find((c: any) => c.type === 'from_clause');
    if (fromClause?.expr) {
      const exprType = getNodeType(fromClause.expr);
      if (exprType === 'join_expr' || exprType === 'JoinExpr') {
        // Recursively collect from all join specifications
        const collectFromJoinExpr = (joinExpr: any) => {
          if (!joinExpr) return;
          // CST: specification.expr contains the ON condition
          if (joinExpr.specification?.expr) {
            collect(joinExpr.specification.expr);
          } else if (joinExpr.specification?.condition) {
            collect(joinExpr.specification.condition);
          }
          if (joinExpr.left) collectFromJoinExpr(joinExpr.left);
          if (joinExpr.right) collectFromJoinExpr(joinExpr.right);
        };
        collectFromJoinExpr(fromClause.expr);
      }
    }
  }
  
  // Fallback: check fromTables (AST structure)
  const fromTables = getFromTables(selectStmt);
  for (const fromItem of fromTables) {
    if (fromItem.on || fromItem.onClause) {
      const onCondition = fromItem.onClause?.condition || fromItem.on;
      if (onCondition) {
        collect(onCondition);
      }
    }
  }

  return refs;
};

/**
 * Extracts output column names from a CTE's SELECT clause.
 * Returns the column aliases (AS names) or the column names if no alias is specified.
 */
export const extractCteColumnNames = (cteStmt: any): string[] => {
  const columns: string[] = [];
  
  const selectColumns = getSelectColumns(cteStmt);
  if (selectColumns.length === 0) {
    return columns;
  }
  
  for (const col of selectColumns) {
    // Skip SELECT * - we can't determine column names without schema
    const expr = col?.expr ?? col?.expression ?? col;
    if (getNodeType(expr) === 'star' || col === '*') {
      continue;
    }
    
    // Check for explicit alias (AS clause)
    const alias = col.as || col.alias;
    if (alias) {
      const aliasName = typeof alias === 'string' ? alias : (alias.name || alias.value);
      if (aliasName) {
        columns.push(stripIdentifierQuotes(aliasName));
        continue;
      }
    }
    
    // No alias - try to get column name from expression
    if (isColumnRef(expr)) {
      const columnName = extractColumnName(expr);
      if (columnName) {
        columns.push(stripIdentifierQuotes(columnName));
      }
    }
    // Function call without alias - skip (hard to reference)
  }
  
  return columns;
};

/**
 * Builds a map of table aliases and unique tables from a SELECT statement (CST or AST).
 */
export const buildTableAliasMapFromSelect = (
  selectStmt: any
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

    const itemType = getNodeType(item);
    
    // Handle subqueries - register alias name but skip schema mapping
    if (item.query || (item.expr && isSelectStmt(item.expr))) {
      const alias = item.as || item.alias;
      const aliasName = typeof alias === 'string' ? alias : (alias?.name || alias?.text || alias?.value);
      registerAlias(aliasName, {});
      return;
    }

    let datasetId: string | undefined;
    let tableId: string | undefined;
    let projectId: string | undefined;

    // CST structure: alias node with expr (member_expr for dataset.table or identifier for table)
    if (itemType === 'alias' || itemType === 'Alias') {
      const tableExpr = item.expr;
      const aliasObj = item.alias;
      const aliasName = typeof aliasObj === 'string' ? aliasObj : (aliasObj?.name || aliasObj?.text || aliasObj?.value);
      
      // Extract table info from expr
      if (tableExpr) {
        const exprType = getNodeType(tableExpr);
        
        // member_expr: dataset.table1
        if (exprType === 'member_expr' || exprType === 'MemberExpr') {
          const datasetName = tableExpr.object?.name || tableExpr.object?.text;
          const tableName = tableExpr.property?.name || tableExpr.property?.text;
          if (datasetName) datasetId = stripIdentifierQuotes(datasetName);
          if (tableName) tableId = stripIdentifierQuotes(tableName);
        }
        // identifier: table1
        else if (exprType === 'identifier' || exprType === 'Identifier') {
          const tableName = tableExpr.name || tableExpr.text;
          if (tableName) tableId = stripIdentifierQuotes(tableName);
        }
      }
      
      // Register alias
      if (aliasName) {
        registerAlias(aliasName, { datasetId, tableId });
      }
      if (datasetId && tableId) {
        const key = `${datasetId}.${tableId}`.toLowerCase();
        if (!uniqueTables.has(key)) {
          uniqueTables.set(key, { datasetId, tableId });
        }
        registerAlias(`${datasetId}.${tableId}`, { datasetId, tableId });
      }
      if (tableId) {
        registerAlias(tableId, { datasetId, tableId });
      }
      return;
    }

    // AST structure: item.table might be an object with name, schema, catalog
    const tableRef = item.table;
    
    if (tableRef) {
      if (typeof tableRef === 'string') {
        // Simple table name
        tableId = stripIdentifierQuotes(tableRef);
      } else if (typeof tableRef === 'object') {
        // CST: tableRef.name, tableRef.schema, tableRef.catalog
        // AST: tableRef.table, tableRef.db, tableRef.catalog
        if (tableRef.name) {
          tableId = stripIdentifierQuotes(typeof tableRef.name === 'string' ? tableRef.name : tableRef.name.value);
        } else if (tableRef.table) {
          tableId = stripIdentifierQuotes(tableRef.table);
        }
        
        if (tableRef.schema) {
          datasetId = stripIdentifierQuotes(typeof tableRef.schema === 'string' ? tableRef.schema : tableRef.schema.value);
        } else if (tableRef.db) {
          datasetId = stripIdentifierQuotes(tableRef.db);
        }
        
        if (tableRef.catalog) {
          projectId = stripIdentifierQuotes(typeof tableRef.catalog === 'string' ? tableRef.catalog : tableRef.catalog.value);
        }
      }
    }

    // Handle direct properties (AST style)
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

    if (tableId) {
      registerTableName(tableId);
    }

    // Register alias variations for lookup
    const alias = item.as || item.alias;
    const aliasName = typeof alias === 'string' ? alias : (alias?.name || alias?.text || alias?.value);
    registerAlias(aliasName, { datasetId, tableId });

    if (tableId) {
      registerAlias(tableId, { datasetId, tableId });
    }

    if (datasetId && tableId) {
      registerAlias(`${datasetId}.${tableId}`, { datasetId, tableId });
    }
  };

  // Process CTEs (WITH clause) - register CTE names as valid aliases
  const ctes = getWithCtes(selectStmt);
  for (const cte of ctes) {
    // CST: common_table_expression has table (identifier) and expr (paren_expr with select_stmt)
    // AST: cte has name and stmt.ast
    const cteName = cte.table?.name || cte.table?.text || 
                    (typeof cte.name === 'string' ? cte.name : (cte.name?.name || cte.name?.text || cte.name?.value));
    if (cteName) {
      // Extract the column names from the CTE's SELECT clause
      // CST: cte.expr.expr (paren_expr.expr is the select_stmt)
      // AST: cte.query or cte.stmt.ast
      let cteQuery = cte.expr?.expr || cte.expr; // CST: unwrap paren_expr if needed
      if (!cteQuery || !isSelectStmt(cteQuery)) {
        cteQuery = cte.query || cte.stmt?.ast || cte.stmt;
      }
      const cteColumns = cteQuery ? extractCteColumnNames(cteQuery) : [];
      registerAlias(cteName, { cteColumns: cteColumns.length > 0 ? cteColumns : undefined });
    }
  }

  // Process FROM clause
  const fromTables = getFromTables(selectStmt);
  for (const fromItem of fromTables) {
    processFromItem(fromItem);
  }

  return { aliasMap, uniqueTables };
};

/**
 * Collects all subqueries from a CST or AST node.
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
  
  const nodeType = getNodeType(node);
  
  // Found a subquery
  if (isSelectStmt(node)) {
    subqueries.push(node);
    // Don't recurse into the subquery here - it will be processed separately
    return;
  }
  
  // CST: subqueries might be wrapped in paren_expr (e.g., (SELECT ...))
  if (nodeType === 'paren_expr' || nodeType === 'ParenExpr') {
    if (node.expr && isSelectStmt(node.expr)) {
      subqueries.push(node.expr);
      return;
    }
  }
  
  // Recurse into child properties
  for (const key of Object.keys(node)) {
    if (key === 'location' || key === 'loc' || key === 'range') continue;
    collectSubqueries(node[key], subqueries);
  }
};

/**
 * Validates column references in a SELECT statement, including subqueries.
 * Returns an array of validation issues found.
 * 
 * @param selectStmt - The parsed SELECT statement (CST or AST)
 * @param getTableFields - Function to fetch table field names (for schema validation)
 * @param textToValidate - The original SQL text (for error position finding)
 * @param canFetchSchemas - Whether schema fetching is available
 */
export const validateColumnReferences = async (
  selectStmt: any,
  getTableFields: (datasetId: string, tableId: string) => Promise<string[] | null>,
  textToValidate: string,
  canFetchSchemas: boolean
): Promise<ColumnValidationIssue[]> => {
  const issues: ColumnValidationIssue[] = [];

  // Helper function to validate columns for a single SELECT scope
  const validateScope = async (
    scopeStmt: any,
    scopeAliasMap: Map<string, TableAliasInfo>,
    scopeUniqueTables: Map<string, { datasetId?: string; tableId?: string }>
  ) => {
    const columnRefs = collectColumnRefsForSelect(scopeStmt, false);
    const uniqueTableList = Array.from(scopeUniqueTables.values());

    for (const columnRef of columnRefs) {
      const baseColumnName = columnRef.column.split('.')[0];
      const lowerColumnName = baseColumnName.toLowerCase();
      const location = columnRef.location?.start || { line: 1, column: 1 };
      const length = Math.max(1, columnRef.column.length);

      const aliasKey = columnRef.alias ? columnRef.alias.toLowerCase() : null;
      const aliasInfo = aliasKey ? scopeAliasMap.get(aliasKey) : null;

      if (aliasKey && !aliasInfo) {
        issues.push({
          message: `Unknown table or alias "${columnRef.alias}" used in column reference`,
          line: location.line || 1,
          column: location.column || 1,
          length,
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
            line: location.line || 1,
            column: location.column || 1,
            length,
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
            line: location.line || 1,
            column: location.column || 1,
            length,
          });
        }
      }
    }
  };

  // First, validate each CTE body independently against its own FROM tables
  const ctes = getWithCtes(selectStmt);
  for (const cte of ctes) {
    // CST: cte.expr.expr (paren_expr.expr is the select_stmt)
    // AST: cte.query or cte.stmt.ast
    let cteQuery = cte.expr?.expr || cte.expr; // CST: unwrap paren_expr if needed
    if (!cteQuery || !isSelectStmt(cteQuery)) {
      cteQuery = cte.query || cte.stmt?.ast || cte.stmt;
    }
    if (cteQuery) {
      // Build alias map for just this CTE's scope (its own FROM clause only)
      const { aliasMap: cteAliasMap, uniqueTables: cteUniqueTables } = buildTableAliasMapFromSelect({
        ...cteQuery,
        withClause: null,
        with: null, // Don't process nested CTEs here, they'd be handled separately
      });
      await validateScope(cteQuery, cteAliasMap, cteUniqueTables);
    }
  }

  // Then validate the main query (excluding CTE bodies, but including CTE names as valid aliases)
  const { aliasMap, uniqueTables } = buildTableAliasMapFromSelect(selectStmt);
  await validateScope(selectStmt, aliasMap, uniqueTables);

  // Recursively validate subqueries within the statement
  // parentAliasMap contains aliases from outer scopes (for correlated subqueries)
  const validateSubqueries = async (
    stmt: any,
    parentAliasMap: Map<string, TableAliasInfo> = new Map(),
    parentUniqueTables: Map<string, { datasetId?: string; tableId?: string }> = new Map()
  ) => {
    const subqueries: any[] = [];
    
    // Collect subqueries from WHERE, HAVING, SELECT columns, etc.
    const whereCondition = getWhereCondition(stmt);
    if (whereCondition) {
      collectSubqueries(whereCondition, subqueries);
    }
    
    const havingCondition = getHavingCondition(stmt);
    if (havingCondition) {
      collectSubqueries(havingCondition, subqueries);
    }
    
    const columns = getSelectColumns(stmt);
    for (const col of columns) {
      const expr = col?.expr ?? col?.expression ?? col;
      collectSubqueries(expr, subqueries);
    }
    
    // Also check JOIN ON conditions for subqueries
    const fromTables = getFromTables(stmt);
    for (const fromItem of fromTables) {
      if (fromItem.on || fromItem.onClause) {
        const onCondition = fromItem.onClause?.condition || fromItem.on;
        if (onCondition) {
          collectSubqueries(onCondition, subqueries);
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
  for (const cte of ctes) {
    // CST: cte.expr.expr (paren_expr.expr is the select_stmt)
    // AST: cte.query or cte.stmt.ast
    let cteQuery = cte.expr?.expr || cte.expr; // CST: unwrap paren_expr if needed
    if (!cteQuery || !isSelectStmt(cteQuery)) {
      cteQuery = cte.query || cte.stmt?.ast || cte.stmt;
    }
    if (cteQuery) {
      const { aliasMap: cteAliasMap, uniqueTables: cteUniqueTables } = buildTableAliasMapFromSelect({
        ...cteQuery,
        withClause: null,
        with: null,
      });
      await validateSubqueries(cteQuery, cteAliasMap, cteUniqueTables);
    }
  }

  // Validate subqueries in the main query, passing the main query's aliases as parent scope
  await validateSubqueries(selectStmt, aliasMap, uniqueTables);

  return issues;
};

/**
 * Extracts GROUP BY clause from raw SQL text, preserving comments.
 * This is needed because sql-parser-cst removes comments during parsing.
 */
const extractGroupByClauseFromText = (sql: string): { clause: string; startIndex: number } | null => {
  // Normalize whitespace for easier matching
  const normalizedSql = sql.replace(/\r\n/g, '\n');
  
  // Find GROUP BY clause (case-insensitive)
  const groupByMatch = normalizedSql.match(/\bGROUP\s+BY\b/i);
  if (!groupByMatch || groupByMatch.index === undefined) {
    return null;
  }
  
  const startIndex = groupByMatch.index + groupByMatch[0].length;
  
  // Find the end of GROUP BY clause (next clause or end of statement)
  const remainingText = normalizedSql.substring(startIndex);
  const endMatch = remainingText.match(/\b(HAVING|ORDER\s+BY|LIMIT|QUALIFY|WINDOW|UNION|EXCEPT|INTERSECT|$)/i);
  
  let endIndex = normalizedSql.length;
  if (endMatch && endMatch.index !== undefined) {
    endIndex = startIndex + endMatch.index;
  }
  
  const clause = normalizedSql.substring(startIndex, endIndex).trim();
  return { clause, startIndex };
};

/**
 * Parses GROUP BY expressions from raw SQL text, detecting commented columns.
 * This is a simple text-based parser that handles comments.
 */
const parseGroupByExpressionsFromText = (
  groupByClause: string,
  groupByStartLine: number
): Array<{ text: string; isCommented: boolean; line: number; column: number }> => {
  const expressions: Array<{ text: string; isCommented: boolean; line: number; column: number }> = [];
  
  if (!groupByClause) {
    return expressions;
  }
  
  // Remove string literals to avoid false matches
  let processedClause = groupByClause;
  const stringPattern = /(['"`])(?:(?=(\\?))\2.)*?\1/g;
  processedClause = processedClause.replace(stringPattern, (match) => ' '.repeat(match.length));
  
  const lines = processedClause.split('\n');
  let inMultiLineComment = false;
  let multiLineCommentStart = { line: 0, col: 0 };
  
  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    const actualLine = groupByStartLine + lineIdx;
    let i = 0;
    let currentExpr = '';
    let exprStartCol = 0;
    let inExpr = false;
    
    while (i < line.length) {
      const char = line[i];
      const nextChar = i + 1 < line.length ? line[i + 1] : '';
      
      // Handle multi-line comments
      if (inMultiLineComment) {
        if (char === '*' && nextChar === '/') {
          inMultiLineComment = false;
          i += 2;
          // Extract expression from comment if any
          const commentedText = line.substring(multiLineCommentStart.col, i - 2).trim();
          if (commentedText) {
            // Try to extract column reference
            const columnMatch = commentedText.match(/(\w+\.\w+|\w+|\d+)/);
            if (columnMatch) {
              expressions.push({
                text: columnMatch[1],
                isCommented: true,
                line: multiLineCommentStart.line,
                column: multiLineCommentStart.col + 1,
              });
            }
          }
          continue;
        }
        i++;
        continue;
      }
      
      // Check for start of multi-line comment
      if (char === '/' && nextChar === '*') {
        inMultiLineComment = true;
        multiLineCommentStart = { line: actualLine, col: i };
        i += 2;
        continue;
      }
      
      // Check for single-line comment
      if (char === '-' && nextChar === '-') {
        // If we were building an expression, save it
        if (inExpr && currentExpr.trim()) {
          expressions.push({
            text: currentExpr.trim(),
            isCommented: false,
            line: actualLine,
            column: exprStartCol + 1,
          });
          currentExpr = '';
          inExpr = false;
        }
        
        // Extract commented text
        const commentedText = line.substring(i + 2).trim();
        if (commentedText) {
          // Try to extract column reference from commented text
          const columnMatch = commentedText.match(/(\w+\.\w+|\w+|\d+)/);
          if (columnMatch) {
            expressions.push({
              text: columnMatch[1],
              isCommented: true,
              line: actualLine,
              column: i + 1,
            });
          }
        }
        break; // Rest of line is comment
      }
      
      // Regular character - collect column references
      // Match word characters (letters, digits, underscore) or dots for qualified names
      // Also match digits at the start for positional references (1, 2, 3, etc.)
      if (!inExpr && (/\w/.test(char) || /\d/.test(char))) {
        inExpr = true;
        exprStartCol = i;
        currentExpr = char;
      } else if (inExpr) {
        // Continue collecting: word chars, dots, or digits (for multi-digit positional refs like 10)
        if (/[\w.]/.test(char) || /\d/.test(char)) {
          currentExpr += char;
        } else if (/[\s,]/.test(char)) {
          // End of expression
          if (currentExpr.trim()) {
            expressions.push({
              text: currentExpr.trim(),
              isCommented: false,
              line: actualLine,
              column: exprStartCol + 1,
            });
            currentExpr = '';
            inExpr = false;
          }
          // Skip whitespace and commas
          while (i < line.length && /[\s,]/.test(line[i])) {
            i++;
          }
          continue;
        }
      }
      
      i++;
    }
    
    // Handle expression at end of line
    if (inExpr && currentExpr.trim()) {
      expressions.push({
        text: currentExpr.trim(),
        isCommented: false,
        line: actualLine,
        column: exprStartCol + 1,
      });
    }
  }
  
  return expressions;
};

/**
 * Validates GROUP BY expressions in a SELECT statement.
 * Validates GROUP BY columns against:
 * - Column names from tables (via schema lookup)
 * - Column names with alias from JOINS
 * - Column names/aliases from SELECT
 * - Column numbers (positional references like 1, 2, 3)
 * 
 * Also detects commented columns in GROUP BY and validates that all
 * non-aggregated SELECT columns are properly grouped.
 * 
 * @param selectStmt - The parsed SELECT statement (CST or AST)
 * @param aliasMap - Map of table aliases and their information
 * @param uniqueTables - Map of unique tables with dataset/table IDs
 * @param getTableFields - Function to fetch table field names (for schema validation)
 * @param textToValidate - The original SQL text (for error position finding)
 * @param canFetchSchemas - Whether schema fetching is available
 */
export const validateGroupByColumns = async (
  selectStmt: any,
  aliasMap: Map<string, TableAliasInfo>,
  uniqueTables: Map<string, { datasetId?: string; tableId?: string }>,
  getTableFields: (datasetId: string, tableId: string) => Promise<string[] | null>,
  textToValidate: string,
  canFetchSchemas: boolean
): Promise<ColumnValidationIssue[]> => {
  const issues: ColumnValidationIssue[] = [];
  
  const groupByExprs = getGroupByExpressions(selectStmt);
  
  // Extract GROUP BY clause from raw SQL to detect commented columns
  const groupByClauseInfo = extractGroupByClauseFromText(textToValidate);
  let groupByStartLine = 1;
  
  if (groupByClauseInfo) {
    // Calculate line number where GROUP BY starts
    const textBeforeGroupBy = textToValidate.substring(0, groupByClauseInfo.startIndex);
    groupByStartLine = (textBeforeGroupBy.match(/\n/g) || []).length + 1;
  }
  
  const allGroupByExpressions: Array<{ text: string; isCommented: boolean; line: number; column: number }> = [];
  
  if (groupByClauseInfo) {
    const parsed = parseGroupByExpressionsFromText(groupByClauseInfo.clause, groupByStartLine);
    allGroupByExpressions.push(...parsed);
  }
  
  if (groupByExprs.length === 0 && allGroupByExpressions.length === 0) {
    return issues; // No GROUP BY clause at all
  }
  
  // Get SELECT columns to validate positional references and aliases
  const selectColumns = getSelectColumns(selectStmt);
  
  // Build a map of SELECT column aliases (by position and by alias name)
  const selectColumnAliases = new Map<number, string>(); // position -> alias
  const selectColumnNames = new Map<number, string>(); // position -> column name
  const selectAliasToPosition = new Map<string, number>(); // alias -> position
  
  for (let i = 0; i < selectColumns.length; i++) {
    const col = selectColumns[i];
    const expr = col?.expr ?? col?.expression ?? col;
    
    // Get column alias (AS clause)
    const alias = col?.as || col?.alias;
    let aliasName: string | null = null;
    if (alias) {
      if (typeof alias === 'string') {
        aliasName = stripIdentifierQuotes(alias);
      } else if (alias.name) {
        aliasName = stripIdentifierQuotes(typeof alias.name === 'string' ? alias.name : alias.name.value);
      } else if (alias.text) {
        aliasName = stripIdentifierQuotes(alias.text);
      } else if (alias.value) {
        aliasName = stripIdentifierQuotes(alias.value);
      }
    }
    
    // Get column name from expression - handle both column_ref and member_expr
    let columnName: string | null = null;
    let tableName: string | null = null;
    const nodeType = getNodeType(expr);
    
    // Check for column reference (member_expr for table.column, identifier for column, column_ref for AST)
    if (isColumnRef(expr) || nodeType === 'member_expr' || nodeType === 'MemberExpr' || 
        nodeType === 'identifier' || nodeType === 'Identifier') {
      columnName = extractColumnName(expr);
      tableName = extractTableName(expr);
      if (columnName) {
        columnName = stripIdentifierQuotes(columnName);
      }
      if (tableName) {
        tableName = stripIdentifierQuotes(tableName);
      }
    }
    
    // Store alias if present
    if (aliasName) {
      selectColumnAliases.set(i + 1, aliasName.toLowerCase());
      selectAliasToPosition.set(aliasName.toLowerCase(), i + 1);
    }
    
    // Store column name if present - prefer qualified name if table is present
    if (columnName) {
      const cleanColumnName = columnName.toLowerCase();
      if (tableName) {
        const qualifiedName = `${tableName.toLowerCase()}.${cleanColumnName}`;
        selectColumnNames.set(i + 1, qualifiedName); // Store qualified name
      } else {
        selectColumnNames.set(i + 1, cleanColumnName); // Store unqualified name
      }
    }
  }
  
  const uniqueTableList = Array.from(uniqueTables.values());
  
  // Build sets of what's actually in GROUP BY for reverse validation
  // Use both CST parsing (for accurate structure) and text parsing (for commented columns)
  const groupByColumnNames = new Set<string>(); // Column names/aliases in GROUP BY
  const groupByPositions = new Set<number>(); // Positional references in GROUP BY
  
  // First pass: collect all GROUP BY expressions from CST (for reverse validation)
  for (const groupExpr of groupByExprs) {
    if (!groupExpr) continue;
    
    const nodeType = getNodeType(groupExpr);
    
    // Collect positional references (numbers like 1, 2, 3, etc.)
    // These can appear as various CST node types depending on the parser
    if (nodeType === 'number' || nodeType === 'NumberLiteral' || nodeType === 'int' || nodeType === 'integer' ||
        nodeType === 'bigint' || nodeType === 'BigIntLiteral') {
      let colNum: number | null = null;
      if (typeof groupExpr.value === 'number') {
        colNum = groupExpr.value;
      } else if (groupExpr.value?.value !== undefined && typeof groupExpr.value.value === 'number') {
        colNum = groupExpr.value.value;
      } else if (typeof groupExpr.text === 'string') {
        const parsed = parseInt(groupExpr.text, 10);
        if (!isNaN(parsed) && parsed > 0) {
          colNum = parsed;
        }
      }
      // Also check if the expression itself is a number (for some CST formats)
      if (colNum === null && typeof groupExpr === 'number') {
        colNum = groupExpr;
      }
      if (colNum !== null && typeof colNum === 'number' && colNum > 0) {
        groupByPositions.add(colNum);
      }
    }
    
    // Collect column references - handle both column_ref and member_expr
    const isColumnReference = isColumnRef(groupExpr) || nodeType === 'member_expr' || nodeType === 'MemberExpr' || 
                              nodeType === 'identifier' || nodeType === 'Identifier';
    
    if (isColumnReference) {
      const columnName = extractColumnName(groupExpr);
      const tableName = extractTableName(groupExpr);
      
      if (columnName) {
        const cleanColumnName = stripIdentifierQuotes(columnName).toLowerCase();
        if (tableName) {
          const cleanTableName = stripIdentifierQuotes(tableName).toLowerCase();
          const qualifiedName = `${cleanTableName}.${cleanColumnName}`;
          groupByColumnNames.add(qualifiedName);
          // Also add without table qualifier for matching (but prefer qualified)
          groupByColumnNames.add(cleanColumnName);
        } else {
          groupByColumnNames.add(cleanColumnName);
        }
      }
      
      // Also check if this matches a SELECT alias (for cases like GROUP BY Discount when SELECT has Discount AS ...)
      const cleanColumnName = columnName ? stripIdentifierQuotes(columnName).toLowerCase() : null;
      if (cleanColumnName && selectAliasToPosition.has(cleanColumnName)) {
        groupByColumnNames.add(cleanColumnName);
        // Also add qualified version if table is present
        if (tableName) {
          const cleanTableName = stripIdentifierQuotes(tableName).toLowerCase();
          groupByColumnNames.add(`${cleanTableName}.${cleanColumnName}`);
        }
      }
    }
  }
  
  // Also parse from text to get commented columns - these won't be in CST
  // Only add NON-commented expressions from text parsing (commented ones are excluded from GROUP BY)
  for (const expr of allGroupByExpressions) {
    if (!expr.isCommented) {
      const text = expr.text.trim();
      // Try to parse as positional reference (must be pure digits)
      const posMatch = /^\d+$/.test(text);
      if (posMatch) {
        const pos = parseInt(text, 10);
        if (!isNaN(pos) && pos > 0) {
          groupByPositions.add(pos);
        }
      } else {
        // Column reference - normalize and add
        const normalized = text.toLowerCase().replace(/[`"']/g, '').trim();
        if (normalized) {
          groupByColumnNames.add(normalized);
          // Also add parts if it's qualified (table.column)
          const parts = normalized.split('.');
          if (parts.length === 2) {
            groupByColumnNames.add(parts[1]); // Add unqualified name too
          }
        }
      }
    }
  }
  
  // Validate each GROUP BY expression
  for (const groupExpr of groupByExprs) {
    if (!groupExpr) continue;
    
    const location = getLocationFromCst(groupExpr)?.start || { line: 1, column: 1 };
    const nodeType = getNodeType(groupExpr);
    
    // Check if it's a positional reference (column number like 1, 2, 3)
    if (nodeType === 'number' || nodeType === 'NumberLiteral' || nodeType === 'int' || nodeType === 'integer') {
      let colNum: number | null = null;
      
      // Try different CST structures for number literals
      if (typeof groupExpr.value === 'number') {
        colNum = groupExpr.value;
      } else if (groupExpr.value?.value !== undefined && typeof groupExpr.value.value === 'number') {
        colNum = groupExpr.value.value;
      } else if (typeof groupExpr.text === 'string') {
        // Try parsing text representation
        const parsed = parseInt(groupExpr.text, 10);
        if (!isNaN(parsed)) {
          colNum = parsed;
        }
      }
      
      if (colNum !== null && typeof colNum === 'number') {
        // Validate column number is within SELECT column range
        if (colNum < 1 || colNum > selectColumns.length) {
          issues.push({
            message: `GROUP BY column number ${colNum} is out of range. SELECT has ${selectColumns.length} column${selectColumns.length !== 1 ? 's' : ''}.`,
            line: location.line || 1,
            column: location.column || 1,
            length: String(colNum).length,
            severity: 'error',
            rule: 'group-by-positional-out-of-range',
          });
        }
        // Positional reference is valid if it's within range
        continue;
      }
    }
    
    // Check if it's a column reference
    if (isColumnRef(groupExpr) || nodeType === 'member_expr' || nodeType === 'MemberExpr' || 
        nodeType === 'identifier' || nodeType === 'Identifier') {
      const columnName = extractColumnName(groupExpr);
      const tableName = extractTableName(groupExpr);
      
      if (!columnName) {
        // Could be a complex expression - skip validation for now
        continue;
      }
      
      const cleanColumnName = stripIdentifierQuotes(columnName).toLowerCase();
      const cleanTableName = tableName ? stripIdentifierQuotes(tableName).toLowerCase() : null;
      
      // First, check if it matches a SELECT column alias
      if (selectAliasToPosition.has(cleanColumnName)) {
        // Valid - it's a SELECT alias
        continue;
      }
      
      // Check if it matches a SELECT column name (without alias)
      let foundInSelect = false;
      for (const [pos, selectColName] of selectColumnNames.entries()) {
        if (selectColName === cleanColumnName) {
          foundInSelect = true;
          break;
        }
      }
      
      if (foundInSelect && !cleanTableName) {
        // Valid - it's a SELECT column name without table qualifier
        continue;
      }
      
      // If table alias is specified, validate against that table
      if (cleanTableName) {
        const aliasInfo = aliasMap.get(cleanTableName);
        
        if (!aliasInfo) {
          issues.push({
            message: `Unknown table or alias "${tableName}" used in GROUP BY clause`,
            line: location.line || 1,
            column: location.column || 1,
            length: Math.max(columnName.length, tableName?.length || 0),
            severity: 'error',
            rule: 'group-by-unknown-alias',
          });
          continue;
        }
        
        // If it's a CTE or subquery, check against CTE columns
        if (aliasInfo.cteColumns && aliasInfo.cteColumns.length > 0) {
          const hasColumn = aliasInfo.cteColumns.some(
            (col) => col.toLowerCase() === cleanColumnName
          );
          if (!hasColumn) {
            issues.push({
              message: `Column "${columnName}" not found in ${aliasInfo.alias || tableName}`,
              line: location.line || 1,
              column: location.column || 1,
              length: columnName.length,
              severity: 'error',
              rule: 'group-by-column-not-found',
            });
          }
          continue;
        }
        
        // If it's a real table, validate against schema
        if (aliasInfo.datasetId && aliasInfo.tableId) {
          if (!canFetchSchemas) {
            // Can't validate without schema access
            continue;
          }
          
          const fields = await getTableFields(aliasInfo.datasetId, aliasInfo.tableId);
          if (fields === null) {
            // Schema lookup failed - skip validation
            continue;
          }
          
          const hasColumn = fields.some((fieldName) => fieldName.toLowerCase() === cleanColumnName);
          if (!hasColumn) {
            const targetName = aliasInfo.alias || `${aliasInfo.datasetId}.${aliasInfo.tableId}`;
            issues.push({
              message: `Column "${columnName}" not found in ${targetName}`,
              line: location.line || 1,
              column: location.column || 1,
              length: columnName.length,
              severity: 'error',
              rule: 'group-by-column-not-found',
            });
          }
          continue;
        }
      }
      
      // No table alias - check against all tables and SELECT columns
      if (!cleanTableName) {
        // Already checked SELECT columns above, now check tables
        if (!canFetchSchemas) {
          // Can't validate without schema access
          continue;
        }
        
        // Check if column exists in any table
        let columnFound = false;
        
        for (const tableInfo of uniqueTableList) {
          if (!tableInfo.datasetId || !tableInfo.tableId) {
            continue;
          }
          
          const fields = await getTableFields(tableInfo.datasetId, tableInfo.tableId);
          if (fields === null) {
            continue;
          }
          
          const hasColumn = fields.some((fieldName) => fieldName.toLowerCase() === cleanColumnName);
          if (hasColumn) {
            columnFound = true;
            break;
          }
        }
        
        // Also check SELECT column names/aliases again
        if (!columnFound) {
          // Check if column name matches any SELECT column name
          for (const selectColName of selectColumnNames.values()) {
            if (selectColName === cleanColumnName) {
              columnFound = true;
              break;
            }
          }
          // Check if it matches a SELECT alias
          if (!columnFound && selectAliasToPosition.has(cleanColumnName)) {
            columnFound = true;
          }
        }
        
        if (!columnFound && uniqueTableList.length > 0) {
          issues.push({
            message: `Column "${columnName}" in GROUP BY clause not found in referenced tables or SELECT columns`,
            line: location.line || 1,
            column: location.column || 1,
            length: columnName.length,
            severity: 'error',
            rule: 'group-by-column-not-found',
          });
        }
      }
    }
  }
  
  // Reverse validation: Check that all non-aggregated SELECT columns are in GROUP BY
  // This catches cases where columns are commented out or missing from GROUP BY
  for (let i = 0; i < selectColumns.length; i++) {
    const col = selectColumns[i];
    const expr = col?.expr ?? col?.expression ?? col;
    const position = i + 1;
    
    // Skip literals (NULL, numbers, strings, booleans) - they don't need to be in GROUP BY
    if (isLiteral(expr)) {
      continue;
    }
    
    // Skip CASE expressions - they're complex expressions that don't need to be in GROUP BY
    // (though columns referenced within CASE expressions should still be validated separately)
    if (isCaseExpression(expr)) {
      continue;
    }
    
    // Skip if it's an aggregate function or has OVER clause (window function)
    if (isFunctionCall(expr)) {
      const funcName = extractFunctionName(expr);
      if (funcName && BIGQUERY_AGGREGATE_FUNCTIONS.has(funcName)) {
        continue;
      }
    }
    if (expr?.overClause || expr?.over || expr?.window) {
      continue;
    }
    
    // Skip SELECT * 
    if (getNodeType(expr) === 'star' || col === '*') {
      continue;
    }
    
    // Check if column has an aggregate function anywhere in its expression
    const hasAggregate = containsAggregateFunction(expr);
    if (hasAggregate.found) {
      continue;
    }
    
    // Check if this SELECT column is covered by GROUP BY
    let isCovered = false;
    
    // Check positional reference
    if (groupByPositions.has(position)) {
      isCovered = true;
    }
    
    // Check column name/alias
    if (!isCovered) {
      // Get column alias
      const alias = col?.as || col?.alias;
      let aliasName: string | null = null;
      if (alias) {
        if (typeof alias === 'string') {
          aliasName = stripIdentifierQuotes(alias).toLowerCase();
        } else if (alias.name) {
          aliasName = stripIdentifierQuotes(typeof alias.name === 'string' ? alias.name : alias.name.value).toLowerCase();
        } else if (alias.text) {
          aliasName = stripIdentifierQuotes(alias.text).toLowerCase();
        } else if (alias.value) {
          aliasName = stripIdentifierQuotes(alias.value).toLowerCase();
        }
      }
      
      // Check if alias is in GROUP BY (both qualified and unqualified)
      if (aliasName && !isCovered) {
        const aliasLower = aliasName.toLowerCase();
        if (groupByColumnNames.has(aliasLower)) {
          isCovered = true;
        }
        // Also check if alias matches a qualified name in GROUP BY (e.g., "o.discount" matches alias "discount")
        for (const groupByName of groupByColumnNames) {
          const parts = groupByName.split('.');
          if (parts.length === 2 && parts[1] === aliasLower) {
            isCovered = true;
            break;
          }
        }
      }
      
      // Check column name - try multiple matching strategies
      // Handle both column_ref and member_expr (table.column)
      const nodeType = getNodeType(expr);
      const isColumnReference = isColumnRef(expr) || nodeType === 'member_expr' || nodeType === 'MemberExpr' || 
                                nodeType === 'identifier' || nodeType === 'Identifier';
      
      if (!isCovered && isColumnReference) {
        const columnName = extractColumnName(expr);
        const tableName = extractTableName(expr);
        
        if (columnName) {
          const cleanColumnName = stripIdentifierQuotes(columnName).toLowerCase();
          
          // Build qualified name if table is specified
          let qualifiedName: string | null = null;
          if (tableName) {
            const cleanTableName = stripIdentifierQuotes(tableName).toLowerCase();
            qualifiedName = `${cleanTableName}.${cleanColumnName}`;
          }
          
          // Check qualified name first (most specific) - e.g., "o.discount"
          if (qualifiedName && groupByColumnNames.has(qualifiedName)) {
            isCovered = true;
          }
          
          // Check unqualified name - e.g., "discount"
          // This handles cases where GROUP BY uses unqualified name but SELECT uses qualified
          if (!isCovered && groupByColumnNames.has(cleanColumnName)) {
            // If SELECT has a table qualifier, we prefer qualified match
            // But if GROUP BY only has unqualified, that's also valid
            // Check if there's a qualified version in GROUP BY that matches
            let hasMatchingQualified = false;
            if (qualifiedName) {
              // Check if any GROUP BY name starts with table.column
              for (const groupByName of groupByColumnNames) {
                if (groupByName === qualifiedName || 
                    (groupByName.startsWith(`${tableName?.toLowerCase()}.`) && 
                     groupByName.endsWith(`.${cleanColumnName}`))) {
                  hasMatchingQualified = true;
                  break;
                }
              }
            }
            
            // If we have a qualified name and GROUP BY has matching qualified, use that
            // Otherwise, unqualified match is valid
            if (!qualifiedName || !hasMatchingQualified) {
              isCovered = true;
            }
          }
          
          // Also check text-based parsing results for exact matches
          // This is important because CST parsing might miss some edge cases
          if (!isCovered) {
            for (const textExpr of allGroupByExpressions) {
              if (!textExpr.isCommented) {
                const textLower = textExpr.text.toLowerCase().replace(/[`"']/g, '').trim();
                
                // Exact match (qualified or unqualified)
                if (textLower === cleanColumnName || textLower === qualifiedName) {
                  isCovered = true;
                  break;
                }
                
                // Check if text is qualified and matches our column name
                const textParts = textLower.split('.');
                if (qualifiedName && textParts.length === 2) {
                  const textTable = textParts[0];
                  const textColumn = textParts[1];
                  const cleanTableName = tableName ? stripIdentifierQuotes(tableName).toLowerCase() : null;
                  
                  // Match if table and column both match
                  if (textColumn === cleanColumnName && 
                      (cleanTableName === null || textTable === cleanTableName)) {
                    isCovered = true;
                    break;
                  }
                }
                
                // Also check reverse: if our qualified name matches text's qualified name
                if (qualifiedName && textParts.length === 2) {
                  const textQualified = textLower;
                  if (textQualified === qualifiedName) {
                    isCovered = true;
                    break;
                  }
                }
              }
            }
          }
          
          // Check if this column name appears in SELECT column names map
          // (in case it's referenced by position in GROUP BY)
          if (!isCovered) {
            for (const [pos, selectColName] of selectColumnNames.entries()) {
              // Match both qualified and unqualified names
              // selectColName might be qualified (o.discount) or unqualified (discount)
              const matchesQualified = qualifiedName && selectColName === qualifiedName;
              const matchesUnqualified = selectColName === cleanColumnName;
              // Also check if selectColName is qualified and matches our unqualified name
              const selectColParts = selectColName.split('.');
              const matchesQualifiedUnqualified = qualifiedName && selectColParts.length === 2 && 
                                                  selectColParts[1] === cleanColumnName &&
                                                  selectColParts[0] === tableName?.toLowerCase();
              
              if ((matchesQualified || matchesUnqualified || matchesQualifiedUnqualified) && 
                  groupByPositions.has(pos)) {
                isCovered = true;
                break;
              }
            }
          }
          
          // Final fallback: check all GROUP BY column names for any match
          // This handles edge cases where CST parsing might miss exact matches
          if (!isCovered) {
            for (const groupByName of groupByColumnNames) {
              // Exact match
              if (groupByName === qualifiedName || groupByName === cleanColumnName) {
                isCovered = true;
                break;
              }
              
              // Check if GROUP BY name is qualified and matches our column
              const groupByParts = groupByName.split('.');
              if (qualifiedName && groupByParts.length === 2) {
                const groupByTable = groupByParts[0];
                const groupByColumn = groupByParts[1];
                const cleanTableName = tableName ? stripIdentifierQuotes(tableName).toLowerCase() : null;
                
                // Match if both table and column match
                if (groupByColumn === cleanColumnName && 
                    (cleanTableName === null || groupByTable === cleanTableName)) {
                  isCovered = true;
                  break;
                }
              }
              
              // Check if our qualified name matches GROUP BY's qualified name
              if (qualifiedName && groupByParts.length === 2 && groupByName === qualifiedName) {
                isCovered = true;
                break;
              }
            }
          }
        }
      }
      
      // Also check if the SELECT column's alias matches any GROUP BY column
      // This handles cases where SELECT has an alias that matches GROUP BY
      if (!isCovered && aliasName) {
        const aliasLower = aliasName.toLowerCase();
        // Check if alias matches GROUP BY (could be qualified or unqualified)
        if (groupByColumnNames.has(aliasLower)) {
          isCovered = true;
        }
        // Check if GROUP BY has a qualified name ending with this alias
        if (!isCovered) {
          for (const groupByName of groupByColumnNames) {
            const parts = groupByName.split('.');
            if (parts.length === 2 && parts[1] === aliasLower) {
              isCovered = true;
              break;
            }
          }
        }
      }
    }
    
    // If not covered, report error
    if (!isCovered) {
      const location = getLocationFromCst(expr)?.start || getLocationFromCst(col)?.start || { line: 1, column: 1 };
      const alias = col?.as || col?.alias;
      let aliasName: string | null = null;
      if (alias) {
        if (typeof alias === 'string') {
          aliasName = stripIdentifierQuotes(alias);
        } else if (alias.name) {
          aliasName = stripIdentifierQuotes(typeof alias.name === 'string' ? alias.name : alias.name.value);
        } else if (alias.text) {
          aliasName = stripIdentifierQuotes(alias.text);
        } else if (alias.value) {
          aliasName = stripIdentifierQuotes(alias.value);
        }
      }
      
      // Extract column name - handle both column_ref and member_expr
      const exprNodeType = getNodeType(expr);
      const isColRef = isColumnRef(expr) || exprNodeType === 'member_expr' || exprNodeType === 'MemberExpr' || 
                       exprNodeType === 'identifier' || exprNodeType === 'Identifier';
      const columnName = isColRef ? extractColumnName(expr) : null;
      const tableNameForDisplay = isColRef ? extractTableName(expr) : null;
      
      // Build display name - prefer qualified name if available
      let displayName: string;
      if (aliasName) {
        displayName = aliasName;
      } else if (columnName) {
        if (tableNameForDisplay) {
          displayName = `${tableNameForDisplay}.${columnName}`;
        } else {
          displayName = columnName;
        }
      } else {
        displayName = `column ${position}`;
      }
      
      issues.push({
        message: `SELECT list expression references ${displayName} which is neither grouped nor aggregated`,
        line: location.line || 1,
        column: location.column || 1,
        length: displayName.length || 10,
        severity: 'error',
        rule: 'select-not-in-group-by',
      });
    }
  }
  
  return issues;
};
