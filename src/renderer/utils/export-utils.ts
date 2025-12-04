import type { ColumnMetadata, Row } from '../../shared/types/query';

/**
 * Format a value for CSV export, handling special characters and types
 */
function formatCSVValue(value: unknown, columnType?: string): string {
  if (value === null || value === undefined) {
    return '';
  }

  // Handle different types
  if (typeof value === 'object') {
    // Arrays and objects - convert to JSON string
    const jsonStr = JSON.stringify(value);
    // Escape quotes and wrap in quotes if contains special chars
    if (jsonStr.includes(',') || jsonStr.includes('"') || jsonStr.includes('\n') || jsonStr.includes('\r')) {
      return `"${jsonStr.replace(/"/g, '""')}"`;
    }
    return jsonStr;
  }

  const strValue = String(value);

  // Check if value needs quoting (contains comma, quote, or newline)
  if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n') || strValue.includes('\r')) {
    // Escape double quotes by doubling them
    return `"${strValue.replace(/"/g, '""')}"`;
  }

  return strValue;
}

/**
 * Convert query results to CSV format
 */
export function resultsToCSV(columns: ColumnMetadata[], rows: Row[]): string {
  // Header row
  const headers = columns.map(col => formatCSVValue(col.name)).join(',');

  // Data rows
  const dataRows = rows.map(row => {
    return row.values.map((value: unknown, idx: number) => {
      const column = columns[idx];
      return formatCSVValue(value, column?.type);
    }).join(',');
  });

  return [headers, ...dataRows].join('\n');
}

/**
 * Convert query results to JSON format
 * Returns an array of objects with column names as keys
 */
export function resultsToJSON(columns: ColumnMetadata[], rows: Row[]): string {
  const data = rows.map(row => {
    const obj: Record<string, unknown> = {};
    row.values.forEach((value: unknown, idx: number) => {
      const columnName = columns[idx]?.name || `column_${idx}`;
      obj[columnName] = value;
    });
    return obj;
  });

  return JSON.stringify(data, null, 2);
}

/**
 * Export results to a file via Electron's save dialog
 */
export async function exportResultsToFile(
  columns: ColumnMetadata[],
  rows: Row[],
  format: 'csv' | 'json',
  defaultFilename?: string
): Promise<{ success: boolean; filePath?: string; error?: string }> {
  try {
    const content = format === 'csv' 
      ? resultsToCSV(columns, rows)
      : resultsToJSON(columns, rows);

    const result = await window.electronAPI.export.saveFile(content, {
      format,
      defaultFilename,
    });

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { success: false, error: errorMessage };
  }
}

/**
 * Copy results to clipboard in the specified format
 */
export async function copyResultsToClipboard(
  columns: ColumnMetadata[],
  rows: Row[],
  format: 'csv' | 'json'
): Promise<{ success: boolean; error?: string }> {
  try {
    const content = format === 'csv'
      ? resultsToCSV(columns, rows)
      : resultsToJSON(columns, rows);

    await navigator.clipboard.writeText(content);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to copy to clipboard';
    return { success: false, error: errorMessage };
  }
}
