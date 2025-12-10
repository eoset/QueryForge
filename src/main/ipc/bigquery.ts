import { ipcMain } from 'electron';
import { getBigQueryClient, getActiveConnection } from './connection';
import type { QueryResult, ColumnMetadata, Row } from '../../shared/types/query';
import { BigQueryErrorCode } from '../../shared/types/bigquery';
import { saveResults, createStreamingSaver } from '../storage/results-cache-sqlite';

/**
 * Serializes a value to ensure it can be cloned and sent through IPC.
 * Handles Date objects, BigNumber objects, Buffers, and nested structures.
 * Uses a WeakSet to track visited objects to prevent circular reference issues.
 * @param value - The value to serialize
 * @param visited - WeakSet to track visited objects (for circular reference detection)
 * @param columnType - Optional BigQuery column type (e.g., 'DATE', 'TIMESTAMP') to help with serialization
 */
function serializeValue(value: any, visited: WeakSet<object> = new WeakSet(), columnType?: string): any {
  // Normalize column type early so it's available throughout the function
  const normalizedColumnType = columnType?.toUpperCase() || '';
  const isDateType = normalizedColumnType === 'DATE' || normalizedColumnType === 'DATETIME' || 
                     normalizedColumnType === 'TIME' || normalizedColumnType === 'TIMESTAMP';
  
  // Handle null and undefined
  if (value === null || value === undefined) {
    return null;
  }

  // CRITICAL: Handle BigQueryDate/BigQueryTime objects FIRST, before any other object handling
  // These objects have a 'value' property containing the string representation
  // This must come BEFORE Date instance check because BigQueryDate is not instanceof Date
  if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
    // Check if it's a BigQuery date/time object with a 'value' property
    // This is the most common pattern: BigQueryDate { value: '2025-11-27' }
    if ('value' in value && typeof value.value === 'string') {
      const valueStr = value.value;
      // Verify it looks like a date/time string
      if (/^\d{4}-\d{2}-\d{2}/.test(valueStr) || /^\d{2}:\d{2}:\d{2}/.test(valueStr) || 
          /^\d{4}-\d{2}-\d{2}T/.test(valueStr)) {
        return valueStr;
      }
    }
  }

  // Handle Date objects - convert to ISO string
  // This MUST happen before any object handling to prevent Date objects from being serialized as {}
  if (value instanceof Date) {
    // Check if it's a valid date
    if (isNaN(value.getTime())) {
      return null; // Invalid dates become null
    }
    // Format based on column type if available
    if (normalizedColumnType === 'DATE') {
      return value.toISOString().split('T')[0]; // YYYY-MM-DD
    }
    if (normalizedColumnType === 'TIME') {
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
    if (normalizedColumnType === 'DATETIME') {
      return value.toISOString().replace('T', ' ').slice(0, 19); // YYYY-MM-DD HH:mm:ss
    }
    // Default: ISO string for TIMESTAMP or unknown
    return value.toISOString();
  }
  
  // CRITICAL: Check for Date-like objects BEFORE general object handling
  // BigQuery might return Date objects that aren't instanceof Date
  // Check for objects with Date-like methods or properties
  if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
    // Check if it has Date-like methods (might be a serialized Date or BigQuery Date object)
    if (typeof value.getTime === 'function' || typeof value.toISOString === 'function') {
      try {
        // Try to convert to Date
        let date: Date | null = null;
        if (typeof value.getTime === 'function') {
          const time = value.getTime();
          if (typeof time === 'number' && !isNaN(time)) {
            date = new Date(time);
          }
        } else if (typeof value.toISOString === 'function') {
          const isoStr = value.toISOString();
          date = new Date(isoStr);
        }
        
        if (date && !isNaN(date.getTime())) {
          // Format based on column type
          if (normalizedColumnType === 'DATE') {
            return date.toISOString().split('T')[0];
          }
          if (normalizedColumnType === 'TIME') {
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
          if (normalizedColumnType === 'DATETIME') {
            return date.toISOString().replace('T', ' ').slice(0, 19);
          }
          return date.toISOString();
        }
      } catch {
        // If conversion fails, continue with normal handling
      }
    }
  }

  // Handle Buffer objects - convert to base64 string
  if (Buffer.isBuffer(value)) {
    return value.toString('base64');
  }

  // Handle BigNumber-like objects (from @google-cloud/bigquery)
  // Check for common BigNumber properties
  if (value && typeof value === 'object' && 'toString' in value && typeof value.toString === 'function') {
    // Check if it's a BigNumber by looking for valueOf or toNumber methods
    if ('valueOf' in value || 'toNumber' in value) {
      try {
        // Try to convert to number first, fallback to string
        const numValue = typeof value.valueOf === 'function' ? value.valueOf() : value;
        if (typeof numValue === 'number' && !isNaN(numValue) && isFinite(numValue)) {
          return numValue;
        }
        return String(value);
      } catch {
        return String(value);
      }
    }
  }

  // Handle arrays - recursively serialize each element
  if (Array.isArray(value)) {
    return value.map((item) => serializeValue(item, visited, columnType));
  }

  // Handle BigQuery DATE/DATETIME/TIME/TIMESTAMP objects
  // BigQuery may return these as objects with special properties or methods
  // This must come after array check but before general object handling
  if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
    // CRITICAL: For DATE/TIME columns, ANY object that isn't a Date instance should be handled specially
    // BigQuery might return DATE as objects in various formats
    if (isDateType) {
      // CRITICAL: Check for BigQuery date/time objects with a 'value' property FIRST
      // BigQueryDate/BigQueryTime objects have a 'value' property containing the string representation
      // This check should be very lenient - just check if 'value' exists and is a string
      if ('value' in value) {
        const innerValue = value.value;
        // If inner value is a string, return it directly (this is the most common case)
        if (typeof innerValue === 'string') {
          return innerValue;
        }
        // If inner value is a Date, convert to ISO string
        if (innerValue instanceof Date) {
          if (normalizedColumnType === 'DATE') {
            return innerValue.toISOString().split('T')[0];
          }
          if (normalizedColumnType === 'TIME') {
            const hours = String(innerValue.getUTCHours()).padStart(2, '0');
            const minutes = String(innerValue.getUTCMinutes()).padStart(2, '0');
            const seconds = String(innerValue.getUTCSeconds()).padStart(2, '0');
            const ms = innerValue.getUTCMilliseconds();
            if (ms > 0) {
              const msStr = String(ms).padStart(3, '0');
              return `${hours}:${minutes}:${seconds}.${msStr}`;
            }
            return `${hours}:${minutes}:${seconds}`;
          }
          if (normalizedColumnType === 'DATETIME') {
            return innerValue.toISOString().replace('T', ' ').slice(0, 19);
          }
          return innerValue.toISOString();
        }
        // Recursively serialize the inner value
        return serializeValue(innerValue, visited, columnType);
      }
      
      // Check for BigQuery Date object structure - might have year, month, day properties
      if ('year' in value || 'month' in value || 'day' in value) {
        const year = value.year ?? new Date().getFullYear();
        const monthVal = value.month ?? 1;
        const month = String(monthVal).padStart(2, '0');
        const day = String(value.day ?? 1).padStart(2, '0');
        if (normalizedColumnType === 'DATE') {
          return `${year}-${month}-${day}`;
        }
        // For DATETIME/TIMESTAMP, check for time components
        const hours = String(value.hours ?? 0).padStart(2, '0');
        const minutes = String(value.minutes ?? 0).padStart(2, '0');
        const seconds = String(value.seconds ?? 0).padStart(2, '0');
        if (normalizedColumnType === 'DATETIME') {
          return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        }
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`;
      }
      
      // Check for TIME object structure
      if (normalizedColumnType === 'TIME' && ('hours' in value || 'minutes' in value || 'seconds' in value)) {
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
      
      // For any other object structure for DATE/TIME, try to extract a string value
      // Check all properties for date-like strings
      const objKeys = Object.keys(value);
      for (const key of objKeys) {
        const propValue = value[key];
        if (typeof propValue === 'string') {
          // Check if it looks like a date/time string
          if (/^\d{4}-\d{2}-\d{2}/.test(propValue) || /^\d{2}:\d{2}:\d{2}/.test(propValue) || 
              /^\d{4}-\d{2}-\d{2}T/.test(propValue)) {
            return propValue;
          }
        }
      }
      
      // If we can't extract a date string, return a placeholder instead of serializing to {}
      return '[Invalid Date Object]';
    }
    
    // For non-date types, check if it's a BigQuery date object with a value property
    if ('value' in value && Object.keys(value).length === 1) {
      const innerValue = value.value;
      // If inner value is a string that looks like a date, return it
      if (typeof innerValue === 'string') {
        return innerValue;
      }
      // If inner value is a Date, convert to ISO string
      if (innerValue instanceof Date) {
        return innerValue.toISOString();
      }
      // Recursively serialize the inner value
      return serializeValue(innerValue, visited, columnType);
    }
    
    // For DATE/TIME columns, try toString() first before checking properties
    if (isDateType && 'toString' in value && typeof value.toString === 'function') {
      try {
        const str = value.toString();
        if (str && str !== '[object Object]' && typeof str === 'string') {
          // Check if it looks like a date/time string
          if (/^\d{4}-\d{2}-\d{2}/.test(str) || /^\d{2}:\d{2}:\d{2}/.test(str) || 
              /^\d{4}-\d{2}-\d{2}T/.test(str)) {
            return str;
          }
        }
      } catch {
        // Continue with property checking if toString fails
      }
      
      // Also check if any property value is a date-like string
      const keys = Object.keys(value);
      for (const key of keys) {
        const propValue = value[key];
        if (typeof propValue === 'string') {
          // Check if it looks like a date/time string
          if (/^\d{4}-\d{2}-\d{2}/.test(propValue) || /^\d{2}:\d{2}:\d{2}/.test(propValue) || 
              /^\d{4}-\d{2}-\d{2}T/.test(propValue)) {
            return propValue;
          }
        }
      }
    }
    
    // Check for date-like objects with year/month/day properties
    if ('year' in value && 'month' in value && 'day' in value) {
      const year = value.year;
      const month = String(value.month ?? 1).padStart(2, '0');
      const day = String(value.day ?? 1).padStart(2, '0');
      // Check if it also has time components (DATETIME/TIMESTAMP)
      if ('hours' in value || 'minutes' in value || 'seconds' in value) {
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
      // Just date components (DATE)
      return `${year}-${month}-${day}`;
    }
    
    // Check for time-only objects (TIME)
    if (('hours' in value || 'minutes' in value || 'seconds' in value) && 
        !('year' in value || 'month' in value || 'day' in value)) {
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
    
    // Try to call toString() if it exists and might give us a useful string
    // (Only if we haven't already tried it above for date types)
    if (!isDateType && 'toString' in value && typeof value.toString === 'function') {
      try {
        const str = value.toString();
        // If toString gives us something useful (not [object Object]), use it
        if (str && str !== '[object Object]' && typeof str === 'string') {
          // Check if it looks like a date/time string
          if (/^\d{4}-\d{2}-\d{2}/.test(str) || /^\d{2}:\d{2}:\d{2}/.test(str)) {
            return str;
          }
        }
      } catch {
        // Ignore toString errors
      }
    }
  }

  // Handle objects - recursively serialize each property
  if (typeof value === 'object') {
    // Check for circular references
    if (visited.has(value)) {
      return '[Circular]';
    }
    visited.add(value);

    try {
      // Check if it's a plain object (not a class instance)
      const proto = Object.getPrototypeOf(value);
      if (proto === null || proto === Object.prototype) {
        // For DATE/TIME columns, be very aggressive about converting objects to strings
        if (isDateType) {
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
              }
            } catch {
              // Continue with property checking if toString fails
            }
          }
          
          // Check all properties for date-like strings
          const keys = Object.keys(value);
          for (const key of keys) {
            const propValue = value[key];
            if (typeof propValue === 'string') {
              // Check if it looks like a date/time string
              if (/^\d{4}-\d{2}-\d{2}/.test(propValue) || /^\d{2}:\d{2}:\d{2}/.test(propValue) || 
                  /^\d{4}-\d{2}-\d{2}T/.test(propValue)) {
                return propValue;
              }
            }
            // If property is a Date, convert it
            if (propValue instanceof Date) {
              if (normalizedColumnType === 'DATE') {
                return propValue.toISOString().split('T')[0];
              }
              return propValue.toISOString();
            }
          }
          
          // If we still haven't found a date string, try JSON.stringify to extract it
          try {
            const jsonStr = JSON.stringify(value);
            const dateMatch = jsonStr.match(/"(\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2})?)"/);
            if (dateMatch) {
              const dateStr = dateMatch[1];
              if (normalizedColumnType === 'DATE') {
                return dateStr.split('T')[0]; // Just the date part
              }
              return dateStr.replace('T', ' ').replace(/Z$/, '');
            }
            // Also try to find any date-like string in the JSON
            const allDateMatches = jsonStr.matchAll(/"(\d{4}-\d{2}-\d{2}[^"]*)"/g);
            for (const match of allDateMatches) {
              const dateStr = match[1];
              if (normalizedColumnType === 'DATE' && !dateStr.includes('T') && !dateStr.includes(':')) {
                return dateStr;
              }
              if (normalizedColumnType !== 'DATE' && (dateStr.includes('T') || dateStr.includes(':'))) {
                return dateStr.replace('T', ' ').replace(/Z$/, '');
              }
            }
          } catch {
            // JSON.stringify failed, continue with normal serialization
          }
          
          // Last resort for DATE columns: convert object to string representation
          // This prevents [object Object] from being sent through IPC
          if (normalizedColumnType === 'DATE' || normalizedColumnType === 'DATETIME' || 
              normalizedColumnType === 'TIMESTAMP') {
            // Try to create a meaningful string from the object
            const keys = Object.keys(value);
            if (keys.length === 0) {
              return '[Empty Date Object]';
            }
            // Return first property value if it's a string or number
            const firstKey = keys[0];
            const firstValue = value[firstKey];
            if (typeof firstValue === 'string') {
              return firstValue;
            }
            if (typeof firstValue === 'number') {
              // Try to interpret as date
              const date = new Date(firstValue > 1e12 ? firstValue / 1000 : firstValue);
              if (!isNaN(date.getTime())) {
                if (normalizedColumnType === 'DATE') {
                  return date.toISOString().split('T')[0];
                }
                return date.toISOString();
              }
            }
            // Return object structure as string
            return `{${keys.slice(0, 2).join(', ')}}`;
          }
        } else {
          // For non-date types, check if this might be a date-like object
          // that we missed in the earlier check (e.g., has a custom toString that returns a date)
          const keys = Object.keys(value);
          // If object has very few keys and one looks date-like, try toString first
          if (keys.length <= 3 && 'toString' in value && typeof value.toString === 'function') {
            try {
              const str = value.toString();
              if (str && str !== '[object Object]' && typeof str === 'string') {
                // Check if it looks like a date/time string
                if (/^\d{4}-\d{2}-\d{2}/.test(str) || /^\d{2}:\d{2}:\d{2}/.test(str)) {
                  return str;
                }
              }
            } catch {
              // Continue with normal serialization if toString fails
            }
          }
        }
        
        const serialized: any = {};
        for (const key in value) {
          if (Object.prototype.hasOwnProperty.call(value, key)) {
            serialized[key] = serializeValue(value[key], visited, columnType);
          }
        }
        // CRITICAL: If serialized object is empty {} and this is a date type, return placeholder
        // This prevents empty objects from being stored and later displayed as "[object Object]"
        if (Object.keys(serialized).length === 0 && isDateType) {
          return '[Invalid Date]';
        }
        return serialized;
      } else {
        // For non-plain objects (class instances), try to serialize
        // CRITICAL: Check for Date objects BEFORE JSON.stringify/parse
        // JSON.stringify converts Date objects to {}, which then becomes [object Object]
        if (value instanceof Date) {
          if (isNaN(value.getTime())) {
            return null;
          }
          if (normalizedColumnType === 'DATE') {
            return value.toISOString().split('T')[0];
          }
          if (normalizedColumnType === 'TIME') {
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
          if (normalizedColumnType === 'DATETIME') {
            return value.toISOString().replace('T', ' ').slice(0, 19);
          }
          return value.toISOString();
        }
        
        // Check for Date-like objects (objects with Date methods)
        if (typeof value.getTime === 'function' || typeof value.toISOString === 'function') {
          try {
            let date: Date | null = null;
            if (typeof value.getTime === 'function') {
              const time = value.getTime();
              if (typeof time === 'number' && !isNaN(time)) {
                date = new Date(time);
              }
            } else if (typeof value.toISOString === 'function') {
              const isoStr = value.toISOString();
              date = new Date(isoStr);
            }
            
            if (date && !isNaN(date.getTime())) {
              if (normalizedColumnType === 'DATE') {
                return date.toISOString().split('T')[0];
              }
              if (normalizedColumnType === 'TIME') {
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
              if (normalizedColumnType === 'DATETIME') {
                return date.toISOString().replace('T', ' ').slice(0, 19);
              }
              return date.toISOString();
            }
          } catch {
            // If conversion fails, continue with normal serialization
          }
        }
        
        // First try JSON.stringify/parse which handles most cases
        // BUT: This will convert Date objects to {}, so we check for Dates above
        try {
          const jsonStr = JSON.stringify(value);
          // Check if JSON.stringify produced an empty object for a date type
          // This happens when Date objects are stringified
          if (jsonStr === '{}' && isDateType) {
            // This is likely a Date object that was stringified to {}
            return '[Invalid Date]';
          }
          return JSON.parse(jsonStr);
        } catch {
          // If JSON serialization fails (e.g., circular refs, functions),
          // try to extract enumerable properties
          const serialized: any = {};
          for (const key in value) {
            if (Object.prototype.hasOwnProperty.call(value, key)) {
              serialized[key] = serializeValue(value[key], visited, columnType);
            }
          }
          // If we got nothing, check if it's a date type before converting to string
          if (Object.keys(serialized).length === 0 && isDateType) {
            return '[Invalid Date]';
          }
          // If we got nothing, convert to string as last resort
          return Object.keys(serialized).length > 0 ? serialized : String(value);
        }
      }
    } catch (error) {
      // If anything goes wrong, check if it's a Date object before converting to string
      // This prevents [object Object] from being returned for Date objects
      if (value instanceof Date) {
        if (isNaN(value.getTime())) {
          return null;
        }
        if (normalizedColumnType === 'DATE') {
          return value.toISOString().split('T')[0];
        }
        if (normalizedColumnType === 'TIME') {
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
        if (normalizedColumnType === 'DATETIME') {
          return value.toISOString().replace('T', ' ').slice(0, 19);
        }
        return value.toISOString();
      }
      // For date types, return a placeholder instead of [object Object]
      if (isDateType && typeof value === 'object' && value !== null) {
        return '[Invalid Date]';
      }
      // Last resort: convert to string
      return String(value);
    }
  }

  // For primitives (string, number, boolean), return as-is
  return value;
}

// Helper function to transform raw BigQuery rows to our Row format
function transformRows(rows: any[], columns: ColumnMetadata[]): Row[] {
  return rows.map((row: any) => ({
    values: columns.map((col) => {
      const value = row[col.name];
      
      // Pass column type to serializeValue to help with date/time serialization
      let serialized = serializeValue(value, new WeakSet(), col.type);
      
      // CRITICAL: For DATE/TIME columns, ensure we NEVER store an object - always convert to string
      const colTypeUpper = (col.type || '').toUpperCase();
      if (colTypeUpper === 'DATE' || colTypeUpper === 'TIME' || 
          colTypeUpper === 'DATETIME' || colTypeUpper === 'TIMESTAMP') {
        if (typeof serialized === 'object' && serialized !== null) {
          const keys = Object.keys(serialized);
          for (const key of keys) {
            const propValue = serialized[key];
            if (typeof propValue === 'string') {
              if (/^\d{4}-\d{2}-\d{2}/.test(propValue) || /^\d{2}:\d{2}:\d{2}/.test(propValue) || 
                  /^\d{4}-\d{2}-\d{2}T/.test(propValue)) {
                serialized = propValue;
                break;
              }
            }
          }
          if (typeof serialized === 'object' && serialized !== null) {
            serialized = '[Invalid Date]';
          }
        }
        if (typeof serialized === 'string' && serialized === '[object Object]') {
          serialized = '[Invalid Date]';
        }
        if (typeof serialized !== 'string') {
          if (serialized === null || serialized === undefined) {
            serialized = '[Invalid Date]';
          } else {
            serialized = String(serialized);
            if (serialized === '[object Object]') {
              serialized = '[Invalid Date]';
            }
          }
        }
      }
      
      return serialized;
    }),
  }));
}

export function registerBigQueryHandlers(): void {
  ipcMain.handle('bigquery:execute', async (_event, queryText: string, projectId: string, tabId?: string) => {
    const client = getBigQueryClient();
    if (!client) {
      throw {
        code: BigQueryErrorCode.CONNECTION_FAILED,
        message: 'No active BigQuery connection',
      };
    }

    // Get the sender's webContents for streaming updates
    const sender = _event.sender;

    try {
      const startTime = Date.now();

      // Get location from active connection, default to EU
      const connection = getActiveConnection();
      const location = connection?.location || 'EU';

      // Create query job
      const [job] = await client.createQueryJob({
        query: queryText,
        location,
      });

      // Wait for the job to complete first
      const [jobResult] = await job.getMetadata();
      
      // Poll until job is done (getQueryResults should do this, but let's be explicit)
      if (jobResult.status?.state !== 'DONE') {
        await job.promise(); // This waits for the job to complete
      }

      // Get job metadata early to get schema and total row count
      const [jobMetadata] = await job.getMetadata();
      
      // Get schema from job metadata
      let schema = jobMetadata.configuration?.query?.schema || 
                   jobMetadata.statistics?.query?.schema ||
                   jobMetadata.schema;

      // Build columns from schema
      let columns: ColumnMetadata[] = [];
      if (schema?.fields && schema.fields.length > 0) {
        columns = schema.fields.map((field: any) => ({
          name: field.name,
          type: field.type,
          mode: field.mode,
        }));
      }

      // Fetch first page of results
      const [firstPageRows, firstNextQuery] = await job.getQueryResults({ maxResults: 10000 });
      const hasMorePages = !!firstNextQuery?.pageToken;
      
      // Get total row count from multiple possible sources:
      // 1. Query results metadata (firstNextQuery.totalRows) - most reliable for SELECT queries
      // 2. Job statistics (query.numDmlAffectedRows) - for DML queries
      // 3. Fall back to first page length if neither available (will be updated after fetching all pages)
      const queryMetadata = firstNextQuery as any;
      const jobStats = jobMetadata.statistics as any;
      
      const totalRowCount = queryMetadata?.totalRows 
        ? parseInt(String(queryMetadata.totalRows), 10) 
        : (jobStats?.query?.numDmlAffectedRows 
          ? parseInt(String(jobStats.query.numDmlAffectedRows), 10)
          : undefined);

      // If no schema from metadata, extract from first row
      if (columns.length === 0 && firstPageRows.length > 0) {
        const firstRow = firstPageRows[0];
        columns = Object.keys(firstRow).map((key) => {
          const value = firstRow[key];
          let type = 'STRING';
          if (typeof value === 'number') {
            type = Number.isInteger(value) ? 'INTEGER' : 'FLOAT';
          } else if (typeof value === 'boolean') {
            type = 'BOOLEAN';
          } else if (value instanceof Date) {
            type = 'TIMESTAMP';
          } else if (Array.isArray(value)) {
            type = 'ARRAY';
          } else if (value && typeof value === 'object') {
            type = 'RECORD';
          }
          return { name: key, type, mode: 'NULLABLE' };
        });
      }

      const executionTimeMs = Date.now() - startTime;
      const bytesProcessed = parseInt(jobMetadata.statistics?.totalBytesProcessed || '0', 10);

      // Transform first page rows
      const transformedFirstPage = transformRows(firstPageRows, columns);

      // Build initial result with first page
      // Use totalRowCount from BigQuery metadata if available (gives accurate count immediately)
      // Otherwise fall back to first page length (will be updated after fetching all pages)
      const initialResult: QueryResult = {
        columns,
        rows: transformedFirstPage,
        totalRows: totalRowCount ?? transformedFirstPage.length,
        rowsReturned: transformedFirstPage.length,
        executionTimeMs,
        bytesProcessed,
        jobId: job.id || '',
        hasMore: hasMorePages,
      };

      // If there are more pages, fetch them in background and send updates
      // With SQLite-backed cache, we can handle much larger datasets
      // 500,000 rows is a good balance between usefulness and fetch time (~1-2 min)
      const MAX_ROWS = 500000;
      
      // Save first page to SQLite immediately if we have a tabId
      if (tabId) {
        saveResults(tabId, initialResult);
      }
      
      if (hasMorePages) {
        // Start background fetch - don't await, let it run async
        (async () => {
          try {
            let pageToken = firstNextQuery?.pageToken;
            let allRows = [...firstPageRows];
            let pageCount = 1;
            
            // Fetch additional pages up to the max limit
            while (pageToken && allRows.length < MAX_ROWS) {
              const [rows, nextQuery] = await job.getQueryResults({ 
                maxResults: 10000, 
                pageToken 
              });
              allRows.push(...rows);
              pageToken = nextQuery?.pageToken;
              pageCount++;
              
              // Only send lightweight progress updates during fetching (no row data)
              sender.send('bigquery:progress', {
                jobId: job.id,
                rowsFetched: allRows.length,
                isComplete: false,
                message: totalRowCount 
                  ? `Loading... ${allRows.length.toLocaleString()} of ${Math.min(totalRowCount, MAX_ROWS).toLocaleString()} rows`
                  : `Loading... ${allRows.length.toLocaleString()} rows`,
              });
              
              // Stop if we've reached the max
              if (allRows.length >= MAX_ROWS) {
                break;
              }
            }
            
            // Transform all rows only once at the end
            const transformedRows = transformRows(allRows, columns);
            
            // Determine if there are more rows than we fetched
            const hitLimit = allRows.length >= MAX_ROWS && !!pageToken;
            const actualTotalRows = totalRowCount ?? transformedRows.length;
            
            // Save complete results to SQLite cache (this is fast!)
            if (tabId) {
              const completeResult: QueryResult = {
                columns,
                rows: transformedRows,
                totalRows: actualTotalRows,
                rowsReturned: transformedRows.length,
                executionTimeMs,
                bytesProcessed,
                jobId: job.id || '',
                hasMore: hitLimit,
              };
              saveResults(tabId, completeResult);
            }
            
            // Send lightweight notification that more rows are available
            // No row data over IPC - renderer will read from SQLite cache
            sender.send('bigquery:rows-update', {
              jobId: job.id,
              columns,
              rows: [], // Don't send rows over IPC - they're in SQLite
              totalRows: actualTotalRows,
              rowsReturned: transformedRows.length,
              executionTimeMs,
              bytesProcessed,
              hasMore: hitLimit, // True if we hit the limit
              message: hitLimit 
                ? `Showing ${transformedRows.length.toLocaleString()} of ${actualTotalRows.toLocaleString()} rows (limited to ${MAX_ROWS.toLocaleString()})`
                : `Complete: ${transformedRows.length.toLocaleString()} rows`,
            });
          } catch (err) {
            console.error('[BigQuery] Background fetch error:', err);
            sender.send('bigquery:rows-error', {
              jobId: job.id,
              error: (err as Error).message || 'Failed to fetch additional rows',
            });
          }
        })();
      }

      return initialResult;
    } catch (error: any) {
      console.error(`[BigQuery] Query execution error:`, error);
      
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        const err = new Error('Network error: Unable to connect to BigQuery');
        (err as any).code = BigQueryErrorCode.NETWORK_ERROR;
        (err as any).details = error.message;
        throw err;
      }
      if (error.code === 403 || error.code === 401) {
        const err = new Error('Authentication error');
        (err as any).code = BigQueryErrorCode.AUTH_ERROR;
        (err as any).details = error.message;
        throw err;
      }
      
      // Extract error message from BigQuery error
      let errorMessage = error.message || 'Query execution failed';
      
      // If error has details array, try to extract message from first detail
      if (error.errors && Array.isArray(error.errors) && error.errors.length > 0) {
        const firstError = error.errors[0];
        if (firstError.message) {
          errorMessage = firstError.message;
        } else if (typeof firstError === 'string') {
          errorMessage = firstError;
        }
      }
      
      const err = new Error(errorMessage);
      (err as any).code = BigQueryErrorCode.BIGQUERY_ERROR;
      (err as any).details = error.errors || error;
      throw err;
    }
  });

  ipcMain.handle('bigquery:cancel', async (_event, jobId: string) => {
    const client = getBigQueryClient();
    if (!client) {
      throw {
        code: BigQueryErrorCode.CONNECTION_FAILED,
        message: 'No active BigQuery connection',
      };
    }

    try {
      const job = client.job(jobId);
      await job.cancel();
    } catch (error: any) {
      if (error.code === 404) {
        throw {
          code: BigQueryErrorCode.JOB_NOT_FOUND,
          message: 'Job not found or already completed',
        };
      }
      throw {
        code: BigQueryErrorCode.CANCEL_FAILED,
        message: 'Failed to cancel job',
        details: error.message,
      };
    }
  });

  ipcMain.handle('bigquery:listDatasets', async () => {
    const client = getBigQueryClient();
    if (!client) {
      throw {
        code: BigQueryErrorCode.CONNECTION_FAILED,
        message: 'No active BigQuery connection',
      };
    }

    try {
      const [datasets] = await client.getDatasets();
      return datasets.map((dataset) => ({
        id: dataset.id,
        name: dataset.id,
        location: dataset.metadata?.location || 'US',
      }));
    } catch (error: any) {
      throw {
        code: BigQueryErrorCode.BIGQUERY_ERROR,
        message: error.message || 'Failed to list datasets',
        details: error.errors || error,
      };
    }
  });

  ipcMain.handle('bigquery:listTables', async (_event, datasetId: string) => {
    const client = getBigQueryClient();
    if (!client) {
      throw {
        code: BigQueryErrorCode.CONNECTION_FAILED,
        message: 'No active BigQuery connection',
      };
    }

    try {
      const dataset = client.dataset(datasetId);
      const [tables] = await dataset.getTables();
      return tables.map((table) => ({
        id: table.id,
        name: table.id,
        type: table.metadata?.type || 'TABLE',
      }));
    } catch (error: any) {
      throw {
        code: BigQueryErrorCode.BIGQUERY_ERROR,
        message: error.message || 'Failed to list tables',
        details: error.errors || error,
      };
    }
  });

  // Wrap handler to suppress error logging for table not found errors
  ipcMain.handle('bigquery:getTableSchema', async (_event, datasetId: string, tableId: string) => {
    try {
      return await (async () => {
        const client = getBigQueryClient();
        if (!client) {
          throw {
            code: BigQueryErrorCode.CONNECTION_FAILED,
            message: 'No active BigQuery connection',
          };
        }

        try {
          const table = client.dataset(datasetId).table(tableId);
          const [metadata] = await table.getMetadata();
          
          // Extract schema fields
          const schema = metadata.schema;
          if (!schema || !schema.fields) {
            return {
              fields: [],
            };
          }

          // Recursively transform fields to include nested structures
          const transformField = (field: any): ColumnMetadata & { fields?: any[] } => {
            const result: ColumnMetadata & { fields?: any[] } = {
              name: field.name,
              type: field.type,
              mode: field.mode || 'NULLABLE',
            };
            
            if (field.fields && field.fields.length > 0) {
              result.fields = field.fields.map(transformField);
            }
            
            return result;
          };

          // Extract table metadata
          // BigQuery timestamps are in milliseconds, can be string or number
          const creationTime = metadata.creationTime 
            ? (typeof metadata.creationTime === 'string' 
                ? parseInt(metadata.creationTime, 10) 
                : metadata.creationTime)
            : undefined;
          const lastModifiedTime = metadata.lastModifiedTime
            ? (typeof metadata.lastModifiedTime === 'string'
                ? parseInt(metadata.lastModifiedTime, 10)
                : metadata.lastModifiedTime)
            : undefined;
          const numRows = metadata.numRows
            ? (typeof metadata.numRows === 'string'
                ? parseInt(metadata.numRows, 10)
                : metadata.numRows)
            : undefined;
          const numBytes = metadata.numBytes
            ? (typeof metadata.numBytes === 'string'
                ? parseInt(metadata.numBytes, 10)
                : metadata.numBytes)
            : undefined;

          // Extract partitioning info
          const timePartitioning = metadata.timePartitioning
            ? {
                type: metadata.timePartitioning.type || 'DAY',
                field: metadata.timePartitioning.field,
                requirePartitionFilter: metadata.timePartitioning.requirePartitionFilter,
              }
            : undefined;

          const rangePartitioning = metadata.rangePartitioning
            ? {
                field: metadata.rangePartitioning.field,
                range: {
                  start: String(metadata.rangePartitioning.range?.start || ''),
                  end: String(metadata.rangePartitioning.range?.end || ''),
                  interval: String(metadata.rangePartitioning.range?.interval || ''),
                },
              }
            : undefined;

          // Extract clustering info
          const clustering = metadata.clustering?.fields && metadata.clustering.fields.length > 0
            ? { fields: metadata.clustering.fields }
            : undefined;

          return {
            fields: schema.fields.map(transformField),
            metadata: {
              creationTime,
              lastModifiedTime,
              numRows,
              numBytes,
              timePartitioning,
              rangePartitioning,
              clustering,
            },
          };
        } catch (error: any) {
          if (error.code === 404) {
            // Create error but suppress Electron's automatic logging for table not found errors
            // These errors are handled in the UI and don't need to be logged
            const err = new Error('Table not found');
            (err as any).code = BigQueryErrorCode.BIGQUERY_ERROR;
            (err as any).details = error.message;
            // Mark error to suppress logging
            (err as any).suppressLogging = true;
            throw err;
          }
          const err = new Error(error.message || 'Failed to get table schema');
          (err as any).code = BigQueryErrorCode.BIGQUERY_ERROR;
          (err as any).details = error.errors || error;
          throw err;
        }
      })();
    } catch (error: any) {
      // Suppress Electron's automatic error logging for table not found errors
      if (error?.code === BigQueryErrorCode.BIGQUERY_ERROR && 
          error?.message === 'Table not found') {
        // Re-throw without Electron logging by using a custom error handler
        // Electron will still pass the error to the renderer, but won't log it
        const err = new Error('Table not found');
        (err as any).code = BigQueryErrorCode.BIGQUERY_ERROR;
        (err as any).details = error.details || error.message;
        // Use a custom property to signal this shouldn't be logged
        Object.defineProperty(err, 'suppressLogging', { value: true, enumerable: false });
        throw err;
      }
      // Re-throw other errors normally
      throw error;
    }
  });

  ipcMain.handle('bigquery:getViewDefinition', async (_event, datasetId: string, tableId: string) => {
    const client = getBigQueryClient();
    if (!client) {
      throw {
        code: BigQueryErrorCode.CONNECTION_FAILED,
        message: 'No active BigQuery connection',
      };
    }

    try {
      const table = client.dataset(datasetId).table(tableId);
      const [metadata] = await table.getMetadata();
      
      // Check if this is actually a view
      if (metadata.type !== 'VIEW' && metadata.type !== 'MATERIALIZED_VIEW') {
        throw {
          code: BigQueryErrorCode.BIGQUERY_ERROR,
          message: 'Table is not a view',
        };
      }

      // Get view definition from metadata
      // For regular views: metadata.view.query
      // For materialized views: metadata.materializedView.query
      let viewDefinition = '';
      if (metadata.type === 'VIEW' && metadata.view) {
        viewDefinition = metadata.view.query || '';
      } else if (metadata.type === 'MATERIALIZED_VIEW' && metadata.materializedView) {
        viewDefinition = metadata.materializedView.query || '';
      }
      
      if (!viewDefinition) {
        throw {
          code: BigQueryErrorCode.BIGQUERY_ERROR,
          message: 'View definition not found',
        };
      }

      return {
        definition: viewDefinition,
      };
    } catch (error: any) {
      if (error.code === 404) {
        throw {
          code: BigQueryErrorCode.BIGQUERY_ERROR,
          message: 'View not found',
          details: error.message,
        };
      }
      if (error.code) {
        throw error;
      }
      throw {
        code: BigQueryErrorCode.BIGQUERY_ERROR,
        message: error.message || 'Failed to get view definition',
        details: error.errors || error,
      };
    }
  });

  /**
   * Perform a dry run of a query to estimate bytes processed without executing.
   * This uses BigQuery's native dry run feature which accounts for:
   * - Column selection (only selected columns count)
   * - Partitioning (only scanned partitions count)
   * - Clustering benefits
   * - Query optimization
   */
  ipcMain.handle('bigquery:dryRun', async (_event, queryText: string) => {
    const client = getBigQueryClient();
    if (!client) {
      throw {
        code: BigQueryErrorCode.CONNECTION_FAILED,
        message: 'No active BigQuery connection',
      };
    }

    try {
      // Get location from active connection, default to EU
      const connection = getActiveConnection();
      const location = connection?.location || 'EU';

      // Create a dry run query job - this validates and estimates without executing
      // For dry runs, the job is not actually created in BigQuery, so we can't call getMetadata()
      // The statistics are returned directly in job.metadata
      const [job] = await client.createQueryJob({
        query: queryText,
        location,
        dryRun: true,
      });

      // For dry runs, metadata is available directly on the job object
      // Don't call getMetadata() as dry run jobs don't actually exist in BigQuery
      const metadata = job.metadata;
      
      // totalBytesProcessed is in statistics
      const totalBytesProcessed = parseInt(
        metadata?.statistics?.totalBytesProcessed || '0', 
        10
      );

      return {
        totalBytesProcessed,
        // Include additional useful statistics if available
        cacheHit: metadata?.statistics?.query?.cacheHit || false,
        statementType: metadata?.statistics?.query?.statementType || null,
      };
    } catch (error: any) {
      // Electron IPC requires Error objects with message property to serialize properly
      // Plain objects thrown will appear as [object Object]
      
      // Handle specific BigQuery errors
      if (error.code === 404) {
        const err = new Error('Table not found');
        (err as any).code = BigQueryErrorCode.BIGQUERY_ERROR;
        (err as any).details = error.message;
        throw err;
      }
      
      // Handle syntax errors and other query errors
      // BigQuery errors include location info (line, column) which we pass through
      if (error.errors && error.errors.length > 0) {
        const firstError = error.errors[0];
        const err = new Error(firstError.message || 'Query validation failed');
        (err as any).code = BigQueryErrorCode.BIGQUERY_ERROR;
        // Include location info if available
        if (firstError.location) {
          (err as any).location = {
            line: firstError.location.line,
            column: firstError.location.column,
          };
        }
        (err as any).details = JSON.stringify(error.errors);
        throw err;
      }
      
      const err = new Error(error.message || 'Dry run failed');
      (err as any).code = BigQueryErrorCode.BIGQUERY_ERROR;
      (err as any).details = error.errors ? JSON.stringify(error.errors) : String(error);
      throw err;
    }
  });

  /**
   * Get job information by job ID.
   * Returns detailed metadata about a BigQuery job including timing, bytes processed,
   * cache hit status, billing tier, and referenced tables.
   */
  ipcMain.handle('bigquery:getJobInfo', async (_event, jobId: string) => {
    const client = getBigQueryClient();
    if (!client) {
      throw {
        code: BigQueryErrorCode.CONNECTION_FAILED,
        message: 'No active BigQuery connection',
      };
    }

    try {
      const job = client.job(jobId);
      const [metadata] = await job.getMetadata();

      // Extract statistics
      const stats = metadata.statistics || {};
      const queryStats = stats.query || {};

      // Parse timestamps - BigQuery returns timestamps as string milliseconds
      const parseTimestamp = (ts: string | undefined): string => {
        if (!ts) return '';
        const ms = parseInt(ts, 10);
        return new Date(ms).toISOString();
      };

      // Parse bytes/numbers
      const parseNumber = (val: string | number | undefined): number => {
        if (val === undefined || val === null) return 0;
        if (typeof val === 'number') return val;
        return parseInt(val, 10) || 0;
      };

      // Extract referenced tables
      const referencedTables = (queryStats.referencedTables || []).map((table: any) => ({
        projectId: table.projectId,
        datasetId: table.datasetId,
        tableId: table.tableId,
      }));

      return {
        // Basic job info
        jobId: metadata.jobReference?.jobId || jobId,
        projectId: metadata.jobReference?.projectId || '',
        location: metadata.jobReference?.location || '',
        user: metadata.user_email || '',

        // Timing info
        creationTime: parseTimestamp(stats.creationTime),
        startTime: parseTimestamp(stats.startTime),
        endTime: parseTimestamp(stats.endTime),
        totalSlotMs: parseNumber(stats.totalSlotMs),

        // Query statistics
        totalBytesProcessed: parseNumber(stats.totalBytesProcessed),
        totalBytesBilled: parseNumber(queryStats.totalBytesBilled),
        cacheHit: queryStats.cacheHit === true,
        statementType: queryStats.statementType || 'UNKNOWN',

        // Row counts
        numDmlAffectedRows: queryStats.numDmlAffectedRows ? parseNumber(queryStats.numDmlAffectedRows) : undefined,
        outputRows: queryStats.outputRows ? parseNumber(queryStats.outputRows) : undefined,

        // Performance details
        billingTier: queryStats.billingTier ? parseNumber(queryStats.billingTier) : undefined,
        estimatedBytesProcessed: queryStats.estimatedBytesProcessed ? parseNumber(queryStats.estimatedBytesProcessed) : undefined,

        // Referenced tables
        referencedTables: referencedTables.length > 0 ? referencedTables : undefined,

        // Status
        state: metadata.status?.state || 'UNKNOWN',
        errorResult: metadata.status?.errorResult ? {
          reason: metadata.status.errorResult.reason || '',
          location: metadata.status.errorResult.location || '',
          message: metadata.status.errorResult.message || '',
        } : undefined,
      };
    } catch (error: any) {
      if (error.code === 404) {
        throw {
          code: BigQueryErrorCode.JOB_NOT_FOUND,
          message: 'Job not found. It may have expired or been deleted.',
        };
      }
      throw {
        code: BigQueryErrorCode.BIGQUERY_ERROR,
        message: error.message || 'Failed to get job information',
        details: error.errors || error,
      };
    }
  });

  /**
   * Check if a table or view with the given name already exists in the dataset.
   * Used to validate view names before creating to avoid collisions.
   */
  ipcMain.handle('bigquery:checkTableExists', async (_event, datasetId: string, tableId: string) => {
    const client = getBigQueryClient();
    if (!client) {
      throw {
        code: BigQueryErrorCode.CONNECTION_FAILED,
        message: 'No active BigQuery connection',
      };
    }

    try {
      const table = client.dataset(datasetId).table(tableId);
      const [exists] = await table.exists();
      return { exists };
    } catch (error: any) {
      // If we get a 404 or similar, the table doesn't exist
      if (error.code === 404) {
        return { exists: false };
      }
      throw {
        code: BigQueryErrorCode.BIGQUERY_ERROR,
        message: error.message || 'Failed to check if table exists',
        details: error.errors || error,
      };
    }
  });

  /**
   * Create a view in BigQuery from the provided SQL query.
   * The view will be created in the specified dataset with the given name.
   */
  ipcMain.handle('bigquery:createView', async (_event, datasetId: string, viewName: string, queryText: string) => {
    const client = getBigQueryClient();
    if (!client) {
      throw {
        code: BigQueryErrorCode.CONNECTION_FAILED,
        message: 'No active BigQuery connection',
      };
    }

    try {
      const dataset = client.dataset(datasetId);
      const table = dataset.table(viewName);

      // Create the view with the provided query
      const [view] = await table.create({
        view: queryText,
      });

      // Get metadata to return details about the created view
      const [metadata] = await view.getMetadata();

      return {
        success: true,
        viewId: viewName,
        datasetId: datasetId,
        projectId: metadata.tableReference?.projectId || '',
        creationTime: metadata.creationTime 
          ? new Date(parseInt(String(metadata.creationTime), 10)).toISOString()
          : new Date().toISOString(),
      };
    } catch (error: any) {
      // Handle specific error cases
      if (error.code === 409 || error.message?.includes('Already Exists')) {
        throw {
          code: BigQueryErrorCode.BIGQUERY_ERROR,
          message: `A table or view named '${viewName}' already exists in dataset '${datasetId}'`,
          details: error.message,
        };
      }
      if (error.code === 400 || error.message?.includes('Syntax error')) {
        throw {
          code: BigQueryErrorCode.BIGQUERY_ERROR,
          message: 'Invalid SQL syntax in view definition',
          details: error.errors || error.message,
        };
      }
      if (error.code === 403) {
        throw {
          code: BigQueryErrorCode.AUTH_ERROR,
          message: 'Permission denied. You may not have access to create views in this dataset.',
          details: error.message,
        };
      }
      throw {
        code: BigQueryErrorCode.BIGQUERY_ERROR,
        message: error.message || 'Failed to create view',
        details: error.errors || error,
      };
    }
  });

  /**
   * Update an existing view's definition in BigQuery.
   * This replaces the view's SQL query while keeping the same name.
   */
  ipcMain.handle('bigquery:updateView', async (_event, datasetId: string, viewName: string, queryText: string) => {
    const client = getBigQueryClient();
    if (!client) {
      throw {
        code: BigQueryErrorCode.CONNECTION_FAILED,
        message: 'No active BigQuery connection',
      };
    }

    try {
      const dataset = client.dataset(datasetId);
      const table = dataset.table(viewName);

      // Get current metadata to verify it's a view
      const [currentMetadata] = await table.getMetadata();
      
      if (currentMetadata.type !== 'VIEW' && currentMetadata.type !== 'MATERIALIZED_VIEW') {
        throw {
          code: BigQueryErrorCode.BIGQUERY_ERROR,
          message: `'${viewName}' is not a view. It is a ${currentMetadata.type}.`,
        };
      }

      // Update the view definition by setting the new metadata
      const [updatedMetadata] = await table.setMetadata({
        view: queryText,
      });

      return {
        success: true,
        viewId: viewName,
        datasetId: datasetId,
        projectId: updatedMetadata.tableReference?.projectId || '',
        lastModifiedTime: updatedMetadata.lastModifiedTime 
          ? new Date(parseInt(String(updatedMetadata.lastModifiedTime), 10)).toISOString()
          : new Date().toISOString(),
      };
    } catch (error: any) {
      // Handle specific error cases
      if (error.code === 404) {
        throw {
          code: BigQueryErrorCode.BIGQUERY_ERROR,
          message: `View '${viewName}' not found in dataset '${datasetId}'`,
          details: error.message,
        };
      }
      if (error.code === 400 || error.message?.includes('Syntax error')) {
        throw {
          code: BigQueryErrorCode.BIGQUERY_ERROR,
          message: 'Invalid SQL syntax in view definition',
          details: error.errors || error.message,
        };
      }
      if (error.code === 403) {
        throw {
          code: BigQueryErrorCode.AUTH_ERROR,
          message: 'Permission denied. You may not have access to update views in this dataset.',
          details: error.message,
        };
      }
      if (error.code) {
        throw error;
      }
      throw {
        code: BigQueryErrorCode.BIGQUERY_ERROR,
        message: error.message || 'Failed to update view',
        details: error.errors || error,
      };
    }
  });
}
