/**
 * Tests for the Tree-sitter SQL Validator
 * 
 * These tests verify the hybrid validation approach using tree-sitter-sql-bigquery.
 */

// Mock tree-sitter modules before importing
jest.mock('tree-sitter', () => {
  // Create a mock parser that simulates tree-sitter behavior
  return jest.fn().mockImplementation(() => ({
    setLanguage: jest.fn(),
    parse: jest.fn((sql: string) => {
      // Simulate parsing behavior
      const mockRootNode = createMockTree(sql);
      return { rootNode: mockRootNode };
    }),
  }));
});

jest.mock('tree-sitter-sql-bigquery', () => ({
  default: {},
}));

// Helper to create mock tree nodes
interface MockNode {
  type: string;
  text: string;
  startPosition: { row: number; column: number };
  endPosition: { row: number; column: number };
  childCount: number;
  children: MockNode[];
  isMissing?: boolean;
  child(index: number): MockNode | null;
}

function createMockNode(type: string, text: string, row: number, column: number, children: MockNode[] = []): MockNode {
  return {
    type,
    text,
    startPosition: { row, column },
    endPosition: { row, column: column + text.length },
    childCount: children.length,
    children,
    child(index: number) {
      return this.children[index] || null;
    },
  };
}

function createMockTree(sql: string): MockNode {
  const trimmed = sql.trim();
  
  // Simulate different parsing outcomes based on SQL content
  if (!trimmed) {
    return createMockNode('source_file', '', 0, 0);
  }
  
  // Simulate syntax errors for known bad patterns
  if (trimmed.match(/^SELEC\s/i)) {
    return createMockNode('source_file', sql, 0, 0, [
      createMockNode('ERROR', sql, 0, 0),
    ]);
  }
  
  if (trimmed.includes('COUNT(*') && !trimmed.includes('COUNT(*)')) {
    // Unclosed parenthesis
    const children = [
      createMockNode('query_statement', sql, 0, 0, [
        createMockNode('select', 'SELECT', 0, 0),
        { ...createMockNode(')', '', 0, sql.indexOf('COUNT(') + 7), isMissing: true },
      ]),
    ];
    return createMockNode('source_file', sql, 0, 0, children);
  }
  
  if (trimmed.match(/GROUP\s+BY\s+\w+\s+FROM/i)) {
    // Invalid keyword order: GROUP BY before FROM
    return createMockNode('source_file', sql, 0, 0, [
      createMockNode('query_statement', sql, 0, 0, [
        createMockNode('select', 'SELECT', 0, 0),
        createMockNode('ERROR', 'GROUP BY id', 0, sql.toLowerCase().indexOf('group')),
      ]),
    ]);
  }
  
  if (trimmed.includes('===')) {
    // Invalid operator
    const errorPos = sql.indexOf('===');
    return createMockNode('source_file', sql, 0, 0, [
      createMockNode('ERROR', '==', 0, errorPos),
    ]);
  }
  
  if (trimmed.includes(',,')) {
    // Double comma
    const errorPos = sql.indexOf(',,') + 1;
    return createMockNode('source_file', sql, 0, 0, [
      createMockNode('ERROR', ',', 0, errorPos),
    ]);
  }
  
  // Valid SQL - return a proper tree structure
  return createMockNode('source_file', sql, 0, 0, [
    createMockNode('query_statement', sql, 0, 0, [
      createMockNode('select', 'SELECT', 0, 0),
      createMockNode('select_list', '', 0, 7),
      createMockNode('from_clause', 'FROM', 0, sql.toLowerCase().indexOf('from') >= 0 ? sql.toLowerCase().indexOf('from') : 20),
    ]),
  ]);
}

// Import after mocks are set up
import {
  initTreeSitterParser,
  validateWithTreeSitter,
  isTreeSitterAvailable,
  hasSyntaxErrors,
} from '../../../../src/renderer/utils/tree-sitter-validator';

describe('Tree-sitter SQL Validator', () => {
  beforeAll(async () => {
    // Initialize the mocked parser
    await initTreeSitterParser();
  });

  describe('initTreeSitterParser', () => {
    it('should initialize successfully', async () => {
      const result = await initTreeSitterParser();
      expect(result).toBe(true);
    });

    it('should report parser as available after initialization', () => {
      expect(isTreeSitterAvailable()).toBe(true);
    });
  });

  describe('validateWithTreeSitter', () => {
    describe('valid SQL', () => {
      it('should return no errors for simple SELECT', () => {
        const errors = validateWithTreeSitter('SELECT id, name FROM users');
        expect(errors).toHaveLength(0);
      });

      it('should return no errors for SELECT with WHERE', () => {
        const errors = validateWithTreeSitter('SELECT * FROM users WHERE active = TRUE');
        expect(errors).toHaveLength(0);
      });

      it('should return no errors for SELECT with GROUP BY', () => {
        const errors = validateWithTreeSitter('SELECT department, COUNT(*) FROM employees GROUP BY department');
        expect(errors).toHaveLength(0);
      });
    });

    describe('syntax errors', () => {
      it('should detect typo in SELECT keyword', () => {
        const errors = validateWithTreeSitter('SELEC id FROM users');
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].message).toContain('Syntax error');
        expect(errors[0].rule).toBe('tree-sitter-syntax');
      });

      it('should detect unclosed parenthesis', () => {
        const errors = validateWithTreeSitter('SELECT COUNT(* FROM users');
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].message).toContain('Missing');
        expect(errors[0].rule).toBe('tree-sitter-missing');
      });

      it('should detect invalid keyword order', () => {
        const errors = validateWithTreeSitter('SELECT * GROUP BY id FROM users');
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].message).toContain('Syntax error');
      });

      it('should detect invalid operator', () => {
        const errors = validateWithTreeSitter('SELECT * FROM users WHERE id === 1');
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].message).toContain('Syntax error');
      });

      it('should detect double comma', () => {
        const errors = validateWithTreeSitter('SELECT a,, b FROM users');
        expect(errors.length).toBeGreaterThan(0);
      });
    });

    describe('empty queries', () => {
      it('should return error for empty string', () => {
        const errors = validateWithTreeSitter('');
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].message).toBe('Empty query');
        expect(errors[0].rule).toBe('tree-sitter-empty');
      });

      it('should return error for whitespace-only query', () => {
        const errors = validateWithTreeSitter('   \n\t  ');
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].message).toBe('Empty query');
      });
    });
  });

  describe('hasSyntaxErrors', () => {
    it('should return false for valid SQL', () => {
      expect(hasSyntaxErrors('SELECT * FROM users')).toBe(false);
    });

    it('should return true for invalid SQL', () => {
      expect(hasSyntaxErrors('SELEC * FROM users')).toBe(true);
    });

    it('should return true for empty query', () => {
      expect(hasSyntaxErrors('')).toBe(true);
    });
  });
});

describe('Tree-sitter Validator Error Locations', () => {
  beforeAll(async () => {
    await initTreeSitterParser();
  });

  it('should provide correct line numbers (1-indexed)', () => {
    const errors = validateWithTreeSitter('SELEC id FROM users');
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].line).toBe(1);
    expect(errors[0].column).toBeGreaterThanOrEqual(1);
  });

  it('should have error severity', () => {
    const errors = validateWithTreeSitter('SELEC id FROM users');
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].severity).toBe('error');
  });

  it('should have a rule identifier', () => {
    const errors = validateWithTreeSitter('SELEC id FROM users');
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].rule).toBeDefined();
    expect(errors[0].rule?.startsWith('tree-sitter')).toBe(true);
  });
});
