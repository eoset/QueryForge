/**
 * SQL Preprocessor for BigQuery-specific syntax
 * 
 * This module preprocesses SQL queries to transform BigQuery-specific syntax
 * that node-sql-parser doesn't support into forms that can be parsed successfully.
 * 
 * The preprocessing is reversible - we track transformations so we can restore
 * the original syntax for execution while allowing the parser to work.
 * 
 * Based on BigQuery GoogleSQL syntax rules documented in:
 * bigquery_query_syntax_rules.md
 */

export interface PreprocessingResult {
  transformedSql: string;
  transformations: Transformation[];
  originalSql: string;
}

export type TransformationType =
  | 'group-by-all'
  | 'qualify-clause'
  | 'select-except'
  | 'select-replace'
  | 'select-as-struct'
  | 'select-as-value'
  | 'nulls-first-last'
  | 'for-system-time'
  | 'grouping-sets'
  | 'rollup'
  | 'cube'
  | 'by-name'
  | 'corresponding'
  | 'differential-privacy'
  | 'aggregation-threshold'
  | 'tablesample';

export interface Transformation {
  type: TransformationType;
  originalText: string;
  transformedText: string;
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

interface MatchInfo {
  match: RegExpMatchArray;
  line: number;
  column: number;
  fullMatch: string;
  replacement: string;
  type: TransformationType;
}

/**
 * Calculates line and column number from a string index
 */
function getLineColumn(sql: string, index: number): { line: number; column: number } {
  const beforeMatch = sql.substring(0, index);
  const line = (beforeMatch.match(/\n/g) || []).length + 1;
  const lastNewlineIndex = beforeMatch.lastIndexOf('\n');
  const column = index - lastNewlineIndex;
  return { line, column };
}

/**
 * Checks if a given position in SQL is within a comment.
 * This function checks both single-line comments (--) and multi-line block comments,
 * and ensures the comment markers are not inside string literals.
 */
function isInComment(sql: string, position: number): boolean {
  const beforePosition = sql.substring(0, position);
  
  // Helper to check if a position is inside a string literal
  const isInString = (pos: number): boolean => {
    const beforePos = sql.substring(0, pos);
    // Count unescaped single quotes before position
    // Simple approach: count quotes, but this doesn't handle escaped quotes perfectly
    // For most SQL, this should work fine
    let inString = false;
    let i = 0;
    while (i < beforePos.length) {
      if (beforePos[i] === "'") {
        // Check if it's escaped (preceded by backslash)
        if (i === 0 || beforePos[i - 1] !== '\\') {
          inString = !inString;
        }
      }
      i++;
    }
    return inString;
  };
  
  // Check for single-line comments (--)
  // Find the last newline before position
  const lastNewlineIndex = beforePosition.lastIndexOf('\n');
  const lineStart = lastNewlineIndex === -1 ? 0 : lastNewlineIndex + 1;
  const lineContent = sql.substring(lineStart, position);
  
  // If we find -- before the position on this line, check if it's a comment
  const commentIndex = lineContent.indexOf('--');
  if (commentIndex !== -1) {
    const absoluteCommentIndex = lineStart + commentIndex;
    // Check if the -- is inside a string
    if (!isInString(absoluteCommentIndex)) {
      return true; // It's a comment
    }
  }
  
  // Check for multi-line comments (/* */)
  // Find all /* before position
  const multiLineCommentStart = /\/\*/g;
  const multiLineCommentEnd = /\*\//g;
  
  const allStarts: number[] = [];
  let match;
  while ((match = multiLineCommentStart.exec(beforePosition)) !== null) {
    // Only consider /* that are not in strings
    if (!isInString(match.index)) {
      allStarts.push(match.index);
    }
  }
  
  // Find all */ before position
  const allEnds: number[] = [];
  multiLineCommentEnd.lastIndex = 0; // Reset regex
  while ((match = multiLineCommentEnd.exec(beforePosition)) !== null) {
    // Only consider */ that are not in strings
    if (!isInString(match.index)) {
      allEnds.push(match.index);
    }
  }
  
  // Check if position is within any /* */ pair
  for (const start of allStarts) {
    // Find the next */ after this /*
    const nextEnd = allEnds.find(end => end > start);
    if (nextEnd && position > start && position < nextEnd + 2) {
      return true;
    }
  }
  
  return false;
}

/**
 * Finds the end position of a match, accounting for multi-line matches
 */
function getEndPosition(sql: string, startIndex: number, length: number): { line: number; column: number } {
  const endIndex = startIndex + length;
  return getLineColumn(sql, endIndex);
}

/**
 * Preprocesses SQL to handle BigQuery-specific syntax that node-sql-parser doesn't support.
 * 
 * Transformations applied:
 * - GROUP BY ALL -> GROUP BY ()
 * - QUALIFY clause -> Commented out (parser doesn't support it)
 * - SELECT * EXCEPT -> SELECT * (EXCEPT removed, columns still selected)
 * - SELECT * REPLACE -> SELECT * (REPLACE removed, columns still selected)
 * - SELECT AS STRUCT -> SELECT (AS STRUCT removed)
 * - SELECT AS VALUE -> SELECT (AS VALUE removed)
 * - NULLS FIRST/LAST -> Removed from ORDER BY
 * - FOR SYSTEM_TIME AS OF -> Removed
 * - GROUP BY GROUPING SETS -> GROUP BY (simplified)
 * - GROUP BY ROLLUP -> GROUP BY (simplified)
 * - GROUP BY CUBE -> GROUP BY (simplified)
 * - BY NAME / CORRESPONDING -> Removed from set operations
 * - WITH DIFFERENTIAL_PRIVACY -> Removed
 * - WITH AGGREGATION_THRESHOLD -> Removed
 * - TABLESAMPLE -> Removed
 * 
 * @param sql The original SQL query
 * @returns Preprocessing result with transformed SQL and transformation metadata
 */
export function preprocessBigQuerySql(sql: string): PreprocessingResult {
  const transformations: Transformation[] = [];
  let transformedSql = sql;
  const allMatches: MatchInfo[] = [];

  // Helper to add a match for processing
  const addMatch = (
    regex: RegExp,
    type: TransformationType,
    replacement: string,
    customReplacement?: (match: RegExpMatchArray) => string
  ) => {
    let match;
    const regexCopy = new RegExp(regex.source, regex.flags);
    while ((match = regexCopy.exec(sql)) !== null) {
      // Skip matches that are within SQL comments
      if (isInComment(sql, match.index)) {
        continue;
      }
      
      const { line, column } = getLineColumn(sql, match.index);
      const fullMatch = match[0];
      const repl = customReplacement ? customReplacement(match) : replacement;
      
      allMatches.push({
        match,
        line,
        column,
        fullMatch,
        replacement: repl,
        type,
      });
    }
  };

  // 1. GROUP BY ALL -> GROUP BY 1 (use 1 instead of () for better parser compatibility)
  addMatch(/\bGROUP\s+BY\s+ALL\b/gi, 'group-by-all', 'GROUP BY 1');

  // 2. QUALIFY clause -> Commented out (parser doesn't support QUALIFY)
  // Match: QUALIFY followed by expression until ORDER BY, LIMIT, or end of line
  addMatch(
    /\bQUALIFY\s+[^\n;]+?(?=\s*(?:ORDER\s+BY|LIMIT|\n|$|;))/gi,
    'qualify-clause',
    '-- QUALIFY removed for parser compatibility',
    (match) => {
      // Comment out the QUALIFY clause
      return `-- ${match[0]}`;
    }
  );

  // 3. SELECT * EXCEPT (columns) -> SELECT *
  // Match: * EXCEPT (column_list) - handle nested parentheses
  addMatch(
    /\*\s+EXCEPT\s*\((?:[^()]|\([^()]*\))*\)/gi,
    'select-except',
    '*',
    (match) => {
      // Just keep the asterisk, remove EXCEPT clause
      return '*';
    }
  );

  // 4. SELECT * REPLACE (expression AS column) -> SELECT *
  // Match: * REPLACE (replace_list) - handle nested parentheses
  addMatch(
    /\*\s+REPLACE\s*\((?:[^()]|\([^()]*\))*\)/gi,
    'select-replace',
    '*',
    (match) => {
      // Just keep the asterisk, remove REPLACE clause
      return '*';
    }
  );

  // 5. SELECT AS STRUCT -> SELECT
  addMatch(/\bSELECT\s+AS\s+STRUCT\b/gi, 'select-as-struct', 'SELECT');

  // 6. SELECT AS VALUE -> SELECT
  addMatch(/\bSELECT\s+AS\s+VALUE\b/gi, 'select-as-value', 'SELECT');

  // 7. NULLS FIRST / NULLS LAST in ORDER BY -> Removed
  // Match: NULLS FIRST/LAST (with optional leading space)
  // Be careful - only match when it's clearly NULLS FIRST/LAST, not part of a column name
  addMatch(
    /\s+NULLS\s+(?:FIRST|LAST)\b/gi,
    'nulls-first-last',
    '',
    (match) => {
      // Remove NULLS FIRST/LAST (the leading space is part of the match, so safe to remove)
      return '';
    }
  );

  // 8. FOR SYSTEM_TIME AS OF timestamp -> Temporarily disabled
  // This transformation is causing issues with table aliases (breaking "AS C" patterns)
  // TODO: Re-enable with better context detection that ensures we don't break aliases
  // For now, node-sql-parser might handle this syntax, or we'll need a more sophisticated approach
  // addMatch(
  //   /\s+FOR\s+SYSTEM_TIME\s+AS\s+OF\s+[^\s,;\)\n]+/gi,
  //   'for-system-time',
  //   '',
  //   (match) => {
  //     return '';
  //   }
  // );

  // 9. GROUP BY GROUPING SETS -> GROUP BY (simplified to first grouping set)
  // Handle nested parentheses in GROUPING SETS - be more careful with extraction
  addMatch(
    /\bGROUP\s+BY\s+GROUPING\s+SETS\s*\((?:[^()]|\([^()]*\))+\)/gi,
    'grouping-sets',
    'GROUP BY 1',
    (match) => {
      // Extract first grouping set from GROUPING SETS
      const fullMatch = match[0];
      // Find the content inside GROUPING SETS (...) - use non-greedy and careful matching
      const contentMatch = fullMatch.match(/GROUPING\s+SETS\s*\((.+?)\)$/is);
      if (contentMatch) {
        const groupingSetsContent = contentMatch[1].trim();
        // Try to extract first set - look for first parenthesized group
        const firstSetMatch = groupingSetsContent.match(/\(([^)]+)\)/);
        if (firstSetMatch && firstSetMatch[1].trim()) {
          const extracted = firstSetMatch[1].trim();
          // Validate extracted content is not empty
          if (extracted.length > 0) {
            // Return without extra parentheses - the GROUP BY already provides structure
            return `GROUP BY ${extracted}`;
          }
        }
        // Fallback: take first item before comma (if no parentheses)
        const firstItem = groupingSetsContent.split(',')[0].trim();
        if (firstItem && firstItem.length > 0 && !firstItem.includes('(')) {
          return `GROUP BY ${firstItem}`;
        }
      }
      // Fallback: GROUP BY with a placeholder to avoid syntax error
      return 'GROUP BY 1';
    }
  );

