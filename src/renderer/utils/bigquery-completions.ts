/**
 * BigQuery IntelliSense and code completion provider for Monaco Editor
 */

// Import metadata store - use dynamic import to avoid circular dependencies
let metadataStoreGetter: (() => any) | null = null;

export function setMetadataStoreGetter(getter: () => any) {
  metadataStoreGetter = getter;
}

// Schema cache to avoid repeated API calls
const schemaCache = new Map<string, Promise<any[]>>();

// Get table schema (with caching)
async function getTableSchema(
  projectId: string,
  datasetId: string,
  tableId: string
): Promise<any[]> {
  const cacheKey = `${projectId}.${datasetId}.${tableId}`;
  
  if (schemaCache.has(cacheKey)) {
    return schemaCache.get(cacheKey)!;
  }
  
  const schemaPromise = (async () => {
    try {
      if (typeof window !== 'undefined' && window.electronAPI) {
        const result = await window.electronAPI.bigquery.getTableSchema(datasetId, tableId);
        return result.fields || [];
      }
      return [];
    } catch (error) {
      // Return empty array on error, don't cache errors
      return [];
    }
  })();
  
  schemaCache.set(cacheKey, schemaPromise);
  return schemaPromise;
}

// Monaco CompletionItemKind enum values (using numeric constants to avoid importing monaco-editor)
const CompletionItemKind = {
  Function: 1,
  Keyword: 14,
  Class: 7, // Use Class for tables
  Module: 9, // Use Module for datasets
  Property: 10, // Use Property for projects
} as const;

const CompletionItemInsertTextRule = {
  InsertAsSnippet: 4,
} as const;

type Monaco = typeof import('monaco-editor');

// BigQuery SQL Keywords
const BIGQUERY_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'GROUP', 'BY', 'ORDER', 'HAVING', 'LIMIT', 'OFFSET',
  'JOIN', 'INNER', 'LEFT', 'RIGHT', 'FULL', 'OUTER', 'ON', 'USING', 'CROSS',
  'UNION', 'ALL', 'DISTINCT', 'AS', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
  'AND', 'OR', 'NOT', 'IN', 'EXISTS', 'LIKE', 'ILIKE', 'BETWEEN', 'IS', 'NULL',
  'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE',
  'VIEW', 'DROP', 'ALTER', 'INDEX', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES',
  'CONSTRAINT', 'DEFAULT', 'CHECK', 'UNIQUE', 'WITH', 'RECURSIVE', 'WINDOW',
  'OVER', 'PARTITION', 'ROWS', 'RANGE', 'PRECEDING', 'FOLLOWING', 'CURRENT',
  'ROW', 'UNBOUNDED', 'INTERVAL', 'CAST', 'SAFE_CAST', 'EXTRACT', 'DATE',
  'DATETIME', 'TIME', 'TIMESTAMP', 'STRING', 'INT64', 'FLOAT64', 'BOOL',
  'BYTES', 'ARRAY', 'STRUCT', 'GEOGRAPHY', 'JSON', 'NUMERIC', 'BIGNUMERIC',
  'DECIMAL', 'TRUE', 'FALSE', 'IF', 'COALESCE', 'NULLIF', 'GREATEST', 'LEAST',
];

// BigQuery Date/Time Functions
const DATE_TIME_FUNCTIONS = [
  {
    label: 'CURRENT_DATE',
    kind: CompletionItemKind.Function,
    insertText: 'CURRENT_DATE()',
    documentation: 'Returns the current date as a DATE value.',
    detail: 'DATE CURRENT_DATE()',
  },
  {
    label: 'CURRENT_DATETIME',
    kind: CompletionItemKind.Function,
    insertText: 'CURRENT_DATETIME()',
    documentation: 'Returns the current date and time as a DATETIME value.',
    detail: 'DATETIME CURRENT_DATETIME([timezone])',
  },
  {
    label: 'CURRENT_TIME',
    kind: CompletionItemKind.Function,
    insertText: 'CURRENT_TIME()',
    documentation: 'Returns the current time as a TIME value.',
    detail: 'TIME CURRENT_TIME([timezone])',
  },
  {
    label: 'CURRENT_TIMESTAMP',
    kind: CompletionItemKind.Function,
    insertText: 'CURRENT_TIMESTAMP()',
    documentation: 'Returns the current date and time as a TIMESTAMP value.',
    detail: 'TIMESTAMP CURRENT_TIMESTAMP()',
  },
  {
    label: 'DATE',
    kind: CompletionItemKind.Function,
    insertText: 'DATE(${1:timestamp})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Converts a timestamp to a DATE value.',
    detail: 'DATE DATE(timestamp)',
  },
  {
    label: 'DATE_ADD',
    kind: CompletionItemKind.Function,
    insertText: 'DATE_ADD(${1:date}, INTERVAL ${2:number} ${3|DAY,WEEK,MONTH,YEAR|})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Adds a specified time interval to a DATE value.',
    detail: 'DATE DATE_ADD(date, INTERVAL number date_part)',
  },
  {
    label: 'DATE_SUB',
    kind: CompletionItemKind.Function,
    insertText: 'DATE_SUB(${1:date}, INTERVAL ${2:number} ${3|DAY,WEEK,MONTH,YEAR|})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Subtracts a specified time interval from a DATE value.',
    detail: 'DATE DATE_SUB(date, INTERVAL number date_part)',
  },
  {
    label: 'DATE_DIFF',
    kind: CompletionItemKind.Function,
    insertText: 'DATE_DIFF(${1:date1}, ${2:date2}, ${3|DAY,WEEK,MONTH,YEAR|})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns the number of date_part intervals between two DATE values.',
    detail: 'INT64 DATE_DIFF(date1, date2, date_part)',
  },
  {
    label: 'EXTRACT',
    kind: CompletionItemKind.Function,
    insertText: 'EXTRACT(${1|YEAR,MONTH,DAY,HOUR,MINUTE,SECOND|} FROM ${2:date})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Extracts a date part from a date, time, or timestamp.',
    detail: 'INT64 EXTRACT(date_part FROM date)',
  },
  {
    label: 'FORMAT_DATE',
    kind: CompletionItemKind.Function,
    insertText: 'FORMAT_DATE(${1:"%Y-%m-%d"}, ${2:date})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Formats a DATE value according to the specified format string.',
    detail: 'STRING FORMAT_DATE(format_string, date)',
  },
  {
    label: 'PARSE_DATE',
    kind: CompletionItemKind.Function,
    insertText: 'PARSE_DATE(${1:"%Y-%m-%d"}, ${2:date_string})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Converts a string representation of a date to a DATE value.',
    detail: 'DATE PARSE_DATE(format_string, date_string)',
  },
  {
    label: 'TIMESTAMP',
    kind: CompletionItemKind.Function,
    insertText: 'TIMESTAMP(${1:timestamp_string})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Converts a string representation of a timestamp to a TIMESTAMP value.',
    detail: 'TIMESTAMP TIMESTAMP(timestamp_string)',
  },
  {
    label: 'TIMESTAMP_ADD',
    kind: CompletionItemKind.Function,
    insertText: 'TIMESTAMP_ADD(${1:timestamp}, INTERVAL ${2:number} ${3|MICROSECOND,MILLISECOND,SECOND,MINUTE,HOUR,DAY|})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Adds a specified time interval to a TIMESTAMP value.',
    detail: 'TIMESTAMP TIMESTAMP_ADD(timestamp, INTERVAL number date_part)',
  },
  {
    label: 'TIMESTAMP_SUB',
    kind: CompletionItemKind.Function,
    insertText: 'TIMESTAMP_SUB(${1:timestamp}, INTERVAL ${2:number} ${3|MICROSECOND,MILLISECOND,SECOND,MINUTE,HOUR,DAY|})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Subtracts a specified time interval from a TIMESTAMP value.',
    detail: 'TIMESTAMP TIMESTAMP_SUB(timestamp, INTERVAL number date_part)',
  },
  {
    label: 'TIMESTAMP_DIFF',
    kind: CompletionItemKind.Function,
    insertText: 'TIMESTAMP_DIFF(${1:timestamp1}, ${2:timestamp2}, ${3|MICROSECOND,MILLISECOND,SECOND,MINUTE,HOUR,DAY|})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns the number of date_part intervals between two TIMESTAMP values.',
    detail: 'INT64 TIMESTAMP_DIFF(timestamp1, timestamp2, date_part)',
  },
];

