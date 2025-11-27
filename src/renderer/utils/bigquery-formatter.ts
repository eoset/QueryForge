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
 * Checks if a value is a Date object or Date-like object
 * This handles cases where Date objects might have been serialized/deserialized
 * and are no longer instanceof Date
 */
function isDateLike(value: any): boolean {
  if (value instanceof Date) {
    return true;
  }
  // Check if it's an object with Date-like methods/properties
  if (typeof value === 'object' && value !== null) {
    // Check for Date-like methods
    if (typeof value.getTime === 'function' && typeof value.toISOString === 'function') {
      return true;
    }
    // Check if it has Date-like properties (from serialized Date)
    if ('getTime' in value || 'toISOString' in value || 'getFullYear' in value) {
      return true;
    }
    // CRITICAL: Check for empty objects {} that might be Date objects that were JSON serialized
    // When Date objects are JSON.stringify'd, they become {}, so we need to check column type
    // This is a fallback for objects that lost their Date properties during serialization
    const keys = Object.keys(value);
    if (keys.length === 0 && typeof value === 'object') {
      // Empty object might be a serialized Date - we'll handle this in the formatter based on column type
      return true; // Return true so it gets special handling
    }
  }
  return false;
}

/**
 * Converts a Date-like value to a Date object for formatting
 */
function toDate(value: any): Date | null {
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === 'object' && value !== null) {
    // Try to call getTime if available
    if (typeof value.getTime === 'function') {
      try {
        const time = value.getTime();
        if (typeof time === 'number' && !isNaN(time)) {
          return new Date(time);
        }
      } catch {
        // Ignore errors
      }
    }
    // Try to create Date from ISO string if available
    if (typeof value.toISOString === 'function') {
      try {
        const isoStr = value.toISOString();
        const date = new Date(isoStr);
        if (!isNaN(date.getTime())) {
          return date;
        }
      } catch {
        // Ignore errors
      }
    }
  }
  return null;
}

/**
 * Formats a BigQuery value based on its column type
 * @param value - The value to format
 * @param columnType - The BigQuery column type (e.g., 'STRING', 'INTEGER', 'TIMESTAMP', etc.)
 * @returns Formatted string representation of the value
 */
// DEBUG: Track formatter calls
let formatterCallCount = 0;