  // 10. GROUP BY ROLLUP -> GROUP BY (simplified to full list)
  // Handle nested parentheses - ensure we extract valid column list
  addMatch(
    /\bGROUP\s+BY\s+ROLLUP\s*\((?:[^()]|\([^()]*\))+\)/gi,
    'rollup',
    'GROUP BY 1',
    (match) => {
      // Extract the grouping list from ROLLUP
      const contentMatch = match[0].match(/ROLLUP\s*\((.+)\)/is);
      if (contentMatch && contentMatch[1].trim()) {
        const extracted = contentMatch[1].trim();
        // Validate extracted content is not empty
        if (extracted.length > 0) {
          return `GROUP BY ${extracted}`;
        }
      }
      // Fallback: GROUP BY with placeholder
      return 'GROUP BY 1';
    }
  );

  // 11. GROUP BY CUBE -> GROUP BY (simplified to full list)
  // Handle nested parentheses - ensure we extract valid column list
  addMatch(
    /\bGROUP\s+BY\s+CUBE\s*\((?:[^()]|\([^()]*\))+\)/gi,
    'cube',
    'GROUP BY 1',
    (match) => {
      // Extract the grouping list from CUBE
      const contentMatch = match[0].match(/CUBE\s*\((.+)\)/is);
      if (contentMatch && contentMatch[1].trim()) {
        const extracted = contentMatch[1].trim();
        // Validate extracted content is not empty
        if (extracted.length > 0) {
          return `GROUP BY ${extracted}`;
        }
      }
      // Fallback: GROUP BY with placeholder
      return 'GROUP BY 1';
    }
  );

