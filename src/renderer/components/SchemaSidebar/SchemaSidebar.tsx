import React, { useState, useEffect } from 'react';
import type { ColumnMetadata } from '../../../shared/types/query';
import './SchemaSidebar.css';

interface SchemaField extends ColumnMetadata {
  fields?: SchemaField[];
}

interface TableMetadata {
  creationTime?: number;
  lastModifiedTime?: number;
  numRows?: number;
  numBytes?: number;
}

interface SchemaSidebarProps {
  projectId: string;
  datasetId: string;
  tableId: string;
  onClose: () => void;
}

export const SchemaSidebar: React.FC<SchemaSidebarProps> = ({
  projectId,
  datasetId,
  tableId,
  onClose,
}) => {
  const [schema, setSchema] = useState<SchemaField[]>([]);
  const [metadata, setMetadata] = useState<TableMetadata | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSchema = async () => {
      if (!window.electronAPI) {
        setError('Electron API not available');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await window.electronAPI.bigquery.getTableSchema(datasetId, tableId);
        setSchema(result.fields as SchemaField[]);
        setMetadata(result.metadata);
      } catch (err: any) {
        setError(err.message || 'Failed to load table schema');
        console.error('Failed to load table schema:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSchema();
  }, [datasetId, tableId]);

  const formatDate = (timestamp?: number): string => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatBytes = (bytes?: number): string => {
    if (!bytes) return 'N/A';
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  const formatNumber = (num?: number): string => {
    if (num === undefined || num === null) return 'N/A';
    return num.toLocaleString();
  };

  const renderField = (field: SchemaField, depth: number = 0): React.ReactNode => {
    const isNested = field.fields && field.fields.length > 0;
    const indent = `${depth}rem`;

    return (
      <div key={field.name} className="schema-field-item">
        <div 
          className="schema-field-row" 
          style={{ paddingLeft: indent }}
        >
          {isNested && <span className="schema-field-icon">▼</span>}
          {!isNested && <span className="schema-field-icon-spacer"></span>}
          <span className="schema-field-name">{field.name}</span>
          <span className="schema-field-type">{field.type}</span>
          {field.mode && field.mode !== 'NULLABLE' && (
            <span className={`schema-field-mode schema-field-mode-${field.mode.toLowerCase()}`}>
              {field.mode}
            </span>
          )}
        </div>
        {isNested && (
          <div className="schema-field-nested">
            {field.fields!.map((nestedField) => renderField(nestedField, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="schema-sidebar">
      <div className="schema-sidebar-header">
        <div className="schema-sidebar-title">
          <div className="schema-sidebar-title-content">
            <span className="schema-sidebar-table-name">{tableId}</span>
            <span className="schema-sidebar-table-path">{projectId}.{datasetId}</span>
          </div>
        </div>
        <button className="schema-sidebar-close" onClick={onClose} title="Close">
          ×
        </button>
      </div>
      <div className="schema-sidebar-content">
        {isLoading && (
          <div className="schema-sidebar-loading">Loading schema...</div>
        )}
        {error && (
          <div className="schema-sidebar-error">{error}</div>
        )}
        {!isLoading && !error && (
          <>
            {metadata && (
              <div className="schema-metadata">
                <div className="schema-metadata-item">
                  <span className="schema-metadata-label">Created:</span>
                  <span className="schema-metadata-value">{formatDate(metadata.creationTime)}</span>
                </div>
                <div className="schema-metadata-item">
                  <span className="schema-metadata-label">Modified:</span>
                  <span className="schema-metadata-value">{formatDate(metadata.lastModifiedTime)}</span>
                </div>
                <div className="schema-metadata-item">
                  <span className="schema-metadata-label">Rows:</span>
                  <span className="schema-metadata-value">{formatNumber(metadata.numRows)}</span>
                </div>
                <div className="schema-metadata-item">
                  <span className="schema-metadata-label">Size:</span>
                  <span className="schema-metadata-value">{formatBytes(metadata.numBytes)}</span>
                </div>
              </div>
            )}
            {schema.length === 0 ? (
              <div className="schema-sidebar-empty">No schema available</div>
            ) : (
              <div className="schema-fields">
                {schema.map((field) => renderField(field))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