// BigQuery String Functions
const STRING_FUNCTIONS = [
  {
    label: 'CONCAT',
    kind: CompletionItemKind.Function,
    insertText: 'CONCAT(${1:value1}, ${2:value2})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Concatenates one or more values into a single string.',
    detail: 'STRING CONCAT(value1, value2, ...)',
  },
  {
    label: 'SUBSTR',
    kind: CompletionItemKind.Function,
    insertText: 'SUBSTR(${1:string}, ${2:position}, ${3:length})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns a substring of the specified string.',
    detail: 'STRING SUBSTR(string, position[, length])',
  },
  {
    label: 'TRIM',
    kind: CompletionItemKind.Function,
    insertText: 'TRIM(${1:string})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Removes leading and trailing whitespace from a string.',
    detail: 'STRING TRIM(string)',
  },
  {
    label: 'UPPER',
    kind: CompletionItemKind.Function,
    insertText: 'UPPER(${1:string})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Converts a string to uppercase.',
    detail: 'STRING UPPER(string)',
  },
  {
    label: 'LOWER',
    kind: CompletionItemKind.Function,
    insertText: 'LOWER(${1:string})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Converts a string to lowercase.',
    detail: 'STRING LOWER(string)',
  },
  {
    label: 'LENGTH',
    kind: CompletionItemKind.Function,
    insertText: 'LENGTH(${1:string})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns the length of a string in bytes.',
    detail: 'INT64 LENGTH(string)',
  },
  {
    label: 'STARTS_WITH',
    kind: CompletionItemKind.Function,
    insertText: 'STARTS_WITH(${1:string}, ${2:prefix})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns TRUE if the string starts with the specified prefix.',
    detail: 'BOOL STARTS_WITH(string, prefix)',
  },
  {
    label: 'ENDS_WITH',
    kind: CompletionItemKind.Function,
    insertText: 'ENDS_WITH(${1:string}, ${2:suffix})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns TRUE if the string ends with the specified suffix.',
    detail: 'BOOL ENDS_WITH(string, suffix)',
  },
  {
    label: 'REGEXP_CONTAINS',
    kind: CompletionItemKind.Function,
    insertText: 'REGEXP_CONTAINS(${1:string}, ${2:regexp})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns TRUE if the string matches the regular expression.',
    detail: 'BOOL REGEXP_CONTAINS(string, regexp)',
  },
  {
    label: 'REGEXP_EXTRACT',
    kind: CompletionItemKind.Function,
    insertText: 'REGEXP_EXTRACT(${1:string}, ${2:regexp})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Extracts the first substring that matches the regular expression.',
    detail: 'STRING REGEXP_EXTRACT(string, regexp)',
  },
  {
    label: 'REGEXP_REPLACE',
    kind: CompletionItemKind.Function,
    insertText: 'REGEXP_REPLACE(${1:string}, ${2:regexp}, ${3:replacement})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Replaces all substrings that match the regular expression.',
    detail: 'STRING REGEXP_REPLACE(string, regexp, replacement)',
  },
  {
    label: 'SPLIT',
    kind: CompletionItemKind.Function,
    insertText: 'SPLIT(${1:string}, ${2:delimiter})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Splits a string into an array of substrings.',
    detail: 'ARRAY<STRING> SPLIT(string, delimiter)',
  },
];

// BigQuery Aggregate Functions
const AGGREGATE_FUNCTIONS = [
  {
    label: 'COUNT',
    kind: CompletionItemKind.Function,
    insertText: 'COUNT(${1:*})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns the number of rows in the result set.',
    detail: 'INT64 COUNT([DISTINCT] expression)',
  },
  {
    label: 'SUM',
    kind: CompletionItemKind.Function,
    insertText: 'SUM(${1:expression})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns the sum of non-NULL values.',
    detail: 'NUMERIC SUM([DISTINCT] expression)',
  },
  {
    label: 'AVG',
    kind: CompletionItemKind.Function,
    insertText: 'AVG(${1:expression})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns the average of non-NULL values.',
    detail: 'NUMERIC AVG([DISTINCT] expression)',
  },
  {
    label: 'MIN',
    kind: CompletionItemKind.Function,
    insertText: 'MIN(${1:expression})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns the minimum value.',
    detail: 'MIN(expression)',
  },
  {
    label: 'MAX',
    kind: CompletionItemKind.Function,
    insertText: 'MAX(${1:expression})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns the maximum value.',
    detail: 'MAX(expression)',
  },
  {
    label: 'STDDEV',
    kind: CompletionItemKind.Function,
    insertText: 'STDDEV(${1:expression})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns the sample standard deviation of non-NULL values.',
    detail: 'NUMERIC STDDEV([DISTINCT] expression)',
  },
  {
    label: 'STDDEV_POP',
    kind: CompletionItemKind.Function,
    insertText: 'STDDEV_POP(${1:expression})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns the population standard deviation of non-NULL values.',
    detail: 'NUMERIC STDDEV_POP([DISTINCT] expression)',
  },
  {
    label: 'VARIANCE',
    kind: CompletionItemKind.Function,
    insertText: 'VARIANCE(${1:expression})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns the sample variance of non-NULL values.',
    detail: 'NUMERIC VARIANCE([DISTINCT] expression)',
  },
  {
    label: 'ARRAY_AGG',
    kind: CompletionItemKind.Function,
    insertText: 'ARRAY_AGG(${1:expression})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns an array of expression values.',
    detail: 'ARRAY ARRAY_AGG([DISTINCT] expression [ORDER BY key])',
  },
  {
    label: 'STRING_AGG',
    kind: CompletionItemKind.Function,
    insertText: 'STRING_AGG(${1:expression}, ${2:delimiter})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns a concatenated string of expression values.',
    detail: 'STRING STRING_AGG([DISTINCT] expression, delimiter [ORDER BY key])',
  },
];

// BigQuery Window Functions
const WINDOW_FUNCTIONS = [
  {
    label: 'ROW_NUMBER',
    kind: CompletionItemKind.Function,
    insertText: 'ROW_NUMBER() OVER (${1:PARTITION BY ${2:column} ORDER BY ${3:column}})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns the sequential row number within a partition.',
    detail: 'INT64 ROW_NUMBER() OVER (window_spec)',
  },
  {
    label: 'RANK',
    kind: CompletionItemKind.Function,
    insertText: 'RANK() OVER (${1:PARTITION BY ${2:column} ORDER BY ${3:column}})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns the rank of rows within a partition.',
    detail: 'INT64 RANK() OVER (window_spec)',
  },
  {
    label: 'DENSE_RANK',
    kind: CompletionItemKind.Function,
    insertText: 'DENSE_RANK() OVER (${1:PARTITION BY ${2:column} ORDER BY ${3:column}})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns the dense rank of rows within a partition.',
    detail: 'INT64 DENSE_RANK() OVER (window_spec)',
  },
  {
    label: 'LAG',
    kind: CompletionItemKind.Function,
    insertText: 'LAG(${1:expression}, ${2:offset}) OVER (${3:PARTITION BY ${4:column} ORDER BY ${5:column}})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns the value of expression at a specified offset before the current row.',
    detail: 'LAG(expression, offset) OVER (window_spec)',
  },
  {
    label: 'LEAD',
    kind: CompletionItemKind.Function,
    insertText: 'LEAD(${1:expression}, ${2:offset}) OVER (${3:PARTITION BY ${4:column} ORDER BY ${5:column}})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns the value of expression at a specified offset after the current row.',
    detail: 'LEAD(expression, offset) OVER (window_spec)',
  },
  {
    label: 'FIRST_VALUE',
    kind: CompletionItemKind.Function,
    insertText: 'FIRST_VALUE(${1:expression}) OVER (${2:PARTITION BY ${3:column} ORDER BY ${4:column}})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns the value of expression from the first row in the window.',
    detail: 'FIRST_VALUE(expression) OVER (window_spec)',
  },
  {
    label: 'LAST_VALUE',
    kind: CompletionItemKind.Function,
    insertText: 'LAST_VALUE(${1:expression}) OVER (${2:PARTITION BY ${3:column} ORDER BY ${4:column}})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns the value of expression from the last row in the window.',
    detail: 'LAST_VALUE(expression) OVER (window_spec)',
  },
];