  // 12. BY NAME / BY NAME ON (columns) -> Removed from set operations (preserve space)
  addMatch(/\s+BY\s+NAME\s+(?:ON\s*\([^)]+\))?/gi, 'by-name', '');

  // 13. CORRESPONDING / STRICT CORRESPONDING / CORRESPONDING BY (columns) -> Removed (preserve space)
  addMatch(/\s+(?:STRICT\s+)?CORRESPONDING\s+(?:BY\s*\([^)]+\))?/gi, 'corresponding', '');

  // 14. WITH DIFFERENTIAL_PRIVACY -> Removed (handle SELECT WITH DIFFERENTIAL_PRIVACY)
  // This appears after SELECT, so we need to be careful
  addMatch(
    /\bWITH\s+DIFFERENTIAL_PRIVACY\s+(?:OPTIONS\s*\([^)]+\))?/gi,
    'differential-privacy',
    '',
    (match) => {
      // Remove the entire WITH DIFFERENTIAL_PRIVACY clause
      // Note: This might leave "SELECT " which is fine
      return '';
    }
  );

  // 15. WITH AGGREGATION_THRESHOLD -> Removed (handle SELECT WITH AGGREGATION_THRESHOLD)
  addMatch(
    /\bWITH\s+AGGREGATION_THRESHOLD\s+(?:OPTIONS\s*\([^)]+\))?/gi,
    'aggregation-threshold',
    '',
    (match) => {
      // Remove the entire WITH AGGREGATION_THRESHOLD clause
      return '';
    }
  );

  // 16. TABLESAMPLE -> Removed (preserve space before it)
  addMatch(
    /\s+TABLESAMPLE\s+(?:SYSTEM|BERNOULLI)\s*\([^)]+\)/gi,
    'tablesample',
    '',
    (match) => {
      // Remove the TABLESAMPLE clause (including leading space)
      return '';
    }
  );

  // Sort matches by position (descending) to process in reverse order
  allMatches.sort((a, b) => b.match.index! - a.match.index!);

  // Process matches in reverse order to maintain correct string positions
  for (const matchInfo of allMatches) {
    const matchIndex = matchInfo.match.index!;
    const matchLength = matchInfo.fullMatch.length;
    const { line, column } = matchInfo;
    const endPos = getEndPosition(sql, matchIndex, matchLength);

    // Validate replacement doesn't create invalid syntax
    let replacement = matchInfo.replacement;
    
    // Ensure GROUP BY always has something after it
    if (replacement === 'GROUP BY' || replacement.trim() === 'GROUP BY') {
      replacement = 'GROUP BY 1'; // Use placeholder to avoid syntax error
    }
    
    // For GROUP BY ALL -> GROUP BY 1 replacement, ensure proper spacing
    if (matchInfo.type === 'group-by-all') {
      // Ensure replacement has proper spacing
      replacement = replacement.trim();
      // Check what comes after the original match
      const afterMatch = transformedSql.substring(matchIndex + matchLength);
      const afterStart = afterMatch.trim().substring(0, 1);
      // If there's something immediately after that's not whitespace or punctuation,
      // we might need to add a space (but GROUP BY 1 should be followed by valid SQL, so this should be fine)
      // Actually, GROUP BY 1 should be fine as-is, so no special handling needed
    }
    
    // Ensure we don't create syntax errors by removing critical parts
    // Check if removing this would leave orphaned syntax
    const beforeMatch = transformedSql.substring(0, matchIndex);
    const afterMatch = transformedSql.substring(matchIndex + matchLength);
    
    // If we're removing something and the replacement is empty, check context
    if (replacement === '' || replacement.trim() === '') {
      // Check if removing this leaves orphaned closing parens or other syntax issues
      const beforeEnd = beforeMatch.trim().slice(-1);
      const afterStart = afterMatch.trim().slice(0, 1);
      
      // If we have "keyword )" pattern, we might have created invalid syntax
      if (beforeEnd && afterStart === ')' && /[A-Za-z]/.test(beforeEnd)) {
        // This might be problematic - try to preserve a space
        replacement = ' ';
      }
    }

    transformations.push({
      type: matchInfo.type,
      originalText: matchInfo.fullMatch,
      transformedText: replacement,
      startLine: line,
      startColumn: column,
      endLine: endPos.line,
      endColumn: endPos.column,
    });

    // Replace in the SQL string
    transformedSql =
      transformedSql.substring(0, matchIndex) +
      replacement +
      transformedSql.substring(matchIndex + matchLength);
  }
  
  // Post-process: Clean up common issues that might cause parser errors
  // Be conservative - only fix obvious issues introduced by transformations
  // Only apply post-processing if we actually made transformations
  if (transformations.length > 0) {
    // Remove double spaces (but preserve newlines)
    transformedSql = transformedSql.replace(/[ \t]+/g, ' ');
    
    // Fix common syntax errors that might have been introduced
    // Fix "GROUP BY )" -> "GROUP BY 1" (use 1 instead of () for parser compatibility)
    transformedSql = transformedSql.replace(/\bGROUP\s+BY\s+\)/gi, 'GROUP BY 1');
    // Fix "ORDER BY )" -> "ORDER BY 1)"
    transformedSql = transformedSql.replace(/\bORDER\s+BY\s+\)/gi, 'ORDER BY 1)');
    
    // Ensure no empty GROUP BY clauses at end of line
    transformedSql = transformedSql.replace(/\bGROUP\s+BY\s*$/gim, 'GROUP BY 1');
    
    // Fix broken table/column references that might have been created
    // Pattern: FROM/JOIN followed by single letter (likely broken)
    // But be careful - single letter table aliases are valid, so only fix if followed by invalid syntax
    transformedSql = transformedSql.replace(/\b(FROM|JOIN)\s+([A-Za-z])\s+(?!AS|ON|WHERE|GROUP|ORDER|HAVING|LIMIT|,|\))/gi, '$1 $2');
    
    // Fix orphaned closing parens after keywords (common issue from transformations)
    // Pattern: keyword followed by space and closing paren
    transformedSql = transformedSql.replace(/\b(FROM|JOIN|WHERE|HAVING|ORDER|LIMIT)\s+\)/gi, '$1 1)');
    
    // Fix broken SELECT list - ensure SELECT is followed by something valid
    transformedSql = transformedSql.replace(/\bSELECT\s+([A-Za-z])\s+(?!FROM|AS|,|\*)/gi, 'SELECT $1');
    
    // Validate parentheses balance (basic check)
    const openParens = (transformedSql.match(/\(/g) || []).length;
    const closeParens = (transformedSql.match(/\)/g) || []).length;
    
    // If we have unbalanced parentheses, try to fix obvious issues
    if (closeParens > openParens) {
      // Fix "keyword BY )" patterns that are clearly errors
      // For GROUP BY, use "GROUP BY 1" instead of "GROUP BY 1)" to avoid extra paren
      transformedSql = transformedSql.replace(/\bGROUP\s+BY\s+\)/gi, 'GROUP BY 1');
      transformedSql = transformedSql.replace(/\bORDER\s+BY\s+\)/gi, 'ORDER BY 1)');
    }
    
    // Final cleanup: ensure no broken patterns
    // Fix patterns like "keyword single_letter )" which might be broken references
    transformedSql = transformedSql.replace(/\b(FROM|JOIN|SELECT)\s+([A-Za-z])\s+\)/gi, '$1 $2');
  }

  return {
    transformedSql,
    transformations,
    originalSql: sql,
  };
}

