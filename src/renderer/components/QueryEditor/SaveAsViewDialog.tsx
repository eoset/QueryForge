import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useBigQueryMetadataStore } from '../../stores/bigquery-metadata-store';
import './QueryEditor.css';

interface SaveAsViewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (datasetId: string, viewName: string) => Promise<void>;
  defaultDatasetId?: string;
}

export const SaveAsViewDialog: React.FC<SaveAsViewDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  defaultDatasetId,
}) => {
  const [viewName, setViewName] = useState('');
  const [selectedDataset, setSelectedDataset] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameAvailable, setNameAvailable] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // Track whether dialog was previously open to detect open/close transitions
  const wasOpenRef = useRef(false);
  
  const datasets = useBigQueryMetadataStore((state) => state.datasets);

  // Reset state only when dialog opens (transition from closed to open)
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      // Dialog just opened - reset everything
      setViewName('');
      setSelectedDataset(defaultDatasetId || (datasets.length > 0 ? datasets[0].id : ''));
      setNameError(null);
      setNameAvailable(false);
      setSaveError(null);
      setIsChecking(false);
      setIsSaving(false);
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, defaultDatasetId, datasets]);

  // Validate view name format (BigQuery naming rules)
  const validateViewName = useCallback((name: string): string | null => {
    if (!name.trim()) {
      return null; // Don't show error for empty - just disable save
    }
    
    // BigQuery table/view names must:
    // - Start with a letter or underscore
    // - Contain only letters, numbers, and underscores
    // - Be at most 1024 characters
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
      return 'View name must start with a letter or underscore and contain only letters, numbers, and underscores';
    }
    
    if (name.length > 1024) {
      return 'View name must be 1024 characters or less';
    }
    
    return null;
  }, []);

  // Check if view name already exists when name or dataset changes
  useEffect(() => {
    if (!isOpen || !selectedDataset || !window.electronAPI) {
      return;
    }

    const trimmedName = viewName.trim();
    
    // Reset availability when name is empty
    if (!trimmedName) {
      setNameError(null);
      setNameAvailable(false);
      setIsChecking(false);
      return;
    }

    // First validate the name format synchronously
    const formatError = validateViewName(trimmedName);
    if (formatError) {
      setNameError(formatError);
      setNameAvailable(false);
      setIsChecking(false);
      return;
    }

    // Mark as checking while we wait for debounce
    setIsChecking(true);
    setNameAvailable(false);

    // Then check if name exists in the dataset (debounced)
    const timeoutId = setTimeout(async () => {
      try {
        const result = await window.electronAPI.bigquery.checkTableExists(selectedDataset, trimmedName);
        // Only update if the name hasn't changed during the async call
        if (viewName.trim() === trimmedName) {
          if (result.exists) {
            setNameError(`A table or view named '${trimmedName}' already exists in this dataset`);
            setNameAvailable(false);
          } else {
            setNameError(null);
            setNameAvailable(true);
          }
        }
      } catch (err: any) {
        // Don't show error for connection issues during typing
        console.error('Error checking table exists:', err);
        // Clear checking state but don't mark as available
        if (viewName.trim() === trimmedName) {
          setNameError(null);
          setNameAvailable(false);
        }
      } finally {
        if (viewName.trim() === trimmedName) {
          setIsChecking(false);
        }
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [isOpen, viewName, selectedDataset, validateViewName]);

  // Handle ESC key to close dialog
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSave = async () => {
    if (!viewName.trim() || !selectedDataset || nameError || isChecking || isSaving) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      await onSave(selectedDataset, viewName.trim());
      onClose();
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to create view';
      setSaveError(errorMessage.replace(/^Error invoking remote method '[^']+': /, '').replace(/^Error: /, ''));
    } finally {
      setIsSaving(false);
    }
  };

  const isSaveDisabled = !viewName.trim() || !selectedDataset || !!nameError || isChecking || isSaving;

  if (!isOpen) return null;

  return (
    <div className="save-dialog-overlay" onClick={onClose}>
      <div className="save-dialog save-view-dialog" onClick={(e) => e.stopPropagation()}>
        <h3>Save as View</h3>
        
        <div className="form-group">
          <label>Dataset *</label>
          <select
            value={selectedDataset}
            onChange={(e) => setSelectedDataset(e.target.value)}
            disabled={datasets.length === 0}
          >
            {datasets.length === 0 ? (
              <option value="">No datasets available</option>
            ) : (
              datasets.map((dataset) => (
                <option key={dataset.id} value={dataset.id}>
                  {dataset.name}
                </option>
              ))
            )}
          </select>
          {datasets.length === 0 && (
            <span className="field-hint error">Connect to BigQuery and load datasets first</span>
          )}
        </div>
        
        <div className="form-group">
          <label>View Name *</label>
          <input
            type="text"
            value={viewName}
            onChange={(e) => setViewName(e.target.value)}
            placeholder="my_view_name"
            autoFocus
            disabled={datasets.length === 0}
          />
          {isChecking && (
            <span className="field-hint">Checking availability...</span>
          )}
          {nameError && !isChecking && (
            <span className="field-hint error">{nameError}</span>
          )}
          {nameAvailable && !isChecking && !nameError && (
            <span className="field-hint success">Name is available</span>
          )}
        </div>

        {saveError && (
          <div className="dialog-error">
            {saveError}
          </div>
        )}

        <div className="form-info">
          <p>The current query will be saved as a view in the selected dataset.</p>
        </div>

        <div className="dialog-actions">
          <button onClick={onClose} disabled={isSaving}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={isSaveDisabled}>
            {isSaving ? 'Creating...' : 'Create View'}
          </button>
        </div>
      </div>
    </div>
  );
};
