/**
 * dbt Utilities
 *
 * Functions for converting between BigQuery SQL syntax and dbt source/ref syntax.
 */

/**
 * Strip SQL comments from query text.
 * Handles both single-line (--) and multi-line comments.
 * Preserves comments inside string literals.
 */
export const stripComments = (sql: string): string => {
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

/**
 * Extract table references from SQL query.
 * Returns array of { datasetId, tableId } objects.
 */
export const extractTableReferences = (
  sql: string
): Array<{ datasetId: string; tableId: string }> => {
  const tableRefsMap = new Map<string, { datasetId: string; tableId: string }>();

  // Strip comments before extracting table references
  const sqlWithoutComments = stripComments(sql);
  const trimmedSql = sqlWithoutComments.trim();

  if (!trimmedSql) return [];

  // Match FROM and JOIN clauses (including LEFT JOIN, RIGHT JOIN, INNER JOIN, etc.)
  const fromJoinPattern =
    /(?:FROM|(?:LEFT|RIGHT|INNER|OUTER|FULL|CROSS)\s+JOIN|JOIN)\s+((?:`[^`]+`(?:\.`[^`]+`){0,2}|`[^`]+`|["'][^"']+["']|[\w-]+(?:\.[\w-]+){0,2}))(?:\s+AS\s+[\w-]+)?/gi;
  const matches = Array.from(trimmedSql.matchAll(fromJoinPattern));

  for (const match of matches) {
    let tableRef = match[1].trim();

    // Remove quotes/backticks
    tableRef = tableRef.replace(/[`"']/g, '');

    // Parse table reference
    const parts = tableRef.split('.').filter((p) => p.length > 0);

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
      const key = `${datasetId}.${tableId}`;
      if (!tableRefsMap.has(key)) {
        tableRefsMap.set(key, { datasetId, tableId });
      }
    }
  }

  return Array.from(tableRefsMap.values());
};

/**
 * Convert SQL to dbt syntax by replacing table references with {{ source('DATASET', 'TABLE') }}.
 */
export const convertToDbtSyntax = (sql: string): string => {
  let result = sql;

  // Only match table references that come after FROM or JOIN keywords
  const fromJoinTablePattern =
    /(\b(?:FROM|JOIN)\s+)((?:`[^`]+`|[a-zA-Z0-9_-]+(?:\.[a-zA-Z0-9_-]+){1,2}))(\s|$|,|\))/gi;

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
      // Not a valid table reference
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

    // Replace just the table reference part
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

/**
 * Check if the query contains dbt source/ref syntax.
 */
export const hasDbtSyntax = (sql: string): boolean => {
  return sql.includes("{{ source('") || sql.includes("{{ ref('");
};

/**
 * Convert dbt source syntax back to BigQuery table references.
 *
 * @param sql - The SQL with dbt syntax
 * @param projectId - The BigQuery project ID to use
 * @param getAllTables - Function to get all cached tables for ref() lookup
 */
export const convertFromDbtSyntax = (
  sql: string,
  projectId: string,
  getAllTables: () => Array<{ dataset: string; table: { id: string } }>
): string => {
  // Pattern to match {{ source('DATASET', 'TABLE') }}
  const dbtSourcePattern =
    /\{\{\s*source\s*\(\s*'([^']+)'\s*,\s*'([^']+)'\s*\)\s*\}\}/g;

  // Pattern to match {{ ref('TABLE') }}
  const dbtRefPattern = /\{\{\s*ref\s*\(\s*'([^']+)'\s*\)\s*\}\}/g;

  let result = sql.replace(dbtSourcePattern, (_, datasetId, tableId) => {
    return `${projectId}.${datasetId}.${tableId}`;
  });

  result = result.replace(dbtRefPattern, (match, tableId) => {
    // Search for the table in cached metadata
    const tableIdLower = tableId.toLowerCase();
    const allTables = getAllTables();
    const foundTable = allTables.find(
      (t) => t.table.id.toLowerCase() === tableIdLower
    );

    if (foundTable) {
      return `${projectId}.${foundTable.dataset}.${foundTable.table.id}`;
    }

    // Table not found in cache - return just the table name as fallback
    return tableId;
  });

  return result;
};