/**
 * Restores the original SQL from a preprocessing result.
 * This is useful if you need to execute the original query.
 * 
 * @param result The preprocessing result
 * @returns The original SQL query
 */
export function restoreOriginalSql(result: PreprocessingResult): string {
  return result.originalSql;
}

/**
 * Applies preprocessing and parses the SQL, returning both the AST and transformation info.
 * This is a convenience function that combines preprocessing and parsing.
 * 
 * @param sql The SQL query to parse
 * @param parser The node-sql-parser Parser instance
 * @returns Object containing the AST and preprocessing metadata
 */
export function preprocessAndParse(
  sql: string,
  parser: any,
  options?: { database?: string }
): { ast: any; preprocessing: PreprocessingResult } {
  const preprocessing = preprocessBigQuerySql(sql);
  
  // Try to parse the transformed SQL
  let ast: any;
  let transformedSql = preprocessing.transformedSql;
  
  try {
    ast = parser.astify(transformedSql, {
      database: options?.database || 'bigquery',
    });
    // Success - update preprocessing result and return
    preprocessing.transformedSql = transformedSql;
    return { ast, preprocessing };
  } catch (parseError: any) {
    // If parsing fails, try to fix common issues and retry once
    const errorMessage = parseError.message || 'Unknown parsing error';
    
    // Only apply error recovery fixes if we actually made transformations
    // Otherwise, the SQL is likely valid and the parser just doesn't support it
    if (preprocessing.transformations.length === 0) {
      // No transformations were applied, so the error is likely due to unsupported syntax
      // Don't try to "fix" it - just throw the error
      const errorWithContext = new Error(
        `SQL preprocessing failed: ${errorMessage}\n` +
        `Transformations applied: ${preprocessing.transformations.length}\n` +
        `Transformation types: ${preprocessing.transformations.map(t => t.type).join(', ')}\n` +
        `Original SQL length: ${sql.length}, Transformed length: ${transformedSql.length}\n` +
        `First 500 chars of transformed SQL: ${transformedSql.substring(0, 500)}`
      );
      (errorWithContext as any).originalError = parseError;
      (errorWithContext as any).transformedSql = transformedSql;
      (errorWithContext as any).transformations = preprocessing.transformations;
      throw errorWithContext;
    }
    
    // Try to fix broken references that might have been created by transformations
    // The error "Expected ... but 'C' found" suggests a broken table/column reference
    
    // Common patterns that might be broken:
    // 1. "FROM table AS C" -> "FROM table AS" + broken "C"
    // 2. "GROUP BY 1 C" -> broken reference after GROUP BY
    // 3. Column references like "C.column" that got broken
    
    transformedSql = transformedSql
      // Fix: Ensure GROUP BY 1 is not followed by a single letter (likely broken)
      // Pattern: GROUP BY 1 C -> GROUP BY 1 (remove orphaned C)
      // But be very careful - only match if it's clearly broken (not part of a valid column list)
      .replace(/\bGROUP\s+BY\s+1\s+([A-Z])\s+(?!WHERE|ORDER|HAVING|LIMIT|,|\)|$|\n)/gi, 'GROUP BY 1')
      // Fix broken aliases: "AS C" followed by invalid token
      .replace(/\bAS\s+([A-Za-z])\s+([A-Z])\s+(?!ON|WHERE|GROUP|ORDER|HAVING|LIMIT|,|\)|$|\n|JOIN)/gi, (match, alias, nextChar) => {
        // If we have "AS C" followed by another capital letter and invalid token,
        // this might be a broken reference - restore the alias
        return `AS ${alias}`;
      })
      // Fix: FROM/JOIN table C [invalid] where C should be an alias
      // Pattern: FROM table C [not AS/ON/etc] -> might be broken, but be careful
      // Actually, "FROM table C" is valid (implicit alias), so skip this
      // Normalize whitespace but preserve newlines for better parsing
      .replace(/[ \t]+/g, ' ')
      .trim();
    
    // Update preprocessing result
    preprocessing.transformedSql = transformedSql;
    
    // Try parsing again
    try {
      ast = parser.astify(transformedSql, {
        database: options?.database || 'bigquery',
      });
      // Success on retry
      return { ast, preprocessing };
    } catch (retryError: any) {
      // Still failed - throw error with helpful context for debugging
      const retryErrorMessage = retryError.message || 'Unknown retry parsing error';
      const errorWithContext = new Error(
        `SQL preprocessing failed: ${errorMessage}\n` +
        `Retry error: ${retryErrorMessage}\n` +
        `Transformations applied: ${preprocessing.transformations.length}\n` +
        `Transformation types: ${preprocessing.transformations.map(t => t.type).join(', ')}\n` +
        `Original SQL length: ${sql.length}, Transformed length: ${transformedSql.length}\n` +
        `First 500 chars of transformed SQL: ${transformedSql.substring(0, 500)}`
      );
      (errorWithContext as any).originalError = parseError;
      (errorWithContext as any).retryError = retryError;
      (errorWithContext as any).transformedSql = transformedSql;
      (errorWithContext as any).transformations = preprocessing.transformations;
      throw errorWithContext;
    }
  }
}