// BigQuery Array Functions
const ARRAY_FUNCTIONS = [
  {
    label: 'ARRAY',
    kind: CompletionItemKind.Function,
    insertText: 'ARRAY[${1:value1}, ${2:value2}]',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Creates an array from a list of values.',
    detail: 'ARRAY<T> ARRAY[value1, value2, ...]',
  },
  {
    label: 'ARRAY_LENGTH',
    kind: CompletionItemKind.Function,
    insertText: 'ARRAY_LENGTH(${1:array})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns the length of an array.',
    detail: 'INT64 ARRAY_LENGTH(array)',
  },
  {
    label: 'ARRAY_CONCAT',
    kind: CompletionItemKind.Function,
    insertText: 'ARRAY_CONCAT(${1:array1}, ${2:array2})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Concatenates two arrays.',
    detail: 'ARRAY<T> ARRAY_CONCAT(array1, array2)',
  },
  {
    label: 'UNNEST',
    kind: CompletionItemKind.Function,
    insertText: 'UNNEST(${1:array})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Converts an array into a table with one row per element.',
    detail: 'UNNEST(array)',
  },
];

// BigQuery Conditional Functions
const CONDITIONAL_FUNCTIONS = [
  {
    label: 'IF',
    kind: CompletionItemKind.Function,
    insertText: 'IF(${1:condition}, ${2:true_value}, ${3:false_value})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns one value if condition is true, another if false.',
    detail: 'IF(condition, true_value, false_value)',
  },
  {
    label: 'IFNULL',
    kind: CompletionItemKind.Function,
    insertText: 'IFNULL(${1:expression}, ${2:null_value})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns the first non-NULL expression.',
    detail: 'IFNULL(expression1, expression2)',
  },
  {
    label: 'COALESCE',
    kind: CompletionItemKind.Function,
    insertText: 'COALESCE(${1:expression1}, ${2:expression2})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns the first non-NULL expression.',
    detail: 'COALESCE(expression1, expression2, ...)',
  },
  {
    label: 'NULLIF',
    kind: CompletionItemKind.Function,
    insertText: 'NULLIF(${1:expression1}, ${2:expression2})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns NULL if expression1 equals expression2, otherwise returns expression1.',
    detail: 'NULLIF(expression1, expression2)',
  },
  {
    label: 'GREATEST',
    kind: CompletionItemKind.Function,
    insertText: 'GREATEST(${1:value1}, ${2:value2})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns the greatest value among all arguments.',
    detail: 'GREATEST(value1, value2, ...)',
  },
  {
    label: 'LEAST',
    kind: CompletionItemKind.Function,
    insertText: 'LEAST(${1:value1}, ${2:value2})',
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: 'Returns the least value among all arguments.',
    detail: 'LEAST(value1, value2, ...)',
  },
];

// Combine all functions
const ALL_FUNCTIONS = [
  ...DATE_TIME_FUNCTIONS,
  ...STRING_FUNCTIONS,
  ...AGGREGATE_FUNCTIONS,
  ...WINDOW_FUNCTIONS,
  ...ARRAY_FUNCTIONS,
  ...CONDITIONAL_FUNCTIONS,
];

// Create keyword completions (range will be added in the provider)
const createKeywordCompletions = () => {
  return BIGQUERY_KEYWORDS.map((keyword) => ({
    label: keyword,
    kind: CompletionItemKind.Keyword,
    insertText: keyword,
    detail: 'BigQuery Keyword',
  }));
};

/**
 * Parses table reference pattern from text
 * Returns { project, dataset, table, prefix } or null if not a table reference
 */
