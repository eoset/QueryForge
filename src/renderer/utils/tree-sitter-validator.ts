/**
 * Tree-sitter SQL Validator
 * 
 * This module provides syntax validation using tree-sitter-sql-bigquery.
 * It complements sql-parser-cst by providing:
 * - Fast incremental parsing
 * - Better error recovery (partial parse trees)
 * - Syntax error detection with precise locations
 * 
 * Used alongside sql-parser-cst for comprehensive validation:
 * - tree-sitter: Syntax errors (structural issues, typos, malformed expressions)
 * - sql-parser-cst: Detailed parsing and semantic validation
 */

import type { ColumnValidationIssue } from './sql-validation';

// Tree-sitter types (we'll dynamically import the module)
interface TreeSitterNode {
  type: string;
  text: string;
  startPosition: { row: number; column: number };
  endPosition: { row: number; column: number };
  childCount: number;
  child(index: number): TreeSitterNode | null;
  isMissing?: boolean;
  hasError?: boolean;
}

interface TreeSitterTree {
  rootNode: TreeSitterNode;
}

interface TreeSitterParser {
  parse(input: string): TreeSitterTree;
  setLanguage(language: any): void;
}

// Singleton parser instance
let treeSitterParser: TreeSitterParser | null = null;
let initializationPromise: Promise<boolean> | null = null;
let initializationError: Error | null = null;

/**
 * Initialize the tree-sitter parser with BigQuery language
 * Returns true if successful, false otherwise
 */
export async function initTreeSitterParser(): Promise<boolean> {
  // Return cached result if already initialized
  if (treeSitterParser !== null) {
    return true;
  }
  
  if (initializationError !== null) {
    return false;
  }
  
  // Prevent multiple simultaneous initialization attempts
  if (initializationPromise !== null) {
    return initializationPromise;
  }
  
  initializationPromise = (async () => {
    try {
      // Dynamic import to handle cases where native modules aren't available
      const TreeSitter = await import('tree-sitter');
      const BigQueryLang = await import('tree-sitter-sql-bigquery');
      
      const parser = new TreeSitter.default();
      parser.setLanguage(BigQueryLang.default);
      
      treeSitterParser = parser;
      return true;
    } catch (error) {
      initializationError = error as Error;
      return false;
    }
  })();
  
  return initializationPromise;
}

/**
 * Check if tree-sitter parser is available
 */
export function isTreeSitterAvailable(): boolean {
  return treeSitterParser !== null;
}

/**
 * Collect all syntax errors from a tree-sitter parse tree
 */
function collectTreeSitterErrors(node: TreeSitterNode, errors: ColumnValidationIssue[]): void {
  if (!node) return;
  
  // ERROR node indicates a parse error
  if (node.type === 'ERROR') {
    const errorText = node.text.substring(0, 50);
    const hasMore = node.text.length > 50;
    
    errors.push({
      message: `Syntax error: unexpected "${errorText}${hasMore ? '...' : ''}"`,
      line: node.startPosition.row + 1,
      column: node.startPosition.column + 1,
      length: Math.min(node.text.length, 20),
      severity: 'error',
      rule: 'tree-sitter-syntax',
    });
  }
  
  // Missing node indicates expected token is missing
  if (node.isMissing) {
    errors.push({
      message: `Missing ${node.type}`,
      line: node.startPosition.row + 1,
      column: node.startPosition.column + 1,
      length: 1,
      severity: 'error',
      rule: 'tree-sitter-missing',
    });
  }
  
  // Recursively check children
  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i);
    if (child) {
      collectTreeSitterErrors(child, errors);
    }
  }
}

/**
 * Parse SQL and return syntax errors using tree-sitter
 * Returns an array of validation issues (empty if no errors)
 */
export function validateWithTreeSitter(sql: string): ColumnValidationIssue[] {
  // Return empty if parser not available
  if (!treeSitterParser) {
    return [];
  }
  
  // Handle empty/whitespace-only queries
  const trimmed = sql.trim();
  if (!trimmed) {
    return [{
      message: 'Empty query',
      line: 1,
      column: 1,
      length: 1,
      severity: 'error',
      rule: 'tree-sitter-empty',
    }];
  }
  
  try {
    const tree = treeSitterParser.parse(sql);
    const errors: ColumnValidationIssue[] = [];
    
    collectTreeSitterErrors(tree.rootNode, errors);
    
    return errors;
  } catch (error) {
    // If parsing throws, return a generic error
    console.error('[TreeSitterValidator] Parse error:', error);
    return [{
      message: `Parse error: ${(error as Error).message}`,
      line: 1,
      column: 1,
      length: 10,
      severity: 'error',
      rule: 'tree-sitter-exception',
    }];
  }
}

/**
 * Get the parse tree for a SQL query (useful for debugging/inspection)
 */
export function getTreeSitterParseTree(sql: string): TreeSitterTree | null {
  if (!treeSitterParser) {
    return null;
  }
  
  try {
    return treeSitterParser.parse(sql);
  } catch {
    return null;
  }
}

/**
 * Print a simplified view of the parse tree (for debugging)
 */
export function printTreeSitterTree(sql: string, maxDepth = 3): string {
  const tree = getTreeSitterParseTree(sql);
  if (!tree) {
    return 'Parser not available';
  }
  
  const lines: string[] = [];
  
  function printNode(node: TreeSitterNode, indent: number): void {
    if (indent > maxDepth * 2) return;
    
    const prefix = '  '.repeat(indent);
    let line = `${prefix}${node.type}`;
    
    if (node.type === 'ERROR') {
      line += ` [ERROR: "${node.text.substring(0, 30)}..."]`;
    } else if (node.isMissing) {
      line += ' [MISSING]';
    } else if (node.childCount === 0 && node.text) {
      line += `: "${node.text.substring(0, 20)}"`;
    }
    
    lines.push(line);
    
    if (indent < maxDepth * 2) {
      for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (child) {
          printNode(child, indent + 1);
        }
      }
    }
  }
  
  printNode(tree.rootNode, 0);
  return lines.join('\n');
}

/**
 * Quick check if SQL has any syntax errors (faster than full validation)
 */
export function hasSyntaxErrors(sql: string): boolean {
  if (!treeSitterParser) {
    return false; // Can't determine, assume no errors
  }
  
  const trimmed = sql.trim();
  if (!trimmed) {
    return true;
  }
  
  try {
    const tree = treeSitterParser.parse(sql);
    return hasErrorsInTree(tree.rootNode);
  } catch {
    return true;
  }
}

/**
 * Recursively check if tree has any ERROR or MISSING nodes
 */
function hasErrorsInTree(node: TreeSitterNode): boolean {
  if (!node) return false;
  if (node.type === 'ERROR' || node.isMissing) return true;
  
  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i);
    if (child && hasErrorsInTree(child)) {
      return true;
    }
  }
  
  return false;
}
