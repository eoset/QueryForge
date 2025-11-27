/**
 * Formats BigQuery values for display in the UI
 * Supports all BigQuery data types as per:
 * https://docs.cloud.google.com/bigquery/docs/reference/standard-sql/data-types
 */

// Pre-compile regex patterns for better performance (compiled once, reused many times)
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^\d{2}:\d{2}:\d{2}(\.\d+)?$/;
const DATETIME_REGEX = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?$/;
const ISO_TIMESTAMP_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

/**
 * Formats a BigQuery value based on its column type
 * @param value - The value to format
 * @param columnType - The BigQuery column type (e.g., 'STRING', 'INTEGER', 'TIMESTAMP', etc.)
 * @returns Formatted string representation of the value
 */
export function formatBigQueryValue(value: any, columnType?: string): string {
  // Handle NULL values - early return for common case
  if (value === null || value === undefined) {
    return 'NULL';
  }

  // Normalize column type to uppercase for comparison (cache if called multiple times)
  const normalizedType = columnType?.toUpperCase() || '';

  // Handle BOOL/BOOLEAN
  if (normalizedType === 'BOOL' || normalizedType === 'BOOLEAN') {
    if (typeof value === 'boolean') {
      return value ? 'TRUE' : 'FALSE';
    }
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      if (lower === 'true' || lower === '1') return 'TRUE';
      if (lower === 'false' || lower === '0') return 'FALSE';
    }
    return String(value);
  }

  // Handle BYTES
  if (normalizedType === 'BYTES') {
    if (typeof value === 'string') {
      // BigQuery returns BYTES as base64-encoded strings
      // Display as hex for better readability
      try {
        const binaryString = atob(value);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return '0x' + Array.from(bytes)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
      } catch {
        // If not valid base64, return as-is
        return value;
      }
    }
    if (value instanceof Uint8Array || Array.isArray(value)) {
      const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
      return '0x' + Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    }
    return String(value);
  }

  // Handle DATE
  if (normalizedType === 'DATE') {
    if (value instanceof Date) {
      return value.toISOString().split('T')[0]; // YYYY-MM-DD
    }
    if (typeof value === 'string') {
      // If already in YYYY-MM-DD format, return as-is
      if (DATE_REGEX.test(value)) {
        return value;
      }
      // Try to parse and format
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
      return value;
    }
    if (typeof value === 'number') {
      // Handle numeric date values (days since epoch)
      const date = new Date(value * 86400000); // Convert days to milliseconds
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
    return String(value);
  }

  // Handle TIME
  if (normalizedType === 'TIME') {
    if (value instanceof Date) {
      const hours = String(value.getUTCHours()).padStart(2, '0');
      const minutes = String(value.getUTCMinutes()).padStart(2, '0');
      const seconds = String(value.getUTCSeconds()).padStart(2, '0');
      const ms = value.getUTCMilliseconds();
      if (ms > 0) {
        const msStr = String(ms).padStart(3, '0');
        return `${hours}:${minutes}:${seconds}.${msStr}`;
      }
      return `${hours}:${minutes}:${seconds}`;
    }
    if (typeof value === 'string') {
      // If already in HH:mm:ss format, return as-is
      if (TIME_REGEX.test(value)) {
        return value;
      }
      // Try to parse and format
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        const seconds = String(date.getUTCSeconds()).padStart(2, '0');
        const ms = date.getUTCMilliseconds();
        if (ms > 0) {
          const msStr = String(ms).padStart(3, '0');
          return `${hours}:${minutes}:${seconds}.${msStr}`;
        }
        return `${hours}:${minutes}:${seconds}`;
      }
      return value;
    }
    if (typeof value === 'number') {
      // Handle numeric time values (milliseconds since midnight)
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        const seconds = String(date.getUTCSeconds()).padStart(2, '0');
        const ms = date.getUTCMilliseconds();
        if (ms > 0) {
          const msStr = String(ms).padStart(3, '0');
          return `${hours}:${minutes}:${seconds}.${msStr}`;
        }
        return `${hours}:${minutes}:${seconds}`;
      }
    }
    return String(value);
  }

  // Handle DATETIME
  if (normalizedType === 'DATETIME') {
    if (value instanceof Date) {
      return value.toISOString().replace('T', ' ').slice(0, 19); // YYYY-MM-DD HH:mm:ss
    }
    if (typeof value === 'string') {
      // If already in YYYY-MM-DD HH:mm:ss format, return as-is
      if (DATETIME_REGEX.test(value)) {
        return value;
      }
      // Try to parse and format
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toISOString().replace('T', ' ').slice(0, 19);
      }
      return value;
    }
    if (typeof value === 'number') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toISOString().replace('T', ' ').slice(0, 19);
      }
    }
    return String(value);
  }

  // Handle TIMESTAMP
  if (normalizedType === 'TIMESTAMP') {
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === 'string') {
      // If already in ISO format, return as-is
      if (ISO_TIMESTAMP_REGEX.test(value)) {
        return value;
      }
      // Try to parse and format
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
      return value;
    }
    if (typeof value === 'number') {
      // BigQuery timestamps are in microseconds since epoch
      // JavaScript Date uses milliseconds, so divide by 1000 if > 1e12
      const timestampMs = value > 1e12 ? value / 1000 : value;
      const date = new Date(timestampMs);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    }
    return String(value);
  }

  // Handle INTERVAL
  if (normalizedType === 'INTERVAL') {
    if (typeof value === 'string') {
      // BigQuery INTERVAL format: "Y-M D H:M:S" or similar
      // Return as-is since it's already formatted
      return value;
    }
    if (typeof value === 'object' && value !== null) {
      // BigQuery might return interval as an object with parts
      if (value.years !== undefined || value.months !== undefined || 
          value.days !== undefined || value.hours !== undefined ||
          value.minutes !== undefined || value.seconds !== undefined) {
        const parts: string[] = [];
        if (value.years) parts.push(`${value.years} year${value.years !== 1 ? 's' : ''}`);
        if (value.months) parts.push(`${value.months} month${value.months !== 1 ? 's' : ''}`);
        if (value.days) parts.push(`${value.days} day${value.days !== 1 ? 's' : ''}`);
        if (value.hours) parts.push(`${value.hours} hour${value.hours !== 1 ? 's' : ''}`);
        if (value.minutes) parts.push(`${value.minutes} minute${value.minutes !== 1 ? 's' : ''}`);
        if (value.seconds) parts.push(`${value.seconds} second${value.seconds !== 1 ? 's' : ''}`);
        return parts.join(' ') || '0 seconds';
      }
    }
    return String(value);
  }

  // Handle NUMERIC and BIGNUMERIC
  if (normalizedType === 'NUMERIC' || normalizedType === 'BIGNUMERIC') {
    if (typeof value === 'number') {
      // Format with appropriate precision
      // NUMERIC has 38 digits total, 9 after decimal
      // BIGNUMERIC has 76 digits total, 38 after decimal
      // For display, use toFixed to show significant digits
      return value.toLocaleString('en-US', {
        maximumFractionDigits: 38,
        useGrouping: true,
      });
    }
    if (typeof value === 'string') {
      // BigQuery returns NUMERIC/BIGNUMERIC as strings to preserve precision
      // Format with locale-aware number formatting
      try {
        const num = parseFloat(value);
        if (!isNaN(num)) {
          return num.toLocaleString('en-US', {
            maximumFractionDigits: 38,
            useGrouping: true,
          });
        }
      } catch {
        // If parsing fails, return as-is
      }
      return value;
    }
    return String(value);
  }

  // Handle INTEGER types (INTEGER, INT64, INT32, INT, etc.)
  if (normalizedType === 'INTEGER' || normalizedType === 'INT' || normalizedType.includes('INT')) {
    if (typeof value === 'number') {
      return value.toLocaleString('en-US');
    }
    if (typeof value === 'string') {
      // BigQuery might return large integers as strings
      try {
        const num = parseInt(value, 10);
        if (!isNaN(num)) {
          return num.toLocaleString('en-US');
        }
      } catch {
        // If parsing fails, return as-is
      }
      return value;
    }
    return String(value);
  }

  // Handle FLOAT and FLOAT64
  if (normalizedType === 'FLOAT' || normalizedType === 'FLOAT64') {
    if (typeof value === 'number') {
      // Format floats with reasonable precision
      if (Number.isInteger(value)) {
        return value.toLocaleString('en-US');
      }
      return value.toLocaleString('en-US', {
        maximumFractionDigits: 15,
        useGrouping: true,
      });
    }
    if (typeof value === 'string') {
      try {
        const num = parseFloat(value);
        if (!isNaN(num)) {
          if (Number.isInteger(num)) {
            return num.toLocaleString('en-US');
          }
          return num.toLocaleString('en-US', {
            maximumFractionDigits: 15,
            useGrouping: true,
          });
        }
      } catch {
        // If parsing fails, return as-is
      }
      return value;
    }
    return String(value);
  }

  // Handle GEOGRAPHY
  if (normalizedType === 'GEOGRAPHY') {
    if (typeof value === 'string') {
      // BigQuery GEOGRAPHY is returned as GeoJSON strings
      try {
        const geoJson = JSON.parse(value);
        // Pretty-print GeoJSON
        return JSON.stringify(geoJson, null, 2);
      } catch {
        // If not valid JSON, return as-is
        return value;
      }
    }
    if (typeof value === 'object' && value !== null) {
      // Already parsed GeoJSON object
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return String(value);
      }
    }
    return String(value);
  }

  // Handle JSON
  if (normalizedType === 'JSON') {
    if (typeof value === 'string') {
      // Try to parse and pretty-print JSON
      try {
        const parsed = JSON.parse(value);
        return JSON.stringify(parsed, null, 2);
      } catch {
        // If not valid JSON, return as-is
        return value;
      }
    }
    if (typeof value === 'object' && value !== null) {
      // Already parsed JSON object
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return String(value);
      }
    }
    return String(value);
  }

  // Handle ARRAY
  if (normalizedType === 'ARRAY' || Array.isArray(value)) {
    if (Array.isArray(value)) {
      // Format array elements recursively
      const formatted = value.map((item, index) => {
        // For arrays, we don't have per-item type info, so format generically
        const formattedItem = formatBigQueryValue(item);
        return formattedItem;
      });
      return `[${formatted.join(', ')}]`;
    }
    return String(value);
  }

  // Handle STRUCT/RECORD
  if (normalizedType === 'STRUCT' || normalizedType === 'RECORD') {
    if (typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)) {
      // Check if it's a BigQuery date object with a value property
      if (value.value !== undefined && Object.keys(value).length === 1) {
        // Recursively format the inner value (but avoid infinite recursion)
        const innerValue = value.value;
        if (innerValue !== value) {
          return formatBigQueryValue(innerValue, columnType);
        }
      }
      // Format as JSON object
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return String(value);
      }
    }
    return String(value);
  }

  // Handle STRING (default case)
  if (normalizedType === 'STRING' || normalizedType === '') {
    return String(value);
  }

  // Fallback for any other types
  return String(value);
}