function parseTableReference(text: string): {
  project?: string;
  dataset?: string;
  table?: string;
  prefix: string;
} | null {
  if (!text) return null;
  
  // Remove backticks for parsing
  const cleanText = text.replace(/`/g, '').trim();
  
  // Handle case where text ends with a dot (e.g., "project.dataset.")
  const endsWithDot = cleanText.endsWith('.');
  const textToParse = endsWithDot ? cleanText.slice(0, -1) : cleanText;
  
  // Match patterns like: project.dataset.table, dataset.table, or just table
  // Also handle partial matches like project.dataset. or dataset.
  const parts = textToParse.split('.').filter(p => p.length > 0);
  
  if (parts.length === 0) {
    return null;
  } else if (parts.length === 1) {
    // Just a table name or partial table name, or dataset name if ends with dot
    if (endsWithDot) {
      return { dataset: parts[0], table: '', prefix: '' };
    }
    return { table: parts[0], prefix: parts[0] };
  } else if (parts.length === 2) {
    // dataset.table or partial, or project.dataset if ends with dot
    if (endsWithDot) {
      return { project: parts[0], dataset: parts[1], table: '', prefix: '' };
    }
    return { dataset: parts[0], table: parts[1] || '', prefix: parts[1] || '' };
  } else if (parts.length === 3) {
    // project.dataset.table or partial
    return { project: parts[0], dataset: parts[1], table: parts[2] || '', prefix: parts[2] || '' };
  }
  
  return null;
}

/**
 * Extracts dataset and table identifiers from a table reference string
 */
function resolveDatasetTableFromRef(tableRef: string): { datasetId: string; tableId: string } | null {
  if (!tableRef) {
    return null;
  }

  const cleanRef = tableRef.replace(/[`"']/g, '');
  const parts = cleanRef.split('.').filter((part) => part.length > 0);

  if (parts.length === 2) {
    return { datasetId: parts[0], tableId: parts[1] };
  }

  if (parts.length === 3) {
    return { datasetId: parts[1], tableId: parts[2] };
  }

  return null;
}

/**
 * Gets text before cursor that might be a table reference
 */
function getTableReferenceText(model: any, position: any): string | null {
  const lineText = model.getLineContent(position.lineNumber);
  const textBeforeCursor = lineText.substring(0, position.column - 1);
  
  // Check if we're right after a dot FIRST (e.g., "project.dataset." or "dataset.")
  // This handles the case where user types "project.dataset." and expects table suggestions
  // This must be checked before the general dot check to catch trailing dots
  const dotMatch = textBeforeCursor.match(/([a-zA-Z0-9_`-]+(?:\.[a-zA-Z0-9_`-]+)*)\.$/);
  if (dotMatch) {
    return dotMatch[1] + '.';
  }
  
  // Look backwards from cursor to find the start of a potential table reference
  // Stop at whitespace, operators, or keywords like FROM, JOIN, etc.
  // Note: Don't stop at hyphens or dots as they're part of identifiers
  const stopPattern = /[\s,;()\[\]+*/=<>!|&]/;
  let end = textBeforeCursor.length;
  let start = end;
  
  // Find the end of the current word/identifier
  // Allow dots and hyphens in identifiers (for project.dataset.table and project-dataset-table)
  while (start > 0) {
    const char = textBeforeCursor[start - 1];
    if (stopPattern.test(char)) {
      break;
    }
    // Allow dots, hyphens, backticks, and alphanumeric characters
    if (!/[a-zA-Z0-9_`.\-]/.test(char)) {
      break;
    }
    start--;
  }
  
  // Get the text that might be a table reference
  const potentialRef = textBeforeCursor.substring(start, end).trim();
  
  // Always check if it contains dots (indicating project.dataset.table pattern)
  // This is the most reliable indicator of a table reference
  if (potentialRef.includes('.')) {
    return potentialRef;
  }
  
  // If no dots, check if we're in a context where table names are expected
  // Look for FROM, JOIN keywords before the cursor
  const fromMatch = textBeforeCursor.match(/\b(FROM|JOIN)\s+([^,\s;()]+)$/i);
  if (fromMatch) {
    return fromMatch[2];
  }
  
  // If we have a partial identifier and we're in a FROM/JOIN context, return it
  if (potentialRef && /[a-zA-Z0-9_`-]/.test(potentialRef)) {
    // Check if there's a FROM or JOIN keyword nearby
    const contextMatch = textBeforeCursor.match(/\b(FROM|JOIN)\s+[^,\s;()]*$/i);
    if (contextMatch) {
      return potentialRef;
    }
  }
  
  return null;
}

interface StatementContext {
  statementText: string;
  statementStartOffset: number;
  statementEndOffset: number;
  cursorOffsetInStatement: number;
  textBeforeCursor: string;
}

interface StatementBounds {
  startOffset: number;
  endOffset: number;
}

interface ScanState {
  inSingleQuote: boolean;
  inDoubleQuote: boolean;
  inBacktick: boolean;
  inLineComment: boolean;
  inBlockComment: boolean;
}

function createInitialScanState(): ScanState {
  return {
    inSingleQuote: false,
    inDoubleQuote: false,
    inBacktick: false,
    inLineComment: false,
    inBlockComment: false,
  };
}

function advanceScanState(state: ScanState, text: string, index: number): number {
  const char = text[index];
  const nextChar = index + 1 < text.length ? text[index + 1] : '';

  if (state.inLineComment) {
    if (char === '\n') {
      state.inLineComment = false;
    } else if (char === '\r') {
      state.inLineComment = false;
    }
    return 1;
  }

  if (state.inBlockComment) {
    if (char === '*' && nextChar === '/') {
      state.inBlockComment = false;
      return 2;
    }
    return 1;
  }

  if (!state.inSingleQuote && !state.inDoubleQuote && !state.inBacktick) {
    if (char === '-' && nextChar === '-') {
      state.inLineComment = true;
      return 2;
    }
    if (char === '/' && nextChar === '*') {
      state.inBlockComment = true;
      return 2;
    }
  }

  if (!state.inDoubleQuote && !state.inBacktick && char === "'") {
    if (state.inSingleQuote && nextChar === "'") {
      return 2;
    }
    state.inSingleQuote = !state.inSingleQuote;
    return 1;
  }

  if (!state.inSingleQuote && !state.inBacktick && char === '"') {
    if (state.inDoubleQuote && nextChar === '"') {
      return 2;
    }
    state.inDoubleQuote = !state.inDoubleQuote;
    return 1;
  }

  if (!state.inSingleQuote && !state.inDoubleQuote && char === '`') {
    state.inBacktick = !state.inBacktick;
    return 1;
  }

  return 1;
}

function findStatementBounds(fullText: string, cursorOffset: number): StatementBounds {
  const len = fullText.length;
  const stateBeforeCursor = createInitialScanState();
  let startOffset = 0;
  let i = 0;

  while (i < Math.min(cursorOffset, len)) {
    const char = fullText[i];
    if (
      !stateBeforeCursor.inSingleQuote &&
      !stateBeforeCursor.inDoubleQuote &&
      !stateBeforeCursor.inBacktick &&
      !stateBeforeCursor.inLineComment &&
      !stateBeforeCursor.inBlockComment &&
      char === ';'
    ) {
      startOffset = i + 1;
      i++;
      continue;
    }
    i += advanceScanState(stateBeforeCursor, fullText, i);
  }

  const stateAfterCursor: ScanState = { ...stateBeforeCursor };
  let endOffset = len;
  let j = cursorOffset;

  while (j < len) {
    const char = fullText[j];
    if (
      !stateAfterCursor.inSingleQuote &&
      !stateAfterCursor.inDoubleQuote &&
      !stateAfterCursor.inBacktick &&
      !stateAfterCursor.inLineComment &&
      !stateAfterCursor.inBlockComment &&
      char === ';'
    ) {
      endOffset = j;
      break;
    }
    j += advanceScanState(stateAfterCursor, fullText, j);
  }

  return { startOffset, endOffset };
}

function getStatementContext(model: any, position: any): StatementContext | null {
  if (!model || typeof model.getValue !== 'function' || typeof model.getOffsetAt !== 'function') {
    return null;
  }
  const fullText = model.getValue();
  const cursorOffset = model.getOffsetAt(position);
  const { startOffset, endOffset } = findStatementBounds(fullText, cursorOffset);
  const safeStart = Math.max(0, startOffset);
  const safeEnd = Math.max(safeStart, endOffset);
  const statementText = fullText.substring(safeStart, safeEnd);
  const cursorOffsetInStatement = cursorOffset - safeStart;
  return {
    statementText,
    statementStartOffset: safeStart,
    statementEndOffset: safeEnd,
    cursorOffsetInStatement,
    textBeforeCursor: statementText.substring(0, Math.max(0, cursorOffsetInStatement)),
  };
}

/**
 * Parses JOIN statements from SQL to extract table references and aliases
 * Returns array of { tableRef, alias, joinType } for each JOIN
 */
function parseJoinStatements(sql: string): Array<{
  tableRef: string;
  alias: string | null;
  joinType: string;
  position: number;
}> {
  const joins: Array<{ tableRef: string; alias: string | null; joinType: string; position: number }> = [];
  
  // Strip comments to avoid matching inside comments
  const stripComments = (text: string): string => {
    let result = '';
    let i = 0;
    const len = text.length;
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let inBacktick = false;

    while (i < len) {
      const char = text[i];
      const nextChar = i + 1 < len ? text[i + 1] : '';

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

      if (inSingleQuote || inDoubleQuote || inBacktick) {
        result += char;
        i++;
        continue;
      }

      if (char === '-' && nextChar === '-') {
        while (i < len && text[i] !== '\n' && text[i] !== '\r') {
          i++;
        }
        if (i < len && text[i] === '\n') {
          result += '\n';
          i++;
        } else if (i < len && text[i] === '\r') {
          result += '\r';
          i++;
          if (i < len && text[i] === '\n') {
            result += '\n';
            i++;
          }
        }
        continue;
      }

      if (char === '/' && nextChar === '*') {
        i += 2;
        while (i < len) {
          if (text[i] === '*' && i + 1 < len && text[i + 1] === '/') {
            i += 2;
            break;
          }
          i++;
        }
        result += ' ';
        continue;
      }

      result += char;
      i++;
    }

    return result;
  };
  
  const sqlWithoutComments = stripComments(sql);
  
  // Match JOIN patterns: [LEFT|RIGHT|INNER|OUTER|FULL|CROSS] JOIN table_ref [AS alias] or table_ref alias
  // First try to match with explicit AS
  const joinPatternWithAs = /\b((?:LEFT|RIGHT|INNER|OUTER|FULL|CROSS)\s+)?JOIN\s+((?:`[^`]+`|["'][^"']+["']|[\w\-]+(?:\.[\w\-]+){0,2}))\s+AS\s+([\w\-]+)/gi;
  const matchesWithAs = Array.from(sqlWithoutComments.matchAll(joinPatternWithAs));
  
  for (const match of matchesWithAs) {
    const joinType = (match[1] || '').trim().toUpperCase() || 'INNER';
    const tableRef = match[2].trim();
    const alias = match[3] || null;
    const position = match.index || 0;
    joins.push({ tableRef, alias, joinType, position });
  }
  
  // Then match without AS - look for JOIN table_ref followed by a word that could be an alias
  const joinPatternWithoutAs = /\b((?:LEFT|RIGHT|INNER|OUTER|FULL|CROSS)\s+)?JOIN\s+((?:`[^`]+`|["'][^"']+["']|[\w\-]+(?:\.[\w\-]+){0,2}))\s+([\w\-]+)(?=\s+ON|\s+WHERE|\s+ORDER|\s+GROUP|\s+HAVING|\s+LIMIT|$)/gi;
  const matchesWithoutAs = Array.from(sqlWithoutComments.matchAll(joinPatternWithoutAs));
  
  for (const match of matchesWithoutAs) {
    const joinType = (match[1] || '').trim().toUpperCase() || 'INNER';
    const tableRef = match[2].trim();
    const potentialAlias = match[3] || null;
    
    // Only add if we haven't already added this JOIN (from the AS pattern)
    const alreadyAdded = joins.some(j => 
      j.position === (match.index || 0) && 
      j.tableRef === tableRef
    );
    
    if (!alreadyAdded && potentialAlias) {
      // Verify it's likely an alias (not a keyword or part of table name)
      const isKeyword = /^(ON|WHERE|ORDER|GROUP|HAVING|LIMIT|SELECT|FROM|JOIN|LEFT|RIGHT|INNER|OUTER|FULL|CROSS)$/i.test(potentialAlias);
      if (!isKeyword && !potentialAlias.includes('.')) {
        joins.push({ tableRef, alias: potentialAlias, joinType, position: match.index || 0 });
      }
    }
  }
  
  // Sort joins by position to maintain order
  joins.sort((a, b) => a.position - b.position);
  
  return joins;
}

/**
 * Parses FROM clause to extract the first table reference and alias
 */
function parseFromClause(sql: string): { tableRef: string; alias: string | null } | null {
  const stripComments = (text: string): string => {
    let result = '';
    let i = 0;
    const len = text.length;
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let inBacktick = false;

    while (i < len) {
      const char = text[i];
      const nextChar = i + 1 < len ? text[i + 1] : '';

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

      if (inSingleQuote || inDoubleQuote || inBacktick) {
        result += char;
        i++;
        continue;
      }

      if (char === '-' && nextChar === '-') {
        while (i < len && text[i] !== '\n' && text[i] !== '\r') {
          i++;
        }
        if (i < len && text[i] === '\n') {
          result += '\n';
          i++;
        } else if (i < len && text[i] === '\r') {
          result += '\r';
          i++;
          if (i < len && text[i] === '\n') {
            result += '\n';
            i++;
          }
        }
        continue;
      }

      if (char === '/' && nextChar === '*') {
        i += 2;
        while (i < len) {
          if (text[i] === '*' && i + 1 < len && text[i + 1] === '/') {
            i += 2;
            break;
          }
          i++;
        }
        result += ' ';
        continue;
      }

      result += char;
      i++;
    }

    return result;
  };
  
  const sqlWithoutComments = stripComments(sql);
  
  // Match FROM table_ref [AS alias] or table_ref alias
  // First try with explicit AS
  const fromPatternWithAs = /\bFROM\s+((?:`[^`]+`|["'][^"']+["']|[\w\-]+(?:\.[\w\-]+){0,2}))\s+AS\s+([\w\-]+)/i;
  const matchWithAs = sqlWithoutComments.match(fromPatternWithAs);
  
  if (matchWithAs) {
    return { tableRef: matchWithAs[1].trim(), alias: matchWithAs[2] || null };
  }
  
  // Then try without AS
  const fromPatternWithoutAs = /\bFROM\s+((?:`[^`]+`|["'][^"']+["']|[\w\-]+(?:\.[\w\-]+){0,2}))\s+([\w\-]+)(?=\s+JOIN|\s+WHERE|\s+ORDER|\s+GROUP|\s+HAVING|\s+LIMIT|$)/i;
  const matchWithoutAs = sqlWithoutComments.match(fromPatternWithoutAs);
  
  if (matchWithoutAs) {
    const tableRef = matchWithoutAs[1].trim();
    const potentialAlias = matchWithoutAs[2];
    
    // Verify it's likely an alias (not a keyword)
    const isKeyword = /^(JOIN|WHERE|ORDER|GROUP|HAVING|LIMIT|SELECT)$/i.test(potentialAlias);
    if (!isKeyword && !potentialAlias.includes('.')) {
      return { tableRef, alias: potentialAlias };
    }
  }
  
  // Fallback: just the table reference without alias
  const fromPatternNoAlias = /\bFROM\s+((?:`[^`]+`|["'][^"']+["']|[\w\-]+(?:\.[\w\-]+){0,2}))(?=\s+JOIN|\s+WHERE|\s+ORDER|\s+GROUP|\s+HAVING|\s+LIMIT|$)/i;
  const matchNoAlias = sqlWithoutComments.match(fromPatternNoAlias);
  
  if (matchNoAlias) {
    return { tableRef: matchNoAlias[1].trim(), alias: null };
  }
  
  return null;
}

/**
 * Detects if we're in a SELECT clause and returns all available table references with aliases
 */
function detectSelectContext(
  model: any,
  position: any,
  statementContext?: StatementContext | null
): Array<{ tableRef: string; alias: string | null }> | null {
  const fallbackText = model.getValue();
  const cursorOffset = statementContext ? statementContext.cursorOffsetInStatement : model.getOffsetAt(position);
  const textUpToCursor = statementContext ? statementContext.textBeforeCursor : fallbackText.substring(0, cursorOffset);
  const statementSql = statementContext ? statementContext.statementText : fallbackText;
  
  // Look for the last SELECT before the cursor inside the active statement
  const selectMatches = Array.from(textUpToCursor.matchAll(/\bSELECT\s+/gi)) as RegExpMatchArray[];
  if (selectMatches.length === 0) {
    return null;
  }
  
  const lastSelectMatch = selectMatches[selectMatches.length - 1];
  const selectIndex = lastSelectMatch.index || 0;
  const selectScopedTextUpToCursor = textUpToCursor.substring(selectIndex);
  const selectScopedStatementText = statementSql.substring(selectIndex);
  
  // Find the FROM keyword after the located SELECT
  const fromMatch = selectScopedTextUpToCursor.match(/\bFROM\s+/i);
  
  // If we haven't reached FROM yet, or cursor is before FROM, we're in SELECT clause
  if (!fromMatch || cursorOffset <= selectIndex + (fromMatch.index || 0)) {
    const fromClause = parseFromClause(selectScopedStatementText);
    const joins = parseJoinStatements(selectScopedStatementText);
    
    const tables: Array<{ tableRef: string; alias: string | null }> = [];
    
    if (fromClause) {
      tables.push(fromClause);
    }
    
    for (const join of joins) {
      tables.push({
        tableRef: join.tableRef,
        alias: join.alias,
      });
    }
    
    return tables.length > 0 ? tables : null;
  }
  
  return null;
}

/**
 * Detects if we're in a JOIN ON clause and returns the relevant table references
 */
function detectJoinOnContext(
  model: any,
  position: any,
  statementContext?: StatementContext | null
): { leftTable: { tableRef: string; alias: string | null } | null; rightTable: { tableRef: string; alias: string | null } | null } | null {
  const fallbackText = model.getValue();
  const cursorOffset = statementContext ? statementContext.cursorOffsetInStatement : model.getOffsetAt(position);
  const textUpToCursor = statementContext ? statementContext.textBeforeCursor : fallbackText.substring(0, cursorOffset);
  const statementSql = statementContext ? statementContext.statementText : fallbackText;
  
  const selectMatches = Array.from(textUpToCursor.matchAll(/\bSELECT\s+/gi)) as RegExpMatchArray[];
  if (selectMatches.length === 0) {
    return null;
  }
  const lastSelectMatch = selectMatches[selectMatches.length - 1];
  const selectIndex = lastSelectMatch.index || 0;
  const selectScopedTextUpToCursor = textUpToCursor.substring(selectIndex);
  const selectScopedStatementText = statementSql.substring(selectIndex);
  
  // Check if we're after an ON keyword that follows a JOIN
  const onMatches = Array.from(selectScopedTextUpToCursor.matchAll(/\bON\s+/gi)) as RegExpMatchArray[];
  if (onMatches.length === 0) {
    return null;
  }
  
  const lastOnMatch = onMatches[onMatches.length - 1];
  const onIndex = lastOnMatch.index || 0;
  
  // Ensure there is a JOIN prior to this ON within the active statement
  const textBeforeOn = selectScopedTextUpToCursor.substring(0, onIndex);
  const joinMatch = textBeforeOn.match(/\b(?:LEFT|RIGHT|INNER|OUTER|FULL|CROSS)?\s+JOIN\s+/i);
  if (!joinMatch) {
    return null;
  }
  
  // Parse FROM clause and JOIN statements using text up to cursor to stay within the active statement
  const fromClause = parseFromClause(selectScopedStatementText);
  if (!fromClause) {
    return null;
  }
  
  const joins = parseJoinStatements(selectScopedTextUpToCursor);
  if (joins.length === 0) {
    return null;
  }
  
  const activeJoin = joins[joins.length - 1];
  if (!activeJoin) {
    return null;
  }
  
  const leftTable = fromClause;
  const rightTable = {
    tableRef: activeJoin.tableRef,
    alias: activeJoin.alias,
  };
  
  return { leftTable, rightTable };
}

/**
 * Gets column suggestions for JOIN ON clause
 */
async function getJoinColumnSuggestions(
  projectId: string,
  leftTable: { tableRef: string; alias: string | null },
  rightTable: { tableRef: string; alias: string | null },
  prefix: string = ''
): Promise<any[]> {
  const suggestions: any[] = [];
  
  try {
    // Parse table references to get dataset and table IDs
    const parseTableRef = (tableRef: string): { datasetId: string; tableId: string } | null => {
      const cleanRef = tableRef.replace(/[`"']/g, '');
      const parts = cleanRef.split('.').filter(p => p.length > 0);
      
      if (parts.length === 2) {
        return { datasetId: parts[0], tableId: parts[1] };
      } else if (parts.length === 3) {
        return { datasetId: parts[1], tableId: parts[2] };
      }
      
      return null;
    };
    
    const leftParsed = parseTableRef(leftTable.tableRef);
    const rightParsed = parseTableRef(rightTable.tableRef);
    
    if (!leftParsed || !rightParsed) {
      return [];
    }
    
    // Get schemas for both tables
    const [leftSchema, rightSchema] = await Promise.all([
      getTableSchema(projectId, leftParsed.datasetId, leftParsed.tableId),
      getTableSchema(projectId, rightParsed.datasetId, rightParsed.tableId),
    ]);
    
    const prefixLower = prefix.toLowerCase();
    
    // Add columns from left table
    const leftAlias = leftTable.alias || leftParsed.tableId;
    for (const field of leftSchema) {
      const fieldName = field.name;
      if (!prefixLower || fieldName.toLowerCase().startsWith(prefixLower)) {
        suggestions.push({
          label: `${leftAlias}.${fieldName}`,
          kind: CompletionItemKind.Property,
          insertText: `${leftAlias}.${fieldName}`,
          detail: `Column: ${fieldName} (${field.type || 'unknown'})`,
          documentation: `Column from ${leftTable.tableRef}`,
        });
      }
    }
    
    // Add columns from right table
    const rightAlias = rightTable.alias || rightParsed.tableId;
    for (const field of rightSchema) {
      const fieldName = field.name;
      if (!prefixLower || fieldName.toLowerCase().startsWith(prefixLower)) {
        suggestions.push({
          label: `${rightAlias}.${fieldName}`,
          kind: CompletionItemKind.Property,
          insertText: `${rightAlias}.${fieldName}`,
          detail: `Column: ${fieldName} (${field.type || 'unknown'})`,
          documentation: `Column from ${rightTable.tableRef}`,
        });
      }
    }
  } catch (error) {
    // Silently handle errors
  }
  
  return suggestions;
}

