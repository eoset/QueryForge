// Mock electron-store before importing the module
const mockStore = {
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
};

jest.mock('electron-store', () => {
  return jest.fn().mockImplementation(() => mockStore);
});

// Mock crypto module
jest.mock('crypto', () => ({
  randomUUID: jest.fn(() => 'test-uuid-1234'),
}));

import type { SavedQuery, SaveQueryInput, UpdateQueryInput } from '../../../src/shared/types/query';

// Import after mocks are set up
let getQueries: () => SavedQuery[];
let getQuery: (id: string) => SavedQuery | undefined;
let saveQuery: (input: SaveQueryInput) => SavedQuery;
let updateQuery: (id: string, updates: UpdateQueryInput) => SavedQuery;
let deleteQuery: (id: string) => void;
let searchQueries: (term: string) => SavedQuery[];

describe('query-store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    
    // Re-import the module to reset state
    const queryStore = require('../../../src/main/storage/query-store');
    getQueries = queryStore.getQueries;
    getQuery = queryStore.getQuery;
    saveQuery = queryStore.saveQuery;
    updateQuery = queryStore.updateQuery;
    deleteQuery = queryStore.deleteQuery;
    searchQueries = queryStore.searchQueries;
  });

  describe('getQueries', () => {
    it('should return empty array when no queries exist', () => {
      mockStore.get.mockReturnValue([]);
      const result = getQueries();
      expect(result).toEqual([]);
    });

    it('should return stored queries', () => {
      const mockQueries: SavedQuery[] = [
        {
          id: '1',
          name: 'Test Query',
          sqlText: 'SELECT * FROM test',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];
      mockStore.get.mockReturnValue(mockQueries);
      
      const result = getQueries();
      expect(result).toEqual(mockQueries);
    });

    it('should return empty array when store returns null', () => {
      mockStore.get.mockReturnValue(null);
      const result = getQueries();
      expect(result).toEqual([]);
    });
  });

  describe('getQuery', () => {
    it('should return query by id', () => {
      const mockQueries: SavedQuery[] = [
        {
          id: '1',
          name: 'Test Query',
          sqlText: 'SELECT * FROM test',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];
      mockStore.get.mockReturnValue(mockQueries);
      
      const result = getQuery('1');
      expect(result).toEqual(mockQueries[0]);
    });

    it('should return undefined for non-existent query', () => {
      mockStore.get.mockReturnValue([]);
      
      const result = getQuery('non-existent');
      expect(result).toBeUndefined();
    });
  });

  describe('saveQuery', () => {
    beforeEach(() => {
      mockStore.get.mockReturnValue([]);
    });

    it('should save a new query', () => {
      const input: SaveQueryInput = {
        name: 'Test Query',
        sqlText: 'SELECT * FROM test',
        description: 'A test query',
        tags: ['test'],
      };

      const result = saveQuery(input);

      expect(result).toMatchObject({
        id: 'test-uuid-1234',
        name: 'Test Query',
        sqlText: 'SELECT * FROM test',
        description: 'A test query',
        tags: ['test'],
      });
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(mockStore.set).toHaveBeenCalled();
    });

    it('should trim query name', () => {
      const input: SaveQueryInput = {
        name: '  Test Query  ',
        sqlText: 'SELECT * FROM test',
      };

      const result = saveQuery(input);
      expect(result.name).toBe('Test Query');
    });

    it('should throw error for empty name', () => {
      const input: SaveQueryInput = {
        name: '',
        sqlText: 'SELECT * FROM test',
      };

      expect(() => saveQuery(input)).toThrow('Query name is required');
    });

    it('should throw error for whitespace-only name', () => {
      const input: SaveQueryInput = {
        name: '   ',
        sqlText: 'SELECT * FROM test',
      };

      expect(() => saveQuery(input)).toThrow('Query name is required');
    });

    it('should throw error for name exceeding 255 characters', () => {
      const input: SaveQueryInput = {
        name: 'a'.repeat(256),
        sqlText: 'SELECT * FROM test',
      };

      expect(() => saveQuery(input)).toThrow('Query name must be 255 characters or less');
    });

    it('should throw error for duplicate name', () => {
      const existingQueries: SavedQuery[] = [
        {
          id: '1',
          name: 'Test Query',
          sqlText: 'SELECT 1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];
      mockStore.get.mockReturnValue(existingQueries);

      const input: SaveQueryInput = {
        name: 'Test Query',
        sqlText: 'SELECT * FROM test',
      };

      expect(() => saveQuery(input)).toThrow('A query with the name "Test Query" already exists');
    });
  });

  describe('updateQuery', () => {
    const existingQuery: SavedQuery = {
      id: '1',
      name: 'Test Query',
      sqlText: 'SELECT * FROM test',
      description: 'Original description',
      tags: ['original'],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    beforeEach(() => {
      mockStore.get.mockReturnValue([existingQuery]);
    });

    it('should update query name', () => {
      const updates: UpdateQueryInput = {
        name: 'Updated Query',
      };

      const result = updateQuery('1', updates);

      expect(result.name).toBe('Updated Query');
      expect(result.sqlText).toBe('SELECT * FROM test');
    });

    it('should update query SQL', () => {
      const updates: UpdateQueryInput = {
        sqlText: 'SELECT 1',
      };

      const result = updateQuery('1', updates);

      expect(result.sqlText).toBe('SELECT 1');
      expect(result.name).toBe('Test Query');
    });

    it('should update multiple fields', () => {
      const updates: UpdateQueryInput = {
        name: 'Updated Query',
        sqlText: 'SELECT 1',
        description: 'Updated description',
        tags: ['updated'],
      };

      const result = updateQuery('1', updates);

      expect(result.name).toBe('Updated Query');
      expect(result.sqlText).toBe('SELECT 1');
      expect(result.description).toBe('Updated description');
      expect(result.tags).toEqual(['updated']);
    });

    it('should throw error for non-existent query', () => {
      expect(() => updateQuery('non-existent', { name: 'Test' })).toThrow(
        'Query with id "non-existent" not found'
      );
    });

    it('should throw error for empty name update', () => {
      expect(() => updateQuery('1', { name: '' })).toThrow('Query name cannot be empty');
    });

    it('should throw error for name exceeding 255 characters', () => {
      expect(() => updateQuery('1', { name: 'a'.repeat(256) })).toThrow(
        'Query name must be 255 characters or less'
      );
    });

    it('should throw error for duplicate name', () => {
      const anotherQuery: SavedQuery = {
        id: '2',
        name: 'Another Query',
        sqlText: 'SELECT 2',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };
      mockStore.get.mockReturnValue([existingQuery, anotherQuery]);

      expect(() => updateQuery('1', { name: 'Another Query' })).toThrow(
        'A query with the name "Another Query" already exists'
      );
    });

    it('should update updatedAt timestamp', () => {
      const result = updateQuery('1', { description: 'New description' });

      expect(result.updatedAt).not.toBe(existingQuery.updatedAt);
    });
  });

  describe('deleteQuery', () => {
    it('should delete an existing query', () => {
      const existingQuery: SavedQuery = {
        id: '1',
        name: 'Test Query',
        sqlText: 'SELECT * FROM test',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };
      mockStore.get.mockReturnValue([existingQuery]);

      deleteQuery('1');

      expect(mockStore.set).toHaveBeenCalledWith('queries', []);
    });

    it('should throw error for non-existent query', () => {
      mockStore.get.mockReturnValue([]);

      expect(() => deleteQuery('non-existent')).toThrow('Query with id "non-existent" not found');
    });
  });

  describe('searchQueries', () => {
    const queries: SavedQuery[] = [
      {
        id: '1',
        name: 'Sales Report',
        sqlText: 'SELECT * FROM sales',
        description: 'Monthly sales data',
        tags: ['report', 'monthly'],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        name: 'User Analytics',
        sqlText: 'SELECT * FROM users WHERE active = true',
        description: 'Active user metrics',
        tags: ['analytics', 'users'],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ];

    beforeEach(() => {
      mockStore.get.mockReturnValue(queries);
    });

    it('should return all queries for empty search term', () => {
      const result = searchQueries('');
      expect(result).toEqual(queries);
    });

    it('should return all queries for whitespace search term', () => {
      const result = searchQueries('   ');
      expect(result).toEqual(queries);
    });

    it('should search by query name', () => {
      const result = searchQueries('sales');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Sales Report');
    });

    it('should search by SQL text', () => {
      const result = searchQueries('active');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('User Analytics');
    });

    it('should search by description', () => {
      const result = searchQueries('metrics');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('User Analytics');
    });

    it('should search by tags', () => {
      const result = searchQueries('report');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Sales Report');
    });

    it('should be case-insensitive', () => {
      const result = searchQueries('SALES');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Sales Report');
    });

    it('should return empty array for no matches', () => {
      const result = searchQueries('nonexistent');
      expect(result).toEqual([]);
    });
  });
});
