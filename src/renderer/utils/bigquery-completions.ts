/**
 * BigQuery IntelliSense and code completion provider for Monaco Editor
 */

// Monaco CompletionItemKind enum values (using numeric constants to avoid importing monaco-editor)
const CompletionItemKind = {
  Function: 1,
  Keyword: 14,
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
 * Creates a completion provider for BigQuery SQL
 */
export function createBigQueryCompletionProvider(monaco: Monaco): any {
  return {
    provideCompletionItems: (model: any, position: any) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      // Get all completions
      const keywordCompletions = createKeywordCompletions();
      const suggestions: any[] = [
        ...keywordCompletions.map((item) => ({
          ...item,
          range,
        })),
        ...ALL_FUNCTIONS.map((item) => ({
          ...item,
          range,
        })),
      ];

      return { suggestions };
    },
  };
}

/**
 * Registers BigQuery language support with Monaco Editor
 */
export function registerBigQueryLanguage(monaco?: typeof import('monaco-editor')): void {
  // Use provided monaco instance or try to get from window
  const monacoInstance = monaco || (typeof window !== 'undefined' ? (window as any).monaco : null);
  
  if (!monacoInstance) {
    return;
  }

  // Register completion provider for SQL language
  // Check if already registered to avoid duplicate registrations
  const providers = monacoInstance.languages.getLanguages();
  const sqlLanguage = providers.find((lang: { id: string }) => lang.id === 'sql');
  
  if (sqlLanguage) {
    monacoInstance.languages.registerCompletionItemProvider('sql', createBigQueryCompletionProvider(monacoInstance));
  }
}