/**
 * Gets matching tables from cache (synchronous)
 */
/**
 * Calculates a match score for a table name against a search pattern.
 * Higher scores indicate better matches.
 * 
 * @param tableName - The table name to match against
 * @param pattern - The search pattern (already lowercase)
 * @returns A score object with match status and priority, or null if no match
 */
function calculateTableMatchScore(tableName: string, pattern: string): { score: number; matchType: 'prefix' | 'segment' | 'segment-start' | 'contains' | 'fuzzy' } | null {
  const lowerName = tableName.toLowerCase();
  
  // Priority 1: Exact prefix match (highest priority)
  if (lowerName.startsWith(pattern)) {
    return { score: 1000 - lowerName.length, matchType: 'prefix' };
  }
  
  // Priority 2: Segment match - pattern matches start of any underscore/hyphen-separated segment sequence
  // e.g., "dim_acc" matches "whs_dim_account" because "dim_acc" starts the segment "dim_account"
  const segments = lowerName.split(/[_-]/);
  for (let i = 1; i < segments.length; i++) {
    // Build the remaining part from this segment onwards
    const remainingSegments = segments.slice(i).join('_');
    if (remainingSegments.startsWith(pattern)) {
      // Earlier segment matches get slightly higher priority
      return { score: 900 - i * 10 - lowerName.length, matchType: 'segment' };
    }
  }
  
  // Priority 3: Single segment start match - pattern matches the start of any individual segment
  // e.g., "agreement" matches "whs_dim_agreement" because segment "agreement" starts with "agreement"
  // e.g., "agree" matches "whs_dim_agreement" because segment "agreement" starts with "agree"
  for (let i = 1; i < segments.length; i++) {
    if (segments[i].startsWith(pattern)) {
      // Earlier segment matches get slightly higher priority
      return { score: 800 - i * 10 - lowerName.length, matchType: 'segment-start' };
    }
  }
  
  // Priority 4: Contains match - pattern appears anywhere in the name
  // e.g., "ount" matches "dim_account_history"
  const containsIndex = lowerName.indexOf(pattern);
  if (containsIndex > 0) {
    // Earlier occurrence gets higher priority
    return { score: 600 - containsIndex - lowerName.length, matchType: 'contains' };
  }
  
  // Priority 5: Fuzzy segment match - each part of the pattern (split by underscore) 
  // matches the start of corresponding segments in order
  // e.g., "dim_acc" could match "dimension_table_account" (dim->dimension, acc->account)
  const patternParts = pattern.split(/[_-]/);
  if (patternParts.length > 1) {
    let segmentIndex = 0;
    let allPartsMatch = true;
    
    for (const part of patternParts) {
      let found = false;
      // Look for this part starting from current segment index
      for (let i = segmentIndex; i < segments.length; i++) {
        if (segments[i].startsWith(part)) {
          segmentIndex = i + 1; // Next part must match a later segment
          found = true;
          break;
        }
      }
      if (!found) {
        allPartsMatch = false;
        break;
      }
    }
    
    if (allPartsMatch) {
      return { score: 400 - lowerName.length, matchType: 'fuzzy' };
    }
  }
  
  return null;
}

