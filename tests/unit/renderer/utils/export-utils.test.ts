import { resultsToCSV, resultsToJSON } from '../../../../src/renderer/utils/export-utils';
import type { ColumnMetadata, Row } from '../../../../src/shared/types/query';

describe('Export Utilities', () => {
  const mockColumns: ColumnMetadata[] = [
    { name: 'id', type: 'INTEGER' },
    { name: 'name', type: 'STRING' },
    { name: 'value', type: 'FLOAT' },
    { name: 'active', type: 'BOOLEAN' },
  ];

  const mockRows: Row[] = [
    { values: [1, 'Alice', 100.5, true] },
    { values: [2, 'Bob', 200.75, false] },
    { values: [3, 'Charlie', 300.25, true] },
  ];

  describe('resultsToCSV', () => {
    it('should convert results to CSV format', () => {
      const csv = resultsToCSV(mockColumns, mockRows);
      const lines = csv.split('\n');

      expect(lines[0]).toBe('id,name,value,active');
      expect(lines[1]).toBe('1,Alice,100.5,true');
      expect(lines[2]).toBe('2,Bob,200.75,false');
      expect(lines[3]).toBe('3,Charlie,300.25,true');
    });

    it('should handle empty rows', () => {
      const csv = resultsToCSV(mockColumns, []);
      expect(csv).toBe('id,name,value,active');
    });

    it('should escape values with commas', () => {
      const rows: Row[] = [{ values: [1, 'Hello, World', 100, true] }];
      const csv = resultsToCSV(mockColumns, rows);
      const lines = csv.split('\n');

      expect(lines[1]).toBe('1,"Hello, World",100,true');
    });

    it('should escape values with quotes', () => {
      const rows: Row[] = [{ values: [1, 'He said "Hello"', 100, true] }];
      const csv = resultsToCSV(mockColumns, rows);
      const lines = csv.split('\n');

      expect(lines[1]).toBe('1,"He said ""Hello""",100,true');
    });

    it('should escape values with newlines', () => {
      const rows: Row[] = [{ values: [1, 'Line1\nLine2', 100, true] }];
      const csv = resultsToCSV(mockColumns, rows);
      const lines = csv.split('\n');

      // The value with newline should be wrapped in quotes
      expect(lines[1]).toContain('"Line1');
    });

    it('should handle null values', () => {
      const rows: Row[] = [{ values: [1, null, undefined, true] }];
      const csv = resultsToCSV(mockColumns, rows);
      const lines = csv.split('\n');

      expect(lines[1]).toBe('1,,,true');
    });

    it('should handle object values (JSON)', () => {
      const rows: Row[] = [{ values: [1, { nested: 'value' }, 100, true] }];
      const csv = resultsToCSV(mockColumns, rows);
      const lines = csv.split('\n');

      // Objects are JSON-stringified and quotes are escaped for CSV
      expect(lines[1]).toContain('nested');
      expect(lines[1]).toContain('value');
    });

    it('should handle array values', () => {
      const rows: Row[] = [{ values: [1, [1, 2, 3], 100, true] }];
      const csv = resultsToCSV(mockColumns, rows);
      const lines = csv.split('\n');

      expect(lines[1]).toContain('[1,2,3]');
    });
  });

  describe('resultsToJSON', () => {
    it('should convert results to JSON format', () => {
      const json = resultsToJSON(mockColumns, mockRows);
      const parsed = JSON.parse(json);

      expect(parsed).toHaveLength(3);
      expect(parsed[0]).toEqual({ id: 1, name: 'Alice', value: 100.5, active: true });
      expect(parsed[1]).toEqual({ id: 2, name: 'Bob', value: 200.75, active: false });
      expect(parsed[2]).toEqual({ id: 3, name: 'Charlie', value: 300.25, active: true });
    });

    it('should handle empty rows', () => {
      const json = resultsToJSON(mockColumns, []);
      const parsed = JSON.parse(json);

      expect(parsed).toEqual([]);
    });

    it('should preserve null values', () => {
      const rows: Row[] = [{ values: [1, null, undefined, true] }];
      const json = resultsToJSON(mockColumns, rows);
      const parsed = JSON.parse(json);

      expect(parsed[0].id).toBe(1);
      expect(parsed[0].name).toBeNull();
      expect(parsed[0].value).toBeUndefined();
      expect(parsed[0].active).toBe(true);
    });

    it('should preserve nested objects', () => {
      const rows: Row[] = [{ values: [1, { nested: { deep: 'value' } }, 100, true] }];
      const json = resultsToJSON(mockColumns, rows);
      const parsed = JSON.parse(json);

      expect(parsed[0].name).toEqual({ nested: { deep: 'value' } });
    });

    it('should preserve arrays', () => {
      const rows: Row[] = [{ values: [1, ['a', 'b', 'c'], 100, true] }];
      const json = resultsToJSON(mockColumns, rows);
      const parsed = JSON.parse(json);

      expect(parsed[0].name).toEqual(['a', 'b', 'c']);
    });

    it('should use column names as keys', () => {
      const columns: ColumnMetadata[] = [
        { name: 'user_id', type: 'INTEGER' },
        { name: 'full_name', type: 'STRING' },
      ];
      const rows: Row[] = [{ values: [123, 'John Doe'] }];
      const json = resultsToJSON(columns, rows);
      const parsed = JSON.parse(json);

      expect(parsed[0]).toHaveProperty('user_id', 123);
      expect(parsed[0]).toHaveProperty('full_name', 'John Doe');
    });

    it('should generate fallback column names for missing columns', () => {
      const columns: ColumnMetadata[] = [{ name: 'id', type: 'INTEGER' }];
      const rows: Row[] = [{ values: [1, 'extra_value', 100] }];
      const json = resultsToJSON(columns, rows);
      const parsed = JSON.parse(json);

      expect(parsed[0]).toHaveProperty('id', 1);
      expect(parsed[0]).toHaveProperty('column_1', 'extra_value');
      expect(parsed[0]).toHaveProperty('column_2', 100);
    });
  });
});
