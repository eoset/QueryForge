import { formatBigQueryValue } from '../../../src/renderer/utils/bigquery-formatter';

describe('bigquery-formatter', () => {
  describe('formatBigQueryValue', () => {
    describe('NULL handling', () => {
      it('should return "null" for null values', () => {
        expect(formatBigQueryValue(null)).toBe('null');
        expect(formatBigQueryValue(null, 'STRING')).toBe('null');
        expect(formatBigQueryValue(null, 'INTEGER')).toBe('null');
      });

      it('should return "null" for undefined values', () => {
        expect(formatBigQueryValue(undefined)).toBe('null');
        expect(formatBigQueryValue(undefined, 'STRING')).toBe('null');
      });
    });

    describe('BOOLEAN formatting', () => {
      it('should format boolean true as "TRUE"', () => {
        expect(formatBigQueryValue(true, 'BOOL')).toBe('TRUE');
        expect(formatBigQueryValue(true, 'BOOLEAN')).toBe('TRUE');
      });

      it('should format boolean false as "FALSE"', () => {
        expect(formatBigQueryValue(false, 'BOOL')).toBe('FALSE');
        expect(formatBigQueryValue(false, 'BOOLEAN')).toBe('FALSE');
      });

      it('should handle string boolean values', () => {
        expect(formatBigQueryValue('true', 'BOOL')).toBe('TRUE');
        expect(formatBigQueryValue('false', 'BOOL')).toBe('FALSE');
        expect(formatBigQueryValue('TRUE', 'BOOL')).toBe('TRUE');
        expect(formatBigQueryValue('FALSE', 'BOOL')).toBe('FALSE');
      });
    });

    describe('STRING formatting', () => {
      it('should return strings as-is', () => {
        expect(formatBigQueryValue('hello', 'STRING')).toBe('hello');
        expect(formatBigQueryValue('hello world', 'STRING')).toBe('hello world');
      });

      it('should handle empty strings', () => {
        expect(formatBigQueryValue('', 'STRING')).toBe('');
      });
    });

    describe('INTEGER/INT64 formatting', () => {
      it('should format integers', () => {
        expect(formatBigQueryValue(123, 'INTEGER')).toBe('123');
        expect(formatBigQueryValue(123, 'INT64')).toBe('123');
        expect(formatBigQueryValue(-456, 'INT64')).toBe('-456');
      });

      it('should format large integers', () => {
        expect(formatBigQueryValue(9007199254740991, 'INT64')).toBe('9007199254740991');
      });

      it('should format zero', () => {
        expect(formatBigQueryValue(0, 'INTEGER')).toBe('0');
      });
    });

    describe('FLOAT64/FLOAT formatting', () => {
      it('should format floats', () => {
        expect(formatBigQueryValue(3.14159, 'FLOAT64')).toBe('3.14159');
        expect(formatBigQueryValue(3.14159, 'FLOAT')).toBe('3.14159');
      });

      it('should format negative floats', () => {
        expect(formatBigQueryValue(-2.5, 'FLOAT64')).toBe('-2.5');
      });
    });

    describe('DATE formatting', () => {
      it('should format date strings', () => {
        expect(formatBigQueryValue('2024-01-15', 'DATE')).toBe('2024-01-15');
      });

      it('should format Date objects for DATE type', () => {
        const date = new Date('2024-01-15T00:00:00Z');
        const result = formatBigQueryValue(date, 'DATE');
        expect(result).toBe('2024-01-15');
      });
    });

    describe('TIMESTAMP formatting', () => {
      it('should format timestamp strings', () => {
        expect(formatBigQueryValue('2024-01-15T10:30:00Z', 'TIMESTAMP')).toBe('2024-01-15T10:30:00Z');
      });

      it('should format Date objects for TIMESTAMP type', () => {
        const date = new Date('2024-01-15T10:30:00Z');
        const result = formatBigQueryValue(date, 'TIMESTAMP');
        expect(result).toMatch(/2024-01-15T10:30:00/);
      });
    });

    describe('DATETIME formatting', () => {
      it('should format datetime strings', () => {
        expect(formatBigQueryValue('2024-01-15 10:30:00', 'DATETIME')).toBe('2024-01-15 10:30:00');
      });

      it('should format Date objects for DATETIME type', () => {
        const date = new Date('2024-01-15T10:30:00Z');
        const result = formatBigQueryValue(date, 'DATETIME');
        expect(result).toBe('2024-01-15 10:30:00');
      });
    });

    describe('TIME formatting', () => {
      it('should format time strings', () => {
        expect(formatBigQueryValue('10:30:00', 'TIME')).toBe('10:30:00');
      });

      it('should format Date objects for TIME type', () => {
        const date = new Date('2024-01-15T10:30:00Z');
        const result = formatBigQueryValue(date, 'TIME');
        expect(result).toBe('10:30:00');
      });
    });

    describe('ARRAY formatting', () => {
      it('should format arrays as JSON', () => {
        const result = formatBigQueryValue([1, 2, 3], 'ARRAY');
        expect(result).toBe('[1, 2, 3]');
      });

      it('should format arrays of strings', () => {
        const result = formatBigQueryValue(['a', 'b', 'c'], 'ARRAY');
        // The formatter joins elements without quoting individual strings
        expect(result).toBe('[a, b, c]');
      });

      it('should format empty arrays', () => {
        const result = formatBigQueryValue([], 'ARRAY');
        expect(result).toBe('[]');
      });
    });

    describe('STRUCT/RECORD formatting', () => {
      it('should format objects as JSON', () => {
        const result = formatBigQueryValue({ name: 'John', age: 30 }, 'STRUCT');
        expect(JSON.parse(result)).toEqual({ name: 'John', age: 30 });
      });

      it('should format nested objects', () => {
        const value = { user: { name: 'John', address: { city: 'NYC' } } };
        const result = formatBigQueryValue(value, 'RECORD');
        expect(JSON.parse(result)).toEqual(value);
      });
    });

    describe('BYTES formatting', () => {
      it('should format byte arrays', () => {
        // BYTES are formatted as hex strings (0x...)
        const result = formatBigQueryValue('SGVsbG8=', 'BYTES');
        // Base64 'SGVsbG8=' decodes to 'Hello' which is 0x48656c6c6f
        expect(result).toBe('0x48656c6c6f');
      });
    });

    describe('GEOGRAPHY formatting', () => {
      it('should format geography strings', () => {
        const geoJson = 'POINT(-122.4194 37.7749)';
        expect(formatBigQueryValue(geoJson, 'GEOGRAPHY')).toBe(geoJson);
      });
    });

    describe('JSON formatting', () => {
      it('should format JSON strings', () => {
        const jsonStr = '{"key": "value"}';
        // JSON is pretty-printed with 2-space indentation
        const expected = '{\n  "key": "value"\n}';
        expect(formatBigQueryValue(jsonStr, 'JSON')).toBe(expected);
      });

      it('should format JSON objects', () => {
        const value = { key: 'value' };
        const result = formatBigQueryValue(value, 'JSON');
        expect(JSON.parse(result)).toEqual(value);
      });
    });

    describe('NUMERIC/BIGNUMERIC formatting', () => {
      it('should format numeric strings', () => {
        expect(formatBigQueryValue('123.456', 'NUMERIC')).toBe('123.456');
        expect(formatBigQueryValue('123.456', 'BIGNUMERIC')).toBe('123.456');
        expect(formatBigQueryValue('123.456', 'DECIMAL')).toBe('123.456');
      });
    });

    describe('Unknown types', () => {
      it('should handle values without column type', () => {
        expect(formatBigQueryValue('hello')).toBe('hello');
        expect(formatBigQueryValue(123)).toBe('123');
        expect(formatBigQueryValue(true)).toBe('true');
      });
    });

    describe('Edge cases', () => {
      it('should handle [object Object] string for date columns', () => {
        const result = formatBigQueryValue('[object Object]', 'DATE');
        expect(result).toBe('[Invalid Date]');
      });

      it('should handle empty objects for date columns', () => {
        const result = formatBigQueryValue({}, 'DATE');
        expect(result).toBe('[Invalid Date]');
      });

      it('should handle invalid Date objects', () => {
        const invalidDate = new Date('invalid');
        const result = formatBigQueryValue(invalidDate, 'DATE');
        expect(result).toBe('Invalid Date');
      });
    });
  });
});