export function formatBigQueryValue(value: any, columnType?: string, columnName?: string): string {
  // DEBUG: Always log first few calls to verify logging works
  formatterCallCount++;
  if (formatterCallCount <= 5) {
    console.log(`🔍 [FORMATTER] Call #${formatterCallCount}, Column: "${columnType}" (${columnName}), Value type: ${typeof value}`);
  }
  
  // Handle NULL values - early return for common case
  if (value === null || value === undefined) {
    return 'NULL';
  }

  // Normalize column type early so we can use it for object detection
  const normalizedType = columnType?.toUpperCase() || '';
  const colNameLower = (columnName || '').toLowerCase();
  
  // Check if this is a date type - either by type or by column name
  // This handles cases where DATE/TIME columns were incorrectly typed as RECORD
  const isDateTypeByType = normalizedType === 'DATE' || normalizedType === 'DATETIME' || 
                           normalizedType === 'TIME' || normalizedType === 'TIMESTAMP';
  const isDateTypeByName = normalizedType === 'RECORD' && (
    colNameLower.includes('date') || 
    colNameLower.includes('time') || 
    colNameLower.includes('timestamp') ||
    colNameLower.includes('datetime')
  );
  const isDateType = isDateTypeByType || isDateTypeByName;
  
  // DEBUG: Log date type detection
  if (normalizedType === 'RECORD' && (colNameLower.includes('date') || colNameLower.includes('time'))) {
    console.log(`🔍 [Formatter] Date detection - Column: "${columnName}", Type: "${columnType}", isDateTypeByType: ${isDateTypeByType}, isDateTypeByName: ${isDateTypeByName}, isDateType: ${isDateType}`);
  }

  // DEBUG: Log ALL object values to see what's being passed to the formatter
  if (typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)) {
    console.log('\n========== FORMATTER OBJECT DEBUG ==========');
    console.log(`[Formatter] Column type: "${columnType}" (normalized: "${normalizedType}")`);
    console.log(`[Formatter] Is date type?: ${isDateType}`);
    console.log(`[Formatter] Value type: ${typeof value}`);
    console.log(`[Formatter] Value:`, value);
    console.log(`[Formatter] Object keys:`, Object.keys(value));
    console.log(`[Formatter] Object prototype:`, Object.getPrototypeOf(value));
    console.log(`[Formatter] Is Date?:`, value instanceof Date);
    console.log(`[Formatter] Has getTime?:`, typeof value.getTime === 'function');
    console.log(`[Formatter] Has toISOString?:`, typeof value.toISOString === 'function');
    console.log(`[Formatter] String(value):`, String(value));
    console.log('===========================================\n');
  }

  // DEBUG: Log DATE/TIME values to see what's actually being passed to the formatter
  if (isDateType) {
    console.log('\n========== FORMATTER DATE/TIME DEBUG ==========');
    console.log(`[Formatter] Column type: "${columnType}" (normalized: "${normalizedType}")`);
    console.log(`[Formatter] Value type: ${typeof value}`);
    console.log(`[Formatter] Value:`, value);
    if (typeof value === 'object' && value !== null) {
      console.log(`[Formatter] Object keys:`, Object.keys(value));
      console.log(`[Formatter] Object prototype:`, Object.getPrototypeOf(value));
      console.log(`[Formatter] Is Date?:`, value instanceof Date);
      console.log(`[Formatter] Has getTime?:`, typeof value.getTime === 'function');
      console.log(`[Formatter] Has toISOString?:`, typeof value.toISOString === 'function');
      console.log(`[Formatter] String(value):`, String(value));
    }
    console.log('===============================================\n');
  }

  // CRITICAL: Check if value is already the string "[object Object]"
  // This can happen if Date objects were converted to strings before reaching the formatter
  if (typeof value === 'string' && value === '[object Object]') {
    // CRITICAL: Even if column type is wrong (e.g., RECORD), check if column name suggests it's a date
    // This handles cases where DATE/TIME columns were incorrectly typed as RECORD
    console.log(`🔍 [Formatter] Checking "[object Object]" string - Column: "${columnName}", Type: "${columnType}", isDateType: ${isDateType}`);
    if (isDateType) {
      console.error(`❌ [Formatter] Received "[object Object]" string for date column (${columnType}, ${columnName}) - Returning '[Invalid Date]'`);
      return '[Invalid Date]';
    }
    console.log(`🔍 [Formatter] "[object Object]" string for non-date column, returning as-is`);
    return value; // For non-date columns, return as-is
  }

  // CRITICAL: Handle plain objects for DATE/TIME types BEFORE anything else
  // This prevents [object Object] from being displayed
  const isObject = typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date);
  if (isDateType && isObject) {
    // CRITICAL: Handle empty objects {} that might be Date objects that were JSON serialized
    // When Date objects go through JSON.stringify, they become {}
    const keys = Object.keys(value);
    if (keys.length === 0) {
      // Empty object for a date column - this is likely a Date that was serialized incorrectly
      // Check if it's truly empty or if it has non-enumerable properties
      // Try to detect if this was a Date object by checking the prototype
      const proto = Object.getPrototypeOf(value);
      if (proto === Object.prototype || proto === null) {
        // This is likely a Date object that was JSON.stringify'd to {}
        // Return a placeholder instead of [object Object]
        return '[Invalid Date]';
      }
      // Might be a Date-like object with non-enumerable properties
      // Try to convert it
      if (isDateLike(value)) {
        const dateObj = toDate(value);
        if (dateObj) {
          if (normalizedType === 'DATE') {
            return dateObj.toISOString().split('T')[0];
          }
          if (normalizedType === 'TIME') {
            const hours = String(dateObj.getUTCHours()).padStart(2, '0');
            const minutes = String(dateObj.getUTCMinutes()).padStart(2, '0');
            const seconds = String(dateObj.getUTCSeconds()).padStart(2, '0');
            const ms = dateObj.getUTCMilliseconds();
            if (ms > 0) {
              const msStr = String(ms).padStart(3, '0');
              return `${hours}:${minutes}:${seconds}.${msStr}`;
            }
            return `${hours}:${minutes}:${seconds}`;
          }
          if (normalizedType === 'DATETIME') {
            return dateObj.toISOString().replace('T', ' ').slice(0, 19);
          }
          return dateObj.toISOString();
        }
      }
      return '[Invalid Date]';
    }
    // Check for wrapped value
    if ('value' in value && Object.keys(value).length === 1) {
      const innerValue = value.value;
      if (innerValue !== value) {
        return formatBigQueryValue(innerValue, columnType);
      }
    }
    
    // Try toString() first
    if ('toString' in value && typeof value.toString === 'function') {
      try {
        const str = value.toString();
        if (str && str !== '[object Object]' && typeof str === 'string') {
          // Check if it looks like a date/time string
          if (/^\d{4}-\d{2}-\d{2}/.test(str) || /^\d{2}:\d{2}:\d{2}/.test(str) || 
              /^\d{4}-\d{2}-\d{2}T/.test(str)) {
            return str;
          }
          // Try to parse it as a date
          const parsed = formatBigQueryValue(str, columnType);
          if (parsed !== str && parsed !== '[object Object]') {
            return parsed;
          }
        }
      } catch {
        // Continue with other checks
      }
    }
    
    // Check all properties for date-like strings
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        const propValue = value[key];
        if (typeof propValue === 'string') {
          // Check if it looks like a date/time string
          if (/^\d{4}-\d{2}-\d{2}/.test(propValue) || /^\d{2}:\d{2}:\d{2}/.test(propValue) || 
              /^\d{4}-\d{2}-\d{2}T/.test(propValue)) {
            return propValue;
          }
        }
        // Check for Date instances and Date-like objects
        if (propValue instanceof Date || isDateLike(propValue)) {
          const dateObj = propValue instanceof Date ? propValue : toDate(propValue);
          if (dateObj) {
            if (normalizedType === 'DATE') {
              return dateObj.toISOString().split('T')[0];
            }
            if (normalizedType === 'DATETIME') {
              return dateObj.toISOString().replace('T', ' ').slice(0, 19);
            }
            return dateObj.toISOString();
          }
        }
      }
    }
    
    // Try JSON.stringify to extract date strings
    try {
      const jsonStr = JSON.stringify(value);
      const dateMatch = jsonStr.match(/"(\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2})?)"/);
      if (dateMatch) {
        return dateMatch[1].replace('T', ' ').replace(/Z$/, '');
      }
      // Try parsing JSON and looking for date strings
      const parsed = JSON.parse(jsonStr);
      if (typeof parsed === 'string' && (/^\d{4}-\d{2}-\d{2}/.test(parsed) || /^\d{2}:\d{2}:\d{2}/.test(parsed))) {
        return parsed;
      }
      // Check all values in parsed object
      for (const key in parsed) {
        if (typeof parsed[key] === 'string' && (/^\d{4}-\d{2}-\d{2}/.test(parsed[key]) || /^\d{2}:\d{2}:\d{2}/.test(parsed[key]))) {
          return parsed[key];
        }
      }
    } catch {
      // JSON operations failed
    }
    
    // Check for date object with year/month/day properties
    if ('year' in value && 'month' in value && 'day' in value) {
      const year = value.year ?? new Date().getFullYear();
      const monthVal = value.month ?? 1;
      const month = String(monthVal).padStart(2, '0');
      const day = String(value.day ?? 1).padStart(2, '0');
      if (normalizedType === 'DATE') {
        return `${year}-${month}-${day}`;
      }
      // For DATETIME/TIMESTAMP, check for time components
      const hours = String(value.hours ?? 0).padStart(2, '0');
      const minutes = String(value.minutes ?? 0).padStart(2, '0');
      const seconds = String(value.seconds ?? 0).padStart(2, '0');
      if (normalizedType === 'DATETIME') {
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      }
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`;
    }
    
    // Last resort: show object keys instead of [object Object]
    // Reuse the keys variable that was already declared above
    if (keys.length > 0) {
      // Try one more time: check if any property value is a date string
      for (const key of keys) {
        const propValue = value[key];
        if (typeof propValue === 'string') {
          // Check if it looks like a date/time string
          if (/^\d{4}-\d{2}-\d{2}/.test(propValue) || /^\d{2}:\d{2}:\d{2}/.test(propValue)) {
            return propValue;
          }
        }
      }
      return `{${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''}}`;
    }
    // If object has no keys, return placeholder
    return '[Date Object]';
  }

  // Handle Date objects early - regardless of column type, to prevent [object Object] display
  // Check for both Date instances and Date-like objects (e.g., serialized Dates)
  if (isDateLike(value)) {
    const dateObj = toDate(value);
    if (dateObj) {
      // Check if it's a valid date
      if (isNaN(dateObj.getTime())) {
        return 'Invalid Date';
      }
      // Format based on column type if available, otherwise use ISO string
      if (normalizedType === 'DATE') {
        return dateObj.toISOString().split('T')[0]; // YYYY-MM-DD
      }
      if (normalizedType === 'TIME') {
        const hours = String(dateObj.getUTCHours()).padStart(2, '0');
        const minutes = String(dateObj.getUTCMinutes()).padStart(2, '0');
        const seconds = String(dateObj.getUTCSeconds()).padStart(2, '0');
        const ms = dateObj.getUTCMilliseconds();
        if (ms > 0) {
          const msStr = String(ms).padStart(3, '0');
          return `${hours}:${minutes}:${seconds}.${msStr}`;
        }
        return `${hours}:${minutes}:${seconds}`;
      }
      if (normalizedType === 'DATETIME') {
        return dateObj.toISOString().replace('T', ' ').slice(0, 19); // YYYY-MM-DD HH:mm:ss
      }
      if (normalizedType === 'TIMESTAMP') {
        return dateObj.toISOString();
      }
      // Default: use ISO string for any Date object
      return dateObj.toISOString();
    }
  }
  
  // Also check for Date instances explicitly (for compatibility)
  if (value instanceof Date) {
    // Check if it's a valid date
    if (isNaN(value.getTime())) {
      return 'Invalid Date';
    }
    // Format based on column type if available, otherwise use ISO string
    if (normalizedType === 'DATE') {
      return value.toISOString().split('T')[0]; // YYYY-MM-DD
    }
    if (normalizedType === 'TIME') {
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
    if (normalizedType === 'DATETIME') {
      return value.toISOString().replace('T', ' ').slice(0, 19); // YYYY-MM-DD HH:mm:ss
    }
    if (normalizedType === 'TIMESTAMP') {
      return value.toISOString();
    }
    // Default: use ISO string for any Date object
    return value.toISOString();
  }

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
    // Handle plain objects that might represent dates
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Check for wrapped value
      if (value.value !== undefined && Object.keys(value).length === 1) {
        return formatBigQueryValue(value.value, columnType);
      }
      // Check for date object with year/month/day properties
      if ('year' in value && 'month' in value && 'day' in value) {
        const year = value.year ?? new Date().getFullYear();
        // Handle both 0-indexed (JS) and 1-indexed (BigQuery) months
        const monthVal = value.month ?? 1;
        const month = String(monthVal).padStart(2, '0');
        const day = String(value.day ?? 1).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      
      // Try to extract any string property that looks like a date
      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          const propValue = value[key];
          if (typeof propValue === 'string' && DATE_REGEX.test(propValue)) {
            return propValue;
          }
          if (typeof propValue === 'string') {
            const date = new Date(propValue);
            if (!isNaN(date.getTime())) {
              return date.toISOString().split('T')[0];
            }
          }
        }
      }
      
      // Try JSON.stringify to see if there's a serializable date value
      try {
        const jsonStr = JSON.stringify(value);
        // Check if JSON contains a date-like string
        const dateMatch = jsonStr.match(/"(\d{4}-\d{2}-\d{2})"/);
        if (dateMatch) {
          return dateMatch[1];
        }
        // Try parsing the JSON and looking for date strings
        const parsed = JSON.parse(jsonStr);
        if (typeof parsed === 'string' && DATE_REGEX.test(parsed)) {
          return parsed;
        }
        // Check all values in the object
        for (const key in parsed) {
          if (typeof parsed[key] === 'string' && DATE_REGEX.test(parsed[key])) {
            return parsed[key];
          }
        }
      } catch {
        // JSON operations failed, continue
      }
      
      // Try toString if it's not the default
      if ('toString' in value && typeof value.toString === 'function') {
        try {
          const str = value.toString();
          if (str !== '[object Object]') {
            return formatBigQueryValue(str, columnType);
          }
        } catch {
          // Ignore toString errors
        }
      }
      
      // Last resort: show object structure instead of [object Object]
      const keys = Object.keys(value);
      if (keys.length > 0) {
        // Try to show first few property values that might be useful
        const preview = keys.slice(0, 3).map(k => {
          const v = value[k];
          if (typeof v === 'string' && v.length < 20) return `${k}:${v}`;
          if (typeof v === 'number') return `${k}:${v}`;
          return k;
        }).join(', ');
        return `{${preview}${keys.length > 3 ? '...' : ''}}`;
      }
      // If object has no keys, return a placeholder instead of [object Object]
      return '[Date Object]';
    }
    // If we get here with an object for a DATE column, something went wrong
    // Return a placeholder instead of [object Object]
    if (typeof value === 'object' && value !== null) {
      return '[Date Object]';
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
    // Handle plain objects that might represent time
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Check for wrapped value
      if (value.value !== undefined && Object.keys(value).length === 1) {
        return formatBigQueryValue(value.value, columnType);
      }
      // Check for time object with hours/minutes/seconds properties
      if ('hours' in value || 'minutes' in value || 'seconds' in value) {
        const hours = String(value.hours ?? 0).padStart(2, '0');
        const minutes = String(value.minutes ?? 0).padStart(2, '0');
        const seconds = String(value.seconds ?? 0).padStart(2, '0');
        const ms = value.milliseconds ?? 0;
        if (ms > 0) {
          const msStr = String(ms).padStart(3, '0');
          return `${hours}:${minutes}:${seconds}.${msStr}`;
        }
        return `${hours}:${minutes}:${seconds}`;
      }
      // Try toString if it's not the default
      if ('toString' in value && typeof value.toString === 'function') {
        try {
          const str = value.toString();
          if (str !== '[object Object]') {
            return formatBigQueryValue(str, columnType);
          }
        } catch {
          // Ignore toString errors
        }
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
    // Handle plain objects that might represent datetime
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Check for wrapped value
      if (value.value !== undefined && Object.keys(value).length === 1) {
        return formatBigQueryValue(value.value, columnType);
      }
      // Check for datetime object with date and time properties
      if (('year' in value && 'month' in value && 'day' in value) ||
          ('hours' in value || 'minutes' in value || 'seconds' in value)) {
        const year = value.year ?? new Date().getFullYear();
        const monthVal = value.month ?? 1;
        const month = String(monthVal).padStart(2, '0');
        const day = String(value.day ?? 1).padStart(2, '0');
        const hours = String(value.hours ?? 0).padStart(2, '0');
        const minutes = String(value.minutes ?? 0).padStart(2, '0');
        const seconds = String(value.seconds ?? 0).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      }
      // Try toString if it's not the default
      if ('toString' in value && typeof value.toString === 'function') {
        try {
          const str = value.toString();
          if (str !== '[object Object]') {
            return formatBigQueryValue(str, columnType);
          }
        } catch {
          // Ignore toString errors
        }
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
    // Handle plain objects that might represent timestamp
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Check for wrapped value
      if (value.value !== undefined && Object.keys(value).length === 1) {
        return formatBigQueryValue(value.value, columnType);
      }
      // Check for timestamp object with date and time properties
      if (('year' in value && 'month' in value && 'day' in value) ||
          ('hours' in value || 'minutes' in value || 'seconds' in value)) {
        const year = value.year ?? new Date().getFullYear();
        const monthVal = value.month ?? 1;
        const month = String(monthVal).padStart(2, '0');
        const day = String(value.day ?? 1).padStart(2, '0');
        const hours = String(value.hours ?? 0).padStart(2, '0');
        const minutes = String(value.minutes ?? 0).padStart(2, '0');
        const seconds = String(value.seconds ?? 0).padStart(2, '0');
        const ms = value.milliseconds ?? 0;
        if (ms > 0) {
          const msStr = String(ms).padStart(3, '0');
          return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${msStr}Z`;
        }
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`;
      }
      // Try toString if it's not the default
      if ('toString' in value && typeof value.toString === 'function') {
        try {
          const str = value.toString();
          if (str !== '[object Object]') {
            return formatBigQueryValue(str, columnType);
          }
        } catch {
          // Ignore toString errors
        }
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
      // Ensure it's displayed as a whole number (no decimal point)
      // Use Math.floor or Math.trunc to remove any decimal part, then convert to string
      const intValue = Number.isInteger(value) ? value : Math.trunc(value);
      return String(intValue); // Convert to string without commas or decimal points
    }
    if (typeof value === 'string') {
      // BigQuery might return large integers as strings
      // Return as-is if it's already a valid integer string (no decimal point, no commas)
      if (/^-?\d+$/.test(value)) {
        return value; // Already a valid integer string, return without commas or periods
      }
      // If string contains a decimal point, parse and truncate to integer
      try {
        const num = parseFloat(value);
        if (!isNaN(num)) {
          const intValue = Math.trunc(num); // Remove decimal part
          return String(intValue); // Convert to string without commas or decimal points
        }
      } catch {
        // If parsing fails, return as-is
      }
      return value;
    }
    // For other types, try to convert to integer
    try {
      const num = Number(value);
      if (!isNaN(num)) {
        const intValue = Math.trunc(num);
        return String(intValue);
      }
    } catch {
      // If conversion fails, return as string
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

  // Handle plain objects that aren't Date instances - check before STRING fallback
  // This prevents [object Object] display for objects that might represent dates or other types
  if (typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)) {
    // Check if it's a wrapped value object (common in some BigQuery responses)
    if (value.value !== undefined && Object.keys(value).length === 1) {
      // Recursively format the inner value (but avoid infinite recursion)
      const innerValue = value.value;
      if (innerValue !== value) {
        return formatBigQueryValue(innerValue, columnType);
      }
    }
    
    // For date/time types, try to extract date from object properties
    if (normalizedType === 'DATE' || normalizedType === 'DATETIME' || normalizedType === 'TIMESTAMP') {
      // Check for common date object properties
      if ('year' in value && 'month' in value && 'day' in value) {
        const year = value.year;
        const month = String(value.month || 0).padStart(2, '0');
        const day = String(value.day || 0).padStart(2, '0');
        if (normalizedType === 'DATE') {
          return `${year}-${month}-${day}`;
        }
        // For DATETIME/TIMESTAMP, check for time components
        const hours = String(value.hours || 0).padStart(2, '0');
        const minutes = String(value.minutes || 0).padStart(2, '0');
        const seconds = String(value.seconds || 0).padStart(2, '0');
        if (normalizedType === 'DATETIME') {
          return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        }
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`;
      }
      // Try to find a string representation in common properties
      if ('toString' in value && typeof value.toString === 'function') {
        try {
          const str = value.toString();
          if (str !== '[object Object]') {
            return formatBigQueryValue(str, columnType);
          }
        } catch {
          // Ignore toString errors
        }
      }
    }
    
    // For other object types, try JSON stringify
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      // If JSON.stringify fails, return a descriptive string
      return `[Object: ${Object.keys(value).join(', ')}]`;
    }
  }

  // CRITICAL: Before falling back to String(value), check if this is an object for a date/time type
  // This is a final safety net to prevent [object Object] display
  if (isDateType && typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)) {
    // Try one more time to extract a date string
    try {
      const jsonStr = JSON.stringify(value);
      // Look for any date-like pattern in the JSON
      const datePatterns = [
        /"(\d{4}-\d{2}-\d{2})"/,  // DATE format
        /"(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/,  // TIMESTAMP format
        /"(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/,  // DATETIME format
        /"(\d{2}:\d{2}:\d{2})/,  // TIME format
      ];
      
      for (const pattern of datePatterns) {
        const match = jsonStr.match(pattern);
        if (match) {
          let dateStr = match[1];
          if (normalizedType === 'DATE' && dateStr.includes('T')) {
            dateStr = dateStr.split('T')[0];
          } else if (normalizedType === 'DATETIME' && dateStr.includes('T')) {
            dateStr = dateStr.replace('T', ' ');
          }
          return dateStr;
        }
      }
      
      // If no date pattern found, show object structure
      const keys = Object.keys(value);
      if (keys.length > 0) {
        // Try to show first property value
        const firstKey = keys[0];
        const firstValue = value[firstKey];
        if (typeof firstValue === 'string' && firstValue.length < 50) {
          return firstValue;
        }
        return `{${keys.slice(0, 2).join(', ')}}`;
      }
      return '[Date Object]';
    } catch {
      // JSON.stringify failed
      const keys = Object.keys(value);
      return keys.length > 0 ? `{${keys.slice(0, 2).join(', ')}}` : '[Date Object]';
    }
  }

  // Handle STRING (default case)
  if (normalizedType === 'STRING' || normalizedType === '') {
    // CRITICAL: Before converting to string, check if it's a Date-like object
    // This prevents [object Object] from being displayed for Date objects
    if (isDateLike(value)) {
      const dateObj = toDate(value);
      if (dateObj) {
        if (isNaN(dateObj.getTime())) {
          return 'Invalid Date';
        }
        return dateObj.toISOString();
      }
    }
    
    // Before converting to string, check if it's an object
    if (typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)) {
      // Try JSON.stringify for objects
      try {
        return JSON.stringify(value);
      } catch {
        return `[Object: ${Object.keys(value).join(', ')}]`;
      }
    }
    
    // Check for Date instance one more time
    if (value instanceof Date) {
      if (isNaN(value.getTime())) {
        return 'Invalid Date';
      }
      return value.toISOString();
    }
    
    return String(value);
  }

  // Fallback for any other types
  // CRITICAL: Before using String(value), check if it's a Date-like object
  // This prevents [object Object] from being displayed for Date objects
  if (isDateLike(value)) {
    const dateObj = toDate(value);
    if (dateObj) {
      // Format based on column type if available, otherwise use ISO string
      if (normalizedType === 'DATE') {
        return dateObj.toISOString().split('T')[0];
      }
      if (normalizedType === 'TIME') {
        const hours = String(dateObj.getUTCHours()).padStart(2, '0');
        const minutes = String(dateObj.getUTCMinutes()).padStart(2, '0');
        const seconds = String(dateObj.getUTCSeconds()).padStart(2, '0');
        const ms = dateObj.getUTCMilliseconds();
        if (ms > 0) {
          const msStr = String(ms).padStart(3, '0');
          return `${hours}:${minutes}:${seconds}.${msStr}`;
        }
        return `${hours}:${minutes}:${seconds}`;
      }
      if (normalizedType === 'DATETIME') {
        return dateObj.toISOString().replace('T', ' ').slice(0, 19);
      }
      if (normalizedType === 'TIMESTAMP') {
        return dateObj.toISOString();
      }
      return dateObj.toISOString();
    }
  }
  
  // CRITICAL: Check for empty objects {} for date types BEFORE general object handling
  // Empty objects for date columns are likely Date objects that were JSON serialized
  if (isDateType && typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)) {
    const objKeys = Object.keys(value);
    if (objKeys.length === 0) {
      // Empty object for a date column - this is a Date that was serialized incorrectly
      return '[Invalid Date]';
    }
  }
  
  // Before using String(value), check if it's an object
  // Exclude Date instances and Date-like objects to prevent [object Object] display
  if (typeof value === 'object' && value !== null && !Array.isArray(value) && 
      !(value instanceof Date) && !isDateLike(value)) {
    // CRITICAL: For date types, never return [object Object]
    if (isDateType) {
      const objKeys = Object.keys(value);
      if (objKeys.length === 0) {
        return '[Invalid Date]';
      }
      // Try to extract any useful information
      try {
        const jsonStr = JSON.stringify(value);
        if (jsonStr === '{}') {
          return '[Invalid Date]';
        }
        return jsonStr;
      } catch {
        return `[Object: ${objKeys.join(', ')}]`;
      }
    }
    try {
      return JSON.stringify(value);
    } catch {
      return `[Object: ${Object.keys(value).join(', ')}]`;
    }
  }
  
  // Final fallback - but check for Date and Date-like objects one more time to be safe
  if (isDateLike(value)) {
    const dateObj = toDate(value);
    if (dateObj) {
      if (isNaN(dateObj.getTime())) {
        return 'Invalid Date';
      }
      return dateObj.toISOString();
    }
  }
  
  if (value instanceof Date) {
    if (isNaN(value.getTime())) {
      return 'Invalid Date';
    }
    return value.toISOString();
  }
  
  // CRITICAL: Last check before String(value) - if it's a date type and an object, don't convert to string
  if (isDateType && typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)) {
    return '[Invalid Date]';
  }
  
  return String(value);
}

