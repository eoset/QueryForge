/**
 * SQL Validation Utilities
 * 
 * This module contains utility functions for validating SQL queries,
 * including column reference validation and subquery scope handling.
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
}

export interface ColumnValidationIssue {
  message: string;
  line: number;
  column: number;
  length: number;
}

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

  const registerAlias = (aliasName: string | null | undefined, info: { datasetId?: string; tableId?: string }) => {
    const cleanAlias = stripIdentifierQuotes(aliasName);
    if (!cleanAlias) return;
    const key = cleanAlias.toLowerCase();
    const existing = aliasMap.get(key);
    if (!existing || (!existing.datasetId && info.datasetId) || (!existing.tableId && info.tableId)) {
      aliasMap.set(key, {
        alias: cleanAlias,
        datasetId: info.datasetId,
        tableId: info.tableId,
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
        registerAlias(cteName, {});
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