/**
 * Filters and sorts tables based on the search pattern using intelligent matching.
 * 
 * @param tables - Array of tables to filter
 * @param pattern - The search pattern (will be lowercased)
 * @returns Filtered and sorted array of tables with their match info
 */
function filterTablesWithScoring<T extends { name: string }>(
  tables: T[],
  pattern: string
): Array<{ table: T; score: number; matchType: string }> {
  if (!pattern) {
    return tables.map(table => ({ table, score: 0, matchType: 'all' }));
  }
  
  const lowerPattern = pattern.toLowerCase();
  const results: Array<{ table: T; score: number; matchType: string }> = [];
  
  for (const table of tables) {
    const match = calculateTableMatchScore(table.name, lowerPattern);
    if (match) {
      results.push({ table, score: match.score, matchType: match.matchType });
    }
  }
  
  // Sort by score descending (higher is better)
  results.sort((a, b) => b.score - a.score);
  
  return results;
}

function getMatchingTablesFromCache(
  projectId: string,
  parsedRef: { project?: string; dataset?: string; table?: string; prefix: string },
  getMetadataStore: () => { getDatasetTables: (datasetId: string) => any[] | undefined; getAllTables: () => Array<{ dataset: string; table: any }>; datasets: any[] }
): any[] {
  const suggestions: any[] = [];
  const metadataStore = getMetadataStore();
  
  try {
    // If we have a project and dataset, search for tables in that dataset
    if (parsedRef.project && parsedRef.dataset) {
      const tables = metadataStore.getDatasetTables(parsedRef.dataset);
      if (tables) {
        const prefix = parsedRef.prefix;
        const filtered = filterTablesWithScoring(tables, prefix);
        
        filtered.forEach(({ table, matchType }) => {
          // When we have project.dataset, only insert the table name (not the full path)
          // The user has already typed project.dataset, so we just complete with the table name
          const fullName = `${parsedRef.project}.${parsedRef.dataset}.${table.name}`;
          suggestions.push({
            label: table.name,
            kind: CompletionItemKind.Class,
            insertText: table.name, // Only table name since project.dataset is already typed
            detail: `Table: ${fullName}`,
            documentation: `Table in ${parsedRef.project}.${parsedRef.dataset}${matchType !== 'prefix' && matchType !== 'all' ? ` (${matchType} match)` : ''}`,
          });
        });
      }
    }
    // If we only have a dataset, search for tables in that dataset
    else if (parsedRef.dataset) {
      const tables = metadataStore.getDatasetTables(parsedRef.dataset);
      if (tables && tables.length > 0) {
        const prefix = parsedRef.prefix;
        const filtered = filterTablesWithScoring(tables, prefix);
        
        filtered.forEach(({ table, matchType }) => {
          // When we have a dataset, only insert the table name (not the full path)
          // The user has already typed the dataset, so we just complete with the table name
          const insertText = table.name; // Just the table name
          const fullName = projectId 
            ? `${projectId}.${parsedRef.dataset}.${table.name}`
            : `${parsedRef.dataset}.${table.name}`;
          suggestions.push({
            label: table.name,
            kind: CompletionItemKind.Class,
            insertText: insertText, // Only table name, not full path
            detail: `Table: ${fullName}`,
            documentation: projectId 
              ? `Table in ${projectId}.${parsedRef.dataset}${matchType !== 'prefix' && matchType !== 'all' ? ` (${matchType} match)` : ''}`
              : `Table in ${parsedRef.dataset}${matchType !== 'prefix' && matchType !== 'all' ? ` (${matchType} match)` : ''}`,
          });
        });
      }
    }
    // If we only have a prefix, search across all datasets
    else if (parsedRef.prefix) {
      const prefix = parsedRef.prefix;
      const allTables = metadataStore.getAllTables();
      
      // Filter tables using the improved matching algorithm
      const tablesWithNames = allTables.map(({ dataset, table }) => ({
        name: table.name,
        dataset,
        table
      }));
      
      const filtered = filterTablesWithScoring(tablesWithNames, prefix);
      
      filtered
        .slice(0, 50) // Limit to 50 suggestions
        .forEach(({ table: { dataset, table }, matchType }) => {
          // Always include project ID in the full path if available
          const fullName = projectId
            ? `${projectId}.${dataset}.${table.name}`
            : `${dataset}.${table.name}`;
          suggestions.push({
            label: `${dataset}.${table.name}`, // Show dataset.table in label for clarity
            kind: CompletionItemKind.Class,
            insertText: fullName, // Insert full project.dataset.table path if projectId available
            detail: `Table: ${fullName}`,
            documentation: projectId 
              ? `Table in ${projectId}.${dataset}${matchType !== 'prefix' && matchType !== 'all' ? ` (${matchType} match)` : ''}`
              : `Table in ${dataset}${matchType !== 'prefix' && matchType !== 'all' ? ` (${matchType} match)` : ''}`,
          });
        });
    }
    
    return suggestions;
  } catch (error) {
    return [];
  }
}

