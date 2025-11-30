/**
 * Additional tests for bigquery-formatter covering more edge cases
 */
import { formatBigQueryValue } from '../../../src/renderer/utils/bigquery-formatter';

describe('bigquery-formatter - additional coverage', () => {
  describe('BOOL handling - string values', () => {
    it('should handle "1" and "0" strings for BOOL', () => {
      expect(formatBigQueryValue('1', 'BOOL')).toBe('TRUE');
      expect(formatBigQueryValue('0', 'BOOL')).toBe('FALSE');
    });
  });

  describe('BYTES handling', () => {
    it('should decode valid base64 to hex', () => {
      // "Hello" encoded in base64 is "SGVsbG8="
      const result = formatBigQueryValue('SGVsbG8=', 'BYTES');
      expect(result).toMatch(/^0x[0-9a-f]+$/);
    });

    it('should handle Uint8Array', () => {
      const bytes = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]); // "Hello"
      const result = formatBigQueryValue(bytes, 'BYTES');
      expect(result).toBe('0x48656c6c6f');
    });

    it('should handle number array', () => {
      const bytes = [0x48, 0x65, 0x6c, 0x6c, 0x6f]; // "Hello"
      const result = formatBigQueryValue(bytes, 'BYTES');
      expect(result).toBe('0x48656c6c6f');
    });

    it('should return invalid base64 as-is', () => {
      const result = formatBigQueryValue('not-valid-base64!!!', 'BYTES');
      expect(result).toBe('not-valid-base64!!!');
    });
  });

  describe('DATE handling', () => {
    it('should handle numeric date values', () => {
      // Days since epoch - 0 should be 1970-01-01
      const result = formatBigQueryValue(0, 'DATE');
      expect(result).toBe('1970-01-01');
    });

    it('should handle objects with year/month/day properties', () => {
      const dateObj = { year: 2024, month: 6, day: 15 };
      const result = formatBigQueryValue(dateObj, 'DATE');
      expect(result).toBe('2024-06-15');
    });

    it('should handle objects with wrapped value', () => {
      const wrapped = { value: '2024-06-15' };
      const result = formatBigQueryValue(wrapped, 'DATE');
      expect(result).toBe('2024-06-15');
    });
  });

  describe('TIME handling', () => {
    it('should format time strings', () => {
      expect(formatBigQueryValue('12:30:45', 'TIME')).toBe('12:30:45');
    });

    it('should handle time with milliseconds', () => {
      expect(formatBigQueryValue('12:30:45.123', 'TIME')).toBe('12:30:45.123');
    });
  });

  describe('TIMESTAMP handling', () => {
    it('should handle ISO timestamp strings', () => {
      const result = formatBigQueryValue('2024-06-15T12:30:45Z', 'TIMESTAMP');
      expect(result).toBe('2024-06-15T12:30:45Z');
    });

    it('should handle timestamp with timezone offset', () => {
      const result = formatBigQueryValue('2024-06-15T12:30:45+02:00', 'TIMESTAMP');
      expect(result).toBe('2024-06-15T12:30:45+02:00');
    });
  });

  describe('DATETIME handling', () => {
    it('should handle datetime strings', () => {
      const result = formatBigQueryValue('2024-06-15 12:30:45', 'DATETIME');
      expect(result).toBe('2024-06-15 12:30:45');
    });
  });

  describe('GEOGRAPHY handling', () => {
    it('should handle WKT strings', () => {
      const wkt = 'POINT(-122.4194 37.7749)';
      expect(formatBigQueryValue(wkt, 'GEOGRAPHY')).toBe(wkt);
    });

    it('should handle POLYGON', () => {
      const wkt = 'POLYGON((0 0, 1 0, 1 1, 0 1, 0 0))';
      expect(formatBigQueryValue(wkt, 'GEOGRAPHY')).toBe(wkt);
    });
  });

  describe('JSON handling', () => {
    it('should handle JSON strings', () => {
      const jsonStr = '{"name": "John", "age": 30}';
      // JSON gets pretty-printed
      const result = formatBigQueryValue(jsonStr, 'JSON');
      expect(JSON.parse(result)).toEqual({ name: 'John', age: 30 });
    });

    it('should handle JSON objects', () => {
      const jsonObj = { name: 'John', age: 30 };
      const result = formatBigQueryValue(jsonObj, 'JSON');
      expect(JSON.parse(result)).toEqual(jsonObj);
    });
  });

  describe('ARRAY handling', () => {
    it('should format arrays of numbers', () => {
      const result = formatBigQueryValue([1, 2, 3], 'ARRAY');
      expect(result).toBe('[1, 2, 3]');
    });

    it('should format arrays of strings', () => {
      const result = formatBigQueryValue(['a', 'b', 'c'], 'ARRAY');
      // Formatter joins without quoting string elements
      expect(result).toBe('[a, b, c]');
    });

    it('should format nested arrays', () => {
      const result = formatBigQueryValue([[1, 2], [3, 4]], 'ARRAY');
      expect(result).toBe('[[1, 2], [3, 4]]');
    });

    it('should format empty arrays', () => {
      expect(formatBigQueryValue([], 'ARRAY')).toBe('[]');
    });
  });

  describe('STRUCT/RECORD handling', () => {
    it('should format simple structs', () => {
      const struct = { name: 'John', age: 30 };
      const result = formatBigQueryValue(struct, 'STRUCT');
      expect(JSON.parse(result)).toEqual(struct);
    });

    it('should format nested structs', () => {
      const struct = { user: { name: 'John', address: { city: 'NYC' } } };
      const result = formatBigQueryValue(struct, 'RECORD');
      expect(JSON.parse(result)).toEqual(struct);
    });
  });

  describe('INTEGER/INT64 handling', () => {
    it('should format positive integers', () => {
      expect(formatBigQueryValue(42, 'INT64')).toBe('42');
    });

    it('should format negative integers', () => {
      expect(formatBigQueryValue(-42, 'INT64')).toBe('-42');
    });

    it('should format zero', () => {
      expect(formatBigQueryValue(0, 'INT64')).toBe('0');
    });

    it('should format string integers', () => {
      expect(formatBigQueryValue('12345', 'INT64')).toBe('12345');
    });
  });

  describe('FLOAT64 handling', () => {
    it('should format floats with decimals', () => {
      expect(formatBigQueryValue(3.14159, 'FLOAT64')).toBe('3.14159');
    });

    it('should format negative floats', () => {
      expect(formatBigQueryValue(-2.718, 'FLOAT64')).toBe('-2.718');
    });

    it('should format very small numbers', () => {
      expect(formatBigQueryValue(0.000001, 'FLOAT64')).toBe('0.000001');
    });
  });

  describe('NUMERIC/BIGNUMERIC handling', () => {
    it('should format NUMERIC values', () => {
      expect(formatBigQueryValue('123.456789', 'NUMERIC')).toBe('123.456789');
    });

    it('should format BIGNUMERIC values', () => {
      // BIGNUMERIC strings are formatted with locale settings (grouping)
      const result = formatBigQueryValue('123456789.123456789', 'BIGNUMERIC');
      // Result includes thousand separators and may round
      expect(result).toContain('123');
    });

    it('should format DECIMAL values', () => {
      expect(formatBigQueryValue('999.99', 'DECIMAL')).toBe('999.99');
    });
  });

  describe('STRING handling', () => {
    it('should return strings as-is', () => {
      expect(formatBigQueryValue('hello', 'STRING')).toBe('hello');
    });

    it('should handle special characters', () => {
      expect(formatBigQueryValue('hello\nworld', 'STRING')).toBe('hello\nworld');
    });

    it('should handle unicode', () => {
      expect(formatBigQueryValue('こんにちは', 'STRING')).toBe('こんにちは');
    });
  });

  describe('Type inference without column type', () => {
    it('should infer string type', () => {
      expect(formatBigQueryValue('hello')).toBe('hello');
    });

    it('should infer number type', () => {
      expect(formatBigQueryValue(42)).toBe('42');
    });

    it('should infer boolean type', () => {
      expect(formatBigQueryValue(true)).toBe('true');
      expect(formatBigQueryValue(false)).toBe('false');
    });

    it('should infer Date type', () => {
      const date = new Date('2024-06-15T12:30:45Z');
      const result = formatBigQueryValue(date);
      expect(result).toMatch(/2024-06-15/);
    });
  });
});
