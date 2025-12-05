import React from 'react';
import './QueryEditor.css';

interface EditorStatusBarProps {
  saveSuccessMessage: string | null;
  isQueryCompleted: boolean;
  completedExecutionTime: number | null;
  validationStatus: {
    isValid: boolean | null;
    errorMessage: string | null;
    errorLine: number | null;
  };
  expectedQuerySize: number | null;
  isLoadingQuerySize: boolean;
}

/**
 * Format bytes to human-readable string.
 */
const formatBytes = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
};

/**
 * Format execution time to human-readable string.
 */
const formatExecutionTime = (ms: number): string => {
  if (ms < 1000) {
    return `${ms}ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`;
  } else {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }
};

export const EditorStatusBar: React.FC<EditorStatusBarProps> = ({
  saveSuccessMessage,
  isQueryCompleted,
  completedExecutionTime,
  validationStatus,
  expectedQuerySize,
  isLoadingQuerySize,
}) => {
  const renderStatusContent = () => {
    // Priority 1: Save success message
    if (saveSuccessMessage) {
      return (
        <span className="status-text status-valid">
          <span className="status-indicator status-indicator-valid"></span>
          {saveSuccessMessage}
        </span>
      );
    }

    // Priority 2: Query completed
    if (isQueryCompleted) {
      return (
        <span className="status-text status-valid">
          <span className="status-indicator status-indicator-valid"></span>
          Query completed
          {completedExecutionTime !== null
            ? ` in ${formatExecutionTime(completedExecutionTime)}`
            : ''}
        </span>
      );
    }

    // Priority 3: No validation status yet (empty editor)
    if (validationStatus.isValid === null) {
      return <span className="status-text">✦ Type a query to get started</span>;
    }

    // Priority 4: Valid query
    if (validationStatus.isValid) {
      return (
        <span className="status-text status-valid">
          <span className="status-indicator status-indicator-valid"></span>
          {expectedQuerySize !== null
            ? `This query will process ${formatBytes(expectedQuerySize)} when run`
            : isLoadingQuerySize
            ? 'Validating query...'
            : 'Query is valid'}
        </span>
      );
    }

    // Priority 5: Invalid query
    return (
      <span className="status-text status-invalid">
        <span className="status-indicator status-indicator-invalid"></span>
        <span className="status-error-message">
          {validationStatus.errorMessage || 'SQL syntax error'}
        </span>
      </span>
    );
  };

  return (
    <div className="editor-status-bar">
      <div className="status-left">{renderStatusContent()}</div>
    </div>
  );
};