/**
 * Creates a completion provider for BigQuery SQL
 */
export function createBigQueryCompletionProvider(monaco: Monaco, getProjectId: () => string | null): any {
  return {
    triggerCharacters: ['.'], // Trigger on dot to show table suggestions
    provideCompletionItems: async (model: any, position: any, context: any) => {
      const word = model.getWordUntilPosition(position);
      const lineText = model.getLineContent(position.lineNumber);
      const textBeforeCursor = lineText.substring(0, position.column - 1);
      const statementContext = getStatementContext(model, position);
      
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      // Check if we're in a SELECT clause first (for column suggestions)
      const projectId = getProjectId();
      let selectColumnSuggestions: any[] = [];
      let isSelectContext = false;
      let joinColumnSuggestions: any[] = [];
      let isJoinOnContext = false;
      
      if (projectId) {
        // Check for SELECT clause context
        const selectTables = detectSelectContext(model, position, statementContext);
        if (selectTables && selectTables.length > 0) {
          // Check if we're typing after a table alias dot (e.g., "da." or "dp.id")
          const aliasDotMatch = textBeforeCursor.match(/([\w\-]+)\.([\w\-]*)$/);
          
          if (aliasDotMatch) {
            const typedAlias = aliasDotMatch[1];
            const partialColumn = aliasDotMatch[2] || '';
            
            // Find matching table by alias
            const getTableAlias = (table: { tableRef: string; alias: string | null }): string => {
              if (table.alias) {
                return table.alias;
              }
              const cleanRef = table.tableRef.replace(/[`"']/g, '');
              const parts = cleanRef.split('.').filter(p => p.length > 0);
              return parts[parts.length - 1] || '';
            };
            
            for (const table of selectTables) {
              const tableAlias = getTableAlias(table);
              if (typedAlias.toLowerCase() === tableAlias.toLowerCase()) {
                isSelectContext = true;
                
                const resolvedRef = resolveDatasetTableFromRef(table.tableRef);
                
                if (resolvedRef) {
                  const { datasetId, tableId } = resolvedRef;
                  try {
                    const schema = await getTableSchema(projectId, datasetId, tableId);
                    const prefixLower = partialColumn.toLowerCase();
                    
                    // Calculate proper range
                    const dotPosition = textBeforeCursor.lastIndexOf('.');
                    const rangeStartColumn = partialColumn 
                      ? (dotPosition + 2)
                      : position.column;
                    const rangeEndColumn = position.column;
                    
                    for (const field of schema) {
                      if (!prefixLower || field.name.toLowerCase().startsWith(prefixLower)) {
                        selectColumnSuggestions.push({
                          label: field.name,
                          kind: CompletionItemKind.Property,
                          insertText: field.name,
                          detail: `Column: ${field.name} (${field.type || 'unknown'})`,
                          documentation: `Column from ${table.tableRef}`,
                          range: {
                            startLineNumber: position.lineNumber,
                            endLineNumber: position.lineNumber,
                            startColumn: rangeStartColumn,
                            endColumn: rangeEndColumn,
                          },
                        });
                      }
                    }
                  } catch (error) {
                    // Silently handle errors
                  }
                }
                break;
              }
            }
          }

          if (!isSelectContext) {
            const dedupedTables: Array<{
              alias: string | null;
              tableRef: string;
              datasetId: string;
              tableId: string;
            }> = [];
            const seenTables = new Set<string>();

            for (const table of selectTables) {
              const resolvedRef = resolveDatasetTableFromRef(table.tableRef);
              if (!resolvedRef) {
                continue;
              }

              const key = table.alias
                ? `alias:${table.alias.toLowerCase()}`
                : `table:${resolvedRef.datasetId.toLowerCase()}.${resolvedRef.tableId.toLowerCase()}`;

              if (seenTables.has(key)) {
                continue;
              }

              seenTables.add(key);
              dedupedTables.push({
                alias: table.alias,
                tableRef: table.tableRef,
                datasetId: resolvedRef.datasetId,
                tableId: resolvedRef.tableId,
              });
            }

            if (dedupedTables.length > 0) {
              try {
                const schemaResults = await Promise.all(
                  dedupedTables.map(async (tableInfo) => ({
                    tableInfo,
                    schema: await getTableSchema(projectId, tableInfo.datasetId, tableInfo.tableId),
                  }))
                );

                const partialColumn = word.word || '';
                const prefixLower = partialColumn.toLowerCase();
                const baseRange = {
                  startLineNumber: position.lineNumber,
                  endLineNumber: position.lineNumber,
                  startColumn: word.startColumn,
                  endColumn: word.endColumn,
                };
                const shouldInsertBareColumns = dedupedTables.length === 1 && !dedupedTables[0].alias;

                for (const { tableInfo, schema } of schemaResults) {
                  const displayPrefix = tableInfo.alias || tableInfo.tableId;
                  for (const field of schema) {
                    if (!prefixLower || field.name.toLowerCase().startsWith(prefixLower)) {
                      const label = shouldInsertBareColumns && !tableInfo.alias
                        ? field.name
                        : `${displayPrefix}.${field.name}`;
                      selectColumnSuggestions.push({
                        label,
                        kind: CompletionItemKind.Property,
                        insertText: label,
                        detail: `Column: ${field.name} (${field.type || 'unknown'})`,
                        documentation: `Column from ${tableInfo.tableRef}`,
                        range: baseRange,
                      });
                    }
                  }
                }

                if (selectColumnSuggestions.length > 0) {
                  isSelectContext = true;
                }
              } catch (error) {
                // Silently handle errors
              }
            }
          }
        }
        
        // Check if we're in a JOIN ON clause
        const joinContext = detectJoinOnContext(model, position, statementContext);
        if (joinContext && joinContext.leftTable && joinContext.rightTable) {
          isJoinOnContext = true;
          
          // Get the current word/prefix for filtering
          const currentWord = word.word || '';
          
          // Check if we're typing after a table alias dot (e.g., "dp." or "da.id")
          const textBeforeCursor = lineText.substring(0, position.column - 1);
          // Match alias followed by dot, optionally followed by a partial column name
          const aliasDotMatch = textBeforeCursor.match(/([\w\-]+)\.([\w\-]*)$/);
          
          if (aliasDotMatch) {
            // User typed an alias and dot, possibly with a partial column name
            const typedAlias = aliasDotMatch[1];
            const partialColumn = aliasDotMatch[2] || '';
            
            // Get aliases for both tables
            const getTableAlias = (table: { tableRef: string; alias: string | null }): string => {
              if (table.alias) {
                return table.alias;
              }
              // Extract table name from tableRef
              const cleanRef = table.tableRef.replace(/[`"']/g, '');
              const parts = cleanRef.split('.').filter(p => p.length > 0);
              return parts[parts.length - 1] || '';
            };
            
            const leftAlias = getTableAlias(joinContext.leftTable);
            const rightAlias = getTableAlias(joinContext.rightTable);
            
            // Determine which table's columns to show
            let targetTable: { tableRef: string; alias: string | null } | null = null;
            if (typedAlias.toLowerCase() === leftAlias.toLowerCase()) {
              targetTable = joinContext.leftTable;
            } else if (typedAlias.toLowerCase() === rightAlias.toLowerCase()) {
              targetTable = joinContext.rightTable;
            }
            
            if (targetTable) {
              // Parse table reference
              const cleanRef = targetTable.tableRef.replace(/[`"']/g, '');
              const parts = cleanRef.split('.').filter(p => p.length > 0);
              let datasetId: string | null = null;
              let tableId: string | null = null;
              
              if (parts.length === 2) {
                datasetId = parts[0];
                tableId = parts[1];
              } else if (parts.length === 3) {
                datasetId = parts[1];
                tableId = parts[2];
              }
              
              if (datasetId && tableId) {
                try {
                  const schema = await getTableSchema(projectId, datasetId, tableId);
                  const prefixLower = partialColumn.toLowerCase();
                  
                  // Calculate proper range - if we're right after the dot, start at cursor position
                  // Otherwise, replace the partial column name
                  const dotPosition = textBeforeCursor.lastIndexOf('.');
                  const rangeStartColumn = partialColumn 
                    ? (dotPosition + 2) // After the dot, replace partial column
                    : position.column;   // Right after dot, insert at cursor
                  const rangeEndColumn = position.column;
                  
                  for (const field of schema) {
                    // Filter by partial column name if provided
                    if (!prefixLower || field.name.toLowerCase().startsWith(prefixLower)) {
                      joinColumnSuggestions.push({
                        label: field.name,
                        kind: CompletionItemKind.Property,
                        insertText: field.name,
                        detail: `Column: ${field.name} (${field.type || 'unknown'})`,
                        documentation: `Column from ${targetTable.tableRef}`,
                        range: {
                          startLineNumber: position.lineNumber,
                          endLineNumber: position.lineNumber,
                          startColumn: rangeStartColumn,
                          endColumn: rangeEndColumn,
                        },
                      });
                    }
                  }
                } catch (error) {
                  // Silently handle errors
                }
              }
            }
          } else {
            // Not after a dot, show columns from both tables with aliases
            try {
              joinColumnSuggestions = await getJoinColumnSuggestions(
                projectId,
                joinContext.leftTable,
                joinContext.rightTable,
                currentWord
              );
              
              // Update range for column suggestions
              joinColumnSuggestions = joinColumnSuggestions.map((item) => ({
                ...item,
                range: {
                  startLineNumber: position.lineNumber,
                  endLineNumber: position.lineNumber,
                  startColumn: word.startColumn,
                  endColumn: word.endColumn,
                },
              }));
            } catch (error) {
              // Silently handle errors
            }
          }
        }
      }
      
      // Try to get table suggestions
      const tableRefText = getTableReferenceText(model, position);
      let tableSuggestions: any[] = [];
      let hasTableContext = false;
      
      // Skip table suggestions if we're in SELECT or JOIN ON context (unless we're typing a table reference)
      if (!isSelectContext && !isJoinOnContext && tableRefText && projectId) {
        const parsedRef = parseTableReference(tableRefText);
        
        if (parsedRef) {
          try {
            // Use cached data from metadata store (synchronous)
            const getMetadataStore = metadataStoreGetter || (() => {
              // Fallback: try to get from window if available
              if (typeof window !== 'undefined' && (window as any).__bigqueryMetadataStore) {
                return (window as any).__bigqueryMetadataStore;
              }
              return { getDatasetTables: () => undefined, getAllTables: () => [], datasets: [] };
            });
            
            const metadataStore = getMetadataStore();
            tableSuggestions = getMatchingTablesFromCache(projectId, parsedRef, getMetadataStore);
            
            // If we have table suggestions, we're in a table context
            hasTableContext = tableSuggestions.length > 0;
            
            // Update range for table suggestions
            if (tableSuggestions.length > 0) {
              // Calculate the actual range for the table reference
              const lineText = model.getLineContent(position.lineNumber);
              const textBeforeCursor = lineText.substring(0, position.column - 1);
              
              // Check if we're right after a dot (e.g., "Bricks.")
              const endsWithDot = textBeforeCursor.endsWith('.');
              
              let startColumn: number;
              let endColumn: number;
              
              if (endsWithDot) {
                // When cursor is right after a dot, we want to insert the table name
                // The range should start at the cursor position (after the dot)
                // and end at the cursor position (replacing nothing, just inserting)
                startColumn = position.column;
                endColumn = position.column;
              } else {
                // When typing a partial table name (e.g., "Bricks.B1"), replace from after the last dot
                // Find the position right after the last dot
                const lastDotIndex = textBeforeCursor.lastIndexOf('.');
                
                if (lastDotIndex >= 0) {
                  // We have a dot, so replace everything after it
                  startColumn = lastDotIndex + 2; // +1 for 0-index, +1 to be after the dot
                  endColumn = position.column;
                } else {
                  // No dot found, find the start of the current identifier
                  // Look backwards from cursor to find the start, stopping at spaces or operators
                  const stopPattern = /[\s,;()\[\]+*/=<>!|&]/;
                  let start = textBeforeCursor.length;
                  
                  // Find the start of the current word/identifier
                  while (start > 0) {
                    const char = textBeforeCursor[start - 1];
                    if (stopPattern.test(char)) {
                      break;
                    }
                    // Allow dots, hyphens, backticks, and alphanumeric characters
                    if (!/[a-zA-Z0-9_`.\-]/.test(char)) {
                      break;
                    }
                    start--;
                  }
                  
                  startColumn = start + 1;
                  endColumn = position.column;
                }
              }
              
              const tableRange = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn,
                endColumn,
              };
              
              tableSuggestions = tableSuggestions.map((item) => ({
                ...item,
                range: tableRange,
              }));
            }
          } catch (error) {
            // Silently handle errors
          }
        }
      }

      // Prioritize column suggestions based on context
      // SELECT context takes precedence, then JOIN ON context
      const suggestions: any[] = [];
      
      if (isSelectContext && selectColumnSuggestions.length > 0) {
        // In SELECT context, show column suggestions from the selected table
        selectColumnSuggestions.sort((a, b) => a.label.localeCompare(b.label));
        suggestions.push(...selectColumnSuggestions);
      } else if (isJoinOnContext) {
        // In JOIN ON context, show column suggestions from both tables
        if (joinColumnSuggestions.length > 0) {
          // Sort suggestions by label for better UX
          joinColumnSuggestions.sort((a, b) => a.label.localeCompare(b.label));
          suggestions.push(...joinColumnSuggestions);
        }
        // If no column suggestions but we're in JOIN context, don't show other suggestions
        // (this prevents showing keywords/functions when user expects columns)
      } else {
        // Check if we have a table reference with a trailing dot - this is a strong signal for table context
        const hasTrailingDot = tableRefText?.endsWith('.');
        
        if (hasTableContext || (hasTrailingDot && tableRefText)) {
          // In table context or after a dot, only show table suggestions
          suggestions.push(...tableSuggestions);
        } else if (tableRefText) {
          // We detected a table reference but no suggestions found - still show table suggestions first
          suggestions.push(...tableSuggestions);
          
          // Add keywords/functions only if we have no table suggestions
          if (tableSuggestions.length === 0) {
            const keywordCompletions = createKeywordCompletions();
            suggestions.push(
              ...keywordCompletions.map((item) => ({
                ...item,
                range,
              })),
              ...ALL_FUNCTIONS.map((item) => ({
                ...item,
                range,
              }))
            );
          }
        } else {
          // Not in table context, show standard completions
          const keywordCompletions = createKeywordCompletions();
          suggestions.push(
            ...keywordCompletions.map((item) => ({
              ...item,
              range,
            })),
            ...ALL_FUNCTIONS.map((item) => ({
              ...item,
              range,
            })),
            ...tableSuggestions // Still include table suggestions if any (for prefix-only searches)
          );
        }
      }

      return { suggestions };
    },
  };
}

/**
 * Registers BigQuery language support with Monaco Editor
 */
export function registerBigQueryLanguage(
  monaco?: typeof import('monaco-editor'),
  getProjectId?: () => string | null
): void {
  // Use provided monaco instance or try to get from window
  const monacoInstance = monaco || (typeof window !== 'undefined' ? (window as any).monaco : null);
  
  if (!monacoInstance) {
    return;
  }

  // Default getProjectId function that tries to get from connection store
  const defaultGetProjectId = getProjectId || (() => {
    if (typeof window !== 'undefined') {
      // Try to get from the function set by QueryEditor component
      try {
        const getter = (window as any).__bigqueryGetProjectId;
        if (typeof getter === 'function') {
          return getter();
        }
      } catch {
        // Ignore errors
      }
    }
    return null;
  });

  // Register completion provider for SQL language
  // Check if already registered to avoid duplicate registrations
  const providers = monacoInstance.languages.getLanguages();
  const sqlLanguage = providers.find((lang: { id: string }) => lang.id === 'sql');
  
  if (sqlLanguage) {
    monacoInstance.languages.registerCompletionItemProvider('sql', createBigQueryCompletionProvider(monacoInstance, defaultGetProjectId));
  }
}

